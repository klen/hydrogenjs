all:
	zeta hydrogen.js -p compiled.

test:
	chromium-browser examples/todos/index.html
