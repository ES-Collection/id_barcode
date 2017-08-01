# concatenate the .js files then delete any '#include' lines.

# Go to current directory so we can double click the file from anywhere
cd "${0%/*}"
cat ./src/header.js ./src/presetManager.js ./src/idUtil.js ./src/isbn.js ./src/gs1Prefixes.js ./src/barcode_library.js ./src/fontDrop.js ./src/sui.js ./src/barcode_drawer.js ./src/main.js | grep -Ev "#include" > id_barcode.jsx