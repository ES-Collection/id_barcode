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

var version = 0.5;
var debug   = true;

var Barcode_Settings_Schema = {
  "type": "object",
  "$schema": "http://json-schema.org/draft-06/schema#",
  "properties": {
    "name": {
      "$id": "/properties/name",
      "type": "string",
      "title": "Name",
      "description": "The name of the preset, this will show in UI drop-down.",
      "default": "New Preset",
      "examples": [
        "My Barcode Preset"
      ]
    },
    "version": {
      "$id": "/properties/version",
      "type": "number",
      "minimum": 0.1,
      "title": "Version",
      "description": "Script version that generated the preset.",
      "default": version,
      "examples": [
        1.2
      ]
    },
    "pageIndex": {
      "$id": "/properties/pageIndex",
      "type": "integer",
      "minimum": -1,
      "title": "Pageindex",
      "description": "An explanation about the purpose of this instance.",
      "default": 0,
      "examples": [
        5
      ]
    },
    "ean": {
      "$id": "/properties/ean",
      "type": "string",
      "title": "Ean",
      "description": "The EAN number including checkdigit (Can contain X)",
      "default": "",
      "examples": [
        "5901234123457"
      ]
    },
    "addon": {
      "$id": "/properties/addon",
      "type": "string",
      "title": "Addon",
      "description": "2-digit EAN-2, or 5-digit EAN-5 supplemental code.",
      "default": "",
      "examples": [
        "12"
      ]
    },
    "codeFont": {
      "$id": "/properties/codeFont",
      "type": "string",
      "title": "Codefont",
      "description": "The font name and style to be used by for the machine readable numbers.",
      "default": "",
      "examples": [
        "OCR-B\tRegular"
      ]
    },
    "readFont": {
      "$id": "/properties/readFont",
      "type": "string",
      "title": "Readfont",
      "description": "The font name and style to be used by for the human readable numbers.",
      "default": "",
      "examples": [
        "OCR-B\tRegular"
      ]
    },
    "readFontTracking": {
      "$id": "/properties/readFontTracking",
      "type": "integer",
      "title": "Readfonttracking",
      "description": "The tracking to be aplied to the human readable font",
      "default": 0,
      "examples": [
        -120
      ]
    },
    "whiteBox": {
      "$id": "/properties/whiteBox",
      "type": "boolean",
      "title": "Whitebox",
      "description": "Should the barcode have a white/paper coloured background.",
      "default": false,
      "examples": [
        true
      ]
    },
    "humanReadable": {
      "$id": "/properties/humanReadable",
      "type": "boolean",
      "title": "Humanreadable",
      "description": "Add the human readable string to the barcode?",
      "default": false,
      "examples": [
        true
      ]
    },
    "alignTo": {
      "$id": "/properties/alignTo",
      "type": "string",
      "title": "Alignto",
      "description": "Align barcode to something?",
      "default": "",
      "examples": [
        "Page",
        "Page Margins",
        "selection"
      ]
    },
    "selectionBounds": {
      "$id": "/properties/selectionBounds",
      "type": "array",
      "description": "Array of Measurement Units in format [y1, x1, y2, x2]",
      "maxItems": 4,
      "minItems": 4,
      "items": {
        "$id": "/properties/selectionBounds/items",
        "type": "number",
        "title": "geometricBounds",
        "description": "coordinate value",
        "default": 0,
        "examples": [
          135.456, -20.34, 15
        ]
      }
    },
    "refPoint": {
      "$id": "/properties/refPoint",
      "type": "string",
      "title": "Refpoint",
      "description": "A reference point for barcode alignment.",
      "default": "",
      "examples": [
        "BOTTOM_RIGHT_ANCHOR"
      ]
    },
    "offset": {
      "$id": "/properties/offset",
      "type": "object",
      "description": "A offset used when drawing the barcode.",
      "properties": {
        "x": {
          "$id": "/properties/offset/properties/x",
          "type": "number",
          "title": "X",
          "default": 0,
          "examples": [
            -20.255
          ]
        },
        "y": {
          "$id": "/properties/offset/properties/y",
          "type": "number",
          "title": "Y",
          "default": 0,
          "examples": [
            12
          ]
        }
      }
    },
    "humanReadableStr": {
      "$id": "/properties/humanReadableStr",
      "type": "string",
      "title": "Humanreadablestr",
      "description": "The human readable string to be used.",
      "default": "",
      "examples": [
        "ISSN: 0123-460"
      ]
    },
    "dpi": {
      "$id": "/properties/dpi",
      "type": "integer",
      "title": "Dpi",
      "description": "The DPI of output device.",
      "default": 0,
      "examples": [
        300
      ]
    },
    "bwr": {
      "$id": "/properties/bwr",
      "type": "object",
      "description": "Bar Width Reduction value",
      "properties": {
        "value": {
          "$id": "/properties/bwr/properties/value",
          "type": "number",
          "title": "Value",
          "default": 0,
          "examples": [
            0, -0.002, 0.0125
          ]
        },
        "unit": {
          "$id": "/properties/bwr/properties/unit",
          "type": "string",
          "title": "Unit",
          "description": "Measure Unit",
          "default": "",
          "examples": [
            "inch"
          ]
        }
      }
    },
    "createOulines": {
      "$id": "/properties/createOulines",
      "type": "boolean",
      "title": "Createoulines",
      "description": "Convert text to outlines?",
      "default": true
    },
    "heightPercent": {
      "$id": "/properties/heightPercent",
      "type": "integer",
      "title": "Heightpercent",
      "description": "Adjust the height of the barcode/",
      "default": 100
    },
    "scalePercent": {
      "$id": "/properties/scalePercent",
      "type": "integer",
      "title": "Scalepercent",
      "description": "Adjust scale of barcode.",
      "default": 100
    },
    "qZoneIndicator": {
      "$id": "/properties/qZoneIndicator",
      "type": "boolean",
      "title": "Qzoneindicator",
      "description": "Add light margin indicator",
      "default": true
    },
    "addQuietZoneMargin": {
      "$id": "/properties/addQuietZoneMargin",
      "type": "integer", // Change to array [top, right, bottom, left]
      "title": "Addquietzonemargin",
      "description": "Add extra quite zone or margins to the barcode.",
      "default": 0,
      "examples": [
        10
      ]
    }
  }
}

// Template presets
var standardPresets = [ { name              : "Penguin Books",
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
                          dpi                : 1200,
                          bwr                : { value: 0.00125, unit: "inch" },
                          createOulines      : true,
                          heightPercent      : 60,
                          scalePercent       : 95,
                          qZoneIndicator     : false,
                          addQuietZoneMargin : 0
                        },

                        { name               : "Standard",
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
                          dpi                : 1200,
                          bwr                : { value: 0, unit: "inch" },
                          createOulines      : true,
                          heightPercent      : 100,
                          scalePercent       : 80,
                          qZoneIndicator     : true,
                          addQuietZoneMargin : 0
                        }
                      ];

// ------------------------
// END of barcode_header.js

