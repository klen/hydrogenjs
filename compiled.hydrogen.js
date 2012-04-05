atom.declare('hydrogen.Router',{history:[],initialize:function(settings){window.addEventListener('hashchange',this.route.bind(this));this.events=atom.Events(this);this.settings=atom.Settings(this.settings).set(settings).addEvents(this.events);},get current(){return this.history.last;},route:function(){var uri=atom.uri();this.history.push(uri.anchor);this.events.fire(uri.anchor);},navigate:function(name){if(this.current==name){return false;}
var base=window.location.href.split('#')[0];window.location.href=base+'#'+name;},back:function(){this.history.pop()
this.navigate(this.current);}});
(function(atom){var evaluate=/<%([\s\S]+?)%>/g,interpolate=/<%=([\s\S]+?)%>/g,escape=/<%-([\s\S]+?)%>/g,noMatch=/.^/,unescape=function(code){return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'"); };

    atom.declare('hydrogen.Template', {

        tmpl: null,

        initialize: function(el, defaults){
            this.el = atom.dom(el);
            this.defaults = defaults || {};
        },

        compile: function(){
            var str = this.el.html();
            this.tmpl = this.constructor.compile(str);
            return this.tmpl;
        },

        render: function(data){
            var tmpl = this.tmpl || this.compile(),
                context = atom.core.append(this.defaults, data || {});

            return tmpl(data);
        },

        own: {

            compile: function(str, data) {
                var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
                    'with(obj||{}){__p.push(\'' +
                    str
                        .replace(/\\/g, '\\\\')
                        .replace(/'/g, "\\'")
                        .replace(escape || noMatch, function(match, code) {
                            return "',_.escape(" + unescape(code) + "),'";
                        })
                        .replace(interpolate || noMatch, function(match, code) {
                            return "'," + unescape(code) + ",'";
                        })
                        .replace(evaluate || noMatch, function(match, code) {
                            return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
                        })
                        .replace(/\r/g, '\\r')
                        .replace(/\n/g, '\\n')
                        .replace(/\t/g, '\\t')
                    + "');}return __p.join('');";atom.declare('hydrogen.View',{bindEventsList:'click contextmenu mouseup mousedown mouseover mouseout'.split(' '),initialize:function(settings){this.bindMethods('eventHandler');this.events=atom.Events(this);this.settings=atom.Settings(settings).addEvents(this.events);var el=this.settings.get('el'),extend=this.settings.get('extend');this.el=el&&atom.dom(el);this.bindEvents();if(typeof extend==='object'){atom.core.append(this,extend);}},create:function(){this.el&&this.unbindEvents();this.el=atom.dom.create.apply(atom.dom,arguments);this.bindEvents();return this;},render:function(){return this;},destroy:function(){this.el&&this.unbindEvents()&&this.el.destroy();return this;},eventHandler:function(e){var view=this;var name=e.type;var targetElem=e.target;this.events.fire(name,[e,this]);},bindEvents:function(){return this.changeEventsStatus('bind');},unbindEvents:function(){return this.changeEventsStatus('unbind');},changeEventsStatus:function(action){for(var i=this.bindEventsList.length;i--;){this.el[action](this.bindEventsList[i],this.eventHandler);}
return this;}});atom.declare('hydrogen.Model',{defaults:{},initialize:function(settings){this.events=atom.Events(this);this.settings=atom.Settings(this.defaults).set(settings).addEvents(this.events);},get:function(name){return this.settings.get(name);},set:function(name,value){this.settings.values[name]=value;},has:function(name){return this.get(name)!==null;},get json(){return atom.clone(this.settings.values);}});
