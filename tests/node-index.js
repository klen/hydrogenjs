/*global require */

var qunit = require('qunit');

qunit.run({
    code: {
        deps: './vendor/atomjs/atom-full-compiled.js',
		path: './hydrogen.min.js',
		namespace: 'hydrogen'
    },
    tests: [
		'model.js',
		'collection.js',
		'router.js',
    ].map(function (v) {
        "use strict";
        return './tests/' + v;
    })
});
