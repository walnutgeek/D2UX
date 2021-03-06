import os
from sniffer.api import file_validator,runnable,select_runnable

@select_runnable('execute_nose')
@file_validator
def py_files(filename):
    return filename.endswith('.py') or filename.endswith('.yaml') or filename.endswith('.rst')

@select_runnable('execute_mocha')
@file_validator
def js_files(filename):
    return filename.endswith('.js') or filename.endswith('.yaml') or filename.endswith('.json')

@runnable
def execute_nose(*args):
    #return nose.run(argv=list(args))
    return 0 == os.system('coverage run -p -m nose; coverage combine; coverage report -m; rm .coverage')

@runnable
def execute_mocha(*args):
    return 0 == os.system('cd mocha ; mocha .')

#@runnable
def execute_sphinx(*args):
    return 0 == os.system('cd docs; make')


