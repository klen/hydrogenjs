all:
	zeta hydrogen.js -p compiled.

example:
	chromium-browser examples/todos/index.html

test:
	chromium-browser tests/index.html
