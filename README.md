# ptweb
PxTone web player with visuals to-be... hopefully. Currently just a tiny change to [PxtoneJS](https://github.com/petamoriken/PxtoneJS).

Right now, it's a simple webpage example that plays chunks of a file in succession so that the initial load time is minimal. One could say it's a kind of streaming?

## Install
Make sure Emscripten is installed. I have 1.38.8 myself. Install all `js` dependencies in the submodules:
```
cd pxtnDecoder
npm install
```
```
cd PxtoneJS
npm install
```
Then `make` in the parent folder. Run `python3 server.py` and navigate to `http://localhost:8080/`.
