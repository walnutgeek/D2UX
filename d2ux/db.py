"""
This module contains of data access logic.

Examples on this page assumes that you imported ``ontimer.db`` like::

    import ontimer.db as db
    
"""
import hashlib
import datetime
import sqlite3
import os
from . import utils
import collections
from enum import IntEnum


default_filename = '.ontimer'

_TBL = 0
_PK  = 1
#                    Table(_TBL)          PKey(_PK)
_EVENTTYPE =         'event_type',        'event_type_id'
_EVENT =             'event',             'event_id'
_TASK =              'task',              'task_id'
_PREREQ =            'task_prereq',       'prereq_id'
_TASKTYPE =          'task_type',         'task_type_id'
_ARTIFACT =          'artifact',          'artifact_id'
_ARTIFACT_SCORE =    'artifact_score',    'artifact_score_id'

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

def _args(args): return args[0] if 1 == len(args) and isinstance(args[0], collections.Iterable) else args

def _selectors( *args ):
    tables_keys = _args(args)
    return  ', '.join( map( lambda t: t[_TBL] + '.*',tables_keys) )

def _joins ( *args ): 
    tables_keys = _args(args)
    return ' and '.join('%s.%s = %s.%s' % (tables_keys[i + 1][0], tk[1], tk[0], tk[1]) for (i, tk) in enumerate(tables_keys[:-1]))

def _froms ( *args ): 
    tables_keys = _args(args)
    return ', '.join(map(lambda t:t[_TBL], tables_keys))

def _join_froms ( query, l, join,r ): 
    return '%s %s JOIN %s ON %s.%s=%s.%s' % (query,join,r[0],l[0],l[1],r[0],l[1])

def _simple_join(tables_keys, selectors, where = ''):
    return 'select %s from %s where %s %s' % (selectors, _froms(tables_keys), _joins(tables_keys), where)

def _fetch_tree(cursor, key_attrib_pairs, query_result = None, query_columns = None):
    ''' 
    divide query results into sections by key (out of key attrib_pairs) and group by 
    '''
    query_result = query_result or cursor.fetchall()
    if len(query_result) == 0:
        return []
    query_columns = query_columns or [ col[0]  for col in cursor.description ]
    result_with_colnames = map( lambda v: [ (col, v[i]) for i,col in enumerate(query_columns) ], query_result )
    group_list=[]
    for row in result_with_colnames:
        i = 0  
        groups=[{}]  
        for pair in row:
            if i < len(key_attrib_pairs) and key_attrib_pairs[i][0] == pair[0]:
                groups.append({})
                i += 1
            groups[i][pair[0]] = pair[1]
        if len(groups) - 1 != len(key_attrib_pairs):
            raise ValueError('cannot find all keys: %r in query columns: %r , come up with: %r' % (key_attrib_pairs,query_columns,groups) )
        group_list.append(groups)
    def group_by(grp_list, children_keys):
        if len(children_keys)==0 :
            return [ r[0] for r in grp_list]
        regroup = []    
        last_grp_idx = None
        def build_group(start,end):
            keys = children_keys[1:] 
            group = grp_list[start][0]
            regroup.append(group)
            children = group_by([ grp_list[j][1:] for j in range(start, end) ],keys)
            group[children_keys[0]] = children
        for idx, _ in enumerate(grp_list):
            if last_grp_idx is None :
                last_grp_idx = idx
            elif grp_list[idx][0] != grp_list[last_grp_idx][0]:
                build_group(last_grp_idx, idx) 
                last_grp_idx = idx
        build_group(last_grp_idx, len(grp_list)) 
        return regroup
    return group_by(group_list,[pair[1] for pair in key_attrib_pairs])

class Dao:
    def __init__(self, root, filename = default_filename):
        self.root = root
        self.filename = filename
    
    def file(self):
        return os.path.join(self.root,self.filename)   
     
    def exists(self):
        return os.path.exists(self.file())

    def connect(self):
        conn = sqlite3.connect(self.file())
        conn.execute('pragma foreign_keys = on')
        return conn
    
    def ensure_db(self):
        if not(self.exists()) :
            self.create_db()
        else:
            try:
                self.query('select * from settings')
            except:
                self.create_db()

    @_conn_decorator
    def query(self, q, params = None, cursor=None, conn=None):
        r = list(cursor.execute(q,params) if params else cursor.execute(q))
        return r
        
        
    @_conn_decorator
    def set_config(self,config_text,cursor=None,conn=None):
        event.Config(config_text)
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
        config = event.Config(r[2])
        config.config_id = r[0]
        for event_type in config.events:
            r = list(cursor.execute("select event_type_id, last_seen_in_config_id from event_type where event_name = ?",(event_type.name,)))
            if len(r) > 1 :
                raise ValueError('duplicate for event_name: %s' % event_type.name)
            elif len(r) == 1:
                event_type.event_type_id = r[0][0]
                if r[0][1] != config.config_id:
                    cursor.execute("update event_type set last_seen_in_config_id = ? where  event_type_id = ?",(config.config_id,event_type.event_type_id))
            else:
                cursor.execute("insert into event_type (event_name,last_seen_in_config_id) values (?,?)",(event_type.name,config.config_id))
                event_type.event_type_id = cursor.lastrowid
            
            def update_ids(obj_list,name, namecol):
                for obj in obj_list:
                    obj_id = None
                    r = list(cursor.execute("select {0}_id, last_seen_in_config_id from {0} where {1} = ? and event_type_id = ?".format(name,namecol),
                                            (obj.name,event_type.event_type_id)))
                    if len(r) > 1 :
                        raise ValueError('duplicate %s: %s' % name, obj.name)
                    elif len(r) == 1:
                        obj_id = r[0][0]
                        if r[0][1] != config.config_id:
                            cursor.execute("update {0} set last_seen_in_config_id = ? where  {0}_id = ?".format(name,namecol),(config.config_id,obj_id))
                    else:
                        cursor.execute("insert into {0} ({1},event_type_id,last_seen_in_config_id) values (?,?,?)".format(name,namecol),
                                       (obj.name,event_type.event_type_id,config.config_id))
                        obj_id = cursor.lastrowid
                    setattr(obj,'%s_id' % name, obj_id)
                    
            update_ids(event_type.generators,'generator', 'generator_name')
            update_ids(event_type.tasks,'task_type', 'task_name')
            
        conn.commit()
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
    
        
    
