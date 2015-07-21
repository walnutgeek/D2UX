'''
Server module
running on websocket and static file web interface on tornado. 
Same tornado ioloop managing concurrent jobs and recording 
out/err streams in files.

'''
from tornado import websocket, web, ioloop, iostream
import socket
import datetime
import json
import yaml
import functools
import os
import fcntl
from sets import Set
import sys

from d2ux.root import Store,ServerStatus
from . import utils
import shlex, subprocess

import logging
log = logging.getLogger(__name__)



class State:
    def __init__(self, dao):
        self.dao = dao
    
    def check(self):
        server_props = self.dao.get_server_properties()
        status = utils.find_enum(ServerStatus, server_props['server_status'])
        prepare_to_stop = status == ServerStatus.prepare_to_stop

        if not(prepare_to_stop):
            if status != ServerStatus.running:
                server_props.update(_server_status = ServerStatus.running)
                self.dao.set_server_properties(server_props)
        else:
            self.main_loop.stop()
            self.scheduler.stop()
            server_props.update(_server_status = ServerStatus.shutdown )
            self.dao.set_server_properties(server_props)
            return
   

    def get_file_fragment(self, fn, start=0,end=-1 ):
        if not(os.path.abspath(fn).startswith(self.dao.root)):
            raise ValueError('path:%s is outside of root:%s' % (fn,self.dao.root))
        fp=open(fn)
        count=end
        if start > 0:
            fp.seek(start,0)
            if count > 0:
                count -= start
        if count > 0:
            return fp.read(count)
        else:
            return fp.read()
    
    def pushAll(self):
        for client in self.clients:
            self.pushToOne(client,self.json)
            
    def pushToOne(self,client,content):
            if content:
                client.write_message(content)        

    def addClient(self,client):
        if client not in self.clients:
            self.clients.append(client)
            self.pushToOne(client, self.meta_json)
            self.pushToOne(client, self.json)

    def removeClient(self,client):
        if client in self.clients:
            self.clients.remove(client)
            

class IndexHandler(web.RequestHandler):
    def get(self):
        self.render("web/app.html")

class SocketHandler(websocket.WebSocketHandler):
    
    def __init__(self,*args,**kwargs):
        self.user = None
        websocket.WebSocketHandler.__init__(self,*args,**kwargs)
        
    def open(self):
        state.addClient(self)
    
    def on_message(self,msg):
        log.debug( 'on message: %r' % msg)
        msg_dict = json.loads(msg)
        action = msg_dict['action']
        source = msg_dict['source']
        args=msg_dict['args']
        res = self.dispatch(action,source,args)
        self.write_message(json.dumps({
               'action': action,
               'source': source,                        
               'response': res }))
    
    def dispatch(self, action,source,args):
        if action == 'change' :
            if source == 'tasks' :
                return state.change_tasks(args['apply'], [ int(i) for i in args['task_id']] )
        elif action == 'get' :
            if source == 'event' :
                if 'task_id' in args:
                    return state.dao.get_event_tasks_by_taskid(args['task_id'])
                elif 'event_id' in args:
                    return state.dao.get_event_tasks_by_eventid(args['event_id'])
            elif source == 'run' :
                return state.dao.get_artifacts_for_run(int(args['task_id']),int(args['run']))
            elif source == 'file' :
                buf = state.get_file_fragment( args['file'],int(args['start']),int(args['end']))
                return { 'buf': buf, 'length' : len(buf), 'args': args  }
        elif action == 'unsubscribe' :
            if source == 'run' :
                pass
        elif action == 'subscribe' :
            if source == 'events' :
                pass
            elif source == 'run' :
                pass
        raise AssertionError('Unrecognized request: {action:%r,source:%r,args:%r}' % (action,source,args))
            
    

    def on_close(self):
        state.removeClient(self)


class ApiHandler(web.RequestHandler):

    @web.asynchronous
    def get(self, *args):
        self.finish()
        event_str = self.get_argument("event")
        state.emit_event(event_str)
        state.check()
        
    @web.asynchronous
    def post(self):
        pass



class FileHandler(web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

def run_server(_dao,address="",port=9753):
    global state
    state = State(_dao)
    webpath = os.path.join(os.path.dirname(__file__),'web')
    log.info( 'platform_info=%r' % (utils.platform_info()) )
    log.info( 'webpath=%s' % webpath)
    app = web.Application([
        (r'/', IndexHandler),
        (r'/.ws', SocketHandler),
        (r"/.web/(.*)", FileHandler,  {"path": webpath}),
        (r"/(.*)", FileHandler,  {"path": _dao.root}),
    ])
    try:
        log.info( 'port=%r, address=%r' % (port,address) )
        app.listen(port,address=address)
    except socket.error, e:
        log.exception(e) 
        raise SystemExit(-1)
    #milliseconds
    interval_ms = 5 * 1000
    server_props = _dao.get_server_properties()
    if ServerStatus.running == server_props['server_status'] :
        raise ValueError('server already running: %r' % server_props)
    server_props.update( _server_status = ServerStatus.running, 
                         _server_host = address, _server_port = port )
    _dao.set_server_properties(server_props)
    state.main_loop = ioloop.IOLoop.instance()
    state.scheduler = ioloop.PeriodicCallback(state.check , interval_ms, io_loop = state.main_loop)
    state.check()
    state.scheduler.start()
    state.main_loop.start()
