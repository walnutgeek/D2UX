'''

'''
from enum import Enum
import os


class FileType(Enum):
    DIR=(0,None,)
    CSV=(1,'.csv')
    JSON=(2,'.json')
    MD=(3,'.md')

class ContentType(Enum):
    DATA_FRAME=(1,)
    OBJECT=(2,)
    MD=(2,)

    

    
class Path:
    def __init__(self,s):
        self.parts=s.split('/')
    
    def file(self, root='/'):
        os.path.join(self.parts.join('/'),root)
        
