function log(text) {
  $.writeln(text);
}

var checkCheckDigit = function(str) {
    // Check ISBN as found here:
    // http://stackoverflow.com/questions/11104439/how-do-i-check-if-an-input-contains-an-isbn-using-javascript/

    var str = String(str).replace(/[^0-9X]/gi, '');

    var len,
        sum,
        weight,
        digit,
        check,
        i;

    if (str.length == 13) {
        // ISBN-13 or padded ISSN
        len = str.length-1;
        sum = 0;
        for (i = 0; i < len; i++) {
            digit = parseInt(str[i]);
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
        // ISBN-10 or unpadded ISSN
        len = str.length-1;
        weight = str.length;
        sum = 0;
        for (i = 0; i < len; i++) {
          digit = parseInt(str[i]);
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

function calculateCheckDigit(ean) {
  var c, n, d;
    if (ean.match(/^\d{9}[\dX]?$/)) {
      // ISBN-10
      c = 0;
      for (n = 0; n < 9; n += 1) {
        c += (10 - n) * ean.charAt(n);
      }
      c = (11 - c % 11) % 11;
      return c === 10 ? 'X' : String(c);

    } else if (ean.match(/(?:978|979|977)\d{9}[\dX]?/)) {
      // ISBN-13 ISSN-13
      c = 0;
      for (n = 0; n < 12; n += 2) {
        c += Number(ean.charAt(n)) + 3 * ean.charAt(n + 1);
      }
      c = (10 - c % 10) % 10;
      return c === 10 ? 'X' : String(c);
    
    } else if (ean.match(/^\d{7}[\dX]?$/)) {
      //ISSN-8
      // https://en.wikipedia.org/wiki/International_Standard_Serial_Number
      c = 0;
      for (n = 0; n < 7; n += 1) {
        c += (8 - n) * ean.charAt(n);
      }
      c = (11 - c % 11) % 11;
      return c === 10 ? 'X' : String(c);

    }

    return null;
}

var Barcode = function () {
  var barcode_string;
  var addon_string;
  var stripped;
  var pattern;

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

      return this;
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

/*
*
* http://en.wikipedia.org/wiki/European_Article_Number
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
  L: [
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
  G: [
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
  R: [
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

// END barcode_library.js

