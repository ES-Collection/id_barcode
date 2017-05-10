﻿#include 'header.js'
#include 'espm.js'
#include 'esfm.js'
#include 'id_Util.js'
#include 'isbn.js'
#include 'barcode_library.js'
#include 'barcode_drawer.js'
#include 'barcode_ui.js'

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

