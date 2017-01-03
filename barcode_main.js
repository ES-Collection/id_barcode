#include 'isbn.js'
#include 'barcode_library.js'
#include 'dropdown.js'

// More info here: http://www.barcodeisland.com/ean13.phtml

$.localize = true; // enable ExtendScript localisation engine

function getStandardSettings(){

  var Settings = {  doc               : undefined,
                    pageIndex         : -1,
                    EAN_Type          : "EAN-13",
                    isbn              : "",
                    addon             : "",
                    isbnFont          : "OCR B Std\tRegular", // Setting tracking to -100 is nice for this font
                    codeFont          : "OCR B Std\tRegular",
                    isbnFontTracking  : 0,
                    whiteBox          : true,
                    humanReadable     : true,
                    alignTo           : "Page",
                    selectionBounds   : [0,0,0,0],
                    refPoint          : "CENTER_ANCHOR",
                    offset            : { x : 0, y : 0 },
                    humanReadableStr  : "",
                    createOulines     : true,
                    heightPercent     : 60 }
  
  if (app.documents.length == 0) return Settings;
  // else
  Settings.doc = app.activeDocument;

  if (Settings.doc.isValid) {
      var tempData = Settings.doc.extractLabel('ISBN');
      if(tempData.length > 0){
        Settings.EAN_Type = "ISBN";
        Settings.isbn = tempData;
      }
      var tempData = Settings.doc.extractLabel('id_barcode_settings'); //Always returns a string
      if(tempData.length > 0){
          try {
            tempData = eval(tempData);
            if( typeof tempData == 'object') {
              if( tempData.hasOwnProperty('EAN_Type') ) {
                Settings = tempData;
              }
            }
          } catch (nothing) {
            return Settings;
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

function getItemByLabel(myPageOrSpread, myLabel){
    // This funcion returns an array of all items found with given label
    // If nothing is found this function returns an empty array
    var allItems = new Array();
    if(myPageOrSpread.isValid){
        var myElements = myPageOrSpread.allPageItems;
        var len = myElements.length;
        for (var i = len-1; i >= 0; i--){
            if(myElements[i].label == myLabel){
                allItems.push(myElements[i]);
            }
        }
        // Guides are not part of pageItems but they can have labels too!
        var myGuides   = myPageOrSpread.guides;
        var len = myGuides.length;
        for (var i = len-1; i >= 0; i--){
            if(myGuides[i].label == myLabel){
                allItems.push(myGuides[i]);
            }
        }
    } else {
        alert("ERROR 759403253473: Expected a valid page or spread.");
    }     
    return allItems;
}

function calcOffset(itemBounds, page, Settings){

  var ib = getBoundsInfo(itemBounds);
  var pb = getBoundsInfo(page.bounds);

  if(Settings.alignTo == "barcode_box"){
    Settings.selectionBounds = Settings.barcode_box.visibleBounds;
    // Now lets add it to the offsets
    Settings.offset.x += Settings.selectionBounds[1];
    Settings.offset.y += Settings.selectionBounds[0];
    pb = getBoundsInfo(Settings.selectionBounds);
  } else if(Settings.alignTo == "Selection"){
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
          if(itemBounds[0] < Settings.selectionBounds[0]){ Settings.selectionBounds[0] = itemBounds[0]; }
          if(itemBounds[1] < Settings.selectionBounds[1]){ Settings.selectionBounds[1] = itemBounds[1]; }
          if(itemBounds[2] > Settings.selectionBounds[2]){ Settings.selectionBounds[2] = itemBounds[2]; }
          if(itemBounds[3] > Settings.selectionBounds[3]){ Settings.selectionBounds[3] = itemBounds[2]; }
          break;
        default:
          break;
      }
    }
    // Now lets add it to the offsets
    Settings.offset.x += Settings.selectionBounds[1];
    Settings.offset.y += Settings.selectionBounds[0];
    pb = getBoundsInfo(Settings.selectionBounds);
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
  Settings.barcode_box = false;

  if ( (Settings === null) || (typeof Settings !== 'object') ) {
    var Settings = getStandardSettings();
  }
  Settings.isbn  = (typeof Settings.isbn  == 'string') ? Settings.isbn  : "";
  Settings.addon = (typeof Settings.addon == 'string') ? Settings.addon : "";

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  var alignToOptions = ["Page", "Page Margins"];
  var EAN_Type_Options = ["EAN-13","ISBN","ISSN","ISMN"];
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
          Settings.alignTo = "Selection";
          var selectionParentPage = app.selection[0].parentPage.name;
          // Let’s see which page contains selection
          for (var j=0; j<=list_of_pages.length-1; j++){
            if(list_of_pages[j] == selectionParentPage){
              Settings.pageIndex = j;
              break;
            }
          }
          break;
        default:
          break;
      }
    }

    // see if there is a barcode box on active spread
    var barcode_boxes = getItemByLabel(app.activeWindow.activeSpread, "barcode_box");
    if( barcode_boxes.length > 0 ) {
      Settings.barcode_box = barcode_boxes[0];
      alignToOptions.push("barcode_box");
      Settings.alignTo = "barcode_box";
      var selectionParentPage = Settings.barcode_box.parentPage.name;
      // Let’s see which page contains selection
      for (var j=0; j<=list_of_pages.length-1; j++){
        if(list_of_pages[j] == selectionParentPage){
          Settings.pageIndex = j;
          break;
        }
      }
    }

  }
  
  //just for testing
  //Settings.isbn  = '978-1-907360-21-3';
  //Settings.addon = '50995';

  var dialog = new Window('dialog', 'New EAN-13 Barcode');
  dialog.orientation = 'column';
  dialog.alignChildren = 'right';
  
  var input = dialog.add('panel', undefined, 'Barcode:');
  input.margins = 10;
  //input.alignment = "fill";
  input.alignChildren = "left";
  input.orientation = 'row';
  
  // This does not do anything as they are all EAN-13, but not everyone knows that.
  var typeDropdown = input.add("dropdownlist", undefined, EAN_Type_Options);
  typeDropdown.selection = find(EAN_Type_Options, Settings.EAN_Type);
  
  //input.add('statictext', undefined, 'ISBN:');
  var edittext = input.add('edittext');
  edittext.characters = 15;
  edittext.active = true;
  edittext.text = Settings.isbn;

  edittext.onChange = function () {
    var digits = edittext.text.replace(/[^\dXx]+/g, '');
    if (digits.length == 8) {
      // ISSN
      edittext.text = digits.substring(0, 4) + "-" + digits.substring(4, 8);
      typeDropdown.selection = find(EAN_Type_Options, "ISSN");
      return;

    } else if (digits.length == 10) {
      // ISBN-10
      try {
        var isbn = ISBN.parse(digits);
      } catch (err) {
        alert(err);
      }
      if ( isbn && isbn.isIsbn10() ) {
          edittext.text = ISBN.hyphenate(digits);
          typeDropdown.selection = find(EAN_Type_Options, "ISBN");
          return;
      }
      return;

    } else if (digits.length == 13) {

      if( digits.substring(0, 3) == "977") {
        // ISSN
        edittext.text = "977-" + digits.substring(3, 7) + "-" + digits.substring(7, 10) + "-" + digits.substring(10, 12) + "-" + digits.substring(12, 13);
        typeDropdown.selection = find(EAN_Type_Options, "ISSN");
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
          edittext.text = "979-0-" + digits.substring(4, 4+pubLen) + "-" + digits.substring(4+pubLen,12) + "-" + digits.substring(12,13);
          typeDropdown.selection = find(EAN_Type_Options, "ISMN");
          return;
        }

      } else if ( digits.substring(0, 3) == "978" || digits.substring(0, 3) == "979") {
        // ISBN
        try {
          var isbn = ISBN.parse(digits);
        } catch (err) {
          alert(err);
        }
        if ( isbn && isbn.isIsbn13() ) {
            edittext.text = ISBN.hyphenate(digits);
            typeDropdown.selection = find(EAN_Type_Options, "ISBN");
            return;
        }
      }

    } // End digits length == 13

    // note returned yet...
    typeDropdown.selection = find(EAN_Type_Options, "EAN-13");
    edittext.text = edittext.text.replace(/ +/g, "-");
    edittext.text = edittext.text.replace(/[^\dxX-]*/g, "").toUpperCase();
  }

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
  fontPanel.margins = 10;
  fontPanel.alignment = "fill";
  fontPanel.alignChildren = "left";
  fontPanel.orientation = 'column';

  fontPanel.add('statictext', undefined, 'Machine-readable');
  var codeFontRow = fontPanel.add('group');
  var codeFontSelect = FontSelect(codeFontRow, Settings.codeFont);
  
  var HR = fontPanel.add ("checkbox", undefined, "Add human-readable");
      HR.value = Settings.humanReadable;
  var isbnFontRow = fontPanel.add('group');
  var isbnFontSelect = FontSelect(isbnFontRow, Settings.isbnFont);

  // Add options
  var extraoptionsPanel = dialog.add('group');
      extraoptionsPanel.alignChildren = "top";
      extraoptionsPanel.orientation   = 'row';
      extraoptionsPanel.alignment = "fill";

  /////////////////////
  // Start REF panel //
  /////////////////////
  var refPanel = extraoptionsPanel.add("panel", undefined, "Alignment");
  refPanel.margins = 20;
  refPanel.alignment = "fill";
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
      adjustPanel.alignment = "fill";
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
      buttonGroup.alignment = 'right';
      buttonGroup.margins = 10;
      buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
      buttonGroup.add('button', undefined, 'OK', {name: 'ok'});

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
    Settings.humanReadable = HR.value;
    Settings.alignTo       = alignToDropdown.selection.text;
    Settings.refPoint      = getSelectedReferencePoint();
    Settings.offset        = { x : parseFloat(offsetX.text), y : parseFloat(offsetY.text) };
    Settings.pageIndex     = pageSelect.selection.index;
    
    var pureEAN = Settings.isbn.replace(/[^\dXx]+/g, '');

    if( (Settings.addon != "") && (Settings.addon.length != 2) && (Settings.addon.length != 5) ){
      alert("Addon should be 2 or 5 digits long.\nLength is: " + Settings.addon.length );
      return showDialog(Settings); // Restart
    }

    if( !checkCheckDigit(pureEAN) ) {
      alert("Check digit does not match.\n" + Settings.isbn);
      return showDialog(Settings); // Restart
    }
    
    if(pureEAN.length == 13){
        if(pureEAN.substring(0, 3) == "977"){
            var ISSN = pureEAN.substring(3, 10);
            Settings.humanReadableStr = "ISSN" + String.fromCharCode(0x2007) + ISSN.substring(0, 4) + "-" + ISSN.substring(4, 7) + calculateCheckDigit(ISSN);
        } else if(pureEAN.substring(0, 4) == "9790"){
            Settings.humanReadableStr = "ISMN" + String.fromCharCode(0x2007) + Settings.isbn;
        } else if(pureEAN.substring(0, 3) == "978" || pureEAN.substring(0, 3) == "979" ){
            Settings.humanReadableStr = "ISBN" + String.fromCharCode(0x2007) + Settings.isbn;
        } else {
            Settings.humanReadableStr = ""; // Country or Coupon EAN-13
        }
    } else if(pureEAN.length == 10){
        // ISBN-10
        Settings.humanReadableStr = "ISBN" + String.fromCharCode(0x2007) + Settings.isbn;
        Settings.isbn = ISBN.asIsbn13(pureEAN, true);
    } else if(pureEAN.length == 8){
        // ISSN
        Settings.humanReadableStr = "ISSN" + String.fromCharCode(0x2007) + Settings.isbn;
        Settings.isbn = "977" + pureEAN.substring(0, 7) + "00";
        Settings.isbn = Settings.isbn + calculateCheckDigit(Settings.isbn+"X");
    }
    
    if( (Settings.isbnFont == null) || (Settings.codeFont == null) ){
        if(Settings.isbnFont == null) Settings.isbnFont = "";
        if(Settings.codeFont == null) Settings.codeFont = "";
        alert("Please select your fonts first");
        return showDialog(Settings); // Restart
    }
    

    if( Settings.alignTo == "barcode_box" ) {
      var originalRulers = setRuler(Settings.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      Settings.selectionBounds = Settings.barcode_box.visibleBounds;
      setRuler(Settings.doc, originalRulers);
    } else if( Settings.alignTo == "Selection" ) {
      var originalRulers = setRuler(Settings.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      Settings.selectionBounds = app.selection[0].visibleBounds;
      setRuler(Settings.doc, originalRulers);
    } else {
      Settings.selectionBounds = [0,0,0,0];
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
    rect.fillColor = colour || "Black";
    rect.geometricBounds = [y, x, y + boxHeight, x + boxWidth];
    return rect;
  }

  function getCurrentOrNewDocument(Settings, size) {
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

  function outline(Settings, textBox){
    if(Settings.createOulines) {
      try{
        textBox.createOutlines();
      } catch (err) {
        alert("Could not create outlines\n" + err.description);
        Settings.createOulines = false; // Don't show this message again :)
      }
    }
  }
  function drawMain(Settings, barWidths) {
    var pattern = null;
    var widths = null;
    var barWidth = null;
    var digit = null;

    // calculate the initial fontsize 
    // and use this size to draw the other characters
    // this makes sure all numbers are the same size
    var textBox = drawChar(Settings, hpos - 10, '9', Settings.codeFont, 13, false); //initial '9'
    var fontSize = fitTextBox(textBox, true, true); // Fit type size

    outline(Settings, textBox);

    for (var i = 0; i < barWidths.length; i++) {
      pattern  = barWidths[i][0];
      widths   = barWidths[i][1];
      digit    = barWidths[i][2];

      outline( Settings, drawChar(Settings, hpos, digit, Settings.codeFont, fontSize, true) );

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

  function drawAddon(Settings, addonWidths) {
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
        var textBox = drawChar(Settings, hpos, digit, Settings.codeFont, Settings.codeFontSize-1, true, -addonHeight-10);
        textBox.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;
        outline(Settings, textBox);
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

  function drawChar(Settings, x, character, font, fontSize, fitBox, yOffset) {
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

  function drawWhiteBox() {
    var whiteBox = drawBox(hpos - 10, 0, width, height+12+vOffset, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
  }

  function init(Settings) {
    scale = 0.3;
    heightAdjustPercent = Settings.heightPercent;
    vOffset = 5;
    if(Settings.humanReadable) {
      vOffset = 10;
    }
    
    height = 60 + vOffset;
    width = 112;

    if(String(Settings.addon).length == 5) {
        width = 175;
    } else if (String(Settings.addon).length == 2) {
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

  }

  function getSize(){
    var _height = height+12+vOffset;
    return {  width : width * scale, height : _height * scale };
  }

  function drawBarcode(Settings) {
    var barcode = Barcode().init(Settings);
    var barWidths = barcode.getNormalisedWidths();
    var addonWidths = barcode.getNormalisedAddon();

    init(Settings);
    
    var size = getSize();
    
    doc = getCurrentOrNewDocument(Settings, size);
    // Save data in doc so we can load this back into UI
    doc.insertLabel('id_barcode_settings', Settings.toSource() );
    // Save EAN-13 in a seperate label for other scripts to use
    doc.insertLabel(Settings.EAN_Type, Settings.isbn );

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

    drawWhiteBox();
    
    if(Settings.humanReadable) {
      var textBox = drawText(hpos - 7, vOffset - 8, 102, 6.5, 
        Settings.humanReadableStr, Settings.isbnFont, 13, Justification.FULLY_JUSTIFIED, VerticalJustification.BOTTOM_ALIGN);

      try {
        textBox.parentStory.otfFigureStyle = OTFFigureStyle.PROPORTIONAL_LINING;
        textBox.parentStory.kerningMethod = "$ID/Optical"; // Most fonts have bad kerning for all caps characters
        textBox.parentStory.tracking = Settings.isbnFontTracking;
      } catch (e) {
        alert("Warning setting story preferences: " + e);
      }

      fitTextBox(textBox, true, false);
      outline(Settings, textBox);
    }

    startGuards();
    Settings.codeFontSize = drawMain(Settings, barWidths);
    endGuards();
    if (addonWidths) {
      drawAddon(Settings, addonWidths);
    }
    var BarcodeGroup = page.groups.add(layer.allPageItems);

    BarcodeGroup.label = "Barcode_Complete";

    // Let's position the barcode now
    BarcodeGroup.move(page.parent.pages[0]);
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
        alert("Oops, Having trouble creating a quality barcode:\n" + "Line " + error.line + ": " + error);
        // Restart UI so we can either correct the ISBN or select a valid font
        main(newSettings);
      }
  } // else: user pressed cancel
}

try {
  main(getStandardSettings());  
} catch ( error ) {
  alert("Oops, Having trouble creating a quality barcode:\n" + "Line " + error.line + ": " + error);
}


