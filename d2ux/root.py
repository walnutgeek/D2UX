"""
This module contains of data access logic.

Examples on this page assumes that you imported ``ontimer.db`` like::

    import ontimer.db as db
    
"""
import hashlib
import yaml
import sqlite3
import os
from enum import IntEnum



class ServerStatus(IntEnum):
    prepare_to_stop  =  -1      
    shutdown = 0    
    running = 1     

server_properties_vars=['server_port','server_host','server_status']

def _conn_decorator(f):
    def decorated(self, *args, **kwargs):
        if kwargs.get('conn'):
            if 'cursor' not in kwargs:
                kwargs['cursor']=kwargs.get('conn').cursor()
            return f(self,*args,**kwargs)
        else:
            conn = self.connect()
            try:
                kwargs['conn']=conn
                kwargs['cursor']=conn.cursor()
                return f(self,*args,**kwargs)
            finally:
                conn.close()
    return decorated

def _fetch_all(cursor, result = None, query=None):
    if query:
        cursor.execute(query)
    if not(result):
        result = cursor.fetchall()
    header=list(cursor.description)
    return list({col[0]:v[i] for (i, col) in enumerate(header)} for v in result)

def _assignments(template, data, whine_if_empty=True ):
    assignments = [ key +' = :_' + key for key in template if '_' + key in data ]
    if whine_if_empty and not(assignments):
        raise ValueError("Have nothing to update: %r", data)
    return ', '.join(assignments)

def _conditions(template, data , whine_if_empty=True):
    conditions = [key + ' = :' + key if data[key] != None else key+' is null' for key in template if key in data ]
    if whine_if_empty and not(conditions):
        raise ValueError("Have nothing to constraint it on: %r", data)
    return ' and '.join(conditions)


default_db = '.d2ux.db'

class Store:
    def __init__(self, root):
        self.root = root
        self.ensure_db()
    
    def db_file(self):
        return self.path(default_db)
    
    def db_exists(self):
        return os.path.exists(self.db_file())

    def ensure_db(self):
        if not(self.db_exists()) :
            self.create_db()
        else:
            try:
                self.query('select * from settings')
            except:
                self.create_db()

    def path(self,filename):
        return os.path.join(self.root,filename)   
    
     
    def connect(self):
        conn = sqlite3.connect(self.db_file())
        conn.execute('pragma foreign_keys = on')
        return conn
    

    @_conn_decorator
    def query(self, q, params = None, cursor=None, conn=None):
        r = list(cursor.execute(q,params) if params else cursor.execute(q))
        return r
    
    @_conn_decorator
    def get_server_properties(self,cursor=None, conn=None):
        q = 'select %s from settings where settings_id = 1' % ','.join(server_properties_vars)
        return dict(zip( server_properties_vars, next(cursor.execute( q ))))

    @_conn_decorator
    def set_server_properties(self,server_props, cursor=None, conn=None):
        set_vars = _assignments(server_properties_vars,server_props)
        cursor.execute('''update settings set %s 
             where settings_id = 1 and
             server_status = :server_status
            ''' % set_vars , server_props)
        if cursor.rowcount == 1 :
            conn.commit()
            return True
        return False                
        
    @_conn_decorator
    def set_config(self,config_text,cursor=None,conn=None):
        r = self.get_config(cursor=cursor, conn=conn)
        sha1 = hashlib.sha1(config_text).hexdigest()
        if not(r) or r[3] != sha1:
            cursor.execute("insert into config (uploaded_dt,config_text,config_sha1) values (CURRENT_TIMESTAMP,?,?)",(config_text,sha1))
            cursor.execute("update settings set current_config_id = ?, last_changed_dt=CURRENT_TIMESTAMP",(cursor.lastrowid,))
            conn.commit()
            return True
        return False

    @_conn_decorator
    def apply_config(self,cursor=None,conn=None):
        r = self.get_config(conn=conn)
        config = yaml.load(r[2])
        return config
            
        
    @_conn_decorator
    def get_config(self,config_id=None,cursor=None, conn=None):
        if not(config_id):
            config_id = list(cursor.execute('select current_config_id from settings'))[0][0]
            if not(config_id):
                return None
        return list(cursor.execute('select config_id,uploaded_dt,config_text,config_sha1 from config where config_id = ?', (config_id,)))[0]


    @_conn_decorator
    def create_db(self, cursor=None, conn=None):
    
        cursor.execute('''CREATE TABLE config (
        config_id INTEGER primary key,
        uploaded_dt TIMESTAMP,
        config_text TEXT,
        config_sha1 TEXT
        )''')
    
        cursor.execute('''CREATE TABLE settings (
        settings_id INTEGER primary key CHECK( settings_id in (1) ) default 1,
        current_config_id INTEGER null references config(config_id) default null,
        server_port INTEGER null default null,
        server_host TEXT null default null,
        server_status INTEGER not null default 0,
        last_changed_dt TIMESTAMP default CURRENT_TIMESTAMP
        )''')
        
        # Save (commit) the changes
        cursor.execute('insert into settings (settings_id) values (1)')
        #
        conn.commit()
    
        
    
