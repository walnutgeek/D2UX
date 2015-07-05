# D2UX

Name stand for "Data Driven User Experience". 

Idea is to define metadata/schema for your data and that automatically 
to define user interface and persistance. 

Plan is to have  data persisted in text files(.csv, .json) or 
[sqlite][] db on server. I want D2UX be simple and usable standalone 
rapid prototyping tool.  

UI should be responsive and work well on different devices. 
For that I will to use [jquery][] and [bootstrap][] for that. 
Unresolved at this time is how to display wide tables, I inteded use 
[slickgrid][], yet I am not sure if I get it to work well on smaller 
devices .

On backend [tornado][] will be used and communication will be 
carried out with websockets.

Each data records identified with path, dependent record 
path will include parent path, and data will be shaped 
like a tree.

Recent Chrome will be first browser to test, and intention is 
to support only modern browsers with native history and websockets.

[jquery]: http://jquery.com
[bootstrap]: http://getbootstrap.com/
[slickgrid]: https://github.com/mleibman/SlickGrid
[tornado]: http://tornadoweb.org
[sqlite]: http://sqlite.org


