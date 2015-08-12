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
  
  d2ux.goto = function (msg,url){
    $('#modalMsg').text(msg);
    setTimeout(function(){
      window.location = url; 
    }, 2000);
  }

  d2ux.modalOn = function (show){
    $('#waitModal').modal({backdrop:'static', keyboard:false, show: show});
  }
  
  $.ajax({url: '/.d2ux.yaml',dataType: 'text', success:function(d){
      var doc = jsyaml.load(d);
      console.log(doc);
    }});

})();