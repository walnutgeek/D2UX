# D2UX

Name stand for "Data Driven User Experience". 

Idea is to define metadata/schema of your data that could be 
used to define user interface and persistance. 

My primary is rapid prototyping so data will be persisted in 
text files(.csv, .json) or sqlite db on server side. I want D2UX 
be simple and usable standalone tool.  

UI should be responsive and work well on different devices. 
For that I will to use [jquery][] and [bootstrap][]. One is 
unresolved UI issues is displaying wide tables, at this time 
I inteded use [slickgrid][], yet I am not sure if I get it to 
work well on smaler devices .

On backend [tornado][] will be used and communication will be 
carried out with websockets.

Each data records identified with path, so dependent record 
parent will include parent path. So data will be shaped 
like a tree.

[jquery]: http://jquery.com
[bootstrap]: http://getbootstrap.com/
[slickgrid]: https://github.com/mleibman/SlickGrid
[tornado]: http://tornadoweb.org

