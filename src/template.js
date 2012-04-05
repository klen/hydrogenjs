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
                    + "');}return __p.join('');";
                var func = new Function('obj', '_', tmpl);
                if (data) return func(data, _);
                return function(data) { return func.call(this, data, _); };
            }
        }
    });

})(atom);
