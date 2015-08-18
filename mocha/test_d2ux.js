var assert = require("assert");
var d2ux = require("../d2ux/web/d2ux");

function testArrays(expected, actual) {
  assert.equal(expected.length, actual.length);
  for ( var i = 0; i < expected.length; i++) {
    assert.equal(expected[i], actual[i]);
  }
}



describe(
    'utils',
    function() {
      describe('#assert', function() {
        it('check assert success and failure', function() {
          d2ux.utils.assert("aa", "aa");
          d2ux.utils.assert("aa", [ "qq", "aa" ]);
          try {
            d2ux.utils.assert("aa", "bb");
          } catch (x) {
            assert.equal(x.message,
                "Unexpected entry: aa  expected:'bb', provided:'aa'");
            assert.equal(x.params.expected, "bb");
            assert.equal(x.params.provided, "aa");
          }
          var arr = [ "cc", "bb" ];
          try {
            d2ux.utils.assert("aa", arr);
          } catch (x) {
            assert.equal(x.message,
                "Unexpected entry: aa  expected:['cc','bb'], provided:'aa'");
            assert.equal(x.params.expected, arr);
            assert.equal(x.params.provided, "aa");
          }
          try {
            d2ux.utils.assert("aa", "bb", "haha");
          } catch (x) {
            assert.equal(x.message, "haha  expected:'bb', provided:'aa'");
            assert.equal(x.params.expected, "bb");
            assert.equal(x.params.provided, "aa");
          }
        });
      });
      describe('#applyOnAll', function() {
        it('make sure that it apply on all object own properties', function() {
          d2ux.utils.applyOnAll({
            a : "b",
            b : "c"
          }, function(v, k, obj) {
            assert.ok(obj instanceof Object);
            if (k === "a") {
              assert.equal(v, "b");
            } else if (k === "b") {
              assert.equal(v, "c");
            } else {
              assert.ok(false, "What the hell is:" + k);
            }
          });
        });
      });
      describe(
          '#escapeXmlBody',
          function() {
            it(
                'make sure that xml attribute escaped properly',
                function() {
                  assert
                      .equal(
                          "&lt;body&gt;&amp;aaa; single quote = ' &amp; double quote = \" &lt;/body&gt;",
                          d2ux.utils
                              .escapeXmlBody("<body>&aaa; single quote = ' & double quote = \" </body>"));
                });
          });
      describe(
          '#escapeXmlAttribute',
          function() {
            it(
                'make sure that xml attribute escaped properly',
                function() {
                  assert
                      .equal(
                          "&lt;body&gt;&amp;aaa; single quote = &#39; &amp; double quote = &quot; &lt;/body&gt;",
                          d2ux.utils
                              .escapeXmlAttribute("<body>&aaa; single quote = ' & double quote = \" </body>"));
                });
          });
      describe('#Tokenizer', function() {
        it('check Tokenizer functionality', function() {
          var tt = d2ux.utils.Tokenizer("a/b/c//dd/x/v/l", "/?&=");
          assert.equal(tt.nextDelimiter(), "");
          assert.equal(tt.nextValue(), "a");
          assert.equal(tt.nextDelimiter(), "/");
          assert.equal(tt.nextValue(), "b");
          assert.equal(tt.nextDelimiter(), "/");
          assert.equal(tt.nextValue(), "c");
          assert.equal(tt.nextDelimiter(), "//");
          assert.equal(tt.nextValue(), "dd");
          assert.equal(tt.nextDelimiter(), "/");
          assert.equal(tt.nextValue(), "x");
          assert.equal(tt.nextDelimiter(), "/");
          assert.equal(tt.nextDelimiter(), "");
          assert.equal(tt.nextValue(), "v");
          assert.equal(tt.nextDelimiter(), "/");
          assert.equal(tt.nextValue(), "l");
          assert.equal(tt.nextValue(), "");
          assert.equal(tt.nextDelimiter(), "");
        });
      });
      describe('#BiMap', function() {
        it('check BiMap', function() {
          
          var m = d2ux.utils.BiMap( { a: 1, b: 2} );
          assert.equal(m.get('a'), 1);
          assert.equal(m.get('b'), 2);
          assert.equal(m.key(2), 'b');
          assert.equal(m.key(3), null);
          m.put('z', 3)
          assert.equal(m.key(3), 'z');
          m.del('b')
          assert.equal(""+m.keys(), "a,z")
        });
      });
      describe('#isArray()', function() {
        it('', function() {
          assert.ok(d2ux.utils.isArray([ 1, 2, 3 ]));
          assert.ok(!d2ux.utils.isArray(1));
          assert.ok(!d2ux.utils.isArray(function() {
          }));
        });
      });
      describe('#extractFunctionName()', function() {
        it('', function() {
          function a(){return 5;}
          assert.equal("a", d2ux.utils.extractFunctionName(a));
          function d2uxa(){return 5;}
          assert.equal("d2uxa", d2ux.utils.extractFunctionName(d2uxa));
        });
      });
      describe('#append()', function() {
        it('', function() {
          var x = {
            a : "a",
            b : "b"
          };
          d2ux.utils.append(x, {
            b : "b2",
            c : "c"
          });
          assert.equal(x.a, "a");
          assert.equal(x.b, "b2");
          assert.equal(x.c, "c");
        });
      });
      describe('#size()', function() {
        it('', function() {
          assert.equal(d2ux.utils.size({}), 0);
          assert.equal(d2ux.utils.size({
            a : "a",
            b : "b"
          }), 2);
          assert.equal(d2ux.utils.size({
            a : "a"
          }), 1);
        });
      });
      describe('#join()', function() {
        it('join array', function() {
          assert.equal(d2ux.utils.join([ 1, 2, 3 ]), "1,2,3");
          assert.equal(d2ux.utils.join([ 1, 2, 3 ], function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }), "[1,2,3]");
        });
        it('join map', function() {
          var m = {
            a : 1,
            b : 2,
            c : 3
          };
          assert.equal(d2ux.utils.join(m, "", function(k, m) {
            return m[k];
          }), "123");
          assert.equal(d2ux.utils.join(m, null, function(k, m) {
            return m[k];
          }), "1,2,3");
          assert.equal(d2ux.utils.join(m, undefined, function(k, m) {
            return m[k];
          }), "1,2,3");
          assert.equal(d2ux.utils.join(m), "a,b,c");
          assert.equal(d2ux.utils.join(m, function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }), "[a,b,c]");
          assert.equal(d2ux.utils.join(m, function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }, function(k, m) {
            return m[k];
          }), "[1,2,3]");
        });
      });
      describe('#isString()', function() {
        it('', function() {
          assert.equal(d2ux.utils.isString("abc"), true);
          assert.equal(d2ux.utils.isString(new String("abc")), true);
          assert.equal(d2ux.utils.isString(5), false);
          assert.equal(d2ux.utils.isString([]), false);
        });
      });
      describe('#stringify()', function() {
        it('', function() {
          assert.equal(d2ux.utils.stringify("abc"), "'abc'");
          assert.equal(d2ux.utils.stringify(new String("abc")), "'abc'");
          assert.equal(d2ux.utils.stringify(5), "5");
          assert.equal(d2ux.utils.stringify([]), "[]");
          assert.equal(d2ux.utils.stringify([ 3, 'a', [ true, [] ] ]),
          "[3,'a',[true,[]]]");
        });
      });
      describe('#splitUrlPath()', function() {
        it('', function() {
          function test(path, compare_with){
            assert.equal(JSON.stringify(d2ux.utils.splitUrlPath(path)), compare_with );
          }
          test("abc",'{"path":["abc"],"variables":{}}');
          test("http://abc.com/index.html",'{"path":["http:","","abc.com","index.html"],"variables":{}}');
          test("/app.html?&_suid=141740660296307673981441184878",'{"path":["","app.html"],"variables":{"_suid":"141740660296307673981441184878"}}');
          test("/events/T7?&_suid=141740833138706824455889873207",'{"path":["","events","T7"],"variables":{"_suid":"141740833138706824455889873207"}}');
          test("",'{"path":[""],"variables":{}}');
          test("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584",'{"path":["","events","z3"],"variables":{"q":"askhsj hdjk","_suid":"141749092391407243743964936584"}}');
          var split =d2ux.utils.splitUrlPath("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584");
          assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584" );
          delete split.variables['_suid'];
          assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk" );
          delete split.variables['q'];
          assert.equal(split.toString(), "/events/z3" );
          
        });
      });
      describe('#error()', function() {
        it('', function() {
          var e = d2ux.utils.error({
            message : "msg",
            a : "a",
            b : "not b"
          });
          assert.ok(e instanceof Error);
          assert.equal(e.message, "msg  a:'a', b:'not b'");
          d2ux.utils.error({
            b : "b",
            c : "c"
          }, e);
          assert.ok(e instanceof Error);
          assert.equal(e.message, "msg  a:'a', b:'b', c:'c'");
          // TODO: Fails on 0.11.13
          //assert.equal(e.stack.split(/\n/)[0],
          //   "Error: msg  a:'a', b:'b', c:'c'");
        });
      });
      describe('#padWith()', function() {
        it('', function() {
          assert.equal(d2ux.utils.padWith(5, '00'), '05');
          assert.equal(d2ux.utils.padWith(345, '00'), '45');
          assert.equal(d2ux.utils.padWith(35, '00'), '35');
          assert.equal(d2ux.utils.padWith(685, '0000'), '0685');
        });
      });
      describe('#parseDateUTC()', function() {
        it('', function() {
          var isoDate = d2ux.utils.parseDateUTC('2014-09-08 17:00:00');
          assert.equal('2014-09-08T17:00:00.0000Z', d2ux.utils.dateToIsoString(isoDate));
          var isoDate = d2ux.utils.parseDateUTC('2014-09-08 17:00:00.456546');
          assert.equal('2014-09-08T17:00:00.0456Z', d2ux.utils.dateToIsoString(isoDate));
        });
      });
      describe('#relativeDateString()', function() {
        it('', function() {
          var s = d2ux.utils.relativeDateString(
              d2ux.utils.parseDateUTC('2014-09-08 17:00:00'),
              d2ux.utils.parseDateUTC('2014-09-08 18:01:20'));
          assert.equal(s, '-01:01');
          s = d2ux.utils.relativeDateString(
              d2ux.utils.parseDateUTC('2014-09-08 18:01:20'), 
              d2ux.utils.parseDateUTC('2014-09-08 17:00:00')
              );
          assert.equal(s, '+01:01');
          s = d2ux.utils.relativeDateString(
              d2ux.utils.parseDateUTC('2014-09-08 18:01:20'), 
              d2ux.utils.parseDateUTC('2014-09-09 17:00:00')
          );
          assert.equal(s, '-22:59');
          s = d2ux.utils.relativeDateString(
              d2ux.utils.parseDateUTC('2014-09-08 18:01:20'), 
              d2ux.utils.parseDateUTC('2014-09-10 17:00:00')
          );
          assert.equal(s, '2014-09-08 18:01');
        });
      });
      describe('#dateToIsoString()', function() {
        it('', function() {
          var isoDate = d2ux.utils
              .dateToIsoString(new Date(Date.UTC(1980, 0, 1)));
          assert.equal(isoDate, '1980-01-01T00:00:00.0000Z');
          assert.equal(d2ux.utils.dateToIsoString(new Date(isoDate)),
              '1980-01-01T00:00:00.0000Z');
        });
      });
      describe('#binarySearch()', function() {
        it('found', function() {
          var array = [ 1, 2, 4, 6, 8, 10, 25 ];
          function test(value, position) {
            var found = d2ux.utils.binarySearch(value, array,
                d2ux.Type.number.compare);
            assert.equal(found, position);
          }
          ;
          test(10, 5);
          test(25, 6);
          test(-1, -1);
          test(3, -3);
          test(5, -4);
          test(6, 3);
          test(7, -5);
          test(8, 4);
          test(9, -6);
          test(24, -7);
          test(26, -8);
          array.splice(5, 1);
          test(10, -6);
          test(25, 5);
          test(-1, -1);
          test(3, -3);
          test(5, -4);
          test(6, 3);
          test(7, -5);
          test(8, 4);
          test(9, -6);
          test(24, -6);
          test(26, -7);
        });
      });
      describe('#brodcastCall()', function() {
        it('ints', function() {
          var array = [ 'Nope', 'Nope' ];
          var one = {f:function(i){assert.equal(this,one);assert.equal(i,1);array[0]="1";}};
          var two = {f:function(i){assert.equal(this,two);assert.equal(i,1);array[1]="2";}};
          var three = {};
          d2ux.utils.brodcastCall([one,two,three] ,"f",[1]);
          testArrays([ "1", "2" ], array);
        });
      });
      describe('#isArrayEmpty()', function() {
        it('ints', function() {
          var nope = [ 'Nope', 'Nope' ];
          var yes1 = null;
          var yes2 = undefined;
          var yes3 = [];
          assert.equal(d2ux.utils.isArrayEmpty(nope),false);
          assert.equal(d2ux.utils.isArrayEmpty(yes1),true);
          assert.equal(d2ux.utils.isArrayEmpty(yes2),true);
          assert.equal(d2ux.utils.isArrayEmpty(yes3),true);
        });
      });
      describe('#detectRepeatingChar()', function() {
        it('', function() {
          assert.equal(d2ux.utils.detectRepeatingChar("###abc","#"), 3);
        });
      });
      describe('#detectPrefix()', function() {
        it('', function() {
          assert.equal(d2ux.utils.detectPrefix("{|abc","{|"), true);
        });
      });
      describe('#repeat()', function() {
        it('ints', function() {
          testArrays([ 0, 0, 0, 0 ], d2ux.utils.repeat(4, 0));
          testArrays([ 1, 1, 1, 1 ], d2ux.utils.repeat(4, 1));
        });
      });
      describe('#sequence()', function() {
        it('ints', function() {
          testArrays([ 0, 1, 2, 3 ], d2ux.utils.sequence(4));
          testArrays([ 1, 2, 3, 4 ], d2ux.utils.sequence(4, 1));
        });
      });
      describe('#sequence()', function() {
        it('strings', function() {
          testArrays([ "s0", "s1", "s2", "s3" ], d2ux.utils.sequence(4, "s"));
        });
      });
      describe('#sequence()', function() {
        it('function', function() {
          testArrays([ 0, 1, 4, 9 ], d2ux.utils.sequence(4, function(i) {
            return i * i
          }));
        });
      });
    });
