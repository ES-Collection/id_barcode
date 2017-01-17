﻿function log(text) {
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
    }
    
    if (str.length == 10 || str.length == 8) {
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
    }


      sum = (11 - sum % 11) % 11;
      return sum === 10 ? 'X' : String(c);


    return false;
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

      //return String((10 - c % 10) % 10);
      c = (10 - c % 10) % 10;
      return c === 10 ? 'X' : String(c);
    
    } else if (ean.match(/^\d{7}[\dX]?$/)) {
      //ISSN-8
      /* Wrongly stated on http://www.issn.org/understanding-the-issn/issn-uses/identification-with-the-ean-13-barcode/
      c = 0;
      for (n = 0; n < 7; n++) {
        d = Number(ean.charAt(n));
        if (i % 2 == 1) {
            // odd
            c += 3*d;
        } else {
            // even
            c += d;
        }
      }
      c = 10 - (c % 10);
      return c === 10 ? 'X' : String(c);
      */
      // Wikipedia is right for a change: https://en.wikipedia.org/wiki/International_Standard_Serial_Number
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

var pattern = ['L', 'G', 'G', 'L', 'G', 'L', 'R', 'R', 'R', 'R', 'R', 'R'];

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
// Many parts of this code borrowed from IndiSnip
// http://indisnip.wordpress.com/2010/08/24/findchange-missing-font-with-scripting/


//get unique Array elements
Array.prototype.unique = function () {
  var r = new Array();
  o:for (var i = 0, n = this.length; i < n; i++) {
    for (var x = 0, y = r.length; x < y; x++) {
      if (r[x]==this[i]) {
        continue o;
      }
    }
    r[r.length] = this[i];
  }
  return r;
}

//search inside array
Array.prototype.findIn = function(search){
  var r = Array();
  for (var i=0; i<this.length; i++) {
    if (this[i].indexOf(search) != -1) {
      r.push(this[i].substr(this[i].indexOf("\t") + 1, this[i].length));
    }
  }
  return r;
};

Array.prototype.findID = function (str) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].indexOf(str) === 0) {
      return i;
    }
  }
  return 0;
};


//FontSelect makes a font selection gui widget, and returns an object
//with the single method getFont, which can be called to get the selected font
function FontSelect(group, font) {
  var fontFamily = "";
  var fontStyle  = "";
  
  function setFontName(font) {
    if (typeof font === 'string' || font instanceof String) {
      var splitFont = font.split('\t');
      if(splitFont.length == 2) {
        fontFamily = splitFont[0];
        fontStyle = splitFont[1];
      }
    }
  }

  setFontName(font);

  var sysFonts = app.fonts.everyItem();
  var sysFontsList = sysFonts.fontFamily.unique();
  sysFontsList.unshift("- Select Font Family -");

  var fontFamilyId = sysFontsList.findID(fontFamily);

  var availableFonts = group.add('dropdownlist', undefined, sysFontsList);
  var availableStyles = group.add('dropdownlist');

  availableFonts.minimumSize = [230,25];
  availableStyles.minimumSize = [220,25];
  
  availableFonts.onChange = function () {
    availableStyles.removeAll();
    var sysFontAvailableStyles = sysFonts.name.findIn(availableFonts.selection);
    for (var i = 0; i < sysFontAvailableStyles.length; i++) {
      availableStyles.add('item',sysFontAvailableStyles[i]);
    }
    fontStyleId = sysFontAvailableStyles.findID(fontStyle);
    availableStyles.selection = fontStyleId;
  }

  availableFonts.selection = fontFamilyId;

  return {
    getFont: function () {
      if (availableFonts.selection && availableStyles.selection) {
        return availableFonts.selection.text + '\t' + availableStyles.selection.text;
      }
      else {
        return null; //Now we know the font is not loaded
      }
    },
    setFont: function(fontName){
      setFontName(fontName);
      fontFamilyId = sysFontsList.findID(fontFamily);
      availableFonts.selection = fontFamilyId;
      
      availableStyles.removeAll();
      
      var sysFontAvailableStyles = sysFonts.name.findIn(availableFonts.selection);
      for (var i = 0; i < sysFontAvailableStyles.length; i++) {
        availableStyles.add('item',sysFontAvailableStyles[i]);
      }
      
      fontStyleId = sysFontAvailableStyles.findID(fontStyle);
      availableStyles.selection = fontStyleId;
    }
  };
}

//https://www.isbn-international.org/range_file_generation

var ISBN = {
  VERSION: '0.01',
  GROUPS: {
  "0": {
    "name": "English language",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "949999"], ["9500000", "9999999"]]
  },
  "1": {
    "name": "English language",
    "ranges": [["00", "09"], ["100", "399"], ["4000", "5499"], ["55000", "86979"], ["869800", "998999"], ["9990000", "9999999"]]
  },
  "2": {
    "name": "French language",
    "ranges": [["00", "19"], ["200", "349"], ["35000", "39999"], ["400", "699"], ["7000", "8399"], ["84000", "89999"], ["900000", "949999"], ["9500000", "9999999"]]
  },
  "3": {
    "name": "German language",
    "ranges": [["00", "02"], ["030", "033"], ["0340", "0369"], ["03700", "03999"], ["04", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "949999"], ["9500000", "9539999"], ["95400", "96999"], ["9700000", "9899999"], ["99000", "99499"], ["99500", "99999"]]
  },
  "4": {
    "name": "Japan",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "949999"], ["9500000", "9999999"]]
  },
  "5": {
    "name": "former U.S.S.R",
    "ranges": [["00000", "00499"], ["0050", "0099"], ["01", "19"], ["200", "420"], ["4210", "4299"], ["430", "430"], ["4310", "4399"], ["440", "440"], ["4410", "4499"], ["450", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "909999"], ["91000", "91999"], ["9200", "9299"], ["93000", "94999"], ["9500000", "9500999"], ["9501", "9799"], ["98000", "98999"], ["9900000", "9909999"], ["9910", "9999"]]
  },
  "600": {
    "name": "Iran",
    "ranges": [["00", "09"], ["100", "499"], ["5000", "8999"], ["90000", "99999"]]
  },
  "601": {
    "name": "Kazakhstan",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "7999"], ["80000", "84999"], ["85", "99"]]
  },
  "602": {
    "name": "Indonesia",
    "ranges": [["00", "10"], ["1100", "1199"], ["1200", "1399"], ["14000", "14999"], ["1500", "1699"], ["17000", "17999"], ["18000", "18999"], ["19000", "19999"], ["200", "699"], ["70000", "74999"], ["7500", "7999"], ["8000", "9499"], ["95000", "99999"]]
  },
  "603": {
    "name": "Saudi Arabia",
    "ranges": [["00", "04"], ["05", "49"], ["500", "799"], ["8000", "8999"], ["90000", "99999"]]
  },
  "604": {
    "name": "Vietnam",
    "ranges": [["0", "4"], ["50", "89"], ["900", "979"], ["9800", "9999"]]
  },
  "605": {
    "name": "Turkey",
    "ranges": [["01", "09"], ["100", "399"], ["4000", "5999"], ["60000", "89999"], ["9000", "9999"]]
  },
  "606": {
    "name": "Romania",
    "ranges": [["0", "0"], ["10", "49"], ["500", "799"], ["8000", "9199"], ["92000", "99999"]]
  },
  "607": {
    "name": "Mexico",
    "ranges": [["00", "39"], ["400", "749"], ["7500", "9499"], ["95000", "99999"]]
  },
  "608": {
    "name": "Macedonia",
    "ranges": [["0", "0"], ["10", "19"], ["200", "449"], ["4500", "6499"], ["65000", "69999"], ["7", "9"]]
  },
  "609": {
    "name": "Lithuania",
    "ranges": [["00", "39"], ["400", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "611": {
    "name": "Thailand",
    "ranges": []
  },
  "612": {
    "name": "Peru",
    "ranges": [["00", "29"], ["300", "399"], ["4000", "4499"], ["45000", "49999"], ["50", "99"]]
  },
  "613": {
    "name": "Mauritius",
    "ranges": [["0", "9"]]
  },
  "614": {
    "name": "Lebanon",
    "ranges": [["00", "39"], ["400", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "615": {
    "name": "Hungary",
    "ranges": [["00", "09"], ["100", "499"], ["5000", "7999"], ["80000", "89999"]]
  },
  "616": {
    "name": "Thailand",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8999"], ["90000", "99999"]]
  },
  "617": {
    "name": "Ukraine",
    "ranges": [["00", "49"], ["500", "699"], ["7000", "8999"], ["90000", "99999"]]
  },
  "618": {
    "name": "Greece",
    "ranges": [["00", "19"], ["200", "499"], ["5000", "7999"], ["80000", "99999"]]
  },
  "619": {
    "name": "Bulgaria",
    "ranges": [["00", "14"], ["150", "699"], ["7000", "8999"], ["90000", "99999"]]
  },
  "620": {
    "name": "Mauritius",
    "ranges": [["0", "9"]]
  },
  "621": {
    "name": "Philippines",
    "ranges": [["00", "29"], ["400", "599"], ["8000", "8999"], ["95000", "99999"]]
  },
  "7": {
    "name": "China, People's Republic",
    "ranges": [["00", "09"], ["100", "499"], ["5000", "7999"], ["80000", "89999"], ["900000", "999999"]]
  },
  "80": {
    "name": "former Czechoslovakia",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "999999"]]
  },
  "81": {
    "name": "India",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["900000", "999999"]]
  },
  "82": {
    "name": "Norway",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8999"], ["90000", "98999"], ["990000", "999999"]]
  },
  "83": {
    "name": "Poland",
    "ranges": [["00", "19"], ["200", "599"], ["60000", "69999"], ["7000", "8499"], ["85000", "89999"], ["900000", "999999"]]
  },
  "84": {
    "name": "Spain",
    "ranges": [["00", "13"], ["140", "149"], ["15000", "19999"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["9000", "9199"], ["920000", "923999"], ["92400", "92999"], ["930000", "949999"], ["95000", "96999"], ["9700", "9999"]]
  },
  "85": {
    "name": "Brazil",
    "ranges": [["00", "19"], ["200", "599"], ["60000", "69999"], ["7000", "8499"], ["85000", "89999"], ["900000", "979999"], ["98000", "99999"]]
  },
  "86": {
    "name": "former Yugoslavia",
    "ranges": [["00", "29"], ["300", "599"], ["6000", "7999"], ["80000", "89999"], ["900000", "999999"]]
  },
  "87": {
    "name": "Denmark",
    "ranges": [["00", "29"], ["400", "649"], ["7000", "7999"], ["85000", "94999"], ["970000", "999999"]]
  },
  "88": {
    "name": "Italy",
    "ranges": [["00", "19"], ["200", "599"], ["6000", "8499"], ["85000", "89999"], ["900000", "909999"], ["910", "929"], ["9300", "9399"], ["940000", "949999"], ["95000", "99999"]]
  },
  "89": {
    "name": "Korea, Republic",
    "ranges": [["00", "24"], ["250", "549"], ["5500", "8499"], ["85000", "94999"], ["950000", "969999"], ["97000", "98999"], ["990", "999"]]
  },
  "90": {
    "name": "Netherlands",
    "ranges": [["00", "19"], ["200", "499"], ["5000", "6999"], ["70000", "79999"], ["800000", "849999"], ["8500", "8999"], ["90", "90"], ["94", "94"]]
  },
  "91": {
    "name": "Sweden",
    "ranges": [["0", "1"], ["20", "49"], ["500", "649"], ["7000", "7999"], ["85000", "94999"], ["970000", "999999"]]
  },
  "92": {
    "name": "International NGO Publishers and EC Organizations",
    "ranges": [["0", "5"], ["60", "79"], ["800", "899"], ["9000", "9499"], ["95000", "98999"], ["990000", "999999"]]
  },
  "93": {
    "name": "India",
    "ranges": [["00", "09"], ["100", "499"], ["5000", "7999"], ["80000", "94999"], ["950000", "999999"]]
  },
  "94": {
    "name": "Netherlands",
    "ranges": [["000", "599"], ["6000", "8999"], ["90000", "99999"]]
  },
  "950": {
    "name": "Argentina",
    "ranges": [["00", "49"], ["500", "899"], ["9000", "9899"], ["99000", "99999"]]
  },
  "951": {
    "name": "Finland",
    "ranges": [["0", "1"], ["20", "54"], ["550", "889"], ["8900", "9499"], ["95000", "99999"]]
  },
  "952": {
    "name": "Finland",
    "ranges": [["00", "19"], ["200", "499"], ["5000", "5999"], ["60", "65"], ["6600", "6699"], ["67000", "69999"], ["7000", "7999"], ["80", "94"], ["9500", "9899"], ["99000", "99999"]]
  },
  "953": {
    "name": "Croatia",
    "ranges": [["0", "0"], ["10", "14"], ["150", "509"], ["51", "54"], ["55000", "59999"], ["6000", "9499"], ["95000", "99999"]]
  },
  "954": {
    "name": "Bulgaria",
    "ranges": [["00", "28"], ["2900", "2999"], ["300", "799"], ["8000", "8999"], ["90000", "92999"], ["9300", "9999"]]
  },
  "955": {
    "name": "Sri Lanka",
    "ranges": [["0000", "1999"], ["20", "40"], ["41000", "43999"], ["44000", "44999"], ["4500", "4999"], ["50000", "54999"], ["550", "749"], ["7500", "7999"], ["8000", "9499"], ["95000", "99999"]]
  },
  "956": {
    "name": "Chile",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "9999"]]
  },
  "957": {
    "name": "Taiwan",
    "ranges": [["00", "02"], ["0300", "0499"], ["05", "19"], ["2000", "2099"], ["21", "27"], ["28000", "30999"], ["31", "43"], ["440", "819"], ["8200", "9699"], ["97000", "99999"]]
  },
  "958": {
    "name": "Colombia",
    "ranges": [["00", "56"], ["57000", "59999"], ["600", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "959": {
    "name": "Cuba",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "99999"]]
  },
  "960": {
    "name": "Greece",
    "ranges": [["00", "19"], ["200", "659"], ["6600", "6899"], ["690", "699"], ["7000", "8499"], ["85000", "92999"], ["93", "93"], ["9400", "9799"], ["98000", "99999"]]
  },
  "961": {
    "name": "Slovenia",
    "ranges": [["00", "19"], ["200", "599"], ["6000", "8999"], ["90000", "94999"]]
  },
  "962": {
    "name": "Hong Kong, China",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "86999"], ["8700", "8999"], ["900", "999"]]
  },
  "963": {
    "name": "Hungary",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["9000", "9999"]]
  },
  "964": {
    "name": "Iran",
    "ranges": [["00", "14"], ["150", "249"], ["2500", "2999"], ["300", "549"], ["5500", "8999"], ["90000", "96999"], ["970", "989"], ["9900", "9999"]]
  },
  "965": {
    "name": "Israel",
    "ranges": [["00", "19"], ["200", "599"], ["7000", "7999"], ["90000", "99999"]]
  },
  "966": {
    "name": "Ukraine",
    "ranges": [["00", "12"], ["130", "139"], ["14", "14"], ["1500", "1699"], ["170", "199"], ["2000", "2789"], ["279", "289"], ["2900", "2999"], ["300", "699"], ["7000", "8999"], ["90000", "90999"], ["910", "949"], ["95000", "97999"], ["980", "999"]]
  },
  "967": {
    "name": "Malaysia",
    "ranges": [["00", "00"], ["0100", "0999"], ["10000", "19999"], ["300", "499"], ["5000", "5999"], ["60", "89"], ["900", "989"], ["9900", "9989"], ["99900", "99999"]]
  },
  "968": {
    "name": "Mexico",
    "ranges": [["01", "39"], ["400", "499"], ["5000", "7999"], ["800", "899"], ["9000", "9999"]]
  },
  "969": {
    "name": "Pakistan",
    "ranges": [["0", "1"], ["20", "39"], ["400", "799"], ["8000", "9999"]]
  },
  "970": {
    "name": "Mexico",
    "ranges": [["01", "59"], ["600", "899"], ["9000", "9099"], ["91000", "96999"], ["9700", "9999"]]
  },
  "971": {
    "name": "Philippines",
    "ranges": [["000", "015"], ["0160", "0199"], ["02", "02"], ["0300", "0599"], ["06", "49"], ["500", "849"], ["8500", "9099"], ["91000", "95999"], ["9600", "9699"], ["97", "98"], ["9900", "9999"]]
  },
  "972": {
    "name": "Portugal",
    "ranges": [["0", "1"], ["20", "54"], ["550", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "973": {
    "name": "Romania",
    "ranges": [["0", "0"], ["100", "169"], ["1700", "1999"], ["20", "54"], ["550", "759"], ["7600", "8499"], ["85000", "88999"], ["8900", "9499"], ["95000", "99999"]]
  },
  "974": {
    "name": "Thailand",
    "ranges": [["00", "19"], ["200", "699"], ["7000", "8499"], ["85000", "89999"], ["90000", "94999"], ["9500", "9999"]]
  },
  "975": {
    "name": "Turkey",
    "ranges": [["00000", "01999"], ["02", "24"], ["250", "599"], ["6000", "9199"], ["92000", "98999"], ["990", "999"]]
  },
  "976": {
    "name": "Caribbean Community",
    "ranges": [["0", "3"], ["40", "59"], ["600", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "977": {
    "name": "Egypt",
    "ranges": [["00", "19"], ["200", "499"], ["5000", "6999"], ["700", "849"], ["85000", "89999"], ["90", "99"]]
  },
  "978": {
    "name": "Nigeria",
    "ranges": [["000", "199"], ["2000", "2999"], ["30000", "79999"], ["8000", "8999"], ["900", "999"]]
  },
  "979": {
    "name": "Indonesia",
    "ranges": [["000", "099"], ["1000", "1499"], ["15000", "19999"], ["20", "29"], ["3000", "3999"], ["400", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "980": {
    "name": "Venezuela",
    "ranges": [["00", "19"], ["200", "599"], ["6000", "9999"]]
  },
  "981": {
    "name": "Singapore",
    "ranges": [["00", "11"], ["17000", "19999"], ["200", "289"], ["290", "299"], ["3000", "3099"], ["310", "399"], ["4000", "9999"]]
  },
  "982": {
    "name": "South Pacific",
    "ranges": [["00", "09"], ["100", "699"], ["70", "89"], ["9000", "9799"], ["98000", "99999"]]
  },
  "983": {
    "name": "Malaysia",
    "ranges": [["00", "01"], ["020", "199"], ["2000", "3999"], ["40000", "44999"], ["45", "49"], ["50", "79"], ["800", "899"], ["9000", "9899"], ["99000", "99999"]]
  },
  "984": {
    "name": "Bangladesh",
    "ranges": [["00", "39"], ["400", "799"], ["8000", "8999"], ["90000", "99999"]]
  },
  "985": {
    "name": "Belarus",
    "ranges": [["00", "39"], ["400", "599"], ["6000", "8999"], ["90000", "99999"]]
  },
  "986": {
    "name": "Taiwan",
    "ranges": [["00", "11"], ["120", "559"], ["5600", "7999"], ["80000", "99999"]]
  },
  "987": {
    "name": "Argentina",
    "ranges": [["00", "09"], ["1000", "1999"], ["20000", "29999"], ["30", "35"], ["3600", "3999"], ["40", "44"], ["45000", "49999"], ["500", "899"], ["9000", "9499"], ["95000", "99999"]]
  },
  "988": {
    "name": "Hong Kong, China",
    "ranges": [["00", "11"], ["12000", "14999"], ["15000", "16999"], ["17000", "19999"], ["200", "799"], ["8000", "9699"], ["97000", "99999"]]
  },
  "989": {
    "name": "Portugal",
    "ranges": [["0", "1"], ["20", "54"], ["550", "799"], ["8000", "9499"], ["95000", "99999"]]
  },
  "9927": {
    "name": "Qatar",
    "ranges": [["00", "09"], ["100", "399"], ["4000", "4999"]]
  },
  "9928": {
    "name": "Albania",
    "ranges": [["00", "09"], ["100", "399"], ["4000", "4999"]]
  },
  "9929": {
    "name": "Guatemala",
    "ranges": [["0", "3"], ["40", "54"], ["550", "799"], ["8000", "9999"]]
  },
  "9930": {
    "name": "Costa Rica",
    "ranges": [["00", "49"], ["500", "939"], ["9400", "9999"]]
  },
  "9931": {
    "name": "Algeria",
    "ranges": [["00", "29"], ["300", "899"], ["9000", "9999"]]
  },
  "9932": {
    "name": "Lao People's Democratic Republic",
    "ranges": [["00", "39"], ["400", "849"], ["8500", "9999"]]
  },
  "9933": {
    "name": "Syria",
    "ranges": [["0", "0"], ["10", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9934": {
    "name": "Latvia",
    "ranges": [["0", "0"], ["10", "49"], ["500", "799"], ["8000", "9999"]]
  },
  "9935": {
    "name": "Iceland",
    "ranges": [["0", "0"], ["10", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9936": {
    "name": "Afghanistan",
    "ranges": [["0", "1"], ["20", "39"], ["400", "799"], ["8000", "9999"]]
  },
  "9937": {
    "name": "Nepal",
    "ranges": [["0", "2"], ["30", "49"], ["500", "799"], ["8000", "9999"]]
  },
  "9938": {
    "name": "Tunisia",
    "ranges": [["00", "79"], ["800", "949"], ["9500", "9999"]]
  },
  "9939": {
    "name": "Armenia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "899"], ["9000", "9999"]]
  },
  "9940": {
    "name": "Montenegro",
    "ranges": [["0", "1"], ["20", "49"], ["500", "899"], ["9000", "9999"]]
  },
  "9941": {
    "name": "Georgia",
    "ranges": [["0", "0"], ["10", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9942": {
    "name": "Ecuador",
    "ranges": [["00", "84"], ["8500", "8999"], ["900", "984"], ["9850", "9999"]]
  },
  "9943": {
    "name": "Uzbekistan",
    "ranges": [["00", "29"], ["300", "399"], ["4000", "9999"]]
  },
  "9944": {
    "name": "Turkey",
    "ranges": [["0000", "0999"], ["100", "499"], ["5000", "5999"], ["60", "69"], ["700", "799"], ["80", "89"], ["900", "999"]]
  },
  "9945": {
    "name": "Dominican Republic",
    "ranges": [["00", "00"], ["010", "079"], ["08", "39"], ["400", "569"], ["57", "57"], ["580", "849"], ["8500", "9999"]]
  },
  "9946": {
    "name": "Korea, P.D.R.",
    "ranges": [["0", "1"], ["20", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9947": {
    "name": "Algeria",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "9948": {
    "name": "United Arab Emirates",
    "ranges": [["00", "39"], ["400", "849"], ["8500", "9999"]]
  },
  "9949": {
    "name": "Estonia",
    "ranges": [["0", "0"], ["10", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9950": {
    "name": "Palestine",
    "ranges": [["00", "29"], ["300", "849"], ["8500", "9999"]]
  },
  "9951": {
    "name": "Kosova",
    "ranges": [["00", "39"], ["400", "849"], ["8500", "9999"]]
  },
  "9952": {
    "name": "Azerbaijan",
    "ranges": [["0", "1"], ["20", "39"], ["400", "799"], ["8000", "9999"]]
  },
  "9953": {
    "name": "Lebanon",
    "ranges": [["0", "0"], ["10", "39"], ["400", "599"], ["60", "89"], ["9000", "9999"]]
  },
  "9954": {
    "name": "Morocco",
    "ranges": [["0", "1"], ["20", "39"], ["400", "799"], ["8000", "9999"]]
  },
  "9955": {
    "name": "Lithuania",
    "ranges": [["00", "39"], ["400", "929"], ["9300", "9999"]]
  },
  "9956": {
    "name": "Cameroon",
    "ranges": [["0", "0"], ["10", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9957": {
    "name": "Jordan",
    "ranges": [["00", "39"], ["400", "699"], ["70", "84"], ["8500", "8799"], ["88", "99"]]
  },
  "9958": {
    "name": "Bosnia and Herzegovina",
    "ranges": [["00", "02"], ["0300", "0399"], ["040", "089"], ["0900", "0999"], ["10", "18"], ["1900", "1999"], ["20", "49"], ["500", "899"], ["9000", "9999"]]
  },
  "9959": {
    "name": "Libya",
    "ranges": [["0", "1"], ["20", "79"], ["800", "949"], ["9500", "9699"], ["970", "979"], ["98", "99"]]
  },
  "9960": {
    "name": "Saudi Arabia",
    "ranges": [["00", "59"], ["600", "899"], ["9000", "9999"]]
  },
  "9961": {
    "name": "Algeria",
    "ranges": [["0", "2"], ["30", "69"], ["700", "949"], ["9500", "9999"]]
  },
  "9962": {
    "name": "Panama",
    "ranges": [["00", "54"], ["5500", "5599"], ["56", "59"], ["600", "849"], ["8500", "9999"]]
  },
  "9963": {
    "name": "Cyprus",
    "ranges": [["0", "1"], ["2000", "2499"], ["250", "279"], ["2800", "2999"], ["30", "54"], ["550", "734"], ["7350", "7499"], ["7500", "9999"]]
  },
  "9964": {
    "name": "Ghana",
    "ranges": [["0", "6"], ["70", "94"], ["950", "999"]]
  },
  "9965": {
    "name": "Kazakhstan",
    "ranges": [["00", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9966": {
    "name": "Kenya",
    "ranges": [["000", "149"], ["1500", "1999"], ["20", "69"], ["7000", "7499"], ["750", "959"], ["9600", "9999"]]
  },
  "9967": {
    "name": "Kyrgyz Republic",
    "ranges": [["00", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9968": {
    "name": "Costa Rica",
    "ranges": [["00", "49"], ["500", "939"], ["9400", "9999"]]
  },
  "9970": {
    "name": "Uganda",
    "ranges": [["00", "39"], ["400", "899"], ["9000", "9999"]]
  },
  "9971": {
    "name": "Singapore",
    "ranges": [["0", "5"], ["60", "89"], ["900", "989"], ["9900", "9999"]]
  },
  "9972": {
    "name": "Peru",
    "ranges": [["00", "09"], ["1", "1"], ["200", "249"], ["2500", "2999"], ["30", "59"], ["600", "899"], ["9000", "9999"]]
  },
  "9973": {
    "name": "Tunisia",
    "ranges": [["00", "05"], ["060", "089"], ["0900", "0999"], ["10", "69"], ["700", "969"], ["9700", "9999"]]
  },
  "9974": {
    "name": "Uruguay",
    "ranges": [["0", "2"], ["30", "54"], ["550", "749"], ["7500", "9499"], ["95", "99"]]
  },
  "9975": {
    "name": "Moldova",
    "ranges": [["0", "0"], ["100", "399"], ["4000", "4499"], ["45", "89"], ["900", "949"], ["9500", "9999"]]
  },
  "9976": {
    "name": "Tanzania",
    "ranges": [["0", "5"], ["60", "89"], ["900", "989"], ["9900", "9999"]]
  },
  "9977": {
    "name": "Costa Rica",
    "ranges": [["00", "89"], ["900", "989"], ["9900", "9999"]]
  },
  "9978": {
    "name": "Ecuador",
    "ranges": [["00", "29"], ["300", "399"], ["40", "94"], ["950", "989"], ["9900", "9999"]]
  },
  "9979": {
    "name": "Iceland",
    "ranges": [["0", "4"], ["50", "64"], ["650", "659"], ["66", "75"], ["760", "899"], ["9000", "9999"]]
  },
  "9980": {
    "name": "Papua New Guinea",
    "ranges": [["0", "3"], ["40", "89"], ["900", "989"], ["9900", "9999"]]
  },
  "9981": {
    "name": "Morocco",
    "ranges": [["00", "09"], ["100", "159"], ["1600", "1999"], ["20", "79"], ["800", "949"], ["9500", "9999"]]
  },
  "9982": {
    "name": "Zambia",
    "ranges": [["00", "79"], ["800", "989"], ["9900", "9999"]]
  },
  "9983": {
    "name": "Gambia",
    "ranges": [["80", "94"], ["950", "989"], ["9900", "9999"]]
  },
  "9984": {
    "name": "Latvia",
    "ranges": [["00", "49"], ["500", "899"], ["9000", "9999"]]
  },
  "9985": {
    "name": "Estonia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "899"], ["9000", "9999"]]
  },
  "9986": {
    "name": "Lithuania",
    "ranges": [["00", "39"], ["400", "899"], ["9000", "9399"], ["940", "969"], ["97", "99"]]
  },
  "9987": {
    "name": "Tanzania",
    "ranges": [["00", "39"], ["400", "879"], ["8800", "9999"]]
  },
  "9988": {
    "name": "Ghana",
    "ranges": [["0", "2"], ["30", "54"], ["550", "749"], ["7500", "9999"]]
  },
  "9989": {
    "name": "Macedonia",
    "ranges": [["0", "0"], ["100", "199"], ["2000", "2999"], ["30", "59"], ["600", "949"], ["9500", "9999"]]
  },
  "99901": {
    "name": "Bahrain",
    "ranges": [["00", "49"], ["500", "799"], ["80", "99"]]
  },
  "99902": {
    "name": "Gabon (reserved)",
    "ranges": []
  },
  "99903": {
    "name": "Mauritius",
    "ranges": [["0", "1"], ["20", "89"], ["900", "999"]]
  },
  "99904": {
    "name": "Curaçao",
    "ranges": [["0", "5"], ["60", "89"], ["900", "999"]]
  },
  "99905": {
    "name": "Bolivia",
    "ranges": [["0", "3"], ["40", "79"], ["800", "999"]]
  },
  "99906": {
    "name": "Kuwait",
    "ranges": [["0", "2"], ["30", "59"], ["600", "699"], ["70", "89"], ["90", "94"], ["950", "999"]]
  },
  "99908": {
    "name": "Malawi",
    "ranges": [["0", "0"], ["10", "89"], ["900", "999"]]
  },
  "99909": {
    "name": "Malta",
    "ranges": [["0", "3"], ["40", "94"], ["950", "999"]]
  },
  "99910": {
    "name": "Sierra Leone",
    "ranges": [["0", "2"], ["30", "89"], ["900", "999"]]
  },
  "99911": {
    "name": "Lesotho",
    "ranges": [["00", "59"], ["600", "999"]]
  },
  "99912": {
    "name": "Botswana",
    "ranges": [["0", "3"], ["400", "599"], ["60", "89"], ["900", "999"]]
  },
  "99913": {
    "name": "Andorra",
    "ranges": [["0", "2"], ["30", "35"], ["600", "604"]]
  },
  "99914": {
    "name": "Suriname",
    "ranges": [["0", "4"], ["50", "89"], ["900", "999"]]
  },
  "99915": {
    "name": "Maldives",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99916": {
    "name": "Namibia",
    "ranges": [["0", "2"], ["30", "69"], ["700", "999"]]
  },
  "99917": {
    "name": "Brunei Darussalam",
    "ranges": [["0", "2"], ["30", "89"], ["900", "999"]]
  },
  "99918": {
    "name": "Faroe Islands",
    "ranges": [["0", "3"], ["40", "79"], ["800", "999"]]
  },
  "99919": {
    "name": "Benin",
    "ranges": [["0", "2"], ["300", "399"], ["40", "69"], ["70", "79"], ["800", "849"], ["850", "899"], ["900", "999"]]
  },
  "99920": {
    "name": "Andorra",
    "ranges": [["0", "4"], ["50", "89"], ["900", "999"]]
  },
  "99921": {
    "name": "Qatar",
    "ranges": [["0", "1"], ["20", "69"], ["700", "799"], ["8", "8"], ["90", "99"]]
  },
  "99922": {
    "name": "Guatemala",
    "ranges": [["0", "3"], ["40", "69"], ["700", "999"]]
  },
  "99923": {
    "name": "El Salvador",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "99924": {
    "name": "Nicaragua",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "99925": {
    "name": "Paraguay",
    "ranges": [["0", "3"], ["40", "79"], ["800", "999"]]
  },
  "99926": {
    "name": "Honduras",
    "ranges": [["0", "0"], ["10", "59"], ["600", "899"], ["90", "99"]]
  },
  "99927": {
    "name": "Albania",
    "ranges": [["0", "2"], ["30", "59"], ["600", "999"]]
  },
  "99928": {
    "name": "Georgia",
    "ranges": [["0", "0"], ["10", "79"], ["800", "999"]]
  },
  "99929": {
    "name": "Mongolia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99930": {
    "name": "Armenia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99931": {
    "name": "Seychelles",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99932": {
    "name": "Malta",
    "ranges": [["0", "0"], ["10", "59"], ["600", "699"], ["7", "7"], ["80", "99"]]
  },
  "99933": {
    "name": "Nepal",
    "ranges": [["0", "2"], ["30", "59"], ["600", "999"]]
  },
  "99934": {
    "name": "Dominican Republic",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "99935": {
    "name": "Haiti",
    "ranges": [["0", "2"], ["30", "59"], ["600", "699"], ["7", "8"], ["90", "99"]]
  },
  "99936": {
    "name": "Bhutan",
    "ranges": [["0", "0"], ["10", "59"], ["600", "999"]]
  },
  "99937": {
    "name": "Macau",
    "ranges": [["0", "1"], ["20", "59"], ["600", "999"]]
  },
  "99938": {
    "name": "Srpska, Republic of",
    "ranges": [["0", "1"], ["20", "59"], ["600", "899"], ["90", "99"]]
  },
  "99939": {
    "name": "Guatemala",
    "ranges": [["0", "5"], ["60", "89"], ["900", "999"]]
  },
  "99940": {
    "name": "Georgia",
    "ranges": [["0", "0"], ["10", "69"], ["700", "999"]]
  },
  "99941": {
    "name": "Armenia",
    "ranges": [["0", "2"], ["30", "79"], ["800", "999"]]
  },
  "99942": {
    "name": "Sudan",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99943": {
    "name": "Albania",
    "ranges": [["0", "2"], ["30", "59"], ["600", "999"]]
  },
  "99944": {
    "name": "Ethiopia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99945": {
    "name": "Namibia",
    "ranges": [["0", "5"], ["60", "89"], ["900", "999"]]
  },
  "99946": {
    "name": "Nepal",
    "ranges": [["0", "2"], ["30", "59"], ["600", "999"]]
  },
  "99947": {
    "name": "Tajikistan",
    "ranges": [["0", "2"], ["30", "69"], ["700", "999"]]
  },
  "99948": {
    "name": "Eritrea",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99949": {
    "name": "Mauritius",
    "ranges": [["0", "1"], ["20", "89"], ["900", "999"]]
  },
  "99950": {
    "name": "Cambodia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99951": {
    "name": "Congo, The Democratic Republic",
    "ranges": []
  },
  "99952": {
    "name": "Mali",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99953": {
    "name": "Paraguay",
    "ranges": [["0", "2"], ["30", "79"], ["800", "939"], ["94", "99"]]
  },
  "99954": {
    "name": "Bolivia",
    "ranges": [["0", "2"], ["30", "69"], ["700", "879"], ["88", "99"]]
  },
  "99955": {
    "name": "Srpska, Republic of",
    "ranges": [["0", "1"], ["20", "59"], ["600", "799"], ["80", "99"]]
  },
  "99956": {
    "name": "Albania",
    "ranges": [["00", "59"], ["600", "859"], ["86", "99"]]
  },
  "99957": {
    "name": "Malta",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "99958": {
    "name": "Bahrain",
    "ranges": [["0", "4"], ["50", "94"], ["950", "999"]]
  },
  "99959": {
    "name": "Luxembourg",
    "ranges": [["0", "2"], ["30", "59"], ["600", "999"]]
  },
  "99960": {
    "name": "Malawi",
    "ranges": [["0", "0"], ["10", "94"], ["950", "999"]]
  },
  "99961": {
    "name": "El Salvador",
    "ranges": [["0", "3"], ["40", "89"], ["900", "999"]]
  },
  "99962": {
    "name": "Mongolia",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99963": {
    "name": "Cambodia",
    "ranges": [["00", "49"], ["500", "999"]]
  },
  "99964": {
    "name": "Nicaragua",
    "ranges": [["0", "1"], ["20", "79"], ["800", "999"]]
  },
  "99965": {
    "name": "Macau",
    "ranges": [["0", "3"], ["40", "69"], ["700", "999"]]
  },
  "99966": {
    "name": "Kuwait",
    "ranges": [["0", "2"], ["30", "69"], ["700", "799"]]
  },
  "99967": {
    "name": "Paraguay",
    "ranges": [["0", "1"], ["20", "59"], ["600", "899"]]
  },
  "99968": {
    "name": "Botswana",
    "ranges": [["0", "3"], ["400", "599"], ["60", "89"], ["900", "999"]]
  },
  "99969": {
    "name": "Oman",
    "ranges": [["0", "4"], ["50", "79"], ["800", "999"]]
  },
  "99970": {
    "name": "Haiti",
    "ranges": [["0", "4"], ["50", "89"], ["900", "999"]]
  },
  "99971": {
    "name": "Myanmar",
    "ranges": [["0", "5"], ["60", "84"], ["850", "999"]]
  },
  "99972": {
    "name": "Faroe Islands",
    "ranges": [["0", "4"], ["50", "89"], ["900", "999"]]
  },
  "99973": {
    "name": "Mongolia",
    "ranges": [["0", "3"], ["40", "79"], ["800", "999"]]
  },
  "99974": {
    "name": "Bolivia",
    "ranges": [["40", "79"], ["800", "999"]]
  },
  "99975": {
    "name": "Tajikistan",
    "ranges": [["0", "3"], ["40", "79"], ["800", "999"]]
  },
  "99976": {
    "name": "Srpska, Republic of",
    "ranges": [["0", "1"], ["20", "59"], ["600", "799"]]
  }
},

  isbn: function () {
    this.initialize.apply(this, arguments);
  },

  parse: function(val, groups) {
    var me = new ISBN.isbn(val, groups ? groups : ISBN.GROUPS);
    //alert("me.isValid: " + String(me.isValid()) );
    return me.isValid() ? me : null;
  },

  hyphenate: function(val) {
    var me = ISBN.parse(val);
    if(me.isIsbn13()) {
      return me.asIsbn13(true)
    } else if(me.isIsbn10()) {
      return me.asIsbn10(true)
    } else {
      return val;
    }
  },

  asIsbn13: function(val, hyphen) {
    var me = ISBN.parse(val);
    if(hyphen) {
      return me.asIsbn13(hyphen);
    } else {
      return me.asIsbn13();
    }
  },

  asIsbn10: function(val, hyphen) {
    var me = ISBN.parse(val);
    if(hyphen) {
      return me.asIsbn10(hyphen);
    } else {
      return me.asIsbn10();
    }
  }
};

ISBN.isbn.prototype = {
  isValid: function() {
    
    //alert("this.codes: " + String(this.codes) );
    //alert("this.codes.isValid: " + String(this.codes.isValid) );

    return this.codes && this.codes.isValid;
  },

  isIsbn13: function() {
    return this.isValid() && this.codes.isIsbn13;
  },

  isIsbn10: function() {
    return this.isValid() && this.codes.isIsbn10;
  },

  asIsbn10: function(hyphen) {
    if(!this.isValid()) return null;
    if(hyphen){
      return this.codes.isbn10h;
    } else {
      return this.codes.isbn10;
    }
  },

  asIsbn13: function(hyphen) {
    if(!this.isValid()) return null;
    if(hyphen){
      return this.codes.isbn13h;
    } else {
      return this.codes.isbn13;
    }
  },

  initialize: function(val, groups) {
    this.groups = groups;
    this.codes = this.parse(val);
  },

  merge: function(lobj, robj) {
    var key;
    if (!lobj || !robj) {
      alert("ISBN: Merge returned null");
      return null;
    }
    for (key in robj) {
      if (robj.hasOwnProperty(key)) {
        lobj[key] = robj[key];
      }
    }
    return lobj;
  },

  parse: function(val) {
    var ret;

    // coerce ISBN to string
    val += '';

    // correct for misplaced hyphens
    // val = val.replace(/ -/,'');

    if( val.match(/^\d{9}[\dX]$/) ) {
      
      ret = this.fill( this.merge({source: val, isValid: true, isIsbn10: true, isIsbn13: false}, this.split(val)) );

    } else if ( val.length === 13 && val.match(/^(\d+)-(\d+)-(\d+)-([\dX])$/) ) {
      
      ret = this.fill({ source: val, isValid: true, isIsbn10: true, isIsbn13: false, group: RegExp.$1, publisher: RegExp.$2, article: RegExp.$3, check: RegExp.$4});
    
    } else if ( val.match(/^(978|979)(\d{9}[\dX]$)/) ) {

      ret = this.fill( this.merge({source: val, isValid: true, isIsbn10: false, isIsbn13: true, prefix: RegExp.$1}, this.split(RegExp.$2)));
    
    } else if ( val.length === 17 && val.match(/^(978|979)-(\d+)-(\d+)-(\d+)-([\dX])$/) ) {

      ret = this.fill({ source: val, isValid: true, isIsbn10: false, isIsbn13: true, prefix: RegExp.$1, group: RegExp.$2, publisher: RegExp.$3, article: RegExp.$4, check: RegExp.$5});
    
    }

    if (!ret) {
      return {source: val, isValid: false};
    }

    return this.merge(ret, {isValid: ret.check === (ret.isIsbn13 ? ret.check13 : ret.check10)});
  },

  split: function(isbn) {
    return (
      !isbn ?
        null :
      isbn.length === 13 ?
        this.merge(this.split(isbn.substr(3)), {prefix: isbn.substr(0, 3)}) :
      isbn.length === 10 ?
        this.splitToObject(isbn) :
        null);
  },

  splitToArray: function(isbn10) {
    var rec, key, rest, i, m;
    rec = this.getGroupRecord(isbn10);
    if (!rec) {
      return null;
    }

    for (key, i = 0, m = rec.record.ranges.length; i < m; i += 1) {
      key = rec.rest.substr(0, rec.record.ranges[i][0].length);
      if (rec.record.ranges[i][0] <= key && rec.record.ranges[i][1] >= key) {
        rest = rec.rest.substr(key.length);
        return [rec.group, key, rest.substr(0, rest.length - 1), rest.charAt(rest.length - 1)];
      }
    }
    return null;
  },

  splitToObject: function(isbn10) {
    var a = this.splitToArray(isbn10);
    if (!a || a.length !== 4) {
      return null;
    }
    return {group: a[0], publisher: a[1], article: a[2], check: a[3]};
  },

  fill: function(codes) {
    var rec, prefix, ck10, ck13, parts13, parts10;

    if (!codes) {
      return null;
    }

    rec = this.groups[codes.group];
    if (!rec) {
      return null;
    }

    prefix = codes.prefix ? codes.prefix : '978';
    ck10 = this.calcCheckDigit([
      codes.group, codes.publisher, codes.article].join(''));
    if (!ck10) {
      return null;
    }

    ck13 = this.calcCheckDigit([prefix, codes.group, codes.publisher, codes.article].join(''));
    if (!ck13) {
      return null;
    }

    parts13 = [prefix, codes.group, codes.publisher, codes.article, ck13];
    this.merge(codes, {
      isbn13: parts13.join(''),
      isbn13h: parts13.join('-'),
      check10: ck10,
      check13: ck13,
      groupname: rec.name
    });

    if (prefix === '978') {
      parts10 = [codes.group, codes.publisher, codes.article, ck10];
      this.merge(codes, {isbn10: parts10.join(''), isbn10h: parts10.join('-')});
    }

    return codes;
  },

  getGroupRecord: function(isbn10) {
    var key;
    for (key in this.groups) {
      if (isbn10.match('^' + key + '(.+)')) {
        return {group: key, record: this.groups[key], rest: RegExp.$1};
      }
    }
    return null;
  },

  calcCheckDigit: function(isbn) {
    var c, n;
    if (isbn.match(/^\d{9}[\dX]?$/)) {
      c = 0;
      for (n = 0; n < 9; n += 1) {
        c += (10 - n) * isbn.charAt(n);
      }
      c = (11 - c % 11) % 11;
      return c === 10 ? 'X' : String(c);

    } else if (isbn.match(/(?:978|979)\d{9}[\dX]?/)) {
      c = 0;
      for (n = 0; n < 12; n += 2) {
        c += Number(isbn.charAt(n)) + 3 * isbn.charAt(n + 1);
      }
      return String((10 - c % 10) % 10);
    }

    return null;
  }
};



/*

    JAXON is an array based preset manager for extendscript
    It loads and saves presets to the user data-folder in JSON format
    
    It assumes your presets are objects collected in an array
    
    NOTE: At the moment this manager does not validate anything

    Bruno Herfst 2016

    Version 0.1
    
    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

*/

var jaxon = function(filePath, standardPresets, templatePreset, presetLockChar){

    // ref to self
    var self = this;

    self._clone = function( something ) {
        //clones whatever it is given via JSON conversion
        return self.JSON.parse(self.JSON.stringify( something ));
    }

    self._not_in_array = function(arr, element) {
        for(var i=0; i<arr.length; i++) {
            if (arr[i] == element) return false;
        }
        return true;
    }

    self._fileExist = function(filePath) {
        var f = File(filePath);
        if(f.exists){
            return true;
        } else {
            return false;
        }
    }

    self._writeFile = function(filePath, contentString) {
        var f = File(filePath);
        try{
            if( !f.open('w') ){
                alert("Error opening file at " + filePath +" \n "+ f.error);
            }
            if( !f.write( String(contentString) ) ){
                alert("Error writing to file at " + filePath +" \n "+ f.error);
            }
            if( !f.close() ){
                alert("Error closing file at " + filePath +" \n "+ f.error);
            }
            return f;
        } catch (t) {
            alert("Error writing to file at " + filePath +" \n "+ t.error);
        }
        
        f.close();
        return false;
    }

    self._updatePreset = function(OldPreset, NewPreset, ignoreKeys){
        // This function will try and copy the old presets
        for (var key in NewPreset) {
            if(OldPreset.hasOwnProperty(key)){
                if ( self._not_in_array(ignoreKeys, key) ){
                    NewPreset[key] = OldPreset[key];
                }
            }
        }
        return NewPreset;
    }

    self._savePresets = function(filePath, obj){
        var objStr   = self.JSON.stringify(obj);
        if( self._writeFile(filePath, objStr) ) {
            return true;
        } else {
            alert("Could not write to file " + filePath);
            return false;
        }
    }

    self._loadPresets = function(filePath){

        if(!self._fileExist(filePath)){
            alert("Cannot load presets.\nFile does not exist.");
            return false;
        }

        var fSettings = File(filePath);
        fSettings.open('r');
        var content = fSettings.read();
        fSettings.close();

        try {
            var presets = self.JSON.parse(content);
        } catch(e) {
            alert("Error reading JSON\n" + e.description);
            var presets = self.presets;
        }

        self.presets = presets;
        return self.presets;
    }
    
    //  standardPresets, templatePreset,

    // ref to JSON
    self.JSON     = JSON;
    // standard file path
    self.filePath = filePath;
    // standard file
    self.file     = File(self.filePath);
    // current preset (The presets we manipulate)
    self.presets  = self._clone(standardPresets);
    // A template preset (For validation and return)
    self.template = self._clone(templatePreset);
    // preset locking character
    // any preset starting with this character cannot be changed by the user
    // users cannot start a preset with this character
    self.lockChar = presetLockChar || '-';


    //-------------------------------------------------
    // S T A R T   P U B L I C   A P I
    //-------------------------------------------------
    
    self.getPresets = function(){
        // return a copy of all presets
        return self._clone(self.presets);
    }

    self.getPreset = function(key, val) {
        // Sample usage: Jaxon.getPreset('id',3);
        for (var i = 0; i < self.presets.length; i++) {
            for (var thisKey in self.presets[i]) {
                if (thisKey == key) {
                    if(self.presets[i][key] == val) {
                        return self.presets[i];
                    }
                    continue;
                }
            }
        }

        return null;
    }
    
    self.addPreset = function(obj) {
        // Add optional before/after key?
        self.presets.push(obj);
        if( self._savePresets(self.filePath, self.presets) ) {
            return true;
        } else {
            alert("Could not save presets to " + self.filePath);
            return false;
        }
    }

    self.addUniquePreset = function(obj, key, val) {
        // Sample usage: Jaxon.addUniquePreset(obj, 'name', "My New Preset");
        var exist = self.getPreset(key, val);
        if(exist){
            var a = confirm("Do you want to overwrite the existing preset?");
            if (a == true) {
                self.removePresets(key, val);
            } else {
                return false;
            }
        }
        return self.addPreset(obj);
    }
    
    self.updatePreset = function(obj, ignoreKeys) {
        var ignoreKeys = ignoreKeys || [];
        if(! ignoreKeys instanceof Array) {
            throw "The function updatePreset expects ignoreKeys be type of array."
        }
        // Create a copy of the standard preset
        var newPreset  = self._clone(self.template);
        return self._updatePreset(obj, newPreset, ignoreKeys);
    }
    
    self.removePresets = function(key, val) {
        // Sample usage: Jaxon.removePresets('id',3);
        var removedPresets = false;
        var len = self.presets.length-1;
        for (var i = len; i >= 0; i--) {
            for (var thisKey in self.presets[i]) {
                if (thisKey == key) {
                    if(self.presets[i][key] == val) {
                        self.presets.splice( i, 1 );
                        removedPresets = true;
                    }
                    continue;
                }
            }
        }
        if(removedPresets){
            if( self._savePresets(self.filePath, self.presets) ) {
                return true;
            } else {
                alert("Could not save presets to " + self.filePath);
            }
        }
        return false;
    }
    
    self.presetString = function( obj ) {
        return self.JSON.stringify(obj);
    }
    
    //-------------------------------------------------
    // E N D   P U B L I C   A P I
    //-------------------------------------------------
    
    // I N I T
    //---------    
    // Save the presets if not exist
    if(!self._fileExist( self.filePath ) ){
        if(! self._savePresets( self.filePath, self.presets ) ){
            alert("Failed to start Jaxon\nUnable to save presets to " + self.filePath);
            return null;
        }
    }
    // Load the presets
    self._loadPresets(self.filePath);
};

//----------------------------------------------------------------------------------








//----------------------------------------------------------------------------------
//
// Start JSON
//
//----------------------------------------------------------------------------------
//  json2.js
//  2016-10-28
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://github.com/douglascrockford/JSON-js/blob/master/json2.js

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                        f(this.getUTCMonth() + 1) + "-" +
                        f(this.getUTCDate()) + "T" +
                        f(this.getUTCHours()) + ":" +
                        f(this.getUTCMinutes()) + ":" +
                        f(this.getUTCSeconds()) + "Z"
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === "object" &&
                typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" &&
                    (typeof replacer !== "object" ||
                    typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return "\\u" +
                            ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());

// EOF



// More info here: http://www.barcodeisland.com/ean13.phtml

$.localize = true; // enable ExtendScript localisation engine

var version = '0.1';

var platform = File.fs;
if(platform == 'Windows'){
    var trailSlash = "\\";
} else if(platform == "Macintosh") {
    var trailSlash = "/";
} else {
    var trailSlash = undefined;
    throw( "Unsupported platform: "  + platform );
}

function newPreset(){
  return { name              : "[ New Preset ]",
           version           : version,
           doc               : undefined,
           pageIndex         : -1,
           ean               : "",
           addon             : "",
           codeFont          : "OCR B Std\tRegular",
           readFont          : "OCR B Std\tRegular", // Setting tracking to -100 is nice for this font
           readFontTracking  : 0,
           whiteBox          : true,
           humanReadable     : true,
           alignTo           : "Page Margins",
           selectionBounds   : [0,0,0,0],
           refPoint          : "BOTTOM_RIGHT_ANCHOR",
           offset            : { x : 0, y : 0 },
           humanReadableStr  : "",
           createOulines     : true,
           heightPercent     : 100 };
}

var stdSettings = [newPreset(),
                   { name              : "[ Last Used ]",  // My personal preference :)
                     version           : version,
                     doc               : undefined,
                     pageIndex         : -1,
                     ean               : "",
                     addon             : "",
                     readFont          : "OCR B Std\tRegular", // Setting tracking to -100 is nice for this font
                     codeFont          : "OCR B Std\tRegular",
                     readFontTracking  : 0,
                     whiteBox          : true,
                     humanReadable     : true,
                     alignTo           : "Page",
                     selectionBounds   : [0,0,0,0],
                     refPoint          : "CENTER_ANCHOR",
                     offset            : { x : 0, y : 0 },
                     humanReadableStr  : "",
                     createOulines     : true,
                     heightPercent     : 60 }];

var presetsFilePath = Folder.userData + trailSlash + "EAN13_barcode_Settings.json";

// Start preset manager
var Jaxon = new jaxon(presetsFilePath, stdSettings, stdSettings[0], '[');

function getBarcodePreset(barcodeGroup){
  var tempData = barcodeGroup.rectangles[0].label
  if(tempData.length > 0){
    var bData = Jaxon.JSON.parse(tempData);
    if( typeof bData == 'object' && bData.hasOwnProperty('ean') ) {
      return Jaxon.updatePreset(bData,['name']);
    }
  }
  return false;
}

function getStandardSettings(){
  // Load presets
  var presets = Jaxon.getPresets();
  if (app.documents.length <= 0) return presets;
  // else add active document setting to presets

  var aDoc = app.activeDocument;

  if (aDoc.isValid) {
    var existingBarcodes = getItemsByLabel(aDoc, "Barcode_Settings");
    if(existingBarcodes.length > 0) {
      for (i = 0; i < existingBarcodes.length; i++) { 
        var eBarcodePreset = getBarcodePreset(existingBarcodes[i]);
        if(eBarcodePreset) {
           eBarcodePreset.doc  = aDoc;
           eBarcodePreset.name = "[ "+ eBarcodePreset.ean +" ]";
           presets.unshift(eBarcodePreset);
        }
      }
    } else {
      // Only go through this routine if there are no barcode boxes found
      var aDocPreset      = newPreset();
          aDocPreset.doc  = aDoc;
          aDocPreset.name = "[ Active Document ]";
      // Check if there is an entry for EAN
      var tempData = aDoc.extractLabel('EAN');
      if( tempData.length > 0 ){
        aDocPreset.ean  = tempData;
      }
      
      presets.unshift(aDocPreset);
    }
  }
  return presets;
}

function getBoundsInfo(bounds){
      // This functions receives bounds (y1, x1, y2, x2)
      // and returns an object with bounds and info as below
      var topLeftY  = bounds[0];
      var topLeftX  = bounds[1];
      var botRightY = bounds[2];
      var botRightX = bounds[3];
      var height    = Math.abs(botRightY - topLeftY);
      var width     = Math.abs(botRightX - topLeftX);

      return {    bounds    : bounds,
                  height    : height,
                  width     : width,
                  topLeft   : {x: topLeftX                , y: topLeftY               } , 
                  topCenter : {x: topLeftX + (width/2)    , y: topLeftY               } , 
                  topRight  : {x: botRightX               , y: topLeftY               } ,
                  midLeft   : {x: topLeftX                , y: topLeftY  + (height/2) } , 
                  midCenter : {x: topLeftX + (width/2)    , y: topLeftY  + (height/2) } , 
                  midRight  : {x: botRightX               , y: topLeftY  + (height/2) } , 
                  botLeft   : {x: topLeftX                , y: botRightY              } , 
                  botCenter : {x: topLeftX + (width/2)    , y: botRightY              } ,
                  botRight  : {x: botRightX               , y: botRightY              } };
}

function setRuler(doc, myNewUnits){
        
    // This function sets the rulers to the disired measure units
    // and returns the original preset that you can send back to
    // this function to reset the rulers.

    var myOldUnits = {xruler : doc.viewPreferences.horizontalMeasurementUnits, yruler: doc.viewPreferences.verticalMeasurementUnits, origin: doc.viewPreferences.rulerOrigin, zeroPoint: doc.zeroPoint };
    
    if (myNewUnits.hasOwnProperty('xruler') && myNewUnits.hasOwnProperty('yruler')){
        doc.viewPreferences.horizontalMeasurementUnits = myNewUnits.xruler;
        doc.viewPreferences.verticalMeasurementUnits   = myNewUnits.yruler;
    } else if( myNewUnits.hasOwnProperty('units')) {
        // Set both rulers to the sam unit
        // We will cast everything to string so it can parse a wide variaty of input including the MeasurementUnits object
        var stringUnits = String(myNewUnits.units).toLowerCase();
        with(doc.viewPreferences){
            switch(stringUnits) {
                case "0":
                case "millimeters":
                case "mm":
                case "millimeter":
                case "zmms":
                case "2053991795":
                    horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
                    verticalMeasurementUnits   = MeasurementUnits.MILLIMETERS;
                    break;
                case "1":
                case "inchesDecimal":
                case "inch": // shorthand to decimal
                case "zind":
                case "2053729892":
                    horizontalMeasurementUnits = MeasurementUnits.INCHES_DECIMAL;
                    verticalMeasurementUnits   = MeasurementUnits.INCHES_DECIMAL;
                    break;
                case "inches":
                case "zinc":
                case "2053729891":
                    horizontalMeasurementUnits = MeasurementUnits.MeasurementUnits.INCHES;
                    verticalMeasurementUnits   = MeasurementUnits.MeasurementUnits.INCHES;
                    break;
                case "2":
                case "points":
                case "pt":
                case "zpoi":
                case "2054188905":
                    horizontalMeasurementUnits = MeasurementUnits.POINTS;
                    verticalMeasurementUnits   = MeasurementUnits.POINTS;
                    break;
                case "american_points":
                case "apt":
                case "zapt":
                case "1514238068":
                    horizontalMeasurementUnits = MeasurementUnits.AMERICAN_POINTS;
                    verticalMeasurementUnits   = MeasurementUnits.AMERICAN_POINTS;
                    break;
                case "agates":
                case "zagt":
                case "2051106676":
                    horizontalMeasurementUnits = MeasurementUnits.AGATES;
                    verticalMeasurementUnits   = MeasurementUnits.AGATES;
                    break;
                case "bai":
                case "zbai":
                case "2051170665":
                    horizontalMeasurementUnits = MeasurementUnits.BAI;
                    verticalMeasurementUnits   = MeasurementUnits.BAI;
                    break;
                case "cm":
                case "centimeter":
                case "centimeters":
                case "zcms":
                case "2053336435":
                    horizontalMeasurementUnits = MeasurementUnits.CENTIMETERS;
                    verticalMeasurementUnits   = MeasurementUnits.CENTIMETERS;
                    break;
                case "ciceros":
                case "c":
                case "zcic":
                case "2053335395":
                    horizontalMeasurementUnits = MeasurementUnits.CICEROS;
                    verticalMeasurementUnits   = MeasurementUnits.CICEROS;
                    break;
                case "custom":
                case "cstm":
                case "1131639917":
                    horizontalMeasurementUnits = MeasurementUnits.CUSTOM;
                    verticalMeasurementUnits   = MeasurementUnits.CUSTOM;
                    break;
                case "ha":
                case "zha":
                case "1516790048":
                    horizontalMeasurementUnits = MeasurementUnits.HA;
                    verticalMeasurementUnits   = MeasurementUnits.HA;
                    break;
                case "mils":
                case "zmil":
                case "2051893612":
                    horizontalMeasurementUnits = MeasurementUnits.MILS;
                    verticalMeasurementUnits   = MeasurementUnits.MILS;
                    break;
                case "picas":
                case "p":
                case "zpic":
                case "2054187363":
                    horizontalMeasurementUnits = MeasurementUnits.PICAS;
                    verticalMeasurementUnits   = MeasurementUnits.PICAS;
                    break;
                case "pixels":
                case "pixel":
                case "px":
                case "zpix":
                case "2054187384":
                    horizontalMeasurementUnits = MeasurementUnits.PIXELS;
                    verticalMeasurementUnits   = MeasurementUnits.PIXELS;
                    break;
                case "q":
                case "zque":
                case "2054255973":
                    horizontalMeasurementUnits = MeasurementUnits.Q;
                    verticalMeasurementUnits   = MeasurementUnits.Q;
                    break;
                case "u":
                case "zju":
                case "2051691808":
                    horizontalMeasurementUnits = MeasurementUnits.U;
                    verticalMeasurementUnits   = MeasurementUnits.U;
                    break;
                default:
                    alert("function setRuler:\nCould not parse MeasurementUnits: " + typeof(myNewUnits) + " " + myNewUnits );
                    break;
            }
        }
    }
    
    if(myNewUnits.hasOwnProperty('origin')){
        doc.viewPreferences.rulerOrigin = myNewUnits.origin;
    } else { // Use page origin if not defined
        doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
    }
    if(myNewUnits.hasOwnProperty('zeroPoint')) {
        doc.zeroPoint = myNewUnits.zeroPoint;
    } else { // Use zero point if not defined
        doc.zeroPoint = [0,0];
    }
    return myOldUnits;
}

function find(haystack, needle) {
    for (var i = 0; i < haystack.length; i++) {
        if(haystack[i] == needle) return i;
    }
    return 0; // Return the first element if nothing is found
}

function getItemsByLabel(DocPageSpread, myLabel){
    // This funcion returns an array of all items found with given label
    // If nothing is found this function returns an empty array
    var allItems = new Array();
    if(DocPageSpread.isValid){
        var myElements = DocPageSpread.allPageItems;
        var len = myElements.length;
        for (var i = len-1; i >= 0; i--){
            if(myElements[i].label == myLabel){
                allItems.push(myElements[i]);
            }
        }
        // Guides are not part of pageItems but they can have labels too!
        var myGuides   = DocPageSpread.guides;
        var len = myGuides.length;
        for (var i = len-1; i >= 0; i--){
            if(myGuides[i].label == myLabel){
                allItems.push(myGuides[i]);
            }
        }
    } else {
        alert("ERROR 759403253473: Expected a valid doc, page or spread.");
    }     
    return allItems;
}

function calcOffset(itemBounds, page, preset){

  var ib = getBoundsInfo(itemBounds);
  var pb = getBoundsInfo(page.bounds);

  if(preset.alignTo == "barcode_box"){
    preset.selectionBounds = preset.barcode_box.visibleBounds;
    // Now lets add it to the offsets
    preset.offset.x += preset.selectionBounds[1];
    preset.offset.y += preset.selectionBounds[0];
    pb = getBoundsInfo(preset.selectionBounds);
  } else if(preset.alignTo == "Selection"){
    for(var i=1;i<app.selection.length;i++){
      switch (app.selection[i].constructor.name){
        case "Rectangle":
        case "TextFrame":
        case "Oval":
        case "Polygon":
        case "GraphicLine":
        case "Group":
        case "PageItem":
          var itemBounds = app.selection[i].visibleBounds; //array [y1, x1, y2, x2], [top, left, bottom, right]
          if(itemBounds[0] < preset.selectionBounds[0]){ preset.selectionBounds[0] = itemBounds[0]; }
          if(itemBounds[1] < preset.selectionBounds[1]){ preset.selectionBounds[1] = itemBounds[1]; }
          if(itemBounds[2] > preset.selectionBounds[2]){ preset.selectionBounds[2] = itemBounds[2]; }
          if(itemBounds[3] > preset.selectionBounds[3]){ preset.selectionBounds[3] = itemBounds[2]; }
          break;
        default:
          break;
      }
    }
    // Now lets add it to the offsets
    preset.offset.x += preset.selectionBounds[1];
    preset.offset.y += preset.selectionBounds[0];
    pb = getBoundsInfo(preset.selectionBounds);
  }

  function addToBounds(b, x, y) {
    b[0] += y; //topLeftY
    b[1] += x; //topLeftX
    b[2] += y; //botRightY
    b[3] += x; //botRightX
    return b;
  }

  // Deal with page
  switch (preset.refPoint) {
      case "TOP_LEFT_ANCHOR":
          //addToBounds(ib, 0, 0);
          break;
      case "TOP_CENTER_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, (pb.width/2)-(ib.width/2), 0);
          break;
      case "TOP_RIGHT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, pb.width-ib.width, 0);
          break;
      case "LEFT_CENTER_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, 0, (pb.height/2)-(ib.height/2) );
          break;
      case "CENTER_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, (pb.width/2)-(ib.width/2), (pb.height/2)-(ib.height/2) );
          break;
      case "RIGHT_CENTER_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, pb.width-ib.width, (pb.height/2)-(ib.height/2));
          break;
      case "BOTTOM_LEFT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, 0, pb.height-ib.height);
          break;
      case "BOTTOM_CENTER_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, (pb.width/2)-(ib.width/2), pb.height-ib.height);
          break;
      case "BOTTOM_RIGHT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, pb.width-ib.width, pb.height-ib.height);
          break;
      default:
          break;
  }
  
  // Deal with margin
  if(preset.alignTo == "Page Margins"){
    var mt = page.marginPreferences.top;
    var mr = page.marginPreferences.right;
    var ml = page.marginPreferences.left;
    var mb = page.marginPreferences.bottom;
    
    // Weight: 0 center, 1 top or left, 2 bottom or right

    var marginInfo = { vertical: {diff : Math.abs(mt-mb), weight : 0}, horizontal: {diff : Math.abs(ml-mr), weight : 0} };
    
    if(mt > mb){
      marginInfo.vertical.weight = 1;
    } else if (mt < mb) {
      marginInfo.vertical.weight = 2;
    }
    if(ml > mr){
      marginInfo.horizontal.weight = 1;
    } else if (ml < mr) {
      marginInfo.horizontal.weight = 2;
    }

    switch (preset.refPoint) {
      case "TOP_LEFT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, ml, mt); // X, Y
          break;
      case "TOP_CENTER_ANCHOR":
          switch(marginInfo.horizontal.weight){
            case 1: // Left
              ib.bounds = addToBounds(ib.bounds, marginInfo.horizontal.diff/2, mt);
              break;
            case 2: // Right
              ib.bounds = addToBounds(ib.bounds, -marginInfo.horizontal.diff/2, mt);
              break;
            default: // LR-CENTER
              ib.bounds = addToBounds(ib.bounds, 0, mt);
              break;
          }
          break;
      case "TOP_RIGHT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, -mr, mt);
          break;
      case "LEFT_CENTER_ANCHOR":
          switch(marginInfo.vertical.weight){
            case 1: // Top
              ib.bounds = addToBounds(ib.bounds, ml, marginInfo.vertical.diff/2);
              break;
            case 2:  // Bottom
              ib.bounds = addToBounds(ib.bounds, ml, -marginInfo.vertical.diff/2);
              break;
            default:
              ib.bounds = addToBounds(ib.bounds, ml, 0);
              break;
          }
          break;

      case "CENTER_ANCHOR":
          switch(marginInfo.horizontal.weight){
            case 1: // Left
              ib.bounds = addToBounds(ib.bounds, marginInfo.horizontal.diff/2, 0);
              break;
            case 2: // Right
              ib.bounds = addToBounds(ib.bounds, -marginInfo.horizontal.diff/2, 0);
              break;
            default: // LR-CENTER
              break;
          }
          switch(marginInfo.vertical.weight){
            case 1: // top
              ib.bounds = addToBounds(ib.bounds, 0, marginInfo.vertical.diff/2);
              break;
            case 2: // bot
              ib.bounds = addToBounds(ib.bounds, 0, -marginInfo.vertical.diff/2);
              break;
            default: // LR-CENTER
              break;
          }
          break;
      case "RIGHT_CENTER_ANCHOR":
          switch(marginInfo.vertical.weight){
            case 1: // Top
              ib.bounds = addToBounds(ib.bounds, -mr, marginInfo.vertical.diff/2);
              break;
            case 2:  // Bottom
              ib.bounds = addToBounds(ib.bounds, -mr, -marginInfo.vertical.diff/2);
              break;
            default:
              ib.bounds = addToBounds(ib.bounds, -mr, 0);
              break;
          }
          break;
      case "BOTTOM_LEFT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, ml, -mb);
          break;
      case "BOTTOM_CENTER_ANCHOR":
          switch(marginInfo.horizontal.weight){
            case 1: // Left
              ib.bounds = addToBounds(ib.bounds, marginInfo.horizontal.diff/2, -mb);
              break;
            case 2: // Right
              ib.bounds = addToBounds(ib.bounds, -marginInfo.horizontal.diff/2, -mb);
              break;
            default: // LR-CENTER
              ib.bounds = addToBounds(ib.bounds, 0, -mb);
              break;
          }
          break;
      case "BOTTOM_RIGHT_ANCHOR":
          ib.bounds = addToBounds(ib.bounds, -mr, -mb);
          break;
      default:
          break;
    }
  }

  // Add UI bound offset
  ib.bounds = addToBounds(ib.bounds, preset.offset.x, preset.offset.y);
  return ib.bounds;
}

function showDialog(presets, preset) {

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  
  preset.barcode_box = false;  
  
  var save = "Save Preset", clear = "Clear Preset";

  if ( (preset === null) || (typeof preset !== 'object') ) {
    var preset = presets[0];
  }

  preset.ean   = (typeof preset.ean   == 'string') ? preset.ean   : "";
  preset.addon = (typeof preset.addon == 'string') ? preset.addon : "";

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  var alignToOptions = ["Page", "Page Margins"];
  var docunits = "mm";
  var list_of_pages = ["1"];

  if(preset.doc == undefined) {
    preset.pageIndex = 0;
  } else {
    var list_of_pages = preset.doc.pages.everyItem().name;
    if( (preset.pageIndex < 0) || (preset.pageIndex > list_of_pages.length-1) ) {
      // Let’s see which page is selected
      for (var j=0; j<=list_of_pages.length-1; j++){
        if(list_of_pages[j] == app.activeWindow.activePage.name){
          preset.pageIndex = j;
          break;
        }
      }
    }

    // Check if there is a selection
    if( app.selection.length > 0 ) {
      switch (app.selection[0].constructor.name){
        case "Rectangle":
        case "TextFrame":
        case "Oval":
        case "Polygon":
        case "GraphicLine":
        case "Group":
        case "PageItem":
          alignToOptions.push("Selection");
          preset.alignTo = "Selection";
          var selectionParentPage = app.selection[0].parentPage.name;
          // Let’s see which page contains selection
          for (var j=0; j<=list_of_pages.length-1; j++){
            if(list_of_pages[j] == selectionParentPage){
              preset.pageIndex = j;
              break;
            }
          }
          break;
        default:
          break;
      }
    }

    // see if there is a barcode box on active spread
    var barcode_boxes = getItemsByLabel(app.activeWindow.activeSpread, "barcode_box");
    if( barcode_boxes.length > 0 ) {
      preset.barcode_box = barcode_boxes[0];
      alignToOptions.push("barcode_box");
      preset.alignTo = "barcode_box";
      var selectionParentPage = preset.barcode_box.parentPage.name;
      // Let’s see which page contains selection
      for (var j=0; j<=list_of_pages.length-1; j++){
        if(list_of_pages[j] == selectionParentPage){
          preset.pageIndex = j;
          break;
        }
      }
    }
  }
  
  //just for testing
  //preset.ean   = '978-1-907360-21-3';
  //preset.addon = '50995';

  var dialog = new Window('dialog', 'EAN-13 Barcode Generator');
  dialog.orientation = 'column';
  dialog.alignChildren = 'left';
  dialog.margins = [15,10,15,20];

  //-------------
  // EAN-13 Input
  //-------------
  var input = dialog.add('panel', undefined, 'New Barcode: ');
  
  function updateEANTypeTo( EAN13_type ){
    var t = String( EAN13_type );
    if( t == "EAN-13" ) t = "Unknown";
    var r = "EAN-13";
    if( t.length > 0 ) {
      r += " [ " + t + " ]";
    }
    input.text = r + ":";
  }
  
  input.margins = [10,20,10,20];
  input.alignment = "fill";
  input.alignChildren = "left";
  input.orientation = 'row';
  
  var eanInput = input.add('edittext');
  eanInput.characters = 15;
  eanInput.active = true;
  eanInput.text = preset.ean;

  eanInput.onChange = function () {
    var digits = eanInput.text.replace(/[^\dXx]+/g, '');
    if (digits.length == 8) {
      // ISSN
      eanInput.text = digits.substring(0, 4) + "-" + digits.substring(4, 8);
      updateEANTypeTo("ISSN");
      
      return;

    } else if (digits.length == 10) {
      // ISBN-10
      try {
        var ean = ISBN.parse(digits);
      } catch (err) {
        alert(err);
      }
      if ( ean && ean.isIsbn10() ) {
          eanInput.text = ISBN.hyphenate(digits);
          updateEANTypeTo("ISBN");
          return;
      }
      return;

    } else if (digits.length == 13) {

      if( digits.substring(0, 3) == "977") {
        // ISSN
        eanInput.text = "977-" + digits.substring(3, 7) + "-" + digits.substring(7, 10) + "-" + digits.substring(10, 12) + "-" + digits.substring(12, 13);
        updateEANTypeTo("ISSN");
        return;

      } else if ( digits.substring(0, 4) == "9790" ) { 
        // ISMN
        // All publisher elements must fit into the general number scheme:
        /*  000 - 099
            1000 - 3999
            40000 - 69999
            700000 - 899999
            9000000 - 9999999 */
        // http://www.ismn-international.org/tools.php

        var pubStart = Number( digits.substring(4,5) );
        var pubLen = 0;
        if ( pubStart == 0 ) {
          pubLen = 3;
        } else if ( pubStart < 4) {
          pubLen = 4;
        } else if ( pubStart < 7) {
          pubLen = 5;
        } else if ( pubStart < 9) {
          pubLen = 6;
        } else if ( pubStart = 9) {
          pubLen = 7;
        }

        if(pubLen != 0) {
          eanInput.text = "979-0-" + digits.substring(4, 4+pubLen) + "-" + digits.substring(4+pubLen,12) + "-" + digits.substring(12,13);
          updateEANTypeTo("ISMN");
          return;
        }

      } else if ( digits.substring(0, 3) == "978" || digits.substring(0, 3) == "979") {
        // ISBN
        try {
          var ean = ISBN.parse(digits);
        } catch (err) {
          alert(err);
        }
        if ( ean && ean.isIsbn13() ) {
            eanInput.text = ISBN.hyphenate(digits);
            updateEANTypeTo("ISBN");
            return;
        }
      }

    } // End digits length == 13

    // note returned yet...
    updateEANTypeTo("EAN-13");
    eanInput.text = eanInput.text.replace(/ +/g, "-");
    eanInput.text = eanInput.text.replace(/[^\dxX-]*/g, "").toUpperCase();
  }

  input.add('statictext', undefined, 'Addon (optional):');
  var addonText = input.add('edittext');
  addonText.characters = 5;
  addonText.text = preset.addon;

  var pageSelectPrefix = input.add('statictext', undefined, 'Page:');
  var pageSelect = input.add('dropdownlist', undefined, list_of_pages);
  pageSelect.selection = pageSelect.items[preset.pageIndex];

  if(preset.doc == undefined) {
    // Don't show page select when there is no document open
    pageSelect.visible = false;
    pageSelectPrefix.visible = false;
  }
  
  input.add('button', undefined, 'Generate', {name: 'ok'});


  // START SETTINGS PANEL
  var settingsPanel = dialog.add('group');
  settingsPanel.margins = 0;
  settingsPanel.alignment = "fill";
  settingsPanel.alignChildren = "left";
  settingsPanel.orientation = 'column';
  
  // Start Fonts Panel
  // -----------------
  var fontPanel = settingsPanel.add("panel", undefined, "Fonts");
  fontPanel.margins = [10,15,10,20];
  fontPanel.alignment = "fill";
  fontPanel.alignChildren = "left";
  fontPanel.orientation = 'column';

  fontPanel.add('statictext', undefined, 'Machine-readable');
  var codeFontRow = fontPanel.add('group');
  var codeFontSelect = FontSelect(codeFontRow, preset.codeFont);
  
  var HR = fontPanel.add ("checkbox", undefined, "Add human-readable");
      HR.value = preset.humanReadable;
  var readFontRow = fontPanel.add('group');
  var readFontSelect = FontSelect(readFontRow, preset.readFont);

  // End Fonts Panel
  // -----------------

  // Add options
  // -----------

  var extraoptionsPanel = settingsPanel.add('group');
      extraoptionsPanel.margins = 0;
      extraoptionsPanel.alignment = "fill";
      extraoptionsPanel.alignChildren = "left";
      extraoptionsPanel.orientation   = 'row';

  /////////////////////
  // Start REF panel //
  /////////////////////
  var refPanel = extraoptionsPanel.add("panel", undefined, "Alignment");
  refPanel.margins = 20;
  refPanel.alignment = "left";
  refPanel.alignChildren = "top";
  refPanel.orientation = 'row';

  // START REF SQUARE GROUP //
  var refSquare = refPanel.add("group");
  refSquare.orientation = 'column';

  var topRow = refSquare.add("group");
  for(var i = 0; i < 3; i++){
    topRow.add("radiobutton", undefined,"");
  }
  var midRow = refSquare.add("group");
  for(var i = 0; i < 3; i++){
    midRow.add("radiobutton", undefined,"");
  }
  var botRow = refSquare.add("group");
  for(var i = 0; i < 3; i++){
    botRow.add("radiobutton", undefined,"");
  }

  // Add event listeners
  for(var i = 0; i < 3; i++){
    
    topRow.children[i].onActivate = function(){
      for(var i = 0; i < 3; i++){
        midRow.children[i].value = false;
        botRow.children[i].value = false;
      }
    }

    midRow.children[i].onActivate = function(){
      for(var i = 0; i < 3; i++){
        topRow.children[i].value = false;
        botRow.children[i].value = false;
      }
    }

    botRow.children[i].onActivate = function(){
      for(var i = 0; i < 3; i++){
        topRow.children[i].value = false;
        midRow.children[i].value = false;
      }
    }
  }

  setSelectedReferencePoint(preset.refPoint);
  // END REF SQUARE GROUP //

  var optionPanel = refPanel.add("group");
  optionPanel.alignChildren = "top";
  optionPanel.orientation = 'column';
  

  var alignToDropdown = optionPanel.add("dropdownlist", undefined, alignToOptions);
  alignToDropdown.selection = find(alignToOptions, preset.alignTo);

  var offsetXRow = optionPanel.add("group");
  offsetXRow.alignChildren = "left";
  offsetXRow.orientation = "row";
  var offsetYRow = optionPanel.add("group");
  offsetYRow.alignChildren = "left";
  offsetYRow.orientation = "row";

  offsetXRow.add("statictext", undefined,"Offset X: ");
  var offsetX = offsetXRow.add("edittext", undefined,[preset.offset.x + " " + docunits]);
  offsetX.characters=6;
  offsetYRow.add("statictext", undefined,"Offset Y: ");
  var offsetY = offsetYRow.add("edittext", undefined,[preset.offset.y + " " + docunits]);
  offsetY.characters=6;

  offsetX.onChange = function () {offsetX.text = parseFloat(offsetX.text) + " " + docunits;}
  offsetY.onChange = function () {offsetY.text = parseFloat(offsetY.text) + " " + docunits;}

  ///////////////////
  // END REF panel //
  ///////////////////

  ////////////////////////////
  // Start Adjustment panel //
  ////////////////////////////
  var adjustPanel = extraoptionsPanel.add("panel", undefined, "Adjustments");
      adjustPanel.margins = 20;
      adjustPanel.alignment = "fill";
      adjustPanel.alignChildren = "left";
      adjustPanel.orientation = 'column';

  var heightAdjust = adjustPanel.add('group');
  heightAdjust.add('statictext', undefined, 'Height adjustment:');
  var heightPercentInput = heightAdjust.add('edittext', undefined, preset.heightPercent);
  heightPercentInput.characters = 4;
  heightPercentInput.onChanging = function () { heightPercentInput.text = String(parseFloat(heightPercentInput.text)) };
  heightAdjust.add('statictext', undefined, '%');

  var whiteBG = adjustPanel.add ("checkbox", undefined, "White background");
      whiteBG.value = preset.whiteBox || false;

  //////////////////////////
  // END Adjustment panel //
  //////////////////////////

  // ----------------------
  // -- Start preset group

  var presetPanel = settingsPanel.add('group');
  presetPanel.margins = [0,5,0,0];
  presetPanel.orientation = 'row';
  presetPanel.alignment = "right";

  var presetDropDownList = new Array();
  for (var i = 0; i < presets.length; i++){
    presetDropDownList.push(presets[i].name);
  }

  var presetDropdown = presetPanel.add("dropdownlist", undefined, presetDropDownList);
  presetDropdown.minimumSize = [215,25];
  presetDropdown.selection = 0;

  if(presetDropdown.selection.text.indexOf('[') == 0){
      var addRemovePresetButton = presetPanel.add('button', undefined, save);
    } else {
      var addRemovePresetButton = presetPanel.add('button', undefined, clear);
  }

  presetDropdown.onChange = function(){
    var pName = this.selection.text;
    loadPresetData( Jaxon.getPreset("name", pName) );
    if(pName.indexOf('[') == 0) {
      addRemovePresetButton.text = save;
    } else {
      addRemovePresetButton.text = clear;
    }
  }

  function updatePresetDropdown(){
    presetDropdown.removeAll();
    for (var i = 0; i < presets.length; i++){
      presetDropdown.add("item", String(presets[i].name) );
    }
  }

  function updatePresets() {
    presets = Jaxon.getPresets();
    updatePresetDropdown();
  }

  function addPreset(){
    var pName = prompt("Name : ", "");
    if(pName != null){
      if( (pName.length <= 0) || (pName.indexOf('[') == 0) ){
      alert("Not a valid name for preset!");
        return addPreset();
      }
      updatePreset();
      preset.name = pName;
      if( Jaxon.addUniquePreset(preset, "name", preset.name) ) {
        updatePresets();
        presetDropdown.selection = presets.length-1;
      }
    } // else user pressed cancel
  }

  function removePreset(){
    if( Jaxon.removePresets("name", presetDropdown.selection.text) ) {
      updatePresets();
      presetDropdown.selection = 0;
    }
  }

  addRemovePresetButton.onClick = function () {
    if( addRemovePresetButton.text == save){
      addPreset();
    } else {
      removePreset();
    }
  }
  
  presetPanel.add('button', undefined, 'Cancel', {name: 'cancel'});

  // -- End preset group
  // ----------------------


  // ADD BUTTON GROUP
  /*
  var buttonGroup = dialog.add('group');
      buttonGroup.orientation = 'row';
      buttonGroup.alignment = 'right';
      buttonGroup.margins = [10,15,10,10];
  buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
  buttonGroup.add('button', undefined, 'Generate', {name: 'ok'});
  */
  // END BUTTON GROUP

  function clearSelectedReferencePoint(){
    for(var i = 0; i < 3; i++){
      topRow.children[i].value = false;
      midRow.children[i].value = false;
      botRow.children[i].value = false;
    }
  }

  function setSelectedReferencePoint(ref){
      // Deselct any active ref point
      clearSelectedReferencePoint();
      switch (ref) {
        case "TOP_LEFT_ANCHOR":
            topRow.children[0].value = true;
            break;
        case "TOP_CENTER_ANCHOR":
            topRow.children[1].value = true;
            break;
        case "TOP_RIGHT_ANCHOR":
            topRow.children[2].value = true;
            break;
        case "LEFT_CENTER_ANCHOR":
            midRow.children[0].value = true;
            break;
        case "CENTER_ANCHOR":
            midRow.children[1].value = true;
            break;
        case "RIGHT_CENTER_ANCHOR":
            midRow.children[2].value = true;
            break;
        case "BOTTOM_LEFT_ANCHOR":
            botRow.children[0].value = true;
            break;
        case "BOTTOM_CENTER_ANCHOR":
            botRow.children[1].value = true;
            break;
        case "BOTTOM_RIGHT_ANCHOR":
            botRow.children[2].value = true;
            break;
        default:
            break;
      }    
  }

  function getSelectedReferencePoint(){
    // Check top row
    var topRowOptions = ["TOP_LEFT_ANCHOR", "TOP_CENTER_ANCHOR", "TOP_RIGHT_ANCHOR" ];
    var midRowOptions = ["LEFT_CENTER_ANCHOR", "CENTER_ANCHOR", "RIGHT_CENTER_ANCHOR" ];
    var botRowOptions = ["BOTTOM_LEFT_ANCHOR", "BOTTOM_CENTER_ANCHOR", "BOTTOM_RIGHT_ANCHOR" ];

    for(var i = 0; i < 3; i++){
      if(topRow.children[i].value == true){
        return topRowOptions[i];
      }
      if(midRow.children[i].value == true){
        return midRowOptions[i];
      }
      if(botRow.children[i].value == true){
        return botRowOptions[i];
      }
    }
  }

  function updatePreset(){
    // This function updates the preset with UI input
    // Get fonts
    preset.codeFont      = codeFontSelect.getFont();
    preset.readFont      = readFontSelect.getFont();
    // Get input
    preset.ean           = eanInput.text.replace(/[^0-9X\-]/gi, ''); // Preserve human readable
    preset.addon         = addonText.text.replace(/[^\d]+/g, '');
    // Get Custom Settings
    preset.heightPercent = heightPercentInput.text.replace(/[^\d]+/g, '');
    preset.whiteBox      = whiteBG.value;
    preset.humanReadable = HR.value;
    preset.alignTo       = alignToDropdown.selection.text;
    preset.refPoint      = getSelectedReferencePoint();
    preset.offset        = { x : parseFloat(offsetX.text), y : parseFloat(offsetY.text) };
    preset.pageIndex     = pageSelect.selection.index || 0;
    //preset.readFontTracking = ;
    //preset.createOulines = ;
  }
  
  function loadPresetData(p) {
    try {
      // Set fonts
      codeFontSelect.setFont(p.codeFont);
      readFontSelect.setFont(p.readFont);
      // Set input
      eanInput.text             = p.ean;
      addonText.text            = p.addon;
      // Set Custom Settings
      heightPercentInput.text   = p.heightPercent;
      whiteBG.value             = p.whiteBox;
      HR.value                  = p.humanReadable;
      alignToDropdown.selection = find(alignToOptions, p.alignTo);
      setSelectedReferencePoint(p.refPoint);
      offsetX.text              = p.offset.x;
      offsetY.text              = p.offset.y;
      pageSelect.selection      = p.pageIndex;
      preset.readFontTracking   = p.readFontTracking;
      preset.createOulines      = p.createOulines;
    } catch (err) {
      alert("Error loading presets: " + err);
    }
  }

  if (dialog.show() === 1) {
    // Save user presets
    updatePreset();
    var pureEAN = preset.ean.replace(/[^\dXx]+/g, '');

    if( pureEAN.length == 0 ) {
      alert("Please enter a valid EAN code.\n");
      return showDialog(presets, preset); // Restart
    } else if(pureEAN.length == 13){
        if(pureEAN.substring(0, 3) == "977"){
            var ISSN = pureEAN.substring(3, 10);
            preset.humanReadableStr = "ISSN" + String.fromCharCode(0x2007) + ISSN.substring(0, 4) + "-" + ISSN.substring(4, 7) + calculateCheckDigit(ISSN);
        } else if(pureEAN.substring(0, 4) == "9790"){
            preset.humanReadableStr = "ISMN" + String.fromCharCode(0x2007) + preset.ean;
        } else if(pureEAN.substring(0, 3) == "978" || pureEAN.substring(0, 3) == "979" ){
            preset.humanReadableStr = "ISBN" + String.fromCharCode(0x2007) + preset.ean;
        } else {
            preset.humanReadableStr = ""; // Country or Coupon EAN-13
        }
    } else if(pureEAN.length == 10){
        // ISBN-10
        preset.humanReadableStr = "ISBN" + String.fromCharCode(0x2007) + preset.ean;
        preset.ean = ISBN.asIsbn13(pureEAN, true);
    } else if(pureEAN.length == 8){
        // ISSN
        preset.humanReadableStr = "ISSN" + String.fromCharCode(0x2007) + preset.ean;
        preset.ean = "977" + pureEAN.substring(0, 7) + "00";
        preset.ean = preset.ean + calculateCheckDigit(preset.ean+"X");
    }

    if( !checkCheckDigit(preset.ean) ) {
      alert("Check digit does not match.\n" + preset.ean);
      return showDialog(presets, preset); // Restart
    }

    if( (preset.addon != "") && (preset.addon.length != 2) && (preset.addon.length != 5) ){
      alert("Addon should be 2 or 5 digits long.\nLength is: " + preset.addon.length );
      return showDialog(presets, preset); // Restart
    }
    
    if( (preset.readFont == null) || (preset.codeFont == null) ){
        if(preset.readFont == null) preset.readFont = "";
        if(preset.codeFont == null) preset.codeFont = "";
        alert("Please select your fonts first");
        return showDialog(presets, preset); // Restart
    }
    

    if( preset.alignTo == "barcode_box" ) {
      var originalRulers = setRuler(preset.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      preset.selectionBounds = preset.barcode_box.visibleBounds;
      setRuler(preset.doc, originalRulers);
    } else if( preset.alignTo == "Selection" ) {
      var originalRulers = setRuler(preset.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      preset.selectionBounds = app.selection[0].visibleBounds;
      setRuler(preset.doc, originalRulers);
    } else {
      preset.selectionBounds = [0,0,0,0];
    }
    
    preset.readFontTracking = parseFloat(preset.readFontTracking);
    preset.pageIndex        = pageSelect.selection.index || 0;

    return preset;
  }
  else {
    // User pressed cancel
    return false;
  }
}

var BarcodeDrawer = (function () {
  var doc;
  var originalRulers;
  var page;
  var layer;
  var scale;
  var height;
  var guardHeight;
  var addonHeight;
  var reduce;
  var hpos;
  var vOffset;

  function drawLine(x1, y1, x2, y2) {
    x1 *= scale;
    y1 *= scale;
    x2 *= scale;
    y2 *= scale;
    var pathPoints = page.graphicLines.add().paths[0].pathPoints;
    pathPoints[0].anchor = [x1, y1];
    pathPoints[1].anchor = [x2, y2];
  }

  function drawBox(x, y, boxWidth, boxHeight, colour) {
    x *= scale;
    y *= scale;
    boxWidth *= scale;
    boxHeight *= scale;
    var rect = page.rectangles.add();
    rect.strokeWeight = 0;
    rect.strokeColor = "None";
    rect.fillColor = colour || "Black";
    rect.geometricBounds = [y, x, y + boxHeight, x + boxWidth];
    return rect;
  }

  function getCurrentOrNewDocument(preset, size) {
    var doc = undefined;
    try {
      var doc = app.activeDocument;
    } catch (noDocOpen) {
      var originalMarginPreference = {
        top    : app.marginPreferences.top,
        left   : app.marginPreferences.left,
        bottom : app.marginPreferences.bottom,
        right  : app.marginPreferences.right
      };

      app.marginPreferences.top    = 0;
      app.marginPreferences.left   = 0;
      app.marginPreferences.bottom = 0;
      app.marginPreferences.right  = 0;

      doc = app.documents.add();
      doc.insertLabel('build_by_ean13barcodegenerator', 'true');

      doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
      doc.viewPreferences.verticalMeasurementUnits   = MeasurementUnits.MILLIMETERS;
      doc.viewPreferences.rulerOrigin                = RulerOrigin.pageOrigin;

      doc.documentPreferences.facingPages      = false;
      doc.documentPreferences.pagesPerDocument = 1;

      if (typeof size != "undefined") {
        doc.documentPreferences.pageWidth   = size.width;
        doc.documentPreferences.pageHeight  = size.height;
      }

      //Reset the application default margin preferences to their former state.
      app.marginPreferences.top    = originalMarginPreference.top   ;
      app.marginPreferences.left   = originalMarginPreference.left  ;
      app.marginPreferences.bottom = originalMarginPreference.bottom;
      app.marginPreferences.right  = originalMarginPreference.right ;
    }
    return doc;
  }

  function drawBar(barWidth, barHeight, y) {
    if (! barHeight) {
      barHeight = height;
    }
    if (! y) {
      y = vOffset;
    }
    drawBox(hpos, y, barWidth - reduce, barHeight);
  }

  function drawAddonBar(addonWidth) {
    drawBar(addonWidth, addonHeight, vOffset + (guardHeight - addonHeight));
  }

  function drawGuard() {
    drawBar(1, guardHeight);
  }

  function startGuards() {
    drawGuard();
    hpos += 2;
    drawGuard();
    hpos += 1;
  }

  function midGuards() {
    hpos += 1;
    drawGuard();
    hpos += 2;
    drawGuard();
    hpos += 2;
  }

  function endGuards() {
    drawGuard();
    hpos += 2;
    drawGuard();
    hpos += 2;
  }

  function outline(preset, textBox){
    if(preset.createOulines) {
      try{
        elements = textBox.createOutlines();
        return elements;
      } catch (err) {
        alert("Could not create outlines\n" + err.description);
        preset.createOulines = false; // Don't show this message again :)
      }
    }
    return textBox;
  }

  function drawMain(preset, barWidths) {
    var pattern = null;
    var widths = null;
    var barWidth = null;
    var digit = null;

    // calculate the initial fontsize 
    // and use this size to draw the other characters
    // this makes sure all numbers are the same size
    var textBox = drawChar(preset, hpos - 10, '9', preset.codeFont, 13, false); //initial '9'
    var fontSize = fitTextBox(textBox, true, true); // Fit type size

    outline(preset, textBox);

    for (var i = 0; i < barWidths.length; i++) {
      pattern  = barWidths[i][0];
      widths   = barWidths[i][1];
      digit    = barWidths[i][2];

      outline( preset, drawChar(preset, hpos, digit, preset.codeFont, fontSize, true) );

      for (var j = 0; j < 4; j++) {
        barWidth = widths[j];
        if (pattern[j] === 1) {
          drawBar(barWidth);
        }
        hpos += barWidth;
      }
      if (i == 5) {
        midGuards();
      }
    }
    return fontSize;
  }

  function drawAddon(preset, addonWidths) {
    var pattern = null;
    var widths = null;
    var aWidth = null;
    var digit = null;

    hpos += 10; //gap between barcode and addon
    for (var i = 0; i < addonWidths.length; i++) {
      pattern = addonWidths[i][0];
      widths = addonWidths[i][1];
      digit = addonWidths[i][2]; //may be undefined

      if (digit) {
        var textBox = drawChar(preset, hpos, digit, preset.codeFont, preset.codeFontSize-1, true, -addonHeight-10);
        textBox.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;
        outline(preset, textBox);
      }

      for (var j = 0; j < widths.length; j++) {
        aWidth = widths[j];
        if (pattern[j] === 1) {
          drawAddonBar(aWidth);
        }
        hpos += aWidth;
      }
    }
  }

  function fitTextBox(textBox, fitText, fitBox){
    var textStyle = textBox.textStyleRanges[0];
    var fontSize  = textStyle.pointSize;
    if (fitText) {
      // Fit type to box
      textBox.parentStory.alignToBaseline = false;
      var safetyCounter = 0;
      //Keep reducing fontsize until no more overset text
      while (textBox.overflows && safetyCounter < 100) {
        safetyCounter++;
        if(fontSize > 1) {
          fontSize -= 0.25;
          textBox.parentStory.pointSize = fontSize;
        } else {
          continue;
        }
      }
    }
    if (fitBox) {
      try {
        // Fit frame to type
        textBox.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_LEFT_POINT;
        textBox.textFramePreferences.autoSizingType = AutoSizingTypeEnum.WIDTH_ONLY;
      } catch (err) {
        alert("Barcode: fitTextBox: Could not fit text box." + err.description);
      }
    }
    return fontSize;
  }

  function drawText(x, y, boxWidth, boxHeight, text, font, fontSize, textAlign, frameAlign) {
    try {
      x *= scale;
      y *= scale;
      boxWidth *= scale;
      boxHeight *= scale;
      var textBox = page.textFrames.add();
      textBox.contents = text;
      textBox.textFramePreferences.verticalJustification = frameAlign;
      var textStyle = textBox.textStyleRanges[0];
      textStyle.appliedFont = font;
      textStyle.pointSize = fontSize;
      textStyle.justification = textAlign;
      textBox.geometricBounds = [y, x, y + boxHeight, x + boxWidth];
      // We don't want the numbers to hang outside the textframe!
      textBox.parentStory.storyPreferences.opticalMarginAlignment = false;
      // Always return the textbox
      return textBox;
    } catch (err) {
      alert("Barcode: drawText: " + err);
      return null;
    }
  }

  function drawChar(preset, x, character, font, fontSize, fitBox, yOffset) {
    var yOffset = yOffset || 0;
    var y = yOffset + vOffset + height + 2;
    var boxWidth = 7;
    var boxHeight = 9;
    var textBox = drawText(x, y, boxWidth, boxHeight, character, font, fontSize, Justification.LEFT_ALIGN, VerticalJustification.TOP_ALIGN);
      textBox.parentStory.alignToBaseline = false;
    // We don't want lining figures!
    try {
      textBox.parentStory.otfFigureStyle = OTFFigureStyle.TABULAR_LINING;
    } catch (e) {
      // Not OTF
    }
    
    if(fitBox) {
      var fitText = false;
      fitTextBox(textBox, fitText, fitBox);  
    }

    return textBox;
  }

  function savePresets() {
    var savePresetBox1 = drawBox(hpos - 10, 0, width, height+12+vOffset, 'None');
    savePresetBox1.label = String(presetString);
    var savePresetBox2 = drawBox(hpos - 10, 0, width, height+12+vOffset, 'None');
    savePresetBox2.label = String(presetString);
    var currPage = savePresetBox1.parentPage;
    var presetGroup = currPage.groups.add([savePresetBox1, savePresetBox2]);
    presetGroup.label = "Barcode_Settings";
    return presetGroup;
  }

  function drawWhiteBox() {
    var whiteBox = drawBox(hpos - 10, 0, width, height+12+vOffset, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
    return whiteBox;
  }

  function init(preset) {
    scale = 0.3;
    heightAdjustPercent = preset.heightPercent;
    vOffset = 5;
    if(preset.humanReadable) {
      vOffset = 10;
    }
    
    height = 60 + vOffset;
    width = 112;

    if(String(preset.addon).length == 5) {
        width = 175;
    } else if (String(preset.addon).length == 2) {
        width = 148;
    }
    guardHeight = 75;
    addonHeight = 60;
    height = (height / 100) * heightAdjustPercent;
    guardHeight  = (guardHeight / 100) * heightAdjustPercent;
    addonHeight  = (addonHeight / 100) * heightAdjustPercent;
    reduce = 0.3;
    devider = 1/reduce;
    hpos = 10;
    presetString = Jaxon.presetString( Jaxon.updatePreset(preset, ['name']) );
  }

  function getSize(){
    var _height = height+12+vOffset;
    return {  width : width * scale, height : _height * scale };
  }

  function drawBarcode(preset) {
    var barcode = Barcode().init(preset);
    var barWidths = barcode.getNormalisedWidths();
    var addonWidths = barcode.getNormalisedAddon();

    init(preset);
    
    var size = getSize();
    
    doc = getCurrentOrNewDocument(preset, size);
  
    if( (preset.pageIndex < 0) || (preset.pageIndex > doc.pages.length-1) ) {
      page = doc.pages[0];
    } else {
      page = doc.pages[preset.pageIndex];
    }

    originalRulers = setRuler(doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
    
    layer = doc.layers.item('barcode');    
    if (layer.isValid) {
      layer.remove();
    }

    doc.layers.add({name: 'barcode'});
    layer = doc.layers.item('barcode');

    bgSwatchName = 'None';

    if(preset.whiteBox){
      bgSwatchName = 'Paper';
    }

    var barcodeElements = new Array();

    //savePresets();
    drawWhiteBox();
    
    if(preset.humanReadable) {
      var textBox = drawText(hpos - 7, vOffset - 8, 102, 6.5, 
        preset.humanReadableStr, preset.readFont, 13, Justification.FULLY_JUSTIFIED, VerticalJustification.BOTTOM_ALIGN);

      try {
        textBox.parentStory.otfFigureStyle = OTFFigureStyle.PROPORTIONAL_LINING;
        textBox.parentStory.kerningMethod = "$ID/Optical"; // Most fonts have bad kerning for all caps characters
        textBox.parentStory.tracking = preset.readFontTracking;
      } catch (e) {
        alert("Warning drawBarcode(): Could not set story preference.\n" + e);
      }

      fitTextBox(textBox, true, false);
      outline(preset, textBox);
    }

    startGuards();
    preset.codeFontSize = drawMain(preset, barWidths);
    endGuards();
    if (addonWidths) {
      drawAddon(preset, addonWidths);
    }

    try {
      var BarcodeGroup = page.groups.add(page.allPageItems);
      BarcodeGroup.label = "Barcode_Complete";

      // Let's position the barcode now
      BarcodeGroup.move(page.parent.pages[0]);
      BarcodeGroup.visibleBounds = calcOffset(BarcodeGroup.visibleBounds, page, preset);
    } catch (err) {
      alert(err);
    }

    //reset rulers
    setRuler(doc, originalRulers);
  }

  return {
    drawBarcode: drawBarcode
  }
})();

function main(presets){
  if (typeof presets == 'undefined' || presets.length <= 0) {
    alert("Oops!\nDid not receive any presets.");
    return;
  }
  var newSetting = showDialog(presets, presets[0]);
  if (newSetting) {
      try {
        BarcodeDrawer.drawBarcode(newSetting);
      } catch( error ) {
        // Alert nice error
        alert("Oops!\nHaving trouble creating a quality barcode: " + "Line " + error.line + ": " + error);
        // Restart UI so we can either correct the EAN or select a valid font.
        main(presets, newSetting);
      }
  } // else: user pressed cancel
}

try {
  main(getStandardSettings());  
} catch ( error ) {
  alert("Oops!\nHaving trouble creating a quality barcode: " + "Line " + error.line + ": " + error);
}
