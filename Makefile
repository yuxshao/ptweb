all: pxtnDecoder Pxtone.js

pxtnDecoder: pxtnDecoder.js emDecoder.wasm

pxtnDecoder.js:
	(cd pxtnDecoder; make build/pxtnDecoder.js)
	cp pxtnDecoder/build/pxtnDecoder.js .

emDecoder.wasm:
	(cd pxtnDecoder; make build/pxtnDecoder.js)
	cp pxtnDecoder/src/emDecoder.wasm .

Pxtone.js:
	(cd PxtoneJS; make build/Pxtone.js)
	cp PxtoneJS/build/Pxtone.js .

clean:
	(cd pxtnDecoder; make clean)
	(cd PxtoneJS; make clean)
	rm -rf emDecoder.wasm
	rm -rf pxtnDecoder.js
	rm -rf Pxtone.js

.PHONY: pxtnDecoder.js emDecoder.wasm Pxtone.js
