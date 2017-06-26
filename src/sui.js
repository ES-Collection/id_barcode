function showDialog( presetIndex ) {
  var onloadIndex = presetIndex || 0;
  var userChange  = true;

  // Start ExtendScript Preset Manager
  var Pm = new presetManager("EAN13_barcode_Settings.json", standardPresets);

  var bwrUnits = ['dots', 'mm', 'µm', 'inch', 'mils'];

  /*
      Try and load extra presets from active document
  */
  var activeDoc = app.documents[0];

  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  var alignToOptions = ["Page", "Page Margins"];
  var docunits       = "mm";
  var list_of_pages  = [];
  var currentPage    = null;
  var barcodeBox     = null;

  function checkActiveDoc( activeDoc ){
    // Update pages info
    list_of_pages = activeDoc.pages.everyItem().name;
    currentPage   = app.activeWindow.activePage.name;

    function getBarcodePreset( pageItem ){
      var tempData = pageItem.label;
      if(tempData.length > 0){
        var bData = JSON.parse(tempData);
        if( typeof bData == 'object' && bData.hasOwnProperty('ean') ) {
          return Pm.format( bData );
        }
      }
      return false;
    }

    function updatePageNumber( MyPreset ) {
      // This function makes sure pagenumer is valid
      if( (MyPreset.pageIndex < 0) || (MyPreset.pageIndex > list_of_pages.length-1) ) {
        // Let’s see which page is selected
        for (var j=0; j<=list_of_pages.length-1; j++){
          if(list_of_pages[j] == currentPage){
            MyPreset.pageIndex = j;
            return MyPreset;
          }
        }
      }
      return MyPreset;
    }

    // Get existing barcodes in document andd add their settings to presets
    var existingBarcodes = idUtil.getItemsByName(activeDoc, "Barcode_Settings");
    if(existingBarcodes.length > 0) {
      for (i = 0; i < existingBarcodes.length; i++) { 
        var eBarcodePreset = getBarcodePreset(existingBarcodes[i]);
        if( eBarcodePreset ) {
            eBarcodePreset.name = "["+ eBarcodePreset.ean +"]";
            eBarcodePreset = updatePageNumber( eBarcodePreset );
            Pm.Presets.add(eBarcodePreset, 0);
        }
      }
    } else {
      // Only go through this routine if there are no barcode settings found
      var activeDocPreset      = Pm.Presets.getTemplate();
          activeDocPreset.name = "[Active Document]";
      // Check if there is an entry for EAN
      var tempData = activeDoc.extractLabel('EAN');
      if( tempData.length > 0 ){
        activeDocPreset.ean = tempData;
        activeDocPreset = updatePageNumber( activeDocPreset );
      }
      // Save
      Pm.Presets.add(activeDocPreset, 0);
    } // End existing barcodes

    // see if there is a barcode box on active spread
    var barcode_boxes = idUtil.getItemsByLabel(app.activeWindow.activeSpread, "barcode_box");
    if( barcode_boxes.length > 0 ) {
      barcode_box = barcode_boxes[0];
      alignToOptions.push("barcode_box");
      Pm.UiPreset.setProp("alignTo", "barcode_box");
      var selectionParentPage = barcode_box.parentPage.name;
      // Let’s see which page contains selection
      for (var j=0; j<=list_of_pages.length-1; j++){
        if(list_of_pages[j] == selectionParentPage){
          Pm.UiPreset.setProp("pageIndex", j);
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
          // Don't process items that are on the pasteboard
          if ( app.selection[0].parentPage ) {
            alignToOptions.push('Selection');
            Pm.UiPreset.setProp('alignTo', 'Selection');
            var selectionParentPage = app.selection[0].parentPage.name;
            // Let’s see which page contains selection
            for (var j=0; j<=list_of_pages.length-1; j++){
              if(list_of_pages[j] == selectionParentPage){
                Pm.UiPreset.setProp("pageIndex", j);
                break;
              }
            }
          }
          break;
        default:
          break;
      }
    } // END check selection
    
  } //END checkActiveDoc

  if ( activeDoc.isValid ) {
    checkActiveDoc( activeDoc );   
  }

  //-----------------------------------------------------------------------
  //                         W I N D O W 
  //-----------------------------------------------------------------------
  var dialog = new Window('dialog', 'EAN-13 Barcode Generator');
  dialog.orientation = 'column';
  dialog.alignChildren = 'left';
  dialog.margins = [15,10,15,20];

  function NaN20(num){
      if(isNaN(num)){
          return 0;
      } else {
          return num;
      }
  }

  function createFresh() {
    if(userChange) {
      Pm.Widget.activateNew();
    }
  }

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
  eanInput.characters = 17;
  eanInput.active = true;
  eanInput.text = Pm.UiPreset.getProp('ean');

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
  addonText.text = Pm.UiPreset.getProp('addon');

  var pageSelectPrefix = input.add('statictext', undefined, 'Page:');
  var pageSelect_dropDown = input.add('dropdownlist', undefined, list_of_pages);
  pageSelect_dropDown.selection = pageSelect_dropDown.items[ Pm.UiPreset.getProp('pageIndex') ];
  
  if( ! activeDoc.isValid ) {
    // Don't show page select when there is no document open
    pageSelect_dropDown.visible = false;
    pageSelectPrefix.visible = false;
  }
  
  // ----------------------
  // -- Start preset group

  var presetPanel = dialog.add('group');
  presetPanel.margins = [0,5,0,0];

  //presetPanel.margins = [10,5,10,0];
  presetPanel.orientation = 'row';
  presetPanel.alignment = "right";

  // -- End preset group
  // ----------------------

  // Add options
  // -----------
  var optionsPanel;

  // START SETTINGS PANEL
  optionsPanel = dialog.add('group');
  optionsPanel.margins = 0;
  optionsPanel.alignment = "fill";
  optionsPanel.alignChildren = "left";
  optionsPanel.orientation = 'column';

  // Start Fonts Panel
  // -----------------
  var fontPanel = optionsPanel.add("panel", undefined, "Fonts");
  fontPanel.margins = [10,15,10,20];
  fontPanel.alignment = "fill";
  fontPanel.alignChildren = "left";
  fontPanel.orientation = 'column';

  fontPanel.add('statictext', undefined, 'Machine-readable');
  var codeFontRow = fontPanel.add('group');


  var codeFontSelect = FontSelect(codeFontRow, Pm.UiPreset.getProp('codeFont'), createFresh );

  fontPanel.add('statictext', undefined, 'Human-readable');
  var readFontRow = fontPanel.add('group');
  var readFontSelect = FontSelect(readFontRow, Pm.UiPreset.getProp('readFont'), createFresh );

  // End Fonts Panel
  // -----------------

  var extraoptionsPanel = optionsPanel.add('group');
  extraoptionsPanel.margins = 0;
  extraoptionsPanel.alignment = "fill";
  extraoptionsPanel.alignChildren = "fill";
  extraoptionsPanel.orientation   = 'row';

  /////////////////////
  // Start REF panel //
  /////////////////////
  var refPanel = extraoptionsPanel.add("panel", undefined, "Alignment");
  refPanel.margins = 20;
  refPanel.alignment = "top";
  refPanel.alignChildren = "fill";
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
      createFresh();
    }

    midRow.children[i].onActivate = function(){
      for(var i = 0; i < 3; i++){
        topRow.children[i].value = false;
        botRow.children[i].value = false;
      }
      createFresh();
    }

    botRow.children[i].onActivate = function(){
      for(var i = 0; i < 3; i++){
        topRow.children[i].value = false;
        midRow.children[i].value = false;
      }
      createFresh();
    }
  }

  // Reference panel functions
  var clearSelectedReferencePoint = function(){
    for(var i = 0; i < 3; i++){
      topRow.children[i].value = false;
      midRow.children[i].value = false;
      botRow.children[i].value = false;
    }
  }

  var setSelectedReferencePoint = function( ref ) {
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

  var getSelectedReferencePoint = function(){
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

  setSelectedReferencePoint( Pm.UiPreset.getProp('refPoint') );

  var optionPanel = refPanel.add("group");
  optionPanel.alignChildren = "top";
  optionPanel.orientation = 'column';
  
  var alignTo_dropDown = optionPanel.add("dropdownlist", undefined, alignToOptions);
  alignTo_dropDown.selection = idUtil.find( alignToOptions, Pm.UiPreset.getProp('alignTo') );

  alignTo_dropDown.onChange = function() {
    createFresh();
  }

  var offsetXRow = optionPanel.add("group");
  offsetXRow.alignChildren = "left";
  offsetXRow.orientation = "row";
  var offsetYRow = optionPanel.add("group");
  offsetYRow.alignChildren = "left";
  offsetYRow.orientation = "row";

  var myOffset = Pm.UiPreset.getProp('offset');
  var offX = String(myOffset.x) + " " + docunits;
  offsetXRow.add("statictext", undefined,"Offset X: ");
  var offsetX_editText = offsetXRow.add("edittext", undefined, offX );
  offsetX_editText.characters=6;
  offsetX_editText.onChange = function () {
    offsetX_editText.text = parseFloat(offsetX_editText.text) + " " + docunits;  
    createFresh();
  }

  offsetYRow.add("statictext", undefined,"Offset Y: ");
  var offsetY_editText = offsetYRow.add("edittext", undefined, String(myOffset.y) + " " + docunits );
  offsetY_editText.characters=6;
  offsetY_editText.onChange = function () {
    offsetY_editText.text = parseFloat(offsetY_editText.text) + " " + docunits;
    createFresh();
  }

  ///////////////////
  // END REF panel //
  ///////////////////

  ////////////////////////////
  // Start Adjustment panel //
  ////////////////////////////
  var tab = 50;

  var adjustPanel = extraoptionsPanel.add("panel", undefined, "Adjustments");
      adjustPanel.margins = 20;
      adjustPanel.alignment = "fill";
      adjustPanel.alignChildren = "left";
      adjustPanel.orientation = 'column';

    //-------------------

    var heightAdjust = adjustPanel.add('group');
    var heightLabel  = heightAdjust.add('statictext', undefined, 'Height:');
        heightLabel.minimumSize.width = tab;

    var heightPercent_editText = heightAdjust.add('edittext', undefined, Pm.UiPreset.getProp('heightPercent') );
        heightPercent_editText.characters = 7;
    heightPercent_editText.onChange = function () {
      heightPercent_editText.text = String(parseFloat(heightPercent_editText.text));
      createFresh();
    };
    
    heightAdjust.add('statictext', undefined, '%');
    
    //-------------------

    var scaleAdjust = adjustPanel.add('group');
    var scaleLabel  = scaleAdjust.add('statictext', undefined, 'Scale:');
        scaleLabel.minimumSize.width = tab;

    var scalePercent_editText = scaleAdjust.add('edittext', undefined, Pm.UiPreset.getProp('scalePercent') );
        scalePercent_editText.characters = 7;
        scalePercent_editText.onChange = function () {
          scalePercent_editText.text = NaN20(parseFloat(scalePercent_editText.text));
          createFresh();
        };
    
    scaleAdjust.add('statictext', undefined, '%');

    //-------------------

    var dpiAdjust = adjustPanel.add('group');
    var dpiLabel  = dpiAdjust.add('statictext', undefined, 'Output:');
        dpiLabel.minimumSize.width = tab;
    
    var dpi_editText = dpiAdjust.add('edittext', undefined, Pm.UiPreset.getProp('dpi') );
        dpi_editText.characters = 7;
        dpi_editText.onChange = function () {
          dpi_editText.text = NaN20(parseInt(dpi_editText.text));
          createFresh();
        };

    dpiAdjust.add('statictext', undefined, 'DPI');

    //-------------------

    var bwrAdjust = adjustPanel.add('group');
    var bwrLabel  = bwrAdjust.add('statictext', undefined, 'BWR:');
        bwrLabel.minimumSize.width = tab;
    
    var bwr_editText = bwrAdjust.add('edittext', undefined, Pm.UiPreset.getProp('bwr') );
        bwr_editText.characters = 7;
        bwr_editText.onChange = function () {
          bwr_editText.text = NaN20(parseFloat(bwr_editText.text));
          createFresh();
        };

    var bwr_measureDrop = bwrAdjust.add("dropdownlist", undefined, bwrUnits);
        bwr_measureDrop.selection = 3; // inch

    //-------------------
    
    var whiteBG_checkBox = adjustPanel.add ("checkbox", undefined, "White background");
    whiteBG_checkBox.value = Pm.UiPreset.getProp('whiteBox');
    whiteBG_checkBox.onClick = function () { 
      createFresh();
    }

    var quiet_checkBox = adjustPanel.add ("checkbox", undefined, "Quiet Zone Indicator");
    quiet_checkBox.value = Pm.UiPreset.getProp('qZoneIndicator');
    quiet_checkBox.onClick = function () {
      createFresh();
    }

    var HumanRead_checkBox = adjustPanel.add ("checkbox", undefined, "Human-readable");
    HumanRead_checkBox.value = Pm.UiPreset.getProp('humanReadable');
    HumanRead_checkBox.onClick = function () {
      createFresh();
    }
  // End adjustment panel

  function getData(){
    // This function creates a new preset from UI data
    try {
      var NewPreset = Pm.UiPreset.get();
    }catch(err){
      alert(err);
    }

    // update NewPreset with latest data
    NewPreset.ean            = eanInput.text.replace(/[^0-9X\-]/gi, ''); // Preserve human readable
    NewPreset.addon          = addonText.text.replace(/[^\d]+/g, '');

    // Update Custom Settings
    NewPreset.codeFont       = codeFontSelect.getFont();
    NewPreset.readFont       = readFontSelect.getFont();
    NewPreset.scalePercent   = parseFloat(scalePercent_editText.text);
    NewPreset.heightPercent  = parseFloat(heightPercent_editText.text);
    NewPreset.whiteBox       = whiteBG_checkBox.value;
    NewPreset.qZoneIndicator = quiet_checkBox.value;
    NewPreset.humanReadable  = HumanRead_checkBox.value;
    NewPreset.dpi            = parseInt(dpi_editText.text);
    NewPreset.bwr            = {value: parseFloat(bwr_editText.text), unit: bwr_measureDrop.selection.text};
    NewPreset.alignTo        = alignTo_dropDown.selection.text;
    NewPreset.refPoint       = getSelectedReferencePoint();
    NewPreset.offset         = { x : parseFloat(offsetX_editText.text), y : parseFloat(offsetY_editText.text) };
    if( pageSelect_dropDown.visible ) {
      NewPreset.pageIndex    = pageSelect_dropDown.selection.index;
    }
    
    return NewPreset;
  }

  function renderData( p ) {
    userChange = false;

    try {
      // Set input
      // Don’t update EAN if there is allready in dialog
      // This should check wheter ean is valid?
      if( eanInput.text.length < 8 ) {
          eanInput.text           = p.ean;
          addonText.text          = p.addon;
      }

      // Set Custom Settings
      codeFontSelect.setFont(p.codeFont);
      readFontSelect.setFont(p.readFont);
      scalePercent_editText.text    = String(p.scalePercent);
      heightPercent_editText.text   = String(p.heightPercent);
      whiteBG_checkBox.value        = p.whiteBox;
      quiet_checkBox.value          = p.qZoneIndicator;
      HumanRead_checkBox.value      = p.humanReadable;
      dpi_editText.text             = p.dpi;
      bwr_editText.text             = p.bwr.value;
      bwr_measureDrop.selection     = idUtil.find(bwrUnits,       p.bwr.unit);
      alignTo_dropDown.selection    = idUtil.find(alignToOptions, p.alignTo);
      setSelectedReferencePoint(p.refPoint);
      offsetX_editText.text         = String(p.offset.x);
      offsetY_editText.text         = String(p.offset.y);
      if( pageSelect_dropDown.visible ) {
        pageSelect_dropDown.selection = p.pageIndex;
      }
    } catch (err) {
      alert("Error loading presets: " + err);
    }
    userChange = true;
  }

  // Add Buttons
  //-------------
  // Attach widget
  Pm.Widget.attachTo( presetPanel, 'name', { getData:getData, renderData:renderData }, { onloadIndex:onloadIndex } );

  // Add OK/Cancel
  var cancelBut = presetPanel.add('button', undefined, 'Cancel', {name: 'cancel'});
  var okBut     = presetPanel.add('button', undefined, 'Generate', {name: 'OK'});

  // Set Return/Enter key to OK window
  okBut.shortcutKey = 'R';
  okBut.onShortcutKey = okBut.onClick;
  dialog.defaultElement = okBut; 

  // End buttons
  //-------------
  if (dialog.show() === 1) {
    // Save anf get user settings
    var preset  = Pm.Widget.saveLastUsed();
    var pureEAN = preset.ean.replace(/[^\dXx]+/g, '');

    // Check EAN
    //----------
    if( pureEAN.length == 0 ) {
      alert("Please enter a valid EAN code.\n");
      return showDialog(-1); // Restart
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
      return showDialog(-1); // Restart
    }

    if( (preset.addon != "") && (preset.addon.length != 2) && (preset.addon.length != 5) ){
      alert("Addon should be 2 or 5 digits long.\nLength is: " + preset.addon.length );
      return showDialog(-1); // Restart
    }
    
    // Check Scale Percent
    //--------------------
    if(preset.scalePercent > 200 || preset.scalePercent < 80 ) {
      alert("Scale is outside target range.\nThe target size is 100% but the standards allow a range between 80% and 200%." );
      return showDialog(-1); // Restart
    }

    // Check DPI and BWR values
    //-------------------------
    // Todo: 2345678909876543

    // Check Fonts
    //------------
    if( (preset.readFont == null) || (preset.codeFont == null) ){
        if(preset.readFont == null) preset.readFont = "";
        if(preset.codeFont == null) preset.codeFont = "";
        alert("Please select your fonts first");
        return showDialog(-1); // Restart
    }

    if( preset.alignTo == "barcode_box" ) {
      var originalRulers = idUtil.setRuler(preset.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      preset.selectionBounds = preset.barcode_box.visibleBounds;
      idUtil.setRuler(preset.doc, originalRulers);
    } else if( preset.alignTo == "Selection" ) {
      var originalRulers = idUtil.setRuler(preset.doc, {units : "mm", origin : RulerOrigin.SPREAD_ORIGIN });
      preset.selectionBounds = idUtil.getMaxBounds( app.selection );
      idUtil.setRuler(preset.doc, originalRulers);
    } else {
      preset.selectionBounds = [0,0,0,0];
    }

    return preset;
  }
  else {
    // User pressed cancel
    return false;
  }
};

// END barcode_ui.js

