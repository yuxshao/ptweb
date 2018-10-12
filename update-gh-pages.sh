#!/bin/sh
set -e
set -o xtrace
git checkout master
git checkout -B gh-pages
make
rm .gitmodules
cp -r build/* .
git add $(ls build) .gitmodules
git commit -m "update gh-pages"
git push -f
git checkout master
rm -rf $(ls build)
make
