// Start BarcodeDrawer

var BarcodeDrawer = (function () {
  var doc;
  var originalRulers;
  var page;
  var layer;
  var BD;
  var fontSize;
  var reduce;
  var hpos;
  var presetString;

  function getBWR_mm( bwrObj, DPI ) {
    switch( bwrObj.unit ) {
      case "dots":
        return ((1 / parseInt(DPI)) * bwrObj.value ) * 25.4;
        break;
      case "mm":
        return bwrObj.value;
        break;
      case "µm":
        return bwrObj.value * 0.001
        break;
      case "inch":
        return bwrObj.value * 25.4;
        break;
      case "mils":
        return bwrObj.value * 0.0254
        break;
      default:
        break; 
    }
    // If we get here something went wrong
    alert("Not a valid BWR unit: " + bwrObj.unit );
    return 0;
  }

  function drawBox(x, y, boxWidth, boxHeight, colour) {
    var rect = page.rectangles.add();
    rect.appliedObjectStyle = doc.objectStyles.item(0);
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
      barHeight = BD.barHeight;
    }
    if (! y) {
      y = BD.barsYoffset;
    }
    drawBox(hpos + (reduce/2), y, barWidth - reduce, barHeight);
  }

  function drawAddonBar( addonWidth ) {
    drawBar( addonWidth, BD.addonHeight, BD.barsYoffset + BD.fontHeight);
  }

  function drawGuard() {
    drawBar(BD.xDimension, BD.guardHeight);
  }

  function startGuards() {
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
  }

  function midGuards() {
    hpos += BD.xDimension;
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
  }

  function endGuards() {
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
    drawGuard();
    hpos += BD.xDimension*2; // Guard plus space
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

    for (var i = 0; i < barWidths.length; i++) {
      pattern  = barWidths[i][0];
      widths   = barWidths[i][1];
      digit    = barWidths[i][2];

      outline( preset, drawChar(preset, hpos, digit, preset.codeFont, fontSize, true) );

      for (var j = 0; j < 4; j++) {
        barWidth = widths[j];
        if (pattern[j] === 1) {
          drawBar(barWidth * BD.xDimension);
        }
        hpos += barWidth * BD.xDimension;
      }
      if (i == 5) {
        midGuards();
      }
    }
    return fontSize;
  }

  function drawAddon(preset, addonWidths) {
    var pattern = null;
    var widths  = null;
    var aWidth  = null;
    var digit   = null;

    hpos += BD.addonGap;
    hpos += BD.addonGap;

    for (var i = 0; i < addonWidths.length; i++) {
      pattern = addonWidths[i][0];
      widths  = addonWidths[i][1];
      digit   = addonWidths[i][2]; //may be undefined

      if (digit) {
        var textBox = drawChar(preset, hpos, digit, preset.codeFont, preset.codeFontSize-1, true, -BD.addonHeight-BD.fontHeight-BD.xDimension);
        textBox.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
        outline(preset, textBox);
      }

      for (var j = 0; j < widths.length; j++) {
        aWidth = widths[j] * BD.xDimension;
        if (pattern[j] === 1) {
          drawAddonBar( aWidth );
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
      var textBox = page.textFrames.add();
      textBox.appliedObjectStyle = doc.objectStyles.item(0);
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
    var y = yOffset + BD.yBottomBar;
    var boxWidth = BD.digitWidth;
    var boxHeight = BD.fontHeight;
    var textBox = drawText(x, y, boxWidth, boxHeight, character, font, fontSize, Justification.LEFT_ALIGN, VerticalJustification.CENTER_ALIGN);
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
    var savePresetBox = drawBox(hpos - startX, 0, BD.minBoxWidth, BD.minBoxHeight, 'None');
        savePresetBox.label = presetString;
        savePresetBox.name  = "Barcode_Settings";
    return savePresetBox;
  }

  function drawWhiteBox() {
    var whiteBox = drawBox(0, 0, BD.minBoxWidth, BD.minBoxHeight, bgSwatchName);
    whiteBox.label = "barcode_whiteBox";
    return whiteBox;
  }

  function drawBarcode( preset ) {
    var barcode     = Barcode().init( preset ); // barcode_library.js
    var barWidths   = barcode.getNormalisedWidths();
    var addonWidths = barcode.getNormalisedAddon();

    BD = barcode.getDimensions();

    startX = BD.xDimension;
    hpos   = startX;
    // Gain control: Dependent on paper properties and dot distribution.
    reduce = getBWR_mm( preset.bwr, preset.dpi ); // 10% dotgain == 0.1
    
    presetString = JSON.stringify( preset );

    doc = getCurrentOrNewDocument(preset, {  width : BD.minBoxWidth, height : BD.minBoxHeight });

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

    // calculate the initial fontsize 
    // and use this size to draw the other characters
    // this makes sure all numbers are the same size
    var textBox = drawChar(preset, hpos, preset.ean[0], preset.codeFont, 20, false); //initial '9'
    fontSize = fitTextBox(textBox, true, true); // Fit type size

    outline(preset, textBox);

    hpos   += BD.digitWidth + BD.xDimension;
    startX += BD.digitWidth + BD.xDimension;

    startGuards();
    preset.codeFontSize = drawMain(preset, barWidths);
    endGuards();

    if(preset.qZoneIndicator) {
      var textBox = drawChar(preset, hpos, '>', preset.codeFont, preset.codeFontSize, true); //quiet zone indicator '>'
      var elements = outline(preset, textBox);
    }

    if(preset.humanReadable && preset.humanReadableStr.length > 0) {
      var textBox = drawText( BD.startingpos, 0, BD.humanReadableWidth, BD.barsYoffset, 
        preset.humanReadableStr, preset.readFont, 20, Justification.FULLY_JUSTIFIED, VerticalJustification.CENTER_ALIGN);

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
    //BarcodeGroup.move(page.parent.pages[0]);
    //BarcodeGroup.visibleBounds = idUtil.calcOffset(BarcodeGroup.visibleBounds, page, preset);
    
    //reset rulers
    idUtil.setRuler(doc, originalRulers);
  }

  return {
    drawBarcode: drawBarcode
  }
})(); 

// END barcode_drawer.js

