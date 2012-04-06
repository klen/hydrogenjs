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
