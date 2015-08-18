(function() {
  
  var d2ux = new Object();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = d2ux;
  }
  this.d2ux = d2ux;

  function yesterday(){
    var dateObj = new Date();
    do{
      dateObj.setDate(dateObj.getDate()-1);
    }while([0,6].indexOf(dateObj.getDay()) > -1) ; // skip weekends
    if(dateObj)
    return ''+ (dateObj.getMonth() + 1)+'/'+ dateObj.getDate()+'/'+dateObj.getFullYear();
  }

  function tstamp() {
    function pad2(n) {  
      return (n < 10 ? '0' : '') + n;
    }
    var now = new Date();
    return now.getFullYear() +
         pad2(now.getMonth() + 1) + 
         pad2(now.getDate()) +
         pad2(now.getHours()) +
         pad2(now.getMinutes()) +
         pad2(now.getSeconds());
  }

  function buildColumn(i){
      var column = $('<div class="col-md-3 col-sm-6 col-xs-12"></div>');
      column.id = "col" + i ; 
      return column;
  }

    
  function Base(opt){
    this.opt = opt;
    this.opt_key = opt.key || opt.name.replace(/ /g,"") ;
    this.appendTo = function(node){
      if( this.inp != null ){
        this.fg.append(this.inp);
        this.inp = null;  
      } 
      node.append(this.fg);
    };
    var selector = '#'+this.opt_key;
    this.value = function(){ return $(selector).val(); }
  };

  function Input(opt){
    Base.call(this,opt);
    this.fg = $('<div class="form-group"><label class="input-label" for="'+this.opt_key+'">'+this.opt.name+' </label></div>');
    this.inp =$('<input class="form-control input-sm" id="'+this.opt_key+'" name="'+this.opt_key+'">');
    if(this.opt.placeholder != null){
      this.inp.attr('placeholder',this.opt.placeholder);
    }   
    if(this.opt.default_value != null){
      this.inp.val(this.opt.default_value);
    }   
  };


  function name2id(s){
    return s.replace(/ /g,"_").toUpperCase();
  }
  
  d2ux.types = {
    String : function(opt){
      Input.call(this,opt);
      this.inp.attr('type','text');
    },
    Double : function(opt){
      Input.call(this,opt);
      this.inp.attr('type','number');
      if( this.opt.step != null){
        this.inp.attr('step', this.opt.step);
      }
    },
    Enum : function(opt){
      Input.call(this,opt);
      var div = $('<div class="btn-group btn-group-xs" role="group" id="'+this.opt_key+'" aria-label="'+this.opt_key+'" ></div>');
      var div_id = this.opt_key;
      this.inp = div;
      this.opt.choices.forEach(function(choice){
        var choice_key = name2id(choice);
        var entry = $('<button type="button" id="'+choice_key+'" class="btn btn-default">'+choice+'</button>');
        entry.on('click',function(){
          $('#'+div_id + ' button').each(function(_,b){
            $(b).removeClass( b.id == choice_key ? "btn-default" : "btn-primary" );
            $(b).addClass( b.id == choice_key ? "btn-primary" : "btn-default" );
          });
          $('#'+div_id).val(choice_key);
        });
        div.append(entry);
      })
    },
    Boolean : function(opt){
      Base.call(this,opt);
      var checked = this.opt.default_value ? ' checked':'';
      this.fg = $('<div class="checkbox"><label><input type="checkbox" id="'+this.opt_key +'" name="'+this.opt_key +'"'+ checked+'>'+this.opt.name+'</label></div>');   
      var selector = '#'+this.opt_key;
      this.value=function(){ return $(selector).is(':checked'); }
    },
    Map : function(opt){
      Input.call(this,opt);
      this.inp = $('<select class="form-control" name="'+this.opt_key+'" id="'+this.opt_key+'" multiple> </select>');
      for(var name in this.opt.default_value){
        this.inp.append($('<option value="'+name+'"'+(this.opt.default_value[name] ? ' selected' : '')+'>'+name+'</option>'));
      }
    },
  };
  
  d2ux.init=function(selector,url){
    if( !url ){
      url = '/.d2ux.yaml';
    }
    $.ajax({url:url,type:'text',success: function(data){
      d2ux.config = jsyaml.load(data);
      d2ux.append_form(selector);
    }});
  }

  d2ux.append_form = function(selector){
    var form = $('<form></form>');
    var column = buildColumn(0);
    var state = [];
    d2ux.state = state;
    var sections = d2ux.config.root.sections;
    for(var i in sections){
      var sec = sections[i];
      state[i] = [];
      if( sec.column != null && ("col" + sec.column) != column.id ){
        form.append(column);
        if(sec.column % 2 == 0){
          form.append($('<div class="clearfix visible-sm"></div>'));
        }
        column = buildColumn(sec.column);
      }
      var section_e = $('<section></section>');
      section_e.id = sec.key || sec.section;
      section_e.append($('<h3></h3>').html(sec.section));
      if( sec.options ){
        for(var j in sec.options){
          var opt = sec.options[j];
          var inp_state = new d2ux.types[opt.type](opt);
          state[i][j] = inp_state;
          inp_state.appendTo(section_e);
        }
        column.append(section_e);
      }
    }
    form.append(column);
    $(selector).append(form);
  }

  function quote(v){
    return '"'+v+'"';
  }
  
  d2ux.utils = (function() {
    function isArray(o) {
      return Object.prototype.toString.call(o) === '[object Array]';
    }

    function isString(a) {
      return typeof a === "string" || a instanceof String;
    }

    function isNumber(a) {
      return typeof a === "number" || a instanceof Number;
    }

    function isBoolean(a) {
      return typeof a === "boolean" || a instanceof Boolean;
    }

    function isFunction(a) {
      return typeof a === "function" || a instanceof Function;
    }

    function isDate(a) {
      return a instanceof Date;
    }

    function isNull(a) {
      return a === null || a === undefined;
    }

    function isPrimitive(a) {
      return isString(a) || isNumber(a) || isBoolean(a) || isFunction(a)
          || isDate(a);
    }

    function isObject(a) {
      return !isPrimitive(a) && !isArray(a);
    }

    function isArrayEmpty(array){
      return isNull(array) || array.length == 0;
    }
    
    function extractArray(args) {
      var array = null;
      if (args.length === 0) {
        array = [];
      } else if (args.length > 1) {
        array = args;
      } else if (args.length === 1) {
        var arg = args[0];
        if (isArray(arg)) {
          array = arg;
        } else if (isPrimitive(arg)) {
          array = [ arg ];
        }
      }
      return array;
    }

    
    function brodcastCall(brodcastTo, funcName, args){
      if(! isArrayEmpty(brodcastTo) ){
        brodcastTo.forEach(
            function(castTo){
              var f = castTo[funcName];
              if( isFunction(f) ) f.apply(castTo,args);
            }
        );
      }
    }


    function extractFunctionName(f) { // because IE does not support Function.prototype.name property
      var m = f.toString().match(/^\s*function\s*([^\s(]+)/);
      return m ? m[1] : "";
    }
    
    function getPropertyExtractor(property) { 
      return function(o) { 
        return o[property];
      };
    }
    
    function combineKeyExtractors() {
      var extractors = arguments;
      return function(o) {
        for ( var i = 0; i < extractors.length; i++) {
          var key = extractors[i](o);
          if(key !== undefined){
            return key;
          }
        }
        return undefined;
      };
    }

    function convertListToObject(list,extractor) {
      var obj = new Object();
      for ( var i = 0; i < list.length; i++) {
        var v = list[i];
        var k = extractor(v);
        if( k !== undefined ){
          obj[k] = v;
        }
      }
      return obj;
    }

    function splitUrlPath (urlpath) {
      var path = urlpath.split("/");
      var last = path[path.length-1].split('?');
      var result = { 
          path: path , 
          variables: {},
          toString: function(){ 
            var vars = '' ;
            var sep = '?' ;
            for ( var k in this.variables) {
              if (this.variables.hasOwnProperty(k)) {
                vars += sep + k + '=' + encodeURI(this.variables[k]);
                sep = '&';
              }
            }
            return this.path.join('/') + vars;
          }
      };
      if( last.length == 2 ){
        path[path.length-1] = last[0];
        last[1].split("&").forEach(function(part) {
          var item = part.split("=");
          if( item[0].length > 0 ){
            result.variables[item[0]] = decodeURIComponent(item[1]);
          }
        });
      }else if(last.length > 2){
        throw 'Unexpected number of "?" in url :' + urlpath ;
      }
      return result;
    }

    
    function convertFunctionsToObject(funcList) {
      return convertListToObject(funcList, combineKeyExtractors(getPropertyExtractor("name"), extractFunctionName));
    }
    
    function applyOnAll(obj, action) {
      for ( var k in obj) {
        if (obj.hasOwnProperty(k)) {
          action(obj[k], k, obj);
        }
      }
    }

    function append(object, params) {
      for ( var propertyName in params) {
        if (params.hasOwnProperty(propertyName)) {
          object[propertyName] = params[propertyName];
        }
      }
      return object;
    }

    function size(obj) {
      var size = 0;
      for ( var key in obj) {
        if (obj.hasOwnProperty(key))
          size++;
      }
      return size;
    }

    function join(array, delimiter, toString) {
      var keys = isObject(array) ? Object.keys(array) : array;
      if (!toString) {
        toString = function(s) {
          return s;
        };
      }
      if (delimiter == null) {
        delimiter = ',';
      }
      var doDelimit = (typeof delimiter === 'function') ? delimiter : function(
          array, positionFromBegining, positionFromEnd) {
        return (positionFromBegining < 0 || positionFromEnd <= 0) ? ''
            : delimiter;
      };
      var result = '';
      var positionFromBegining = -1;
      var positionFromEnd = keys.length;
      while (positionFromBegining < keys.length) {
        if (positionFromBegining >= 0) {
          result += toString(keys[positionFromBegining], array);
        }
        result += doDelimit(keys, positionFromBegining, positionFromEnd, array);
        positionFromBegining++;
        positionFromEnd--;
      }
      return result;
    }
    
    function detectRepeatingChar(l,c){
      var at = 0 ;  
      while( at < l.length && l.charAt(at) === c ) at++;
      return at;
    }

    function detectPrefix(l,prefix){
      var at = 0 ;  
      while( at < prefix.length && at < l.length && l.charAt(at) === prefix.charAt(at) ) at++;
      return prefix.length === at;
    }


    function stringify(x) {
      return x === undefined ? "undefined" : x === null ? "null"
          : isString(x) ? "'" + x + "'" : isArray(x) ? "["
              + join(x, ",", stringify) + "]" : x.toString();
    }

    function ensureDate(a) {
      return a instanceof Date ? a : new Date(a);
    }

    function ensureString(a) {
      return isString(a) ? a : String(a);
    }

    function error(params, input) {
      var e;
      if (input instanceof Error) {
        e = input;
      } else {
        e = new Error();
        if (input) {
          e.params = {
            cause : input
          };
        }
      }
      if (!e._message) {
        if (e.message) {
          e._message = e.message;
        } else if (params || params.message) {
          e._message = params.message;
          delete params['message'];
        }
      }
      var msg = e._message;
      if (!e.params) {
        e.params = {};
      }
      if (params) {
        append(e.params, params);
      }
      if (size(e.params)) {
        msg += "  ";
        for ( var k in e.params) {
          if (e.params.hasOwnProperty(k)) {
            msg += k + ":" + stringify(e.params[k]) + ", ";
          }
        }
        msg = msg.substring(0, msg.length - 2);
      }
      e.message = msg;
      return e;
    }

    function assert(provided, expected, message) {
      function checkAnyAgainstExpected() {
        for ( var i = 0; i < expected.length; i++) {
          if (provided === expected[i]) {
            return false;
          }
        }
        return true;
      }
      if (!isArray(expected) ? provided !== expected
          : checkAnyAgainstExpected()) {
        throw error({
          message : message || ("Unexpected entry: " + provided),
          expected : expected,
          provided : provided,
        });
      }
    }

    function padWith(what, pad) {
      var r = String(what);
      if (r.length !== pad.length) {
        r = (pad + r).substr(r.length, pad.length);
      }
      return r;
    }

    function dateToIsoString(date) {
      return date.getUTCFullYear() + '-'
          + padWith(date.getUTCMonth() + 1, '00') + '-'
          + padWith(date.getUTCDate(), '00') + 'T'
          + padWith(date.getUTCHours(), '00') + ':'
          + padWith(date.getUTCMinutes(), '00') + ':'
          + padWith(date.getUTCSeconds(), '00') + '.'
          + padWith(date.getUTCMilliseconds(), '0000') + 'Z';
    }
    
    //
    
    function parseDateUTC(s){
      return new Date(Date.parse(s+' UTC'));
    }
    
    function relativeDateString(date,rel) {
      if(!isDate(date)){
        if(!isNull(date)){
          date = parseDateUTC(date);
        }else{
          return "";
        }
      }
      if(!isDate(rel)){
        rel = new Date();
      }
      if( Math.abs(date.getTime() - rel.getTime()) < 86400000 ){
        var a = Math.floor( (date.getTime() - rel.getTime())  / 1000);
        var s = Math.abs(a) + 30;
        var m = Math.floor( s / 60 );
        var h = Math.floor( m / 60 );
        s = s % 60;
        m = m % 60;
        return (a < 0 ? '-' : '+') + padWith(h, '00') + ':' + padWith(m, '00')  ;
      } 
      return date.getUTCFullYear() + '-'
      + padWith(date.getUTCMonth() + 1, '00') + '-'
      + padWith(date.getUTCDate(), '00') + ' '
      + padWith(date.getUTCHours(), '00') + ':'
      + padWith(date.getUTCMinutes(), '00') ;
      
    }
    
    if (!Date.prototype.toISOString) {
      Date.prototype.toISOString = function() {
        return dateToIsoString(this);
      };
    }

    function binarySearch(searchFor, array, comparator, mapper) {
      var mapToValue = mapper || function(x) {
        return x;
      };
      var min = 0;
      var max = array.length - 1;
      var mid, r;
      while (min <= max) {
        mid = ((min + max) / 2) | 0;
        r = comparator(searchFor, mapToValue(array[mid]));
        if (r > 0) {
          min = mid + 1;
        } else if (r < 0) {
          max = mid - 1;
        } else {
          return mid;
        }
      }
      return -1 - min;
    }

    function repeat(count, value) {
      var result = [];
      for ( var i = 0; i < count; i++) {
        result.push(isFunction(value) ? value(i) : value);
      }
      return result;
    }

    function sequence(count, offset) {
      return repeat(count, function(i) {
        return isNumber(offset) || isString(offset) ? offset + i
            : isFunction(offset) ? offset(i) : i;
      });
    }

    function BiMap(map) {
      var forward = map;
      var _inverse = null;
      function inverse(){
        if( _inverse === null ){
          _inverse = {};
          for ( var key in forward) {
            if (forward.hasOwnProperty(key)) {
              _inverse[forward[key]]=key;
            }
          }
        }
        return _inverse;
      }
      return {
        get: function(key) { return forward[key]; },
        key: function(val) { return inverse()[val]; },
        put: function(key,val) { forward[key] = val; _inverse = null; },
        del: function(key) { delete forward[key];_inverse = null; },
        keys: function() { return Object.keys(forward); },
        values: function() { return Object.keys(inverse()); }
      };
    }

    function Tokenizer(s, delimiters) {
      var i = 0;

      function isValueChar() {
        return delimiters.indexOf(s.charAt(i)) < 0;
      }

      function next(condition) {
        var start = i;
        while (i < s.length && condition())
          i++;
        var next = s.substring(start, i);
        return next;
      }

      return {
        getText : function() {
          return s;
        },
        nextValue : function() {
          return next(isValueChar);
        },
        nextDelimiter : function() {
          return next(function() {
            return !isValueChar();
          });
        },
        toString : function() {
          return s.substring(0, i) + " <-i-> " + s.substring(i);
        },
        getPosition : function() {
          return i;
        },
        setPosition : function(_i) {
          i = _i;
        }
      };
    }

    var mappingEntities = {
      "<" : "&lt;",
      ">" : "&gt;",
      "&" : "&amp;",
      '"' : "&quot;",
      "'" : "&#39;",
    };

    function escapeEntities(s, delims) {
      var t = new Tokenizer(s, delims);
      var r = "";
      for (;;) {
        var v = t.nextValue();
        var d = t.nextDelimiter();
        if (v) {
          r += v;
        }
        if (d) {
          for ( var i = 0; i < d.length; i++) {
            r += mappingEntities[d.charAt(i)];
          }
        }
        if (!v && !d) {
          return r;
        }
      }
    }

    function escapeXmlAttribute(s) {
      return escapeEntities(s, "<>&'\"");
    }

    function escapeXmlBody(s) {
      return escapeEntities(s, "<>&");
    }

    return convertFunctionsToObject([ convertFunctionsToObject, convertListToObject,
        combineKeyExtractors, extractFunctionName, isArray, append, size,
        join, error, applyOnAll, assert, BiMap, Tokenizer, stringify, padWith,
        relativeDateString, parseDateUTC, dateToIsoString, ensureDate, 
        ensureString, isObject, isString, isNumber, isBoolean, isFunction, 
        isDate, isPrimitive, isNull, extractArray, binarySearch, repeat, 
        sequence, escapeXmlAttribute, escapeXmlBody, brodcastCall, 
        isArrayEmpty, detectRepeatingChar, detectPrefix, splitUrlPath ]);
  })();
  
  /** Type */

  function Type(name, sortFunction) {
    this.name = name;
    this.compare = Type.nullsCompare(sortFunction);
    Type[name] = this;
    d2ux.utils.assert(Type[name], this,
        "Type is frozen for changes. Cannot add:" + name);
  }
  d2ux.Type = Type;

  Type.nullsCompare = function(f) {
    function isUndef(x) {
      return x === undefined;
    }
    function isNull(x) {
      return x === null;
    }
    function exculdeIs(is, doIt) {
      return function(a, b) {
        return is(a) ? (is(b) ? 0 : 1) : (is(b) ? -1 : doIt(a, b));
      };
    }
    return exculdeIs(isUndef, exculdeIs(isNull, f));
  };

  Type.inverse = function(f) {
    return function(a, b) {
      return f(b, a);
    };
  };

  new Type("string", function(a, b) {
    var aStr = d2ux.utils.ensureString(a);
    var bStr = d2ux.utils.ensureString(b);
    return aStr === bStr ? 0 : aStr < bStr ? -1 : 1;
  });

  new Type("number", function(a, b) {
    return a - b;
  });

  new Type("boolean", function(a, b) {
    return a ? (b ? 0 : 1) : (b ? -1 : 0);
  });

  new Type("date", function(a, b) {
    var aDateValueOf = d2ux.utils.ensureDate(a).valueOf();
    var bDateValueOf = d2ux.utils.ensureDate(b).valueOf();
    return aDateValueOf === bDateValueOf ? 0
        : aDateValueOf < bDateValueOf ? -1 : 1;
  });

  new Type("blob", Type.string.compare);
  Object.freeze(Type);

   
})();