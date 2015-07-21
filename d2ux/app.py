'''
D2UX  app 
+++++++++++

stand for Data Driven User Experience

to run::

  python -m d2ux.app --root root/ 
  
'''
from __future__ import print_function

import argparse
import sys
import os
from d2ux.root import Store,ServerStatus
from . import server
from . import utils
import logging

log = logging.getLogger(__name__)

def set_logging(rootdir, quiet):
    error_handler = logging.FileHandler( os.path.join(rootdir, "debug.log"), "a" )
    error_handler.setLevel(logging.DEBUG)
    error_handler.setFormatter(logging.Formatter("%(asctime)s:%(levelname)s:%(message)s"))
    root = logging.getLogger()
    if not(quiet):
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
        root.addHandler(console_handler)
    root.addHandler(error_handler)
    root.setLevel(logging.DEBUG)

def warning(*objs):
    print("WARNING: ", *objs, file=sys.stderr)
    
def main():
    dao = None
    def do_shutdown(args):
        if not(dao.db_exists()):
            raise ValueError('cannot shutdown not running D2UX instance')
        server_props = dao.get_server_properties()
        if utils.find_enum(ServerStatus, server_props['server_status'] ) != ServerStatus.running:
            raise ValueError('cannot shutdown not running D2UX instance')
        server_props.update( _server_status = ServerStatus.prepare_to_stop )
        if dao.set_server_properties(server_props):
            log.info ("Shutdown initiated")
        
    def run_server(args):
        log.debug('%r %r' % ('server', args) )
        server.run_server(dao,address=args.address,port=args.port)

        
    parser = argparse.ArgumentParser(description='D2UX - Data Driven User Experience')
    subparsers = parser.add_subparsers()
    
    subparsers.add_parser('shutdown', help='notify D2UX instance server to shutdown').set_defaults(func=do_shutdown)
    subparsers.add_parser('server',   help='starts D2UX instance server, if --config is defined load new config before start').set_defaults(func=run_server)
    parser.set_defaults(quiet=False)
    parser.add_argument('--quiet', dest='quiet', action='store_true', help='quiet mode')
    parser.add_argument("--port", type=int, default=9753, help='D2UX instance will listen on that port.')
    parser.add_argument("--address", type=str, default='', help='D2UX instance will listen on that ip address.')
    parser.add_argument("--root", type=str, default='.', help='D2UX instance root dir to store db and artifacts. if not provided current directory will be used as default.')
    args = parser.parse_args()
    abs_root = os.path.abspath(args.root)
    set_logging(abs_root,args.quiet)
    log.info("abs_root= %r" % abs_root)
    dao=Store(abs_root)
    try:
        args.func(args)
    except ValueError, e:
        warning(e)
        #parser.print_help()
        raise SystemExit(-1)

if __name__ == '__main__':
    main()    
