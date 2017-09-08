#!/bin/bash

# For use in GUI
cd "${0%/*}"

# Concatenate files and delete any '#include' lines
cat ./src/header.js ./src/polyPlotter.js ./src/presetManager.js ./src/idUtil.js ./src/isbn.js ./src/gs1Prefixes.js ./src/barcode_library.js ./src/fontDrop.js ./src/sui.js ./src/barcode_drawer.js ./src/main.js | grep -Ev "#include" > id_barcode.jsx