# concatenate the .js files then delete any '#include' lines.

# Go to current directory so we can double click the file from anywhere
cd "${0%/*}"
cat ./src/barcode_header.js ./src/espm.js ./src/id_Util.js ./src/isbn.js ./src/barcode_library.js ./src/esfm.js ./src/barcode_ui.js ./src/barcode_drawer.js ./src/barcode_main.js | grep -Ev "#include" > id_barcode.jsx