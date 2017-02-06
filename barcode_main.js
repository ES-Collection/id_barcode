#include 'isbn.js'
#include 'barcode_library.js'
#include 'dropdown.js'
#include 'jaxon.js'

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
           heightPercent     : 100,
           qZoneIndicator    : true };
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
                     heightPercent     : 60,
                     qZoneIndicator    : false }];

var presetsFilePath = Folder.userData + trailSlash + "EAN13_barcode_Settings.json";

// Start preset manager
var Jaxon = new jaxon(presetsFilePath, stdSettings, stdSettings[0], '[');

function getBarcodePreset(pageItem){
  var tempData = pageItem.label;
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
    var existingBarcodes = getItemsByName(aDoc, "Barcode_Settings");
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

function getItemsByName(DocPageSpread, myName){
    // This funcion returns an array of all items found with given label
    // If nothing is found this function returns an empty array
    var allItems = new Array();
    if(DocPageSpread.isValid){
        var myElements = DocPageSpread.allPageItems;
        var len = myElements.length;
        for (var i = len-1; i >= 0; i--){
            if(myElements[i].name == myName){
                allItems.push(myElements[i]);
            }
        }
    } else {
        alert("ERROR 759403253473: Expected a valid doc, page or spread.");
    }     
    return allItems;
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

function getMaxBounds( pageElementArray ){
  var maxBounds = pageElementArray[0].visibleBounds; //array [y1, x1, y2, x2], [top, left, bottom, right]
  for(var i=1;i<pageElementArray.length;i++){
    switch (pageElementArray[i].constructor.name){
      case "Rectangle":
      case "TextFrame":
      case "Oval":
      case "Polygon":
      case "GraphicLine":
      case "Group":
      case "PageItem":
        var itemBounds = pageElementArray[i].visibleBounds; //array [y1, x1, y2, x2], [top, left, bottom, right]
        if(itemBounds[0] < maxBounds[0]){ maxBounds[0] = itemBounds[0]; }
        if(itemBounds[1] < maxBounds[1]){ maxBounds[1] = itemBounds[1]; }
        if(itemBounds[2] > maxBounds[2]){ maxBounds[2] = itemBounds[2]; }
        if(itemBounds[3] > maxBounds[3]){ maxBounds[3] = itemBounds[2]; }
        break;
      default:
        alert("getMaxBounds() received " + pageElementArray[i].constructor.name);
        break;
    }
  }
  return maxBounds;
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
    preset.selectionBounds = getMaxBounds( app.selection );
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
      // Don’t update EAN if there is allready one in dialog
      if(eanInput.text.length < 8) {
        eanInput.text             = p.ean;
        addonText.text            = p.addon;
      }
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
    
    doc.insertLabel('EAN-13', preset.ean);
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
        element = textBox.createOutlines();
        return element;
      } catch (err) {
        alert("Could not create outlines\n" + err.description);
        preset.createOulines = false; // Don't show this message again :)
      }
    }
    return [textBox];
  }

  function drawMain(preset, barWidths) {
    var pattern = null;
    var widths = null;
    var barWidth = null;
    var digit = null;

    // calculate the initial fontsize 
    // and use this size to draw the other characters
    // this makes sure all numbers are the same size
    var textBox = drawChar(preset, hpos - 10, '9', preset.codeFont, 20, false); //initial '9'
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
    var savePresetBox = drawBox(hpos - 10, 0, width, height+12+vOffset, 'None');
        savePresetBox.label = String(presetString);
        savePresetBox.name  = "Barcode_Settings";
    return savePresetBox;
  }

  function drawWhiteBox() {
    var whiteBox = drawBox(hpos - 10, 0, width, height+12+vOffset, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
    return whiteBox;
  }

  function init(preset) {
    // When any of these barcodes is at
    // its nominal or 100% size the width
    // of the narrowest bar or space is
    // 0.33 mm
    scale = 1; // 0.33 == 100% // 0.264 == 80% // 0.31 Penguin
    heightAdjustPercent = preset.heightPercent;
    vOffset = 5;
    if(preset.humanReadable) {
      vOffset = 10;
    }
    
    height = 60 + vOffset;
    width = 114;

    if(String(preset.addon).length == 5) {
        width = 177;
    } else if (String(preset.addon).length == 2) {
        width = 150;
    }
    guardHeight = 75;
    addonHeight = 60;
    height = (height / 100) * heightAdjustPercent;
    guardHeight  = (guardHeight / 100) * heightAdjustPercent;
    addonHeight  = (addonHeight / 100) * heightAdjustPercent;

    // Gain control: Dependent on paper properties and dot distribution. Best to leave to CtP process.
    reduce = 0; // 10% dotgain == 0.1
    
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
    var startingpos = hpos - 7;
    
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

    drawWhiteBox();
    
    savePresets();

    startGuards();
    preset.codeFontSize = drawMain(preset, barWidths);
    endGuards();

    if(preset.qZoneIndicator) {
      var textBox = drawChar(preset, hpos, '>', preset.codeFont, preset.codeFontSize, true); //quiet zone indicator '>'
      var elements = outline(preset, textBox);
      var elementBounds = getMaxBounds( elements );
      alert(elementBounds);
      var humanReadableWidth = elementBounds[3] - startingpos;
    } else {
      var humanReadableWidth = hpos - startingpos;
    }

    if(preset.humanReadable) {
      var textBox = drawText( startingpos, vOffset - 8, humanReadableWidth, 6.5, 
        preset.humanReadableStr, preset.readFont, 20, Justification.FULLY_JUSTIFIED, VerticalJustification.BOTTOM_ALIGN);

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

    if (addonWidths) {
      drawAddon(preset, addonWidths);
    }

    var BarcodeGroup = page.groups.add(layer.allPageItems);

    BarcodeGroup.label = "Barcode_Complete";

    // Let's position the barcode now
    BarcodeGroup.move(page.parent.pages[0]);
    BarcodeGroup.visibleBounds = calcOffset(BarcodeGroup.visibleBounds, page, preset);
    
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
