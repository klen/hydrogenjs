all: clean compiled.hydrogen.js hydrogen.min.js


example:
	chromium-browser examples/todos/index.html


test:
	chromium-browser tests/index.html


clean:
	rm -f compiled.hydrogen.js
	rm -f hydrogen.min.js


hydrogen.min.js:
	uglifyjs compiled.hydrogen.js > hydrogen.min.js
	rm -f compiled.hydrogen.js


compiled.hydrogen.js:
	zeta hydrogen.js -p compiled.
