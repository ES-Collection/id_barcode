# concatenate the .js files then delete any '#include' lines.

# Go to current directory so we can double click the file from anywhere
cd "${0%/*}"
cat barcode_library.js dropdown.js isbn.js barcode_main.js | grep -Ev "#include" > id_barcode.jsx