function log(text) {
  $.writeln(text);
}

var checkCheckDigit = function(str) {
    // Check ISBN as found here:
    // http://stackoverflow.com/questions/11104439/how-do-i-check-if-an-input-contains-an-isbn-using-javascript/

    var str = String(str);

    var sum,
        weight,
        digit,
        check,
        i;

    str = str.replace(/[^0-9X]/gi, '');

    if (str.length != 10 && str.length != 13) {
        return false;
    }

    if (str.length == 13) {
        sum = 0;
        for (i = 0; i < 12; i++) {
            digit = parseInt(str[i]);
            if (i % 2 == 1) {
                sum += 3*digit;
            } else {
                sum += digit;
            }
        }
        check = (10 - (sum % 10)) % 10;
        return (check == str[str.length-1]);
    }

    if (str.length == 10) {
        weight = 10;
        sum = 0;
        for (i = 0; i < 9; i++) {
            digit = parseInt(str[i]);
            sum += weight*digit;
            weight--;
        }
        check = 11 - (sum % 11);
        if (check == 10) {
            check = 'X';
        }
        return (check == str[str.length-1].toUpperCase());
    }
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
  function stripISBN(str) {
    return str.replace(/[^0-9X]/gi, '');
  }

  return {
    init: function (Settings) {
      var isbnStr  = String(Settings.isbn);
      var addonStr = String(Settings.addon);
      
      if (isbnStr) {
        barcode_string = isbnStr;
        stripped = stripISBN(barcode_string);
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
        current.push(stripped[i+1]); //add isbn digit
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
    
  if (typeof font === 'string' || font instanceof String) {
    var splitFont = font.split('\t');
    if(splitFont.length == 2) {
      fontFamily = splitFont[0];
      fontStyle = splitFont[1];
    }
  }

  var sysFonts = app.fonts.everyItem();
  var sysFontsList = sysFonts.fontFamily.unique();
  sysFontsList.unshift("- Select Font Family -");

  var fontFamilyId = sysFontsList.findID(fontFamily);

  var availableFonts = group.add('dropdownlist', undefined, sysFontsList);
  var availableStyles = group.add('dropdownlist');

  availableStyles.minimumSize = [180,25];
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
        return null; //Now we know the default font is not loaded
      }
    }
  };
}


function getStandardSettings(){

  var Settings = {  doc               : undefined,
                    pageIndex         : -1,
                    isbn              : "",
                    addon             : "",
                    isbnFont          : "OCR B Std\tRegular", // Setting tracking to -100 is nice for this font
                    codeFont          : "OCR B Std\tRegular",
                    isbnFontTracking  : 0,
                    whiteBox          : true,
                    alignTo           : "Selection",
                    refPoint          : "TOP_LEFT_ANCHOR",
                    offset            : { x : 0, y : 0 },
                    heightPercent     : 60 }
  
  if (app.documents.length == 0) return Settings;
  // else
  Settings.doc = app.activeDocument;
  
  if (Settings.doc.isValid) {
      var tempData = Settings.doc.extractLabel('id_barcode_settings'); //Always returns a string
      if(tempData.length > 0){
          tempData = eval(tempData);
          if( typeof tempData == 'object') {
              Settings = tempData;
          }
      }
  }

  return Settings;
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
    // and returns the original setting that you can send back to
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

function calcOffset(itemBounds, page, Settings){

  var ib = getBoundsInfo(itemBounds);
  var pb = getBoundsInfo(page.bounds);

  if(Settings.alignTo == "Selection"){
    var selectionBounds = app.selection[0].visibleBounds;
    for(var i=1;i<app.selection.length;i++){
      switch (app.selection[i].constructor.name){
        case "Rectangle":
        case "TextFrame":
        case "Oval":
        case "Polygon":
        case "GraphicLine":
        case "Group":
        case "PageItem":
          itemBounds = app.selection[i].visibleBounds; //array [y1, x1, y2, x2], [top, left, bottom, right]
          if(itemBounds[0] < selectionBounds[0]){ selectionBounds[0] = itemBounds[0]; }
          if(itemBounds[1] < selectionBounds[1]){ selectionBounds[1] = itemBounds[1]; }
          if(itemBounds[2] > selectionBounds[2]){ selectionBounds[2] = itemBounds[2]; }
          if(itemBounds[3] > selectionBounds[3]){ selectionBounds[3] = itemBounds[2]; }
          break;
        default:
          break;
      }
    }
    // Now lets add it to the offsets
    Settings.offset.x += selectionBounds[1];
    Settings.offset.y += selectionBounds[0];
    pb = getBoundsInfo(selectionBounds);
  }

  function addToBounds(b, x, y) {
    b[0] += y; //topLeftY
    b[1] += x; //topLeftX
    b[2] += y; //botRightY
    b[3] += x; //botRightX
    return b;
  }

  // Deal with page
  switch (Settings.refPoint) {
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
  if(Settings.alignTo == "Page Margins"){
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

    switch (Settings.refPoint) {
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
  ib.bounds = addToBounds(ib.bounds, Settings.offset.x, Settings.offset.y);
  return ib.bounds;
}

function showDialog(Settings) {

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];

  if ( (Settings === null) || (typeof Settings !== 'object') ) {
    var Settings = getStandardSettings();
  }
  Settings.isbn  = (typeof Settings.isbn  == 'string') ? Settings.isbn  : "";
  Settings.addon = (typeof Settings.addon == 'string') ? Settings.addon : "";

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  var alignToOptions = ["Page", "Page Margins"];

  var docunits = "mm";
  var list_of_pages = ["1"];

  if(Settings.doc == undefined) {
    Settings.pageIndex = 0;
  } else {
    var list_of_pages = Settings.doc.pages.everyItem().name;

    if( (Settings.pageIndex < 0) || (Settings.pageIndex > list_of_pages.length-1) ) {
      // Let’s see which page is selected
      for (var j=0; j<=list_of_pages.length-1; j++){
        if(list_of_pages[j] == app.activeWindow.activePage.name){
          Settings.pageIndex = j;
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
          break;
        default:
          break;
      }
    }
  }
  
  
  //just for testing
  //Settings.isbn  = '978-1-907360-21-3';
  //Settings.addon = '50995';

  var dialog = new Window('dialog', 'New barcode');
  dialog.orientation = 'column';
  dialog.alignChildren = 'left';
  var input = dialog.add('group');
  input.add('statictext', undefined, 'ISBN:');
  var edittext = input.add('edittext');
  edittext.characters = 15;
  edittext.active = true;
  edittext.text = Settings.isbn;

  input.add('statictext', undefined, 'Addon (optional):');
  var addonText = input.add('edittext');
  addonText.characters = 5;
  addonText.text = Settings.addon;

  var pageSelectPrefix = input.add('statictext', undefined, 'Page:');
  var pageSelect = input.add('dropdownlist', undefined, list_of_pages);
  pageSelect.selection = pageSelect.items[Settings.pageIndex];

  if(Settings.doc == undefined) {
    // Don't show page select when there is no document open
    pageSelect.visible = false;
    pageSelectPrefix.visible = false;
  }

  var fontPanel = dialog.add("panel", undefined, "Fonts");
  fontPanel.margins = 20;
  fontPanel.alignChildren = "left";
  fontPanel.orientation = 'column';
  fontPanel.add('statictext', undefined, 'Human-readable');
  var isbnFontRow = fontPanel.add('group');
  var isbnFontSelect = FontSelect(isbnFontRow, Settings.isbnFont);
  fontPanel.add('statictext', undefined, 'Machine-readable');
  var codeFontRow = fontPanel.add('group');
  var codeFontSelect = FontSelect(codeFontRow, Settings.codeFont);
  
  // Add options
  var extraoptionsPanel = dialog.add('group');
      extraoptionsPanel.alignChildren = "top";
      extraoptionsPanel.orientation   = 'row';

  /////////////////////
  // Start REF panel //
  /////////////////////
  var refPanel = extraoptionsPanel.add("panel", undefined, "Alignment");
  refPanel.margins = 20;
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
  topRow.children[0].value = true;

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

  setSelectedReferencePoint(Settings.refPoint);
  // END REF SQUARE GROUP //

  var optionPanel = refPanel.add("group");
  optionPanel.alignChildren = "top";
  optionPanel.orientation = 'column';

  var alignToDropdown = optionPanel.add("dropdownlist", undefined, alignToOptions);
  alignToDropdown.selection = find(alignToOptions, Settings.alignTo);

  var offsetXRow = optionPanel.add("group");
  offsetXRow.alignChildren = "left";
  offsetXRow.orientation = "row";
  var offsetYRow = optionPanel.add("group");
  offsetYRow.alignChildren = "left";
  offsetYRow.orientation = "row";

  offsetXRow.add("statictext", undefined,"Offset X: ");
  var offsetX = offsetXRow.add("edittext", undefined,[Settings.offset.x + " " + docunits]);
  offsetX.characters=6;
  offsetYRow.add("statictext", undefined,"Offset Y: ");
  var offsetY = offsetYRow.add("edittext", undefined,[Settings.offset.y + " " + docunits]);
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
      adjustPanel.alignChildren = "left";
      adjustPanel.orientation = 'column';

  var heightAdjust = adjustPanel.add('group');
  heightAdjust.add('statictext', undefined, 'Height adjustment:');
  var heightPercentInput = heightAdjust.add('edittext', undefined, Settings.heightPercent);
  heightPercentInput.characters = 4;
  heightPercentInput.onChanging = function () { heightPercentInput.text = String(parseFloat(heightPercentInput.text)) };
  heightAdjust.add('statictext', undefined, '%');

  var whiteBG = adjustPanel.add ("checkbox", undefined, "White background");
      whiteBG.value = Settings.whiteBox || false;

  //////////////////////////
  // END Adjustment panel //
  //////////////////////////

  var buttonGroup = dialog.add('group');
      buttonGroup.orientation = 'row';
      buttonGroup.margins = 10;
      buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
      buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

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

  if (dialog.show() === 1) {
    // Save user settings
    Settings.isbnFont      = isbnFontSelect.getFont();
    Settings.codeFont      = codeFontSelect.getFont();
    Settings.isbn          = edittext.text.replace(/[^0-9X\-]/gi, ''); // Preserve human readable
    Settings.addon         = addonText.text.replace(/[^\d]+/g, '');
    Settings.heightPercent = heightPercentInput.text.replace(/[^\d]+/g, '');
    Settings.whiteBox      = whiteBG.value;
    Settings.alignTo       = alignToDropdown.selection.text;
    Settings.refPoint      = getSelectedReferencePoint();
    Settings.offset        = { x : parseFloat(offsetX.text), y : parseFloat(offsetY.text) };
    Settings.pageIndex     = pageSelect.selection.index;
    
    if( (Settings.addon != "") && (Settings.addon.length > 5) ){
      alert("Addon should be 5 digits or less.\nLength is: " + Settings.addon.length );
      return showDialog(Settings); // Restart
    }

    if( !checkCheckDigit(Settings.isbn) ) {
      alert("Check digit does not match.\n" + Settings.isbn);
      return showDialog(Settings); // Restart
    }

    if( (Settings.isbnFont == null) || (Settings.codeFont == null) ){
        if(Settings.isbnFont == null) Settings.isbnFont = "";
        if(Settings.codeFont == null) Settings.codeFont = "";
        alert("Please select your fonts first");
        return showDialog(Settings); // Restart
    }

    return Settings;
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
  var normalHeight;
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

  function drawBox(x, y, width, height, colour) {
    x *= scale;
    y *= scale;
    width *= scale;
    height *= scale;
    var rect = page.rectangles.add();
    rect.strokeWeight = 0;
    rect.fillColor = colour || "Black";
    rect.geometricBounds = [y, x, y + height, x + width];
    return rect;
  }

  function getCurrentOrNewDocument(Settings, size) {
    var doc = app.documents[0];
    if (!doc.isValid) {
      
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

  function drawBar(width, height, y) {
    if (! height) {
      height = normalHeight;
    }
    if (! y) {
      y = vOffset;
    }
    drawBox(hpos, y, width - reduce, height);
  }

  function drawAddonBar(width) {
    drawBar(width, addonHeight, vOffset + (normalHeight - addonHeight));
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

  function drawMain(barWidths, font) {
    var pattern = null;
    var widths = null;
    var width = null;
    var digit = null;

    // calculate the initial fontsize 
    // and use this size to draw the other characters
    // this makes sure all numbers are the same size
    var textBox = drawChar(hpos - 10, '9', font, 13, false); //initial '9'
    var fontSize = fitTextBox(textBox, true, true); // Fit type size

    for (var i = 0; i < barWidths.length; i++) {
      pattern = barWidths[i][0];
      widths = barWidths[i][1];
      digit = barWidths[i][2];

      drawChar(hpos, digit, font, fontSize, true);

      for (var j = 0; j < 4; j++) {
        width = widths[j];
        if (pattern[j] === 1) {
          drawBar(width);
        }
        hpos += width;
      }
      if (i == 5) {
        midGuards();
      }
    }
    return fontSize;
  }

  function drawAddon(addonWidths, font, fontSize) {
    var pattern = null;
    var widths = null;
    var width = null;
    var digit = null;

    hpos += 10; //gap between barcode and addon
    for (var i = 0; i < addonWidths.length; i++) {
      pattern = addonWidths[i][0];
      widths = addonWidths[i][1];
      digit = addonWidths[i][2]; //may be undefined

      if (digit) {
        drawChar(hpos, digit, font, fontSize, true);
      }

      for (var j = 0; j < widths.length; j++) {
        width = widths[j];
        if (pattern[j] === 1) {
          drawAddonBar(width);
        }
        hpos += width;
      }
    }
  }

  function fitTextBox(textBox, fitText, fitBox){
    var textStyle = textBox.textStyleRanges[0];
    var fontSize  = textStyle.pointSize;
    if (fitText) {
      // Fit type to box
      var safetyCounter = 0;
      //Keep reducing fontsize until no more overset text
      while (textBox.overflows && safetyCounter < 100) {
        if(fontSize > 1) {
          fontSize -= 0.25;
          textStyle.pointSize = fontSize;
        } else {
          continue;
        }
        safetyCounter++;
      }
    }
    if (fitBox) {
      // Fit frame to type
      textBox.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_LEFT_POINT;
      textBox.textFramePreferences.autoSizingType = AutoSizingTypeEnum.WIDTH_ONLY;
    }
    return fontSize;
  }

  function drawText(x, y, boxWidth, boxHeight, text, font, fontSize, textAlign, frameAlign) {
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
  }

  function drawChar(x, character, font, fontSize, fitBox) {
    var y = vOffset + normalHeight + 2;
    var boxWidth = 7;
    var boxHeight = 9;
    var textBox = drawText(x, y, boxWidth, boxHeight, character, font, fontSize, Justification.LEFT_ALIGN, VerticalJustification.TOP_ALIGN);
    // We don't want lining figures!
    textBox.parentStory.otfFigureStyle = OTFFigureStyle.TABULAR_LINING;
    // Set standard to capheight so alignment is more consistent between different fonts
    textBox.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT;
    if(fitBox) {
      fitTextBox(textBox, false, true);
    }
    return textBox;
  }

  function drawWhiteBox(wide) {
    var width = 112;
    if (wide) {
      width = 170;
    }
    var whiteBox = drawBox(hpos - 10, vOffset - 10, width, normalHeight + 22, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
  }

  function init(Settings) {
    scale = 0.3;
    heightAdjustPercent = Settings.heightPercent;
    normalHeight = 70;
    guardHeight = 75;
    addonHeight = 60;
    normalHeight = (normalHeight / 100) * heightAdjustPercent;
    guardHeight  = (guardHeight / 100) * heightAdjustPercent;
    addonHeight  = (addonHeight / 100) * heightAdjustPercent;
    reduce = 0.3;
    devider = 1/reduce;
    hpos = 10;
    vOffset = 10;
  }

  function getSize(addonWidths){
    var width = 112;
    if(addonWidths) {
      width = 170;
    }
    var height = normalHeight + 22;
    return {  width : width * scale, height : height * scale };
  }

  function drawBarcode(Settings) {
    var barcode = Barcode().init(Settings);
    var barWidths = barcode.getNormalisedWidths();
    var addonWidths = barcode.getNormalisedAddon();

    init(Settings);
    
    var size = getSize(addonWidths);
    
    doc = getCurrentOrNewDocument(Settings, size);
    // Save data in doc so we can load this back into UI
    doc.insertLabel('id_barcode_settings', Settings.toSource() );

    if( (Settings.pageIndex < 0) || (Settings.pageIndex > doc.pages.length-1) ) {
      page = doc.pages[0];
    } else {
      page = doc.pages[Settings.pageIndex];
    }

    originalRulers = setRuler(doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
    
    layer = doc.layers.item('barcode');
    
    if (layer.isValid) {
      layer.remove();
    }

    doc.layers.add({name: 'barcode'});
    layer = doc.layers.item('barcode');

    bgSwatchName = 'None';

    if(Settings.whiteBox){
      bgSwatchName = 'Paper';
    }

    drawWhiteBox(!!addonWidths);
    
    var textBox = drawText(hpos - 7, vOffset - 8, 102, 6.5, 
      "ISBN" + String.fromCharCode(0x2007) + Settings.isbn, Settings.isbnFont, 13, Justification.FULLY_JUSTIFIED, VerticalJustification.BOTTOM_ALIGN);

    textBox.parentStory.otfFigureStyle = OTFFigureStyle.PROPORTIONAL_LINING;
    textBox.parentStory.kerningMethod = "Optical"; // Most fonts have bad kerning for all caps characters
    textBox.parentStory.tracking = Settings.isbnFontTracking;
    textBox.textFramePreferences.firstBaselineOffset = FirstBaseline.FIXED_HEIGHT;
    textBox.textFramePreferences.minimumFirstBaselineOffset = 0;

    fitTextBox(textBox, true, false);

    startGuards();
    Settings.codeFontSize = drawMain(barWidths, Settings.codeFont);
    endGuards();
    if (addonWidths) {
      drawAddon(addonWidths, Settings.codeFont, Settings.codeFontSize);
    }
    var BarcodeGroup = page.groups.add(layer.allPageItems);

    BarcodeGroup.label = "Barcode_Complete";

    // Let's position the barcode now
    BarcodeGroup.move(page);
    BarcodeGroup.visibleBounds = calcOffset(BarcodeGroup.visibleBounds, page, Settings);
    
    //reset rulers
    setRuler(doc, originalRulers);
  }

  return {
    drawBarcode: drawBarcode
  }
})();

function main(Settings){
  var newSettings = showDialog(Settings);
  if (newSettings) {
      try {
        BarcodeDrawer.drawBarcode(newSettings);
      } catch( error ) {
        // Alert nice error
        alert("Oops, Having trouble creating a quality barcode:\n" + error);
        // Restart UI so we can either correct the ISBN or select a valid font
        main(newSettings);
      }
  } // else: user pressed cancel
}

try {
  main(getStandardSettings());  
} catch ( error ) {
  alert("Oops, Having trouble creating a quality barcode:\n" + error);
}


