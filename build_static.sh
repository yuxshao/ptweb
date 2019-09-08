#!/usr/bin/bash
for f in $(ls -d static/*); do ln -fs ../$f build/; done
