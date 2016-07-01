#include 'barcode_library.js'
#include 'dropdown.js'

function getStandardSettings(){

  var Settings = {  isbn     : "",
                    addon    : "",
                    isbnFont : "Helvetica Neue LT Std\t55 Roman",
                    codeFont : "OCR B Std\tRegular"
  }

  var doc = app.activeDocument;
  if (doc.isValid) {
      var tempData = doc.extractLabel('id_barcode_settings'); //Always returns a string
      if(tempData.length > 0){
          tempData = eval(tempData);
          if( typeof tempData == 'object') {
              Settings = tempData;
          }
      }
  }
  return Settings;
}

function showDialog(Settings) {
  if ( (Settings === null) || (typeof Settings !== 'object') ) {
    var Settings = getStandardSettings();
  }
  Settings.isbn  = (typeof Settings.isbn  == 'string') ? Settings.isbn  : "";
  Settings.addon = (typeof Settings.addon == 'string') ? Settings.addon : "";

  //just for testing
  //Settings.isbn  = '978-1-907360-21-3';
  //Settings.addon = '50995';
  
  var dialog = new Window('dialog', 'New barcode');
  dialog.orientation = 'column';
  dialog.alignChildren = 'left';
  var input = dialog.add('group');
  input.add('statictext', undefined, 'ISBN:');
  var edittext = input.add('edittext');
  edittext.characters = 20;
  edittext.active = true;
  edittext.text = Settings.isbn;

  input.add('statictext', undefined, 'Addon (optional):');
  var addonText = input.add('edittext');
  addonText.characters = 10;
  addonText.text = Settings.addon;

  dialog.add('statictext', undefined, 'ISBN font:');
  var isbnFontRow = dialog.add('group');
  var isbnFontSelect = FontSelect(isbnFontRow, Settings.isbnFont);
  dialog.add('statictext', undefined, 'Barcode font:');
  var codeFontRow = dialog.add('group');
  var codeFontSelect = FontSelect(codeFontRow, Settings.codeFont);
  
  var buttonGroup = dialog.add('group');
  buttonGroup.orientation = 'row';
  buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
  buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

  if (dialog.show() === 1) {

    Settings.isbnFont = isbnFontSelect.getFont();
    Settings.codeFont = codeFontSelect.getFont();
    Settings.isbn     = edittext.text;
    Settings.addon    = addonText.text;

    if( Settings.isbn === "" ) {
      // It would be nice to add a validator here
      alert("Not a valid ISBN");
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
    width *= scale
    height *= scale;
    var rect = page.rectangles.add();
    rect.strokeWeight = 0;
    rect.fillColor = colour || "Black";
    rect.geometricBounds = [y, x, y + height, x + width];
  }

  function getCurrentOrNewDocument() {
    var doc = app.documents[0];
    if (!doc.isValid) {
      doc = app.documents.add();
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

    drawChar(hpos - 10, '9', font); //initial '9'

    for (var i = 0; i < barWidths.length; i++) {
      pattern = barWidths[i][0];
      widths = barWidths[i][1];
      digit = barWidths[i][2];

      drawChar(hpos, digit, font);

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
  }

  function drawAddon(addonWidths, font) {
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
        drawChar(hpos, digit, font);
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

  function drawText(x, y, boxWidth, boxHeight, text, font, align) {
    var fontSize = 12; //this is just a starting point
    x *= scale;
    y *= scale;
    boxWidth *= scale;
    boxHeight *= scale;
    var textBox = page.textFrames.add();
    textBox.contents = text;
    var textStyle = textBox.textStyleRanges[0];
    textStyle.appliedFont = font;
    textStyle.pointSize = fontSize;
    textStyle.justification = align;
    textBox.geometricBounds = [y, x, y + boxHeight, x + boxWidth];
    var safetyCounter = 0;

    //Keep reducing fontsize until no more overset text
    while (textBox.overflows && safetyCounter < 100) {
      textStyle.pointSize -= 0.5;
      safetyCounter++;
    }
  }

  function drawChar(x, character, font) {
    var y = vOffset + normalHeight + 2;
    var boxWidth = 7;
    var boxHeight = 9;
    drawText(x, y, boxWidth, boxHeight, character, font, Justification.LEFT_ALIGN);
  }

  function drawWhiteBox(wide) {
    var width = 112;
    if (wide) {
      width = 170;
    }
    drawBox(hpos - 10, vOffset - 15, width, 100, 'Paper');
  }

  function init(Settings) {
    scale = 0.3;
    normalHeight = 70;
    guardHeight = 75;
    addonHeight = 60;
    reduce = 0.3;
    hpos = 50;
    vOffset = 50;
    doc = getCurrentOrNewDocument();
    // Save data in doc so we can load this back into UI
    doc.insertLabel('id_barcode_settings', Settings.toSource() );
    page = app.activeWindow.activePage;
    var viewPrefs = doc.viewPreferences;
    viewPrefs.horizontalMeasurementUnits = MeasurementUnits.millimeters;
    viewPrefs.verticalMeasurementUnits = MeasurementUnits.millimeters;
    layer = doc.layers.item('barcode');
    if (layer.isValid) {
      layer.remove();
    }
    doc.layers.add({name: 'barcode'});
    layer = doc.layers.item('barcode');
  }

  function drawBarcode(barWidths, addonWidths, Settings) {
    init(Settings);
    drawWhiteBox(!!addonWidths);
    drawText(hpos, vOffset - 10, 98, 9,
      "ISBN " + Settings.isbn, Settings.isbnFont, Justification.LEFT_ALIGN);
    startGuards();
    drawMain(barWidths, Settings.codeFont);
    endGuards();
    if (addonWidths) {
      drawAddon(addonWidths, Settings.codeFont);
    }
    page.groups.add(layer.allPageItems);
  }

  return {
    drawBarcode: drawBarcode
  }
})();

function main(Settings){
  var newSettings = showDialog(Settings);
  if (newSettings) {
      try {
        var barcode = Barcode().init(Settings);
        var barWidths = barcode.getNormalisedWidths();
        var addonWidths = barcode.getNormalisedAddon();
        BarcodeDrawer.drawBarcode(barWidths, addonWidths, newSettings);
      } catch( error ) {
        // Alert nice error
        alert("Oops, Having trouble creating a quality barcode:\n" + error);
        // Restart UI so we can either correct the ISBN or select a valid font
        main(newSettings);
      }
  } // else: user pressed cancel
}

main(getStandardSettings());

