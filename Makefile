all: clean compiled.hydrogen.js hydrogen.min.js

.PHONY: help
# target: help - Display callable targets
help:
	@egrep "^# target:" [Mm]akefile

.PHONY: example
# target: example - Run example
example:
	xdg-open examples/todos/index.html

.PHONY: test
# target: test - Run tests
test:
	xdg-open tests/index.html

.PHONY: clean
# target: clean - Clean builds
clean:
	rm -f compiled.hydrogen.js
	rm -f hydrogen.min.js

hydrogen.min.js:
	uglifyjs compiled.hydrogen.js > hydrogen.min.js
	rm -f compiled.hydrogen.js

compiled.hydrogen.js:
	zeta hydrogen.js -p compiled.
