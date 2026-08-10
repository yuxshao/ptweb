all: build/static

build:
	mkdir build

build/static: build
	./build_static.sh

clean:
	rm -rf build

.PHONY: build/static
