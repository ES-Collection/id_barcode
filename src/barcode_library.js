/*
*
* http://en.wikipedia.org/wiki/European_Article_Number
* http://en.wikipedia.org/wiki/International_Standard_Book_Number
* http://en.wikipedia.org/wiki/International_Standard_Music_Number
* http://en.wikipedia.org/wiki/International_Standard_Serial_Number
* http://en.wikipedia.org/wiki/EAN_5
* http://en.wikipedia.org/wiki/EAN_2
*
*/

var ean13_pattern = [
  ['L', 'L', 'L', 'L', 'L', 'L', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'L', 'G', 'L', 'G', 'G', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'L', 'G', 'G', 'L', 'G', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'L', 'G', 'G', 'G', 'L', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'L', 'L', 'G', 'G', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'G', 'L', 'L', 'G', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'G', 'G', 'L', 'L', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'L', 'G', 'L', 'G', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'L', 'G', 'G', 'L', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['L', 'G', 'G', 'L', 'G', 'L', 'R', 'R', 'R', 'R', 'R', 'R']
];

var addon_pattern = [
  ['G', 'G', 'L', 'L', 'L'],
  ['G', 'L', 'G', 'L', 'L'],
  ['G', 'L', 'L', 'G', 'L'],
  ['G', 'L', 'L', 'L', 'G'],
  ['L', 'G', 'G', 'L', 'L'],
  ['L', 'L', 'G', 'G', 'L'],
  ['L', 'L', 'L', 'G', 'G'],
  ['L', 'G', 'L', 'G', 'L'],
  ['L', 'G', 'L', 'L', 'G'],
  ['L', 'L', 'G', 'L', 'G']
];

var bar_widths = {
  L: [ // Set A
    [0, 0, 0, 1, 1, 0, 1],
    [0, 0, 1, 1, 0, 0, 1],
    [0, 0, 1, 0, 0, 1, 1],
    [0, 1, 1, 1, 1, 0, 1],
    [0, 1, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 0, 1],
    [0, 1, 0, 1, 1, 1, 1],
    [0, 1, 1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 1, 0, 1, 1]
  ],
  G: [ // Set B
    [0, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 0, 0, 1, 1],
    [0, 0, 1, 1, 0, 1, 1],
    [0, 1, 0, 0, 0, 0, 1],
    [0, 0, 1, 1, 1, 0, 1],
    [0, 1, 1, 1, 0, 0, 1],
    [0, 0, 0, 0, 1, 0, 1],
    [0, 0, 1, 0, 0, 0, 1],
    [0, 0, 0, 1, 0, 0, 1],
    [0, 0, 1, 0, 1, 1, 1]
  ],
  R: [ // Set C
    [1, 1, 1, 0, 0, 1, 0],
    [1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 0],
    [1, 0, 0, 1, 1, 1, 0],
    [1, 0, 1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 0]
  ]
};

var checkCheckDigit = function(str) {
    // Check ISBN improved version from here:
    // http://stackoverflow.com/questions/11104439/how-do-i-check-if-an-input-contains-an-isbn-using-javascript/

    var str = String(str).replace(/[^0-9X]/gi, '');

    var len, sum, i, weight, digit, check;

    if (str.length == 13) {
        // EAN 13. ISBN 13, Padded ISSN
        len = str.length-1;
        sum = 0;
        for (i = 0; i < len; i++) {
            digit = Number(str[i]);
            if (i % 2 == 1) {
                sum += 3*digit;
            } else {
                sum += digit;
            }
        }
        check = (10 - (sum % 10)) % 10;
        if (check == 10) {
            check = 'X';
        }
        return (check == str[str.length-1].toUpperCase());

    } else if (str.length == 10 || str.length == 8) {
        // ISBN 10, Unpadded ISSN
        len    = str.length-1;
        weight = str.length;
        sum    = 0;
        for (i = 0; i < len; i++) {
          digit = Number(str[i]);
          sum += (weight - i) * digit;
        }

        check = (11 - sum % 11) % 11;
        if (check == 10) {
            check = 'X';
        }
        return (check == str[str.length-1].toUpperCase());

    } else {
      throw("Can't check digit: Wrong number count.");
    }
}

function calculateCheckDigit( ean ) {
  var sum, i;
    if (ean.match(/^\d{9}[\dX]?$/)) {
      // ISBN 10
      sum = 0;
      for (i = 0; i < 9; i += 1) {
        sum += (10 - i) * Number(ean.charAt(i));
      }
      sum = (11 - sum % 11) % 11;
      return sum === 10 ? 'X' : String(sum);

    } else if (ean.match(/\d{12}[\dX]?/)) {
      // EAN 13, ISBN 13, ISSN 13
      sum = 0;
      for (i = 0; i < 12; i += 2) {
        sum += Number(ean.charAt(i)) + 3 * Number(ean.charAt(i + 1));
      }
      sum = (10 - sum % 10) % 10;
      return sum === 10 ? 'X' : String(sum);
    
    } else if (ean.match(/^\d{7}[\dX]?$/)) {
      //ISSN 8
      sum = 0;
      for (i = 0; i < 7; i += 1) {
        sum += (8 - i) * Number(ean.charAt(i));
      }
      sum = (11 - sum % 11) % 11;
      return sum === 10 ? 'X' : String(sum);

    }

    return null;
}

var Barcode = function () {
  var barcode_string;
  var addon_string;
  var stripped;
  var pattern;
  var dimensions;

  function getDimensions( options ) {
      /*
    
      This function gets the dimensions for an EAN-13 barcode
      
      Param: Options (Object): {dpi: integer, scale: integer (percent), heightAdjust:  integer (percent)} 
      
      Note: Values are in mm unless otherwise indicated

      */

      // Barcode Dimension Object (return)
      var BD = new Object();

      function fitDPI( VALUE_MM, DPI ) {
          var value = parseFloat(VALUE_MM)/25.4; // Inches
          var dpi   = parseInt(DPI);

          var dotWidth = 1/dpi;
          var dotCount = Math.floor( dpi * value );

          var rasterSize = dotWidth * dotCount;
          return rasterSize * 25.4; // in mm
      }

      BD.dpi = 0;
      if( options && options.hasOwnProperty('dpi') ) {
          BD.dpi = parseFloat(options.dpi);
      }

      BD.scale = 100; // Percentage
      if( options && options.hasOwnProperty('scale') ) {
          BD.scale = parseInt(options.scale);
      }
      
      BD.scalePercent = parseFloat(BD.scale)/100;

      // The recommended typeface for the Human Readable Interpretation is OCR-B at a height of 2.75mm
      BD.fontHeight = 2.75 * BD.scalePercent;

      BD.barsYoffset = 0;
      if( options && options.hasOwnProperty('humanReadable') ) {
            if( options.humanReadable ){
                BD.barsYoffset = BD.fontHeight;
            }
      }

      BD.barHeight = 22.85 * BD.scalePercent; // Height of normal bar (Not to be confused with guard bar)

      if( options && options.hasOwnProperty('heightAdjust') ) {
          BD.barHeight = (BD.barHeight/100) * options.heightAdjust;
      }

      BD.xDimension = 0.33 * BD.scalePercent; // X-dimension is the width of the thinnest bar
      if( BD.dpi > 0 ) {
          BD.xDimension = fitDPI( BD.xDimension, BD.dpi );
      }

      BD.quietZone = 7 * BD.xDimension; // Area of white space on either side of the bars. (X-dimension * 7 = Minimum)

      // Width of all bars (including the width of the Left & Right Quiet Zones)
      BD.digitWidth = 6 * BD.xDimension;
      BD.guardWidth = 4 * BD.xDimension;
      
      BD.width = (12 * BD.digitWidth) + (3 * BD.guardWidth); // Width of bars including guards

      BD.humanReadableWidth = BD.width + (2 * BD.quietZone) + (2 * BD.digitWidth);
      BD.minBoxWidth        = BD.width + (2 * BD.quietZone) + (2 * BD.digitWidth) + (2 * BD.xDimension);

      function addWidth( w ) {
          BD.width       += w;
          BD.minBoxWidth += w;
      }

      BD.guardBarOvershoot = 5 * BD.xDimension; // Specification specifies that barHeight is extended downward 5X: barHeight + (X-dimension * 5)  
      BD.guardHeight = BD.barHeight + BD.guardBarOvershoot; 
      BD.addonHeight = BD.barHeight - BD.fontHeight;

      BD.height = BD.guardHeight; // Also called symbolHeight or guardHeight; 

      BD.minBoxHeight = BD.barsYoffset + BD.barHeight + BD.fontHeight + (BD.xDimension * 2); // height incl. Machine Readable Numbers

      BD.addonLen    = 0; // How many digits in the addon code
      BD.addonGap    = BD.quietZone; // How much space bewteen the ean and addon code

      if( options && options.hasOwnProperty('addonLen') ) {
          BD.addonLen = parseInt(options.addonLen);
          if( BD.addonLen > 0 ) {
              // Add gap
              addWidth( BD.addonGap );
              // Start (5) + first digit (7) 
              addWidth( BD.xDimension * 12 );
              // Seperator (2) + next digits (7)
              for(var x = BD.addonLen; x > 1; x--) {
                addWidth( BD.xDimension * 9 );
              }
              addWidth( BD.quietZone + BD.xDimension );
          }
      }
      
      // Some positional markers that are handy to refer to
      BD.yBottomBar  = BD.barsYoffset + BD.barHeight;
      BD.startingpos = BD.xDimension;

      return BD;
  }

  function getNorm(bars) {
    var curr = bars[0];
    var counter = 1;
    var norm = [];
    for (var i = 1; i < bars.length; i++) {
      if (curr !== bars[i]) {
        norm.push(counter);
        counter = 1;
        curr = bars[i];
      }
      else {
        counter++;
      }
    }
    norm.push(counter);
    return norm;
  }

  function stripAddon(str) {
    return str.replace(/[^\d]+/g, '');
  }

  function stripEAN(str) {
    return str.replace(/[^0-9X]/gi, '');
  }

  return {
    init: function (preset) {
      var eanStr   = String(preset.ean);
      var addonStr = String(preset.addon);
      
      if (eanStr) {
        barcode_string = eanStr;
        stripped = stripEAN(barcode_string);
        if ( !checkCheckDigit(stripped) ) {
          throw "Check digit incorrect";
        }
        pattern = ean13_pattern[stripped[0]];
      }

      if (addonStr) {
        addon_string = stripAddon(addonStr);
        if(addon_string.length > 5) {
        	throw "Addon should be 5 digits or less.\nLength is: " + addon_string.length;
        }
      }

      dimensions = getDimensions( { dpi           : preset.dpi,
                                    scale         : preset.scalePercent, 
                                    heightAdjust  : preset.heightPercent, 
                                    humanReadable : preset.humanReadable, 
                                    addonLen      : preset.addon.length} );
      return this;
    },

    getDimensions: function () {
      return dimensions;
    },

    getStripped: function () {
      return stripped;
    },
	
    getBarWidths: function () {
      var barWidths = [];
      for (var i = 1; i < stripped.length; i++) { //don't include first number of barcode
        var encoding = pattern[i - 1];
        var thisBarWidth = bar_widths[encoding][stripped[i]];
        barWidths.push(thisBarWidth);
      }
      return barWidths;
    },

    getNormalisedWidths: function () {
      var barWidths = this.getBarWidths();
      var normalisedWidths = [];
      var current = [];
      for (var i = 0; i < barWidths.length; i++) {
        current = [];
        if (barWidths[i][0] === 0) {
          current.push([0, 1, 0, 1]);
        }
        else {
          current.push([1, 0, 1, 0]);
        }
        var norm = getNorm(barWidths[i]);
        current.push(norm);
        current.push(stripped[i+1]); //add ean digit
        normalisedWidths.push(current);
      }
      return normalisedWidths;

    },

    getAddonWidths: function () {
      if (! addon_string) {
        return false;
      }
      else {
        var checksum = this.getAddonChecksum();
        var pattern = addon_pattern[checksum];
        var widths = [];
        for (var i = 0; i < addon_string.length; i++) {
          //separators:
          if (i === 0) {
            widths.push([0, 1, 0, 1, 1]);
          }
          else {
            widths.push([0, 1]);
          }
          var encoding = pattern[i];
          widths.push(bar_widths[encoding][addon_string[i]]);
        }
        return widths;
      }
    },

    getNormalisedAddon: function () {
      var addonWidths = this.getAddonWidths();
      if (! addonWidths) {
        return false;
      }
      var normalisedAddon = [];
      var current = [];
      for (var i = 0; i < addonWidths.length; i++) {
        current = [];
        if (addonWidths[i].length == 2) {
          current.push([0, 1])
        }
        else {
          current.push([0, 1, 0, 1]);
        }
        current.push(getNorm(addonWidths[i]));
        if (i % 2 == 1) {
          current.push(addon_string[Math.floor(i / 2)]);
        }
        normalisedAddon.push(current);
      }

      return normalisedAddon;
    },

    getAddonChecksum: function () {
      var total = 0;
      for (var i = 0; i < addon_string.length; i++) {
        if (i % 2 === 0) {
          total += addon_string[i] * 3;
        }
        else {
          total += addon_string[i] * 9;
        }
      }
      return total % 10;
    }

  }
};

// END barcode_library.js

