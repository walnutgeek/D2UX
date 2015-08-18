from __future__ import print_function
from nose.tools import eq_,with_setup
import sys
import os
import shutil

from datetime import datetime
from subprocess import Popen

sample_config='./sample-config.yaml'

def create_sample_config_server(abs_dir, config_file = sample_config):
    print('creating %s server in : %s' % (config_file,abs_dir))
    if os.path.isdir(abs_dir):
        shutil.rmtree(abs_dir)
    os.makedirs(abs_dir)
    

def test_app():
    test_dir = os.path.abspath('./test-out/test_app')
    create_sample_config_server(test_dir)
    Popen(['coverage', 'run', '-p','-m', 'd2ux.app', 
           '--root', test_dir,  
           '--port', '9766' , 'server']) 

    import time
    time.sleep(5) 
    Popen(['coverage', 'run',  '-p','-m', 'd2ux.app', '--root', test_dir, 'shutdown'])
    time.sleep(2) 


if __name__ == '__main__':
    create_sample_config_server(os.path.abspath(sys.argv[1])) 

