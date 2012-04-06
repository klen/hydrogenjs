// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/init.js'
(function(atom){

    var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'delete': 'DELETE',
        'read':   'GET'
    };

    var getValue = function(object, prop) {
        if (!(object && object[prop])) { return null; }
        return atom.core.isFunction(object[prop]) ? object[prop]() : object[prop];
        },
        idCounter = 0,
        uniqueID = function(prefix){
            return prefix ? prefix + (++idCounter) : ++idCounter;
        };

    
    atom.declare('hydrogen', {
        own: {
            sync: function(type, model, options){

                var method = methodMap[type];

                options = options || {};
                
                var params = {method: method, dataType: 'json'};

                if (!options.url) {
                    params.url = getValue(model, 'url');
                }
                if (!options.data && model && (type == 'create' || type == 'update')) {
                    params.headers = {
                        'Content-type': 'application/json'
                    };
                    params.type = 'json';
                    params.data = JSON.stringify(model);
                }
                params = atom.core.extend(params, options);
                return atom.ajax(params);
            },

            escape: function(string){
                return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
            }
        }
    });


    atom.declare('hydrogen.Base', {

        proto: {

            properties: 'id'.split(' '),

            initialize: function(settings){
                this.events = atom.Events(this);
                this.settings = atom.Settings(this.settings)
                    .set(settings)
                    .addEvents(this.events);

                this._configure();
            },

            configure: function(){ },

            fire: function(event, args){
                this.events.fire('all', [event].concat(args));
                this.events.fire(event, args);
            },
            
            /** @private */
            _configure: function(){
                var i=0, l=this.properties.length, attr, value;
                for (; i<l; i++) {
                    attr = this.properties[i];
                    value = this.settings.get(attr);
                    if (value) {
                        this[attr] = value;
                        this[attr] = getValue(this, attr);
                    }
                }
                this.cid = uniqueID(this.constructor.NAME);
            }
        }

    });

})(atom);

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/router.js'
atom.declare('hydrogen.Router', {

    parent: hydrogen.Base,

    history: [],

    initialize: function parent (settings){

        parent.previous.apply(this, arguments);

        window.addEventListener('hashchange', this.route.bind(this));
    },

    get current () {
        return this.history.last;
    },

    set current (value) { },

    route: function(){
        var uri = atom.uri();

        this.history.push(uri.anchor);
        this.events.fire(uri.anchor);
    },

    navigate: function(name){
        if (this.current == name){
            return false;
        }
        var base = window.location.href.split('#')[0];
        window.location.href = base + '#' + name;
    },

    back: function(){
        this.history.pop();
        this.navigate(this.current);
    }
    
});

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/template.js'
// JavaScript micro-templating, similar to John Resig's implementation.

(function(atom){
    
    var evaluate = /<%([\s\S]+?)%>/g,
        interpolate = /<%=([\s\S]+?)%>/g,
        escape = /<%-([\s\S]+?)%>/g,
        noMatch = /.^/,
        unescape = function(code) { return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'"); };

    atom.declare('hydrogen.Template', {

        tmpl: null,

        initialize: function(el, defaults){
            var el = typeof el === 'string' ? atom.dom(el) : el,
                str = el.html();

            this.defaults = defaults || {};
            this.tmpl = this.constructor.compile(str);
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
                    str.replace(/\\/g, '\\\\')
                       .replace(/'/g, "\\'")
                       .replace(escape || noMatch, function(match, code) {
                            return "',hydrogen.escape(" + unescape(code) + "),'";
                       })
                       .replace(interpolate || noMatch, function(match, code) {
                            return "'," + unescape(code) + ",'";
                       })
                       .replace(evaluate || noMatch, function(match, code) {
                            return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
                       })
                       .replace(/\r/g, '\\r')
                       .replace(/\n/g, '\\n')
                       .replace(/\t/g, '\\t') + "');}return __p.join('');";
                var func = new Function('obj', 'hydrogen', tmpl);
                if (data) { return func(data, hydrogen); }
                return function(data) { return func.call(this, data, hydrogen); };
            }
        }
    });

})(atom);

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/view.js'
(function(){

    var eventSplitter = /^(\S+)\s*(.*)$/;
    
    atom.declare('hydrogen.View', {

        parent: hydrogen.Base,

        own: {
            extend: function(proto) {
                return atom.declare({
                    parent: hydrogen.View,
                    proto: proto
                });
            }
        },
        
        proto: {

            properties: 'model collection el id attrs className tagName template'.split(' '),

            template: null,

            tagName: 'div',

            attributes: {},

            actions: {},

            initialize: function parent (settings){

                parent.previous.apply(this, arguments);

                this.setElement(this.el || atom.dom.create(this.tagName, this.attributes));

                if (this.template !== null){
                    this.template = new hydrogen.Template(this.template);
                }

                this.configure();
            },

            configure: function () {
                return this;
            },

            render: function(){
                return this;
            },

            destroy: function(){
                this.el.destroy();
                return this;
            },

            setElement: function(el){
                this.el = atom.dom(el);
                this._bindEvents();
            },

            find: function(selector){
                return this.el.find(selector);
            },

            /** @private */
            _bindEvents: function(){
                var method, key, match, name, selector,
                    actions=this.actions;
                for (key in actions){
                    method = actions[key];
                    if (!atom.core.isFunction(method)) { method = this[actions[key]]; }
                    if (!method) { continue; }
                    match = key.match(eventSplitter);
                    name = match[1];
                    selector = match[2];
                    if (selector === '') {
                        this.el.bind(name, method.bind(this));
                    } else {
                        this.el.delegate(selector, name, method.bind(this));
                    }
                }
            }
        }
    });

})();

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/model.js'
atom.declare('hydrogen.Model', {

    parent: hydrogen.Base,

    own: {
        extend: function(proto) {
            return atom.declare({
                parent: hydrogen.Model,
                proto: proto
            });
        }
    },

    proto: {

        properties: 'id collection'.split(' '),

        idAttribute: 'id',

        initialize: function parent (settings){
            parent.previous.apply(this, arguments);
            this.configure();
        },

        get id(){ return this.get(this.idAttribute); },

        set id(value){ this.set(this.idAttribute, value); },

        get: function(name){
            return this.settings.get(name);
        },

        set: function(name, value){
            this._id = this.id;
            this.settings.set(name, value);
            this.fire('change', [this, this.collection, arguments]);
        },

        has: function(name){
            return this.get(name) !== undefined;
        },

        sync: function(){
            return hydrogen.sync.apply(this, arguments);
        },

        toJSON: function() {
            return atom.clone(this.settings.values);
        },

        parse: function(resp, xhr) {
            return resp;
        },

        isNew: function() {
            return this.get('id') === undefined;
        },

        url: function() {
            var base = this.urlRoot || this.collection.url;
            if (this.isNew()) { return base; }
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
        },

        save: function(key, value, settings) {
            var attrs, current, model=this;

            if (key === Object(key) || key === null) {
                attrs = key;
                settings = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }
            settings = settings ? atom.clone(settings) : {};

            var onLoad = settings.onLoad;
            settings.onLoad = function(resp) {
                var serverAttrs = model.parse(resp);
                model.set(model.parse(resp));
                if (onLoad) {
                    onLoad(model, resp);
                } else {
                    model.fire('sync', [resp, settings]);
                }
            };

            var method = this.isNew() ? 'create' : 'update';
            return this.sync(method, this, settings);
        },

        destroy: function(settings) {
            var model = this;

            settings = atom.clone(settings || {});

            var onLoad = settings.onLoad;

            var triggerDestroy = function() {
                model.fire('destroy', [model, model.collection, settings]);
            };

            if (this.isNew()) {
                triggerDestroy();
                return false;
            }

            settings.onLoad = function(resp) {
                if (onLoad) {
                    onLoad(model, resp);
                } else {
                    model.fire('sync', [resp, settings]);
                }
            };

            var xhr = this.sync(method, this, settings);
            triggerDestroy();
            return xhr;
        }
    }
});

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/collection.js'
atom.declare('hydrogen.Collection', {

    parent: hydrogen.Base,

    own: {
        extend: function(proto) {
            return atom.declare({
                parent: hydrogen.Collection,
                proto: proto
            });
        }
    },

    proto: {

        properties: 'id model comparator url'.split(' '),

        model: hydrogen.Model,

        initialize: function parent (settings){

            this.bindMethods('_onModelEvent');

            parent.previous.apply(this, arguments);

            this.reset(this.settings.get('models') || [], settings);
            this.configure();
        },

        toJSON: function() {
            return this.models.map(function(model){ return model.toJSON(); });
        },

        get length () {
            return this.models.length;
        },

        set length (value) {},

        get first() { return this.models[0]; },

        get last() { return this.models[this.length-1] },

        get: function(id){
            if (id == null) return void 0;
            return this._byId[id.id != null ? id.id : id];
        },

        getByCid: function(cid){
            return cid && this._byCid[cid.cid || cid];
        },

        at: function(index) {
            return this.models[index];
        },

        pluck: function(name){
            return this.models.map(function(model){ return model.get(name) });
        },

        sort: function(settings) {
            settings || (settings = {});
            if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
            var boundComparator = this.comparator.bind(this);
            this.models.sort(boundComparator);
            if (!settings.silent) this.fire('reset', [this, settings]);
            return this;
        },

        add: function(models, settings){
            settings = settings || {};

            var mds = [], index,
                _byId = this._byId, _byCid = this._byCid, col=this,
                _onModelEvent = this._onModelEvent,
                prepareModel = this._prepareModel.bind(this);

            models = atom.isArrayLike(models) ? models.slice() : [models];
            models.forEach(function(model){
                model = prepareModel(model);
                model.events.add('all', _onModelEvent);
                if (!_byId[model.id] && !_byCid[model.cid]){ 
                    _byCid[model.cid] = model;
                    if (model.id != null) { _byId[model.id] = model; }
                    mds.push(model);
                }
            });
            index = settings.at != null ? settings.at : this.length;
            Array.prototype.splice.apply(this.models, [index, 0].concat(mds));
            mds.forEach(function(model){
                settings.index = index++;
                model.fire('add', [model, col, settings]); });
            return this;
        },

        create: function(model, settings) {
            var coll = this;
            settings = settings ? atom.clone(settings) : {};
            model = this._prepareModel(model, settings);
            if (!model) return false;
            this.add(model, settings);
            var onLoad = settings.onLoad;
            settings.onLoad = function(nextModel, resp, xhr) {
                if (onLoad) {
                    onLoad(nextModel, resp);
                } else {
                    nextModel.fire('sync', [resp, settings]);
                }
            };
            model.save(null, settings);
            return model;
        },

        remove: function(models, settings) {
            var i, l, index, model;
            settings || (settings = {});
            models = atom.isArrayLike(models) ? models.slice() : [models];
            for (i = 0, l = models.length; i < l; i++) {
                model = this.getByCid(models[i]) || this.get(models[i]);
                if (!model) continue;
                delete this._byId[model.id];
                delete this._byCid[model.cid];
                index = this.models.indexOf(model);
                this.models.splice(index, 1);
                this.length--;
                this._removeReference(model);
            }
            return this;
        },

        fetch: function(settings) {
            settings = settings ? atom.clone(settings) : {};
            if (settings.parse === undefined) { settings.parse = true; }

            var collection = this;
            var onLoad = settings.onLoad;

            settings.onLoad = function(resp) {
                collection[settings.add ? 'add' : 'reset'](collection.parse(resp), settings);
                if (onLoad) {onLoad(collection, resp);}
            };
            return this.sync('read', this, settings);
        },

        parse: function(resp) {
            return resp;
        },

        sync: function(){
            return hydrogen.sync.apply(this, arguments);
        },

        reset: function(models, settings){
            this._reset();
            this.add(models, settings);
            this.fire('reset', arguments);
        },

        /** @private */
        _reset: function() {
            this.length = 0;
            this.models = [];
            this._byId  = {};
            this._byCid = {};
        },

        /** @private */
        _prepareModel: function(model, settings) {
            settings = settings || {};
            if (!(model instanceof hydrogen.Model)) {
                var attrs = model;
                settings.collection = this;
                model = new this.model(attrs, settings);
            } else if (!model.collection) {
                model.collection = this;
            }
            return model;
        },

        /** @private */
        _onModelEvent: function(event, model, collection, settings){
            if ((event == 'add' || event == 'remove') && collection != this) return;
            if (event == 'destroy') {
                this.remove(model, settings);
            }
            if (event == 'change') {
                delete this._byId[model._id];
                this._byId[model.id] = model;
            }
            this.fire(event, [model, collection, settings]);
        },

        _removeReference: function(model) {
            if (this == model.collection) {
                delete model.collection;
            }
            model.events.remove('all', this._onModelEvent);
        }
    }
});


