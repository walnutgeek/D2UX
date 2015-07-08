var assert = require("assert");
var $_ = require("../d2ux/web/d2ux");

function testArrays(expected, actual) {
  assert.equal(expected.length, actual.length);
  for ( var i = 0; i < expected.length; i++) {
    assert.equal(expected[i], actual[i]);
  }
}

describe('pecent_encoding', function() {
  describe('#decode', function() {
    function scenario1(p, encoded) {
      var encodeToTest = $_.percent_encoding.encode(p);
      assert.equal(encodeToTest, encoded);
      var decodedEncode = $_.percent_encoding.decode(encodeToTest);
      assert.equal(decodedEncode, p);
    }
    ;
    it('basic', function() {
      scenario1("Abc/dlkdd?dldl=zz z", "Abc%2Fdlkdd%3Fdldl%3Dzz+z");
      scenario1("Abc/dlk\ndd\t?d\rldl=zz+z%",
          "Abc%2Fdlk%0Add%09%3Fd%0Dldl%3Dzz%2Bz%25");
    });
    it('utf-8', function() {
      scenario1("У попа", "%D0%A3+%D0%BF%D0%BE%D0%BF%D0%B0");
      scenario1("\u0423 \u043F\u043E\u043F\u0430",
          "%D0%A3+%D0%BF%D0%BE%D0%BF%D0%B0");
    });
  });
});
describe('Sliki', function() {
  describe('#render', function() {
    function scenario1(p, encoded) {
      assert.equal(new $_.Sliki(p).render(), encoded);
    };
    it('basic', function() {
      //scenario1("{{#nowiki}}\nno ''markup''\n{{/nowiki}}\n", "<code>\nno ''markup''\n</code>\n");
      scenario1("\nno ''markup''\n","<p>\nno <i>markup</i>\n");
      scenario1("\nno '''markup'''\n","<p>\nno <b>markup</b>\n");
      scenario1("\nno ''''markup''''\n","<p>\nno <b><i>markup</i></b>\n");
      scenario1("\nno '''markup''''\n","<p>\nno <b>markup'</b>\n");
      scenario1("\nno ''''markup'''\n","<p>\nno <b>'markup</b>\n");
      scenario1("\nno '''''markup''''\n","<p>\nno <b><i>'markup</i></b>\n");
      scenario1("\nno '''''markup''''\n\n''markup''","<p>\nno <b><i>'markup</i></b>\n</p><p>\n<i>markup</i>");
      scenario1("\nno <math>markup</math>, <math> a = b + c </math>\n","<p>\nno $$$ markup $$$, $$$  a = b + c  $$$\n");
      scenario1("\n---- \t\n","<p>\n<hr>\n");
    });
    it('heading', function() {
      scenario1("\n== markup ==\n","<p>\n<h2>markup</h2>\n");
      scenario1("\n==== markup ===\n","<p>\n<h3>=markup</h3>\n");
      scenario1("\n=== markup ====\n","<p>\n<h3>markup=</h3>\n");
      scenario1("\n=== markup ====\n\n=== markup ====\n","<p>\n<h3>markup=</h3>\n</p><p>\n<h3>markup=</h3>\n");
    });
    it('list', function() {
      scenario1("\n* l1 a\n** l2 a\n** L2 b\n* L1 b","<p>\n<ul><li> l1 a<ul><li> l2 a</li><li> L2 b</li></ul></li><li> L1 b</li></ul>");
      scenario1("\n# l1 a\n## l2 a\n## L2 b\n# L1 b","<p>\n<ol><li> l1 a<ol><li> l2 a</li><li> L2 b</li></ol></li><li> L1 b</li></ol>");
      scenario1("\n# l1 a\n## l2 a\n## L2 b\n# L1 b","<p>\n<ol><li> l1 a<ol><li> l2 a</li><li> L2 b</li></ol></li><li> L1 b</li></ol>");
      scenario1("\n# l1 a\n** l2 a\n** L2 b\n# L1 b","<p>\n<ol><li> l1 a<ul><li> l2 a</li><li> L2 b</li></ul></li><li> L1 b</li></ol>");
      scenario1("\n# l1 a\n*** l2 a\n** L2 b\n# L1 b","<p>\n<ol><li> l1 a<ul><li> <ul><li> l2 a</li></ul></li><li> L2 b</li></ul></li><li> L1 b</li></ol>");
    });
  });
});

describe(
    'slinck',
    function() {
      describe('#Path', function() {
        it(' - simple case', function() {
          var p = $_.Path("a/b/c");
          var p2 = new $_.Path("a/b/c");

          assert.ok(p instanceof $_.Path);
          assert.ok(p2 instanceof $_.Path);

          assert.equal(p.toString(), p2.toString());
          assert.equal(p.toString(), "a/b/c");
        });
        it(' - check unexpected entry logic', function() {
          try {
            new $_.Path("a/b/c//");
            assert.fail("it not supposed get here and choke on '//'");
          } catch (e) {
            assert.equal(e.params.expected, null);
            assert.equal(e.params.provided, "//");
          }
        });
        it(' - check wierd character and array constructor', function() {
          var p3 = new $_.Path([ "a", "b/", "c" ]);
          var p4 = $_.Path("a/b%2F/c/");
          assert.ok(p3 instanceof $_.Path);
          assert.ok(p4 instanceof $_.Path);
          assert.equal(p4.toString(), p3.toString());
          assert.equal(p4.toString(), "a/b%2F/c");
        });
      });

      function doSlinck(tests, sl) {
        for ( var i = 0; i < tests.length; i++) {
          tests[i](sl);
        }
      }

      function hostCheck(snk) {
        assert.equal("host", snk.host);
      }
      function noHostCheck(snk) {
        assert.equal(null, snk.host);
      }
      function sectionCheck(snk) {
        assert.equal("branch/sec/ti/on", snk.section.toString());
      }
      function sectionDbCheck(snk) {
        assert.equal("branch/sec/ti/ondb", snk.section.toString());
      }
      function pathCheck(snk) {
        assert.equal("a/b/c", snk.path.toString());
      }

      function boundXCheck(snk, x, v) {
        assert.equal(x + "=" + v, snk.bound(x).toString());
      }

      function boundEqCheck(snk) {
        boundXCheck(snk, "eq", "a/b/c");
      }
      function boundGteCheck(snk) {
        boundXCheck(snk, "gte", "a1/b1/c1");
      }
      function boundLtCheck(snk) {
        boundXCheck(snk, "lt", "a2/b2/c3");
      }

      var testCases = {
        "slinck://host/branch/sec/ti/on" : {
          description : "section",
          tests : [ hostCheck, sectionCheck ]
        },
        "slinck://host/branch/sec/ti/on//" : {
          description : "section",
          tests : [ hostCheck, sectionCheck ]
        },
        "slinck://host/branch/sec/ti/on?" : {
          description : "section",
          tests : [ hostCheck, sectionCheck ]
        },
        "slinck://host/branch/sec/ti/ondb//a/b/c" : {
          description : "fragment of ordered table",
          tests : [ hostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
        },
        "slinck://host/branch/sec/ti/ondb?eq=a/b/c" : {
          description : "fragment of ordered table using 'eq' bound",
          tests : [ hostCheck, sectionDbCheck, boundEqCheck ]
        },
        "slinck://host/branch/sec/ti/ondb?gte=a1/b1/c1&lt=a2/b2/c3" : {
          description : "fragment as range between two keys",
          tests : [ hostCheck, sectionDbCheck, boundGteCheck, boundLtCheck ]
        },
        "branch/sec/ti/on//" : {
          description : "hostless section",
          tests : [ noHostCheck, sectionCheck ]
        },
        "branch/sec/ti/ondb//a/b/c" : {
          description : "hostless fragment of ordered table",
          tests : [ noHostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
        },
        "branch/sec/ti/ondb?eq=a/b/c" : {
          description : "hostless fragment of ordered table using 'eq' bound",
          tests : [ noHostCheck, sectionDbCheck, boundEqCheck ]
        },
        "branch/sec/ti/ondb?gte=a1/b1/c1&lt=a2/b2/c3" : {
          description : "hostless fragment as range between two keys",
          tests : [ noHostCheck, sectionDbCheck, boundGteCheck, boundLtCheck ]
        },
        "/branch/sec/ti/on" : {
          description : "hostless section",
          tests : [ noHostCheck, sectionCheck ]
        },
        "/branch/sec/ti/on//" : {
          description : "hostless section",
          tests : [ noHostCheck, sectionCheck ]
        },
        "/branch/sec/ti/on?" : {
          description : "hostless section",
          tests : [ noHostCheck, sectionCheck ]
        },
        "/branch/sec/ti/ondb//a/b/c" : {
          description : "hostless fragment of ordered table",
          tests : [ noHostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
        },
        "/branch/sec/ti/ondb?eq=a/b/c" : {
          description : "hostless fragment of ordered table using 'eq' bound",
          tests : [ noHostCheck, sectionDbCheck, boundEqCheck ]
        },
        "/branch/sec/ti/ondb?gte=a1/b1/c1&lt=a2/b2/c3" : {
          description : "hostless fragment as range between two keys",
          tests : [ noHostCheck, sectionDbCheck, boundGteCheck, boundLtCheck ]
        },
      };

      describe('#Slinck', function() {
        for ( var sl in testCases) {
          (function() {
            var tests = testCases[sl].tests;
            var slnk = new $_.Slinck(sl);
            it(' - ' + testCases[sl].description + ': ' + sl, function() {
              doSlinck(tests, slnk);
            });
          })();
        }
      });
      describe(
          '#Graph',
          function() {
            it('check if it will throw exception without new', function() {
              try {
                $_.Graph();
                assert.ok(false);
              } catch (e) {
              }
            });
            it('assemble graph one edge at the time', function() {
              var g = new $_.Graph().addEdge("x", "q").addEdge("a", "b")
                  .addEdge("b", "c").addEdge("x", "b").addEdge("x", "q")
                  .addEdge("c", "q");
              assert.equal(g.toString(), "x=(q,b=(c=(q))),a=(b)");
            });
            it('parse Graph', function() {
              var g = $_.Graph.parse("x=(q,b=(c=(q))),a=(b)");
              assert.equal(g.toString(), "x=(q,b=(c=(q))),a=(b)");
            });
            it('test search', function() {
              var g = $_.Graph.parse("x=(q,b=(c=(q))),a=(b)");
              assert.equal(g.get("q").search("a", "down"), true);
              assert.equal(g.get("q").search("a", "up"), false);
              assert.equal(g.get("b").search("x", "down"), true);
              assert.equal(g.get("b").search("x", "up"), false);
              assert.equal(g.get("a").search("b", "down"), false);
              assert.equal(g.get("a").search("b", "up"), true);
            });
            it('test sort', function() {
              var g = $_.Graph.parse("x=(q,b=(c=(q))),a=(b)");
              assert.equal($_.utils.stringify(g.sort()),
                  "['q','c','b','a','x']");
            });
            it(
                'parse exception: extra parenthesis at the end',
                function() {
                  try {
                    $_.Graph.parse("x=(q,b=(c=(q))),a=(b))");
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "unbalanced parenthesis  t:'x=(q,b=(c=(q))),a=(b)) <-i-> '");
                  }
                });
            it(
                'parse exception: missing parenthesis at the end',
                function() {
                  try {
                    $_.Graph.parse("x=(q,b=(c=(q))),a=(b");
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "unbalanced parenthesis  path:['a'], t:'x=(q,b=(c=(q))),a=(b <-i-> '");
                  }
                });
            it(
                'parse exception: circular reference',
                function() {
                  try {
                    $_.Graph.parse("x=(q,b=(c=(q,x))),a=(b)");
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(
                            e.message,
                            "circular reference  downstream:'c', upstream:'x', t:'x=(q,b=(c=(q,x <-i-> ))),a=(b)'");
                  }
                });
            it('parse exception: circular reference', function() {
              try {
                new $_.Graph().addEdge("x", "q").addEdge("c", "x").addEdge("a",
                    "b").addEdge("b", "c").addEdge("x", "b").addEdge("x", "q")
                    .addEdge("c", "q");
                assert.ok(false);
              } catch (e) {
                assert.equal(e.message,
                    "circular reference  downstream:'x', upstream:'b'");
              }
            });
          });
      function descriptionTable() {
        var table = new $_.Table();
        table.addColumn("name", null, $_.Type.string);
        table.addColumn("description", null, $_.Type.string);
        table.addColumn("modified", null, $_.Type.date);
        table.add({
          name : "a",
          description : "a",
          modified : new Date()
        });
        table.add({
          name : "a",
          description : "b",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "a",
          description : "t",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "b",
          description : "a",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "b",
          description : "m",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "c",
          description : "l",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "c",
          description : "q",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "x",
          description : "a",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "x",
          description : "x",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "x",
          description : "y",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "x",
          description : "z",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "z",
          description : "a",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        table.add({
          name : "z",
          description : "x",
          modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
        });
        return table;
      }
      describe(
          '#Index',
          function() {
            it(
                'check if it will throw exception without new',
                function() {
                  try {
                    $_.Index();
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "please use 'new', when calling this function  expected:true, provided:false");
                  }
                });
            it('index ordered', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "name", "description" ]);
              for ( var i = 0; i < index.index.length; i++) {
                assert.equal(index.index[i], i);
              }
              assert.equal(index.sorted, true);

            });
            it('index sort', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "description", "name" ]);
              assert.equal($_.utils.stringify(index.index),
                  "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
              assert.equal(index.sorted, false);

            });
            it('index indexOf', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "description", "name" ]);
              // "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
              assert.equal(10, index.indexOf({
                description : "x",
                name : "z"
              }));
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(-2, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.equal(-3, index.indexOf({
                description : "a",
                name : "c"
              }));
            });
            it('ordered indexOf', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "name", "description" ]);
              assert.equal(10, index.indexOf({
                name : "x",
                description : "z"
              }));
              assert.equal(-1, index.indexOf({
                name : "a",
                description : "A"
              }));
              assert.equal(0, index.indexOf({
                name : "a",
                description : "a"
              }));
              assert.equal(-2, index.indexOf({
                name : "a",
                description : "aa"
              }));
              assert.equal(1, index.indexOf({
                name : "a",
                description : "b"
              }));
              assert.equal(-3, index.indexOf({
                name : "a",
                description : "c"
              }));
            });
            it('index.merge on existing row', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "description", "name" ]);
              // "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
              assert.equal(10, index.indexOf({
                description : "x",
                name : "z"
              }));
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(-2, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.ok(index.row(1).modified != null);
              assert.equal(-3, index.indexOf({
                description : "a",
                name : "c"
              }));
              index.merge({
                description : "a",
                name : "b",
                modified : null
              });
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(-2, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.ok(index.row(1).modified == null);
              assert.equal(-3, index.indexOf({
                description : "a",
                name : "c"
              }));
            });
            it('index.merge that creates new row', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "description", "name" ]);
              // "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
              assert.equal(10, index.indexOf({
                description : "x",
                name : "z"
              }));
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(-2, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.equal(-3, index.indexOf({
                description : "a",
                name : "c"
              }));
              index.merge({
                description : "a",
                name : "aa",
                modified : null
              });
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.ok(index.row(1).modified == null);
              assert.equal(2, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.equal(-4, index.indexOf({
                description : "a",
                name : "c"
              }));
            });
            it('index.add to add duplicate key next to existing row',
                function() {
                  var table = descriptionTable();
                  var index = new $_.Index(table, [ "description", "name" ]);
                  // "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
                  assert.equal(10, index.indexOf({
                    description : "x",
                    name : "z"
                  }));
                  assert.equal(-1, index.indexOf({
                    description : "A",
                    name : "A"
                  }));
                  assert.equal(0, index.indexOf({
                    description : "a",
                    name : "a"
                  }));
                  assert.equal(-2, index.indexOf({
                    description : "a",
                    name : "aa"
                  }));
                  assert.equal(1, index.indexOf({
                    description : "a",
                    name : "b"
                  }));
                  assert.ok(index.row(1).modified != null);
                  assert.equal(-3, index.indexOf({
                    description : "a",
                    name : "c"
                  }));
                  index.add({
                    description : "a",
                    name : "b",
                    modified : null
                  });
                  assert.equal(-1, index.indexOf({
                    description : "A",
                    name : "A"
                  }));
                  assert.equal(0, index.indexOf({
                    description : "a",
                    name : "a"
                  }));
                  assert.equal(-2, index.indexOf({
                    description : "a",
                    name : "aa"
                  }));
                  var idx_ab = index.indexOf({
                    description : "a",
                    name : "b"
                  });
                  assert.ok(idx_ab == 1 || idx_ab == 2);
                  assert.ok(index.row(1).description == "a");
                  assert.ok(index.row(2).description == "a");
                  assert.ok(index.row(1).name == "b");
                  assert.ok(index.row(2).name == "b");
                  assert.equal(-4, index.indexOf({
                    description : "a",
                    name : "c"
                  }));
                });
            it('index.add that creates new uniqe row', function() {
              var table = descriptionTable();
              var index = new $_.Index(table, [ "description", "name" ]);
              // "[0,3,7,11,1,5,4,6,2,8,12,9,10]");
              assert.equal(10, index.indexOf({
                description : "x",
                name : "z"
              }));
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(-2, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.equal(-3, index.indexOf({
                description : "a",
                name : "c"
              }));
              index.add({
                description : "a",
                name : "aa",
                modified : null
              });
              assert.equal(-1, index.indexOf({
                description : "A",
                name : "A"
              }));
              assert.equal(0, index.indexOf({
                description : "a",
                name : "a"
              }));
              assert.equal(1, index.indexOf({
                description : "a",
                name : "aa"
              }));
              assert.ok(index.row(1).modified == null);
              assert.equal(2, index.indexOf({
                description : "a",
                name : "b"
              }));
              assert.equal(-4, index.indexOf({
                description : "a",
                name : "c"
              }));
            });
          });
      describe(
          '#Table',
          function() {
            it(
                'check if it will throw exception without new',
                function() {
                  try {
                    $_.Table();
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "please use 'new', when calling this function  expected:true, provided:false");
                  }
                });
            it('set', function() {
              var table = descriptionTable();
              var row = table.row(0);
              assert.equal(row.name, "a");
              assert.equal(row.description, "a");
              assert.ok(row.modified !== null);
              table.set(0, {
                name : "q",
                modified : null
              });
              assert.equal(row.name, "q");
              assert.equal(row.description, "a");
              assert.ok(row.modified === null);
            });
            it('filter', function() {
              var table = descriptionTable();
              var filtered = table.filter(function(r){return r.name == "b";});
              var row = filtered.row(0);
              assert.equal(row._rowId, 0);
              assert.equal(row.name, "b");
              assert.equal(row.description, "a");
              row = filtered.row(1);
              assert.equal(row._rowId, 1);
              assert.equal(row.name, "b");
              assert.equal(row.description, "m");
              assert.equal(filtered.getRowCount(), 2);
              row = table.row(3);
              assert.equal(row._rowId, 3);
              assert.equal(row.name, "b");
              row = table.row(4);
              assert.equal(row._rowId, 4);
              assert.equal(row.name, "b");
              assert.equal(filtered.header().length,3);

            });            
            it('sort Table', function() {
              var table = new $_.Table();
              table.addColumn("name", null, $_.Type.string);
              table.addColumn("description", null, $_.Type.string);
              table.addColumn("modified", null, $_.Type.date);
              try {
                table.addColumn("description", null, $_.Type.string);
                assert.ok(false);
              } catch (e) {
                assert.equal(e.params.name, "description");
              }
              var r0 = table.add({
                name : "a",
                description : "d",
                modified : new Date()
              });
              var r1 = table.add({
                name : "a",
                description : "x",
                modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
              });
              assert.equal(0, r0);
              assert.equal(1, r1);
              assert.equal(table.columns.hash.name.type, $_.Type.string);
              assert.equal(table.columns[0].name, "name");
              var compareNameDescriptionDate = table.makeCompare([ "name",
                  "description", "modified" ]);
              var compareDateDescription = table.makeCompare([ "modified",
                  "description" ]);
              try {
                table.makeCompare([ "date", "description" ]);
                assert.ok(false);
              } catch (e) {
                assert.equal(e.message, "column does not exist  key:'date'");
                assert.equal(e.params.key, "date");
              }
              assert.equal(compareNameDescriptionDate(0, 1) < 0, true);
              assert.equal(compareNameDescriptionDate(1, 0) > 0, true);
              assert.equal(compareNameDescriptionDate(1, 1) === 0, true);
              assert.equal(compareNameDescriptionDate(0, 0) === 0, true);
              assert.equal(compareDateDescription(0, 1) > 0, true);
              assert.equal(compareDateDescription(1, 0) < 0, true);
              assert.equal(compareDateDescription(1, 1) === 0, true);
              assert.equal(compareDateDescription(0, 0) === 0, true);
              var compareDateDescription2 = table.makeCompare([ "^modified",
                  "description" ]);
              assert.equal(compareDateDescription2(0, 1) < 0, true);
              assert.equal(compareDateDescription2(1, 0) > 0, true);
              assert.equal(compareDateDescription2(1, 1) === 0, true);
              assert.equal(compareDateDescription2(0, 0) === 0, true);
              // pass keys as arguments
              var compareDateDescriptionValues = table.makeCompare("^modified",
                  "description").compareValues;
              assert.equal(compareDateDescriptionValues(table.row(0), table
                  .row(1)) < 0, true);
              assert.equal(compareDateDescriptionValues(table.row(1), table
                  .row(0)) > 0, true);
              assert.equal(compareDateDescriptionValues(table.row(1), table
                  .row(1)) === 0, true);
              assert.equal(compareDateDescriptionValues(table.row(0), table
                  .row(0)) === 0, true);

            });
          });
      describe(
          '#TableView',
          function() {
            it(
                'check if it will throw exception without new',
                function() {
                  try {
                    $_.TableView();
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "please use 'new', when calling this function  expected:true, provided:false");
                  }
                });
            it('#toHtml with specified columns', function() {
              var table = descriptionTable();
              assert.equal("<table>"
                  + "<thead><tr><th>name</th><th>description</th></tr></thead>"
                  + "<tbody><tr><td>a</td><td>a</td></tr>"
                  + "<tr><td>a</td><td>b</td></tr>"
                  + "<tr><td>a</td><td>t</td></tr>"
                  + "<tr><td>b</td><td>a</td></tr>"
                  + "<tr><td>b</td><td>m</td></tr>"
                  + "<tr><td>c</td><td>l</td></tr>"
                  + "<tr><td>c</td><td>q</td></tr>"
                  + "<tr><td>x</td><td>a</td></tr>"
                  + "<tr><td>x</td><td>x</td></tr>"
                  + "<tr><td>x</td><td>y</td></tr>"
                  + "<tr><td>x</td><td>z</td></tr>"
                  + "<tr><td>z</td><td>a</td></tr>"
                  + "<tr><td>z</td><td>x</td></tr></tbody></table>",
                  new $_.TableView(table, null, [ 'name', 'description' ])
                      .toHtml());
            });
            it(
                '#toHtml with custom format',
                function() {
                  var table = descriptionTable();
                  assert
                      .equal(
                          "<table><thead><tr><th>name</th><th>description</th><th>modified</th></tr></thead>"
                              + "<tbody><tr><td>a</td><td>a</td><td>date</td></tr>"
                              + "<tr><td>a</td><td>b</td><td>date</td></tr>"
                              + "<tr><td>a</td><td>t</td><td>date</td></tr>"
                              + "<tr><td>b</td><td>a</td><td>date</td></tr>"
                              + "<tr><td>b</td><td>m</td><td>date</td></tr>"
                              + "<tr><td>c</td><td>l</td><td>date</td></tr>"
                              + "<tr><td>c</td><td>q</td><td>date</td></tr>"
                              + "<tr><td>x</td><td>a</td><td>date</td></tr>"
                              + "<tr><td>x</td><td>x</td><td>date</td></tr>"
                              + "<tr><td>x</td><td>y</td><td>date</td></tr>"
                              + "<tr><td>x</td><td>z</td><td>date</td></tr>"
                              + "<tr><td>z</td><td>a</td><td>date</td></tr>"
                              + "<tr><td>z</td><td>x</td><td>date</td></tr></tbody></table>",
                          new $_.TableView(table, function(v) {
                            return $_.utils.isDate(v) ? "date" : $_.utils
                                .ensureString(v);
                          }).toHtml());
                });
          });
      describe(
          '#Column',
          function() {
            it(
                'check if it will throw exception without new',
                function() {
                  try {
                    $_.Table.Column();
                    assert.ok(false);
                  } catch (e) {
                    assert
                        .equal(e.message,
                            "please use 'new', when calling this function  expected:true, provided:false");
                  }
                });
          });
      describe(
          '#XmlNode',
          function() {
            it(
                'table with 2 row',
                function() {
                  var table = new $_.XmlNode("table");
                  var tbody = table.child("tbody");
                  tbody.addText("abc");
                  var trs = tbody.child([ "tr", "tr", "tr" ]);
                  trs[0].attr("class", "even");
                  trs[1].attr({
                    class : "odd",
                    style : "height: 20px;"
                  });
                  trs.forEach(function(x) {
                    x.child([ "td", "td", "td" ]);
                  });
                  assert
                      .equal(
                          "<table><tbody>"
                              + "abc"
                              + "<tr class=\"even\"><td /><td /><td /></tr>"
                              + "<tr class=\"odd\" style=\"height: 20px;\"><td /><td /><td /></tr>"
                              + "<tr><td /><td /><td /></tr>"
                              + "</tbody></table>", table.toString());
                });
          });
      describe(
          '#Column.Type',
          function() {
            it('compare boolean', function() {
              var a = [ true, null, false, undefined, null, true, undefined,
                  false ];
              a.sort($_.Type.boolean.compare);
              assert.equal(
                  "[false,false,true,true,null,null,undefined,undefined]",
                  $_.utils.stringify(a));
              assert.equal(a[6], undefined);
              assert.equal(a[7], undefined);
            });
            it('compare number', function() {
              var a = [ "43", null, "1", undefined, "", null, 5, -2, "-1",
                  undefined, "10" ];
              a.sort($_.Type.number.compare);
              assert.equal(
                  "[-2,'-1','','1',5,'10','43',null,null,undefined,undefined]",
                  $_.utils.stringify(a));
              assert.equal(a[10], undefined);
              assert.equal(a[11], undefined);
            });
            it('compare string', function() {
              var a = [ "a", null, "Z", undefined, "", "-1", null, 5, -2,
                  undefined, "10" ];
              a.sort($_.Type.string.compare);
              assert.equal(
                  "['','-1',-2,'10',5,'Z','a',null,null,undefined,undefined]",
                  $_.utils.stringify(a));
              assert.equal(a[10], undefined);
              assert.equal(a[11], undefined);
            });
            it(
                'check freeze',
                function() {
                  assert.ok($_.Type.blob);
                  try {
                    new $_.Type("zhlob", $_.Type.string.compare);
                    assert.ok(false, "should throw exception");
                  } catch (e) {
                    assert
                        .equal(
                            e.message,
                            "Type is frozen for changes. Cannot add:zhlob  expected:[object Object], provided:undefined");

                  }
                  assert.ok(!$_.Type.zhlob);
                });
            it(
                'compare date',
                function() {
                  var a = [ "1980-01-02", "December 31, 1979", null,
                      new Date("1980-01-01T00:00:00.0000Z").toUTCString(), undefined ,new Date("1990-01-01T00:00:00.0000Z")];
                  a.sort($_.Type.date.compare);
                  var s = $_.utils.stringify(a);
                  assert.ok(s.indexOf("['December 31, 1979','Tue, 01 Jan 1980 00:00:00 GMT','1980-01-02',") === 0);
                  var endsWith =",null,undefined]";
                  assert.ok(s.indexOf(endsWith,s.length-endsWith.length) !== -1);
                  assert.equal(a[4], undefined);
                });
          });
    });

describe(
    'utils',
    function() {
      describe('#assert', function() {
        it('check assert success and failure', function() {
          $_.utils.assert("aa", "aa");
          $_.utils.assert("aa", [ "qq", "aa" ]);
          try {
            $_.utils.assert("aa", "bb");
          } catch (x) {
            assert.equal(x.message,
                "Unexpected entry: aa  expected:'bb', provided:'aa'");
            assert.equal(x.params.expected, "bb");
            assert.equal(x.params.provided, "aa");
          }
          var arr = [ "cc", "bb" ];
          try {
            $_.utils.assert("aa", arr);
          } catch (x) {
            assert.equal(x.message,
                "Unexpected entry: aa  expected:['cc','bb'], provided:'aa'");
            assert.equal(x.params.expected, arr);
            assert.equal(x.params.provided, "aa");
          }
          try {
            $_.utils.assert("aa", "bb", "haha");
          } catch (x) {
            assert.equal(x.message, "haha  expected:'bb', provided:'aa'");
            assert.equal(x.params.expected, "bb");
            assert.equal(x.params.provided, "aa");
          }
        });
      });
      describe('#applyOnAll', function() {
        it('make sure that it apply on all object own properties', function() {
          $_.utils.applyOnAll({
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
                          $_.utils
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
                          $_.utils
                              .escapeXmlAttribute("<body>&aaa; single quote = ' & double quote = \" </body>"));
                });
          });
      describe('#Tokenizer', function() {
        it('check Tokenizer functionality', function() {
          var tt = $_.utils.Tokenizer("a/b/c//dd/x/v/l", "/?&=");
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
          
          var m = $_.utils.BiMap( { a: 1, b: 2} );
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
          assert.ok($_.utils.isArray([ 1, 2, 3 ]));
          assert.ok(!$_.utils.isArray(1));
          assert.ok(!$_.utils.isArray(function() {
          }));
        });
      });
      describe('#extractFunctionName()', function() {
        it('', function() {
          function a(){return 5;}
          assert.equal("a", $_.utils.extractFunctionName(a));
          function $_a(){return 5;}
          assert.equal("$_a", $_.utils.extractFunctionName($_a));
        });
      });
      describe('#append()', function() {
        it('', function() {
          var x = {
            a : "a",
            b : "b"
          };
          $_.utils.append(x, {
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
          assert.equal($_.utils.size({}), 0);
          assert.equal($_.utils.size({
            a : "a",
            b : "b"
          }), 2);
          assert.equal($_.utils.size({
            a : "a"
          }), 1);
        });
      });
      describe('#join()', function() {
        it('join array', function() {
          assert.equal($_.utils.join([ 1, 2, 3 ]), "1,2,3");
          assert.equal($_.utils.join([ 1, 2, 3 ], function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }), "[1,2,3]");
        });
        it('join map', function() {
          var m = {
            a : 1,
            b : 2,
            c : 3
          };
          assert.equal($_.utils.join(m, "", function(k, m) {
            return m[k];
          }), "123");
          assert.equal($_.utils.join(m, null, function(k, m) {
            return m[k];
          }), "1,2,3");
          assert.equal($_.utils.join(m, undefined, function(k, m) {
            return m[k];
          }), "1,2,3");
          assert.equal($_.utils.join(m), "a,b,c");
          assert.equal($_.utils.join(m, function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }), "[a,b,c]");
          assert.equal($_.utils.join(m, function(array, i, j) {
            return i === -1 ? "[" : j === 0 ? "]" : ",";
          }, function(k, m) {
            return m[k];
          }), "[1,2,3]");
        });
      });
      describe('#isString()', function() {
        it('', function() {
          assert.equal($_.utils.isString("abc"), true);
          assert.equal($_.utils.isString(new String("abc")), true);
          assert.equal($_.utils.isString(5), false);
          assert.equal($_.utils.isString([]), false);
        });
      });
      describe('#stringify()', function() {
        it('', function() {
          assert.equal($_.utils.stringify("abc"), "'abc'");
          assert.equal($_.utils.stringify(new String("abc")), "'abc'");
          assert.equal($_.utils.stringify(5), "5");
          assert.equal($_.utils.stringify([]), "[]");
          assert.equal($_.utils.stringify([ 3, 'a', [ true, [] ] ]),
          "[3,'a',[true,[]]]");
        });
      });
      describe('#splitUrlPath()', function() {
        it('', function() {
          function test(path, compare_with){
            assert.equal(JSON.stringify($_.utils.splitUrlPath(path)), compare_with );
          }
          test("abc",'{"path":["abc"],"variables":{}}');
          test("http://abc.com/index.html",'{"path":["http:","","abc.com","index.html"],"variables":{}}');
          test("/app.html?&_suid=141740660296307673981441184878",'{"path":["","app.html"],"variables":{"_suid":"141740660296307673981441184878"}}');
          test("/events/T7?&_suid=141740833138706824455889873207",'{"path":["","events","T7"],"variables":{"_suid":"141740833138706824455889873207"}}');
          test("",'{"path":[""],"variables":{}}');
          test("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584",'{"path":["","events","z3"],"variables":{"q":"askhsj hdjk","_suid":"141749092391407243743964936584"}}');
          var split =$_.utils.splitUrlPath("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584");
          assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584" );
          delete split.variables['_suid'];
          assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk" );
          delete split.variables['q'];
          assert.equal(split.toString(), "/events/z3" );
          
        });
      });
      describe('#error()', function() {
        it('', function() {
          var e = $_.utils.error({
            message : "msg",
            a : "a",
            b : "not b"
          });
          assert.ok(e instanceof Error);
          assert.equal(e.message, "msg  a:'a', b:'not b'");
          $_.utils.error({
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
          assert.equal($_.utils.padWith(5, '00'), '05');
          assert.equal($_.utils.padWith(345, '00'), '45');
          assert.equal($_.utils.padWith(35, '00'), '35');
          assert.equal($_.utils.padWith(685, '0000'), '0685');
        });
      });
      describe('#parseDateUTC()', function() {
        it('', function() {
          var isoDate = $_.utils.parseDateUTC('2014-09-08 17:00:00');
          assert.equal('2014-09-08T17:00:00.0000Z', $_.utils.dateToIsoString(isoDate));
          var isoDate = $_.utils.parseDateUTC('2014-09-08 17:00:00.456546');
          assert.equal('2014-09-08T17:00:00.0456Z', $_.utils.dateToIsoString(isoDate));
        });
      });
      describe('#relativeDateString()', function() {
        it('', function() {
          var s = $_.utils.relativeDateString(
              $_.utils.parseDateUTC('2014-09-08 17:00:00'),
              $_.utils.parseDateUTC('2014-09-08 18:01:20'));
          assert.equal(s, '-01:01');
          s = $_.utils.relativeDateString(
              $_.utils.parseDateUTC('2014-09-08 18:01:20'), 
              $_.utils.parseDateUTC('2014-09-08 17:00:00')
              );
          assert.equal(s, '+01:01');
          s = $_.utils.relativeDateString(
              $_.utils.parseDateUTC('2014-09-08 18:01:20'), 
              $_.utils.parseDateUTC('2014-09-09 17:00:00')
          );
          assert.equal(s, '-22:59');
          s = $_.utils.relativeDateString(
              $_.utils.parseDateUTC('2014-09-08 18:01:20'), 
              $_.utils.parseDateUTC('2014-09-10 17:00:00')
          );
          assert.equal(s, '2014-09-08 18:01');
        });
      });
      describe('#dateToIsoString()', function() {
        it('', function() {
          var isoDate = $_.utils
              .dateToIsoString(new Date(Date.UTC(1980, 0, 1)));
          assert.equal(isoDate, '1980-01-01T00:00:00.0000Z');
          assert.equal($_.utils.dateToIsoString(new Date(isoDate)),
              '1980-01-01T00:00:00.0000Z');
        });
      });
      describe('#binarySearch()', function() {
        it('found', function() {
          var array = [ 1, 2, 4, 6, 8, 10, 25 ];
          function test(value, position) {
            var found = $_.utils.binarySearch(value, array,
                $_.Type.number.compare);
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
          $_.utils.brodcastCall([one,two,three] ,"f",[1]);
          testArrays([ "1", "2" ], array);
        });
      });
      describe('#isArrayEmpty()', function() {
        it('ints', function() {
          var nope = [ 'Nope', 'Nope' ];
          var yes1 = null;
          var yes2 = undefined;
          var yes3 = [];
          assert.equal($_.utils.isArrayEmpty(nope),false);
          assert.equal($_.utils.isArrayEmpty(yes1),true);
          assert.equal($_.utils.isArrayEmpty(yes2),true);
          assert.equal($_.utils.isArrayEmpty(yes3),true);
        });
      });
      describe('#detectRepeatingChar()', function() {
        it('', function() {
          assert.equal($_.utils.detectRepeatingChar("###abc","#"), 3);
        });
      });
      describe('#detectPrefix()', function() {
        it('', function() {
          assert.equal($_.utils.detectPrefix("{|abc","{|"), true);
        });
      });
      describe('#repeat()', function() {
        it('ints', function() {
          testArrays([ 0, 0, 0, 0 ], $_.utils.repeat(4, 0));
          testArrays([ 1, 1, 1, 1 ], $_.utils.repeat(4, 1));
        });
      });
      describe('#sequence()', function() {
        it('ints', function() {
          testArrays([ 0, 1, 2, 3 ], $_.utils.sequence(4));
          testArrays([ 1, 2, 3, 4 ], $_.utils.sequence(4, 1));
        });
      });
      describe('#sequence()', function() {
        it('strings', function() {
          testArrays([ "s0", "s1", "s2", "s3" ], $_.utils.sequence(4, "s"));
        });
      });
      describe('#sequence()', function() {
        it('function', function() {
          testArrays([ 0, 1, 4, 9 ], $_.utils.sequence(4, function(i) {
            return i * i
          }));
        });
      });
    });
