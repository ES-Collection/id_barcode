/*

    |I|d| |B|a|r|c|o|d|e|

    An InDesign script for creating EAN-13 barcodes

    https://github.com/GitBruno/id_barcode
    
    Copyright (c) 2016 - 2017 Bruno Herfst, http://brunoherfst.com
    Copyright (c) 2011 Nick Morgan, http://skilldrick.co.uk

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

*/

#targetengine 'EAN13_Barcode_Creator';

$.localize = false; // enable ExtendScript localisation engine

var version = 0.4;
var debug   = true;

// Template preset
var standardPreset = { name               : "Standard",
                       version            : version,
                       pageIndex          : -1,
                       ean                : "",
                       addon              : "",
                       codeFont           : "OCR BARCODE\tRegular",
                       readFont           : "OCR BARCODE\tRegular",
                       readFontTracking   : 0,
                       whiteBox           : true,
                       humanReadable      : true,
                       alignTo            : "Page Margins",
                       selectionBounds    : [0,0,0,0],
                       refPoint           : "BOTTOM_RIGHT_ANCHOR",
                       offset             : { x: 0, y: 0 },
                       humanReadableStr   : "",
                       dpi                : 300,
                       bwr                : { value: 0, unit: "inch" },
                       createOulines      : true,
                       heightPercent      : 100,
                       scalePercent       : 80,
                       qZoneIndicator     : true,
                       addQuietZoneMargin : 0 };

var standardPresets = [standardPreset];

// ------------------------
// END of barcode_header.js

