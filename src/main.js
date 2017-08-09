#include 'header.js'
#include 'presetManager.js'
#include 'fontDrop.js'
#include 'idUtil.js'
#include 'isbn.js'
#include 'gs1Prefixes.js'
#include 'barcode_library.js'
#include 'barcode_drawer.js'
#include 'sui.js'

function main(){
  // Get preset from user
  var userPreset = showDialog();
  
  if( userPreset ) {
      BarcodeDrawer.drawBarcode( userPreset );
  } // else: user pressed cancel
}

try {
  // Run script with single undo if supported
  if (parseFloat(app.version) < 6 || debug) {
    main();
  } else {
    app.doScript(main, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Expand State Abbreviations");
  }
  // Global error reporting
} catch ( error ) {
  alert("I'm having trouble creating a quality barcode:\n" + error + " (Line " + error.line + " in file " + error.fileName + ")");
};

// END barcode_main.js

