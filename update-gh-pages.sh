#!/bin/sh
set -e
set -o xtrace
git checkout master
git checkout -B gh-pages
make
rm -rf .gitignore .gitmodules
git add Pxtone.js pxtnDecoder.js emDecoder.wasm .gitmodules .gitignore
git commit -m "update gh-pages"
git push -f
git checkout master
make
