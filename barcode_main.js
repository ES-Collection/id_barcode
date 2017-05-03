#include 'barcode_idUtil.js'
#include 'isbn.js'
#include 'barcode_library.js'
#include 'dropdown.js'
#include 'barcode_ui.js'
#include 'barcode_drawer.js'
#include 'jaxon.js'

$.localize = true; // enable ExtendScript localisation engine

/* 
 Global settings
*/
var version         = 0.3;

var presetsFilePath = Folder.userData + "/EAN13_barcode_Settings.json";
var presetLockChar  = "[";
// Template preset
var standardPreset = { name               : "[ New Preset ]",
                       version            : version,
                       doc                : undefined,
                       pageIndex          : -1,
                       ean                : "",
                       addon              : "",
                       codeFont           : "OCR B Std\tRegular",
                       readFont           : "OCR B Std\tRegular", // Setting tracking to -100 is nice for this font
                       readFontTracking   : 0,
                       whiteBox           : true,
                       humanReadable      : true,
                       alignTo            : "Page Margins",
                       selectionBounds    : [0,0,0,0],
                       refPoint           : "BOTTOM_RIGHT_ANCHOR",
                       offset             : { x : 0, y : 0 },
                       humanReadableStr   : "",
                       createOulines      : true,
                       heightPercent      : 100,
                       scalePercent       : 80,
                       qZoneIndicator     : true,
                       addQuietZoneMargin : 0 };

var standardPresets = [standardPreset];


function main(){
  var Jaxon = new jaxon(presetsFilePath, standardPresets, standardPresets[0], presetLockChar);
    
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

    /*
        Try and load last used presets from document
    */
    var activeDoc = app.documents[0];

    // TO FINISH USE JAXON!
    if (activeDoc.isValid) {
        var existingBarcodes = idUtil.getItemsByName(activeDoc, "Barcode_Settings");
        if(existingBarcodes.length > 0) {
          for (i = 0; i < existingBarcodes.length; i++) { 
            var eBarcodePreset = getBarcodePreset(existingBarcodes[i]);
            if(eBarcodePreset) {
               eBarcodePreset.name = "[ "+ eBarcodePreset.ean +" ]";
               presets.unshift(eBarcodePreset);
            }
          }
        } else {
          // Only go through this routine if there are no barcode boxes found
          var activeDocPreset      = newPreset();
              activeDocPreset.doc  = activeDoc;
              activeDocPreset.name = "[ Active Document ]";
          // Check if there is an entry for EAN
          var tempData = activeDoc.extractLabel('EAN');
          if( tempData.length > 0 ){
            activeDocPreset.ean  = tempData;
          }
          
          presets.unshift(activeDocPreset);
        }
    }
  
  var newSetting = showDialog( standardPresets );
  
  if (newSetting) {
      try {
        BarcodeDrawer.drawBarcode(newSetting);
      } catch( error ) {
        alert("Oops!\nHaving trouble creating a quality barcode: " + "Line " + error.line + ": " + error);
        // Restart UI so we can either correct the EAN or select a valid font.
        showDialog(newSetting);
      }
  } // else: user pressed cancel
} // END OF MAIN

try {
  // Run script with single undo if supported
  if (parseFloat(app.version) < 6) {
    main();
  } else {
    main();
    //app.doScript(main, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Expand State Abbreviations");
  }
  // Global error reporting
} catch ( error ) {
  alert("Oops!\nHaving trouble creating a quality barcode: " + "Line " + error.line + ": " + error);
}