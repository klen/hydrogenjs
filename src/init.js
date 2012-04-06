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
