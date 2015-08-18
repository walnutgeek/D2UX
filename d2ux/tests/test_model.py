
from nose.tools import eq_
from .. import model

def expectError(err, action):
    see_err = False
    try: 
        action()
    except err:
        see_err = True
    eq_(see_err,True)

def test_FileType():
    eq_(model.FileType.DIR!=None,True)
    

