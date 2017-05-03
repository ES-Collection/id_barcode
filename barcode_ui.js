function showDialog(presets, preset) {
  var userChange = true;
  var selectionBounds, pageBounds, marginBounds = [0,0,0,0];
  
  var save = "Save Preset", clear = "Clear Preset";

  if ( (preset === null) || (typeof preset !== 'object') ) {
    var preset = presets[0];
  }

  preset.barcode_box = false;  
  
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
    var barcode_boxes = idUtil.getItemsByLabel(app.activeWindow.activeSpread, "barcode_box");
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

  //-----------------------------------------------------------------------
  //                         W I N D O W 
  //-----------------------------------------------------------------------
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
  
  // ----------------------
  // -- Start preset group

  var presetPanel = dialog.add('group');
  presetPanel.margins = [0,5,0,0];
  //presetPanel.margins = [10,5,10,0];
  presetPanel.orientation = 'row';
  presetPanel.alignment = "right";

  var presetDropDownList = new Array();
  for (var i = 0; i < presets.length; i++){
    presetDropDownList.push(presets[i].name);
  }

  var presetDropdown = presetPanel.add("dropdownlist", undefined, presetDropDownList);
  presetDropdown.minimumSize = [215,25];
  presetDropdown.selection = 0;
  presetDropdown.alignment = 'fill';
  
  if(presetDropdown.selection.text.indexOf('[') == 0){
      var addRemovePresetButton = presetPanel.add('button', undefined, save);
    } else {
      var addRemovePresetButton = presetPanel.add('button', undefined, clear);
  }

  var resetPresetDropdown = function (){
    userChange = false;
    presetDropdown.selection = 0; // New preset
    userChange = true;
  }

  presetDropdown.onChange = function(){
    if(userChange) {
      var pName = this.selection.text;
      loadPresetData( PresetsController.getPreset("name", pName) );
    }
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
    presets = PresetsController.getPresets();
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
      if( PresetsController.addUniquePreset(preset, "name") ) {
        updatePresets();
        presetDropdown.selection = presets.length-1;
      }
    } // else user pressed cancel
  }

  function removePreset(){
    if( PresetsController.removePresets("name", presetDropdown.selection.text) ) {
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
  
  var settingsButton = presetPanel.add('button', undefined, 'Options', {name: 'options'});
  var settingsHidden = true;
  settingsButton.onClick = function() {
    settingsHidden = !settingsHidden;
    if(settingsHidden) {
      dialog.remove(settingsPanel);
    } else {
      createExtraOptionsPanel();
    }
    dialog.layout.layout( true ); 
  }

  presetPanel.add('button', undefined, 'Cancel', {name: 'cancel'});

  // -- End preset group
  // ----------------------
  var settingsPanel;

  // Add options
  // -----------

  function createExtraOptionsPanel(){
    // START SETTINGS PANEL
    settingsPanel = dialog.add('group');
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
    var codeFontSelect = FontSelect(codeFontRow, preset.codeFont, resetPresetDropdown);

    fontPanel.add('statictext', undefined, 'Human-readable');
    var readFontRow = fontPanel.add('group');
    var readFontSelect = FontSelect(readFontRow, preset.readFont, resetPresetDropdown);

    // End Fonts Panel
    // -----------------

    var extraoptionsPanel = settingsPanel.add('group');
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
        resetPresetDropdown();
      }

      midRow.children[i].onActivate = function(){
        for(var i = 0; i < 3; i++){
          topRow.children[i].value = false;
          botRow.children[i].value = false;
        }
        resetPresetDropdown();
      }

      botRow.children[i].onActivate = function(){
        for(var i = 0; i < 3; i++){
          topRow.children[i].value = false;
          midRow.children[i].value = false;
        }
        resetPresetDropdown();
      }
    }

    setSelectedReferencePoint(preset.refPoint);
    // END REF SQUARE GROUP //

    var optionPanel = refPanel.add("group");
    optionPanel.alignChildren = "top";
    optionPanel.orientation = 'column';
    

    var alignToDropdown = optionPanel.add("dropdownlist", undefined, alignToOptions);
    alignToDropdown.selection = idUtil.find(alignToOptions, preset.alignTo);

    alignToDropdown.onChange = function() {
      resetPresetDropdown();
    }

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

    offsetX.onChange = function () {
      offsetX.text = parseFloat(offsetX.text) + " " + docunits;
      resetPresetDropdown();
    }
    offsetY.onChange = function () {
      offsetY.text = parseFloat(offsetY.text) + " " + docunits;
      resetPresetDropdown();
    }

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
    heightPercentInput.onChange = function () { 
      heightPercentInput.text = String(parseFloat(heightPercentInput.text));
      resetPresetDropdown();
    };
    heightAdjust.add('statictext', undefined, '%');
    
    var scaleAdjust = adjustPanel.add('group');
    scaleAdjust.add('statictext', undefined, 'Scale:');
    var scalePercentInput = scaleAdjust.add('edittext', undefined, preset.scalePercent);
    scalePercentInput.characters = 4;
    scalePercentInput.onChange = function () { 
      scalePercentInput.text = String(scalePercentInput.text);
      resetPresetDropdown();
    };
    scaleAdjust.add('statictext', undefined, '%');
    
    var whiteBG = adjustPanel.add ("checkbox", undefined, "White background");
        whiteBG.value = preset.whiteBox || false;
        whiteBG.onClick = function () { 
          resetPresetDropdown();
        }

    var quietZoneIndicator = adjustPanel.add ("checkbox", undefined, "Quiet Zone Indicator");
        quietZoneIndicator.value = preset.qZoneIndicator || false;
        quietZoneIndicator.onClick = function () {
          resetPresetDropdown();
        }

    var HR = adjustPanel.add ("checkbox", undefined, "Human-readable");
        HR.value = preset.humanReadable;
        HR.onClick = function () {
          resetPresetDropdown();
        }

    //////////////////////////
    // END Adjustment panel //
    //////////////////////////



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
      preset.codeFont       = codeFontSelect.getFont();
      preset.readFont       = readFontSelect.getFont();
      // Get input
      preset.ean            = eanInput.text.replace(/[^0-9X\-]/gi, ''); // Preserve human readable
      preset.addon          = addonText.text.replace(/[^\d]+/g, '');
      // Get Custom Settings
      preset.scalePercent   = scalePercentInput.text.replace(/[^\d]+/g, '');
      preset.heightPercent  = heightPercentInput.text.replace(/[^\d]+/g, '');
      preset.whiteBox       = whiteBG.value;
      preset.qZoneIndicator = quietZoneIndicator.value;
      preset.humanReadable  = HR.value;
      preset.alignTo        = alignToDropdown.selection.text;
      preset.refPoint       = getSelectedReferencePoint();
      preset.offset         = { x : parseFloat(offsetX.text), y : parseFloat(offsetY.text) };
      preset.pageIndex      = pageSelect.selection.index || 0;
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
          eanInput.text           = p.ean;
          addonText.text          = p.addon;
        }
        // Set Custom Settings
        scalePercentInput.text    = p.scalePercent;
        heightPercentInput.text   = p.heightPercent;
        whiteBG.value             = p.whiteBox;
        HR.value                  = p.humanReadable;
        alignToDropdown.selection = idUtil.find(alignToOptions, p.alignTo);
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

  }
  
  createExtraOptionsPanel();

  if (dialog.show() === 1) {
    // Save user settings
    updatePreset();

    // Save user settings to last used preset
    preset.name = "[ Last Used ]";
    PresetsController.addUniquePreset(preset, "name", true);

    var pureEAN = preset.ean.replace(/[^\dXx]+/g, '');

    // Check EAN
    //----------
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
    
    // Check Scale Percent
    //--------------------
    if(preset.scalePercent > 200 || preset.scalePercent < 80 ) {
      alert("Scale is outside target range.\nThe target size is 100% but the standards allow a range between 80% and 200%." );
      return showDialog(presets, preset); // Restart
    }

    // Check Fonts
    //------------
    if( (preset.readFont == null) || (preset.codeFont == null) ){
        if(preset.readFont == null) preset.readFont = "";
        if(preset.codeFont == null) preset.codeFont = "";
        alert("Please select your fonts first");
        return showDialog(presets, preset); // Restart
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
    
    preset.readFontTracking = parseFloat(preset.readFontTracking);
    preset.pageIndex        = pageSelect.selection.index || 0;

    return preset;
  }
  else {
    // User pressed cancel
    return false;
  }
}

