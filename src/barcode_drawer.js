// Start BarcodeDrawer
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
  var presetString;

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
      var doc = app.activeDoc;
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
    // returns array of page elements
    if(preset.createOulines && textBox.constructor.name == "TextFrame") {
      try{
        var elements = textBox.createOutlines();
      } catch (err) {
        alert("Could not create outlines\n" + err.description);
        preset.createOulines = false; // Don't show this message again :)
      }
      return elements;
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
    var savePresetBox = drawBox(hpos - startX, 0, width, height+12+vOffset, 'None');
        savePresetBox.label = presetString;
        savePresetBox.name  = "Barcode_Settings";
    return savePresetBox;
  }

  function drawWhiteBox() {
    var whiteBox = drawBox(hpos - startX, 0, width, height+12+vOffset, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
    return whiteBox;
  }

  function init( preset ) {
    // When any of these barcodes is at
    // its nominal or 100% size the width
    // of the narrowest bar or space is 0.33 mm
    // scale = 0.33; // == 100%
    var xDimensionPercent = 0.0033;
    
    // scale 0.33 == 100% // 0.264 == 80% // 0.31 Penguin
    scale = xDimensionPercent*preset.scalePercent;
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
    
    startX = 10 + preset.addQuietZoneMargin;
    hpos = startX+0;
    width += (preset.addQuietZoneMargin*2);

    presetString = JSON.stringify( preset );
  }

  function getSize(){
    var _height = height+12+vOffset;
    return {  width : width * scale, height : _height * scale };
  }

  function drawBarcode( preset ) {
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

    originalRulers = idUtil.setRuler(doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
    
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
      var elementsBounds = idUtil.getMaxBounds( elements );

      if(scale != 0 && elementsBounds[3] != 0) {
        elementsBounds[3] /= scale;
      }
      var humanReadableWidth = elementsBounds[3] - startingpos;
    } else {
      var humanReadableWidth = hpos - startingpos;
    }

    if(preset.humanReadable) {
      var textBox = drawText( startingpos, vOffset - 8.5, humanReadableWidth, 6.5, 
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
    BarcodeGroup.visibleBounds = idUtil.calcOffset(BarcodeGroup.visibleBounds, page, preset);
    
    //reset rulers
    idUtil.setRuler(doc, originalRulers);
  }

  return {
    drawBarcode: drawBarcode
  }
})(); 

// END barcode_drawer.js

