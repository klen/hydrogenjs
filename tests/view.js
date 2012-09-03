/*global atom, hydrogen, console, module, test, equal, raises, ok, asyncTest, start */

atom.dom(function () {
    "use strict";

    module('hydrogen.View', {

    });

    test("View: init", function () {
        var View = hydrogen.View.extend({
            template: '#template'
        }), view = new View();
        ok(view.template);
    });

});
