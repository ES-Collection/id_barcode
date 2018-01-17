// Bruno Herfst 2018
// v1.1

var idUtil = new Object();

idUtil.getBoundsInfo = function (bounds){
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

idUtil.setRuler = function (doc, myNewUnits){

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
                    alert("idUtil setRuler:\nCould not parse MeasurementUnits: " + typeof(myNewUnits) + " " + myNewUnits );
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

idUtil.find = function (haystack, needle) {
    for (var i = 0; i < haystack.length; i++) {
        if(haystack[i] == needle) return i;
    }
    return 0; // Return the first element if nothing is found
}

idUtil.getItemsByName = function (DocPageSpread, myName){
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

idUtil.getItemsByLabel = function (DocPageSpread, myLabel){
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

idUtil.getMaxBounds = function ( pageElementArray ){
  
  if(pageElementArray.length == 0) {
    alert("getMaxBounds received empty array :(");
    return [0,0,0,0];
  }

  var maxBounds = pageElementArray[0].visibleBounds; //array [y1, x1, y2, x2], [top, left, bottom, right]
  if(pageElementArray.length == 1) return maxBounds;
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

idUtil.calcOffset = function (itemBounds, page, preset){
  //Note: This function needs a better name
  var ib = idUtil.getBoundsInfo(itemBounds);
  var pb = idUtil.getBoundsInfo(page.bounds);

  if(preset.alignTo == "Barcode Box"){
    // Add to offsets
    preset.offset.x += preset.selectionBounds[1];
    preset.offset.y += preset.selectionBounds[0];
    pb = idUtil.getBoundsInfo(preset.selectionBounds);
  } else if(preset.alignTo == "Selection"){
    // Now lets add it to the offsets
    preset.offset.x += preset.selectionBounds[1];
    preset.offset.y += preset.selectionBounds[0];
    pb = idUtil.getBoundsInfo(preset.selectionBounds);
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
};

//-----------------------------------------------------------------------------------
//  LAYER TOOLS
//-----------------------------------------------------------------------------------
function getSelectAndMoveLayer(doc, name, afterlayerNo){
    return moveLayer(getAndSelectLayer(doc, name), afterlayerNo);
}
function getAndSelectLayer(doc, name) {
    return selectLayer(doc, getLayer(doc, name));
}
function getLayer(doc, name) {
    for (i=0; i<doc.layers.length-1; i++) {
        if (doc.layers[i].name===name) return doc.layers[i];
    }
    return doc.layers.add({name:name});
}
function selectLayer(doc, layer){
    doc.activeLayer = layer;
    return layer;
}
function selectTopLayer(doc) {
  return selectLayer(doc, doc.layers.firstItem());
}
function moveLayer(layer, afterlayerNo){
    try {
        layer.move(LocationOptions.AFTER,layer.parent.layers[afterlayerNo]);
        return layer
    } catch (e) {
        alert("CoverBuilder.Tools MoveLayer\n" + e.message +  " (Line " + e.line + " in file " + e.fileName + ")");
    }
}

function layerLocked(myLayer, givenLock){
    // givenLock: True:  Layer will be locked
    // givenLock: False: Layer will be unlocked
    originalLock = myLayer.locked;

    if(givenLock == undefined){
        // Toggle!
        var givenLock = !originalLock;
    }

    if(givenLock){
        myLayer.locked = true;
        return originalLock;
    } else {
        myLayer.locked = false;
        return originalLock;
    }
}

// END id_Util.js

