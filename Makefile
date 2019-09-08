all: build/static build/pxtnDecoder build/Pxtone.js

build:
	mkdir build

build/static: build
	./build_static.sh

build/pxtnDecoder: build build/pxtnDecoder.js build/emDecoder.wasm

build/pxtnDecoder.js: build
	(cd pxtnDecoder; make build/pxtnDecoder.js)
	cp pxtnDecoder/build/pxtnDecoder.js build

build/emDecoder.wasm: build
	(cd pxtnDecoder; make build/pxtnDecoder.js)
	cp pxtnDecoder/src/emDecoder.wasm build

build/Pxtone.js: build
	(cd PxtoneJS; make build/Pxtone.js)
	cp PxtoneJS/build/Pxtone.js build

clean:
	(cd pxtnDecoder; make clean)
	(cd PxtoneJS; make clean)
	rm -rf build

.PHONY: build/static build/all build/pxtnDecoder.js build/emDecoder.wasm build/Pxtone.js
