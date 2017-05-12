/*

    presetManager.js

    An array based preset manager for extendscript    

    Bruno Herfst 2017

    Version 1.0
    
    MIT license (MIT)
    
    https://github.com/GitBruno/ESPM

*/


/* -------------------------------------------------------------------------------
    
    @param fileName : String
        Name of file to be saved in user data folder
    
    @param standardPresets : Array of Objects
        Array of initial presets that are loaded if no presetsFile is found at filePath
    
    @param TemplatePreset : Object
        A template preset to benchmark against. Also used as default.
        If not supplied TemplatePreset is first Preset in standardPresets.

------------------------------------------------------------------------------- */

var presetManager = function( fileName, standardPresets, TemplatePreset ) {
    // ref to self
    var Espm = this;

    // Create copy of standardPresets
    var standardPresets = JSON.parse(JSON.stringify(standardPresets));

    // standard file path
    var filePath = Folder.userData + "/" + fileName;
    
    Espm.getPresetsFilePath = function () {
        return filePath;
    }

    /////////////////////
    // T E M P L A T E //
    /////////////////////
    if ( typeof TemplatePreset !== 'object' ) {
        // TemplatePreset is optional
        TemplatePreset = standardPresets.shift();
    }

    var Template = ( function() { 
        // Create a new template by calling Template.getInstance();
        function createTemplate() {
            var newTemplate = new Object();
            for(var k in TemplatePreset) newTemplate[k]=TemplatePreset[k];
            return newTemplate;
        }
        return {
            getInstance: function () {
                return createTemplate();
            }
        };
    })();

    ///////////////////////////////////////
    // P R I V A T E   F U N C T I O N S //
    ///////////////////////////////////////
    function createMsg ( bool, comment ) {
        // Standard return obj
        return {success: Boolean(bool), comment: String( comment ) };
    }

    function copy_of ( something ) {
        //clones whatever it is given via JSON conversion
        return JSON.parse(JSON.stringify( something ));
    }

    function not_in_array ( arr, element ) {
        for(var i=0; i<arr.length; i++) {
            if (arr[i] == element) return false;
        }
        return true;
    }

    function fileExist ( filePath ) {
        var f = File(filePath);
        if(f.exists){
            return true;
        } else {
            return false;
        }
    }

    function writeFile ( filePath, contentString ) {
        // This function will (over) write a file to file path
        // filePath does not need to exist

        var alertUser = true;

        function error( bool, message ) {
            if(alertUser) {
                alert( "Preset Manager\n" + String(message) );
            }
            try {
                f.close();
            } catch ( err ) {
                // Do nothing
            }
            return createMsg ( bool, message );
        }

        var f = File(filePath);
        
        try {
            // Set character encoding
            f.encoding = "UTF-16";
            
            // Open the file
            if( ! f.open('w') ){
                return error( false, "Error opening file at " + filePath +": "+ f.error );
            }
            // Write to file
            if( ! f.write( String(contentString) ) ){
                return error( false, "Error writing to file at " + filePath +": "+ f.error );
            }
            // Close the file
            if( ! f.close() ){
                return error( false, "Error closing file at " + filePath +": "+ f.error );
            }
        } catch ( r ) {
            return error( false, r.error );
        }

        return createMsg ( true, "Done" );
    }

    function updateObj ( Old_Obj, New_Obj, ignoreKeys ) {
        // This function will try and copy all values
        // from Old_Obj to New_Obj
        for ( var key in New_Obj ) {
            if( Old_Obj.hasOwnProperty(key) ) {
                if ( not_in_array( ignoreKeys, key ) ) {
                    New_Obj[key] = Old_Obj[key];
                }
            }
        }
        return copy_of( New_Obj );
    }

    function updatePreset ( oldPreset, ignoreKeys ) {
        var ignoreKeys = ignoreKeys || [];
        if(! ignoreKeys instanceof Array) {
            throw "The function updatePreset expects ignoreKeys be type of array."
        }
        // Create a copy of the standard preset
        var newPreset  = Template.getInstance();
        return updateObj( oldPreset, newPreset, ignoreKeys );
    }


    // P R E S E T   C O N T R O L L E R
    //-------------------------------------------------

    function presetController( Preset ) {
        // This preset controller handles a single preset
        // And will be attached to any preset
        var PresetController = this;
        // Create a fresh template
        var _Preset = Template.getInstance();

        var _hasProp = function( propName ) {
            if( _Preset.hasOwnProperty( propName ) ){
                return true;
            } else {
                alert("UiPreset does not have property " + propName);
                return false;
            }
        }

        // Public
        //-------
        presetController.getTemplate = function() {
            return Template.getInstance();
        }

        PresetController.get = function() {
            return copy_of( _Preset );
        }

        PresetController.load = function( Preset ) {
            _Preset = updatePreset( Preset );
            return _Preset;
        }
        
        // Get and set preset properties
        PresetController.getProp = function( propName ) {
            var prop = String(propName);
            if( _hasProp( prop ) ) {
                return copy_of( _Preset[ prop ] );
            }
            alert("Could not get preset property.\nProperty " + prop + " does not exist.");
            return undefined;
        }

        PresetController.setProp = function( propName, val ) {
            var prop = String(propName);
            if( _hasProp( prop ) ) {
                _Preset[ prop ] = val;
                return copy_of( _Preset[ prop ] );
            }
            alert("Could not set preset property.\nProperty " + prop + " does not exist.");
            return undefined;
        }

        // init
        PresetController.load( Preset );

    } // End of presetController


    // P R E S E T S   C O N T R O L L E R
    //-------------------------------------------------

    function presetsController( presets ) {
        // The presets controller handles the presets array

        var PresetsController = this;

        function infuse( presets ) {
            var holder = new Array();
            var len = presets.length;
            for (var i = 0; i < len; i++) {
                holder[i] = new presetController( presets[i] );
            }
            return holder;
        }

        var _Presets = infuse( presets );

        function clean() {
            var holder = new Array();
            var len = _Presets.length;
            for (var i = 0; i < len; i++) {
                holder[i] = _Presets[i].get();
            }
            return holder;
        }

        function presetExist( key, val ) {
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                    return true;
                }
            }
            return false;
        }

        function calcIndex( pos, len ) {
            // Calculate actual index
            var i = pos;
            if ( pos < 0 ) {
                i = len - Math.abs(pos);
            }
            return Math.abs(i);
        }

        function outOfRange( pos, len ) {
            var pos = parseInt(pos);
            var len = parseInt(len);
            if(pos > len) {
                return true;
            }
            if( pos < -1-len ) {
                return true;
            }
            return false;
        }

        //------------------------------------------
        // Public access

        PresetsController.get = function () {
            return clean();
        }
        
        PresetsController.getTemplate = function() {
            return Template.getInstance();
        }

        PresetsController.getByKey = function ( key, val ) {
            // Sample usage: Espm.Presets.getByKey('id',3);
            // Please note that this function returns the first
            // preset it can find
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                   return _Presets[i].get();
                }
            }
            return false;
        }

        PresetsController.getIndex = function ( key, val ) {
            // Sample usage: Espm.Presets.getIndex('name','this');
            // returns array with matches
            var matches = new Array();
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                   matches.unshift(i);
                }
            }
            return matches;
        }

        PresetsController.getByIndex = function ( position ) {
            // Sample usage: Espm.getPresetByIndex( 3 );
            var len = _Presets.length;
            if( outOfRange( position, len ) ) {
                alert("Preset Manager\nThere is no preset at index " + i);
                return false;
            }
            var i = calcIndex( parseInt(position), len );
            return _Presets[i].get();
        }

        PresetsController.getPropList = function ( key ) {
            if( !Espm.UiPreset.get().hasOwnProperty( key ) ) {
                alert("Preset Manager\nCan't create propertylist with key " + key);
                return [];
            }
            var len = _Presets.length;
            var propList = new Array();
            for (var i = 0; i < len; i++) {
                propList[i] = _Presets[i].getProp(key);
            }
            return propList;
        }

        PresetsController.reset = function () {
            _Presets = infuse( standardPresets );
        }

        PresetsController.load = function ( presets ) {
            _Presets = infuse( presets );
            return clean();
        }

        PresetsController.add = function ( preset, position ) {
            // para position; index that can handle negative numbers
            // that are calculated from the back -1 == last
            var len = _Presets.length;
            // Not a number
            if ( isNaN(position) ) {
                position = len;
            }

            if( outOfRange(position, len) ) {
                position = len;
            }
            
            var i = calcIndex( position, len+1 );
            var infusedPreset = new presetController( preset );
            _Presets.splice(i, 0, infusedPreset);

            return clean();
        }

        PresetsController.addUnique = function ( Preset, key, options ) {
            // Sample usage: Espm.Presets.addUnique( Preset, 'name' );
            var silently = false;
            var position = -1;

            if(options && options.hasOwnProperty('position')) {
                if( !isNaN(options.position) ) position = parseInt(options.position);
            }
            if(options && options.hasOwnProperty('silently')) {
                silently = options.silently == true;
            }
            var exist = presetExist(key, Preset[key]);
            
            if(exist){
                if(silently) {
                    var overwrite = true;
                } else {
                    var overwrite = confirm("Do you want to overwrite the existing preset?");
                }
                if (overwrite) {
                    PresetsController.removeWhere( key, Preset[key] );
                } else {
                    return false;
                }
            }

            var newLen = _Presets.length+1;
            PresetsController.add( Preset, position );

            return _Presets.length == newLen;
        }
        
        PresetsController.remove = function ( position ) {
            var len = _Presets.length;
            // Check for outside range
            if( outOfRange(position, len) ) {
                alert("Could not remove preset\nOut of range: presets length: " + len + " index to be removed: "  + position);
                return false;
            }
            var i = calcIndex( parseInt(position), len );
            _Presets.splice( i, 1 );
            return true;
        }
        
        PresetsController.overwriteIndex = function ( position, Preset ) {
            PresetsController.remove( position );
            PresetsController.add( Preset, position );
            return clean();
        }

        PresetsController.removeWhere = function ( key, val ) {
            // Sample usage: Espm.Presets.removeWhere('id',3);
            // This function removes any preset that contains key - val match
            // It returns true if any presets have been removed
            var success = false;
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                    _Presets.splice( i, 1 );
                    success = true;
                }
            }
            return success;
        }

        PresetsController.saveToDisk  = function ( ) {
            var presetStr = JSON.stringify( clean() );
            return writeFile(filePath, presetStr);
        }

        PresetsController.loadFromDisk  = function () {
            if( !fileExist(filePath) ){
                alert("Cannot load presets.\nNo preset file found at " + filePath);
                return false;
            }

            var PresetsFile = File(filePath);
            PresetsFile.open('r');
            var content = PresetsFile.read();
            PresetsFile.close();

            try {
                var NewPresets = JSON.parse(content);
                _Presets = infuse( NewPresets );
                return true;
            } catch(e) {
                alert("Error reading JSON\n" + e.description);
                return false;
            }
        }
        
        PresetsController.removeFromDisk = function () {
            if( fileExist(filePath) ){
                var PresetsFile = File(filePath);
                PresetsFile.remove();
                return true;
            }
            return false;
        }

    } // End of presetsController

    // W I D G E T 
    //-------------------------------------------------

    function widgetCreator( SUI_Group ) {

        var WidgetCreator = this;
        var DataPort      = { getData: undefined, renderUiPreset: undefined };

        WidgetCreator.get = function () {
            if(DataPort) {
                return DataPort.getData();
            } else {
                return createMsg ( false, "No dataport defined" );
            }
        }

        // Any preset that starts with a locking character can't be deleted by the user
        var lockChar           = ['[',']'];
        var ButtonText         = {save: "Save Preset", clear: "Clear Preset"};
        var newName            = "New Preset";
        var lastUsedName       = "Last Used";
        var newPresetName      = "";
        var lastUsedPresetName = "";

        function updatePresetNames() {
            newPresetName      = String(lockChar[0] + " " + newName      + " " + lockChar[1]);
            lastUsedPresetName = String(lockChar[0] + " " + lastUsedName + " " + lockChar[1]);
        }

        // This makes it possible to update UI everytime UiPreset is changed
        // Even when the widget is not loaded
        var presetsDrop    = { selection: 0 };
        var presetBut      = { text: "" };
        var presetDropList = [];
        var updateUI       = true;
        var listKey        = "";

        function getDropDownIndex( index, len ) {
            var i = parseInt( index );
            if (i == 0) {
                return i;
            }
            if (i < 0) {
                i += len;
            }
            if (i > len ) {
                i = len;
            }
            return i;
        }

        function createDropDownList(){
            // Check listKey and load dropDown content
            presetDropList = Espm.Presets.getPropList( listKey );
            // Add new (clear) preset to dropdown list
            presetDropList.unshift( newPresetName );
        }

        WidgetCreator.activateNew = function () {
            // This function resets the dropdown to first (New Preset)
            updateUI = false;
            presetsDrop.selection = 0;
            presetBut.text = ButtonText.save;
            updateUI = true;
            return createMsg ( true, "Done" );
        }

        WidgetCreator.saveUiPreset = function () {
            Espm.UiPreset.load( DataPort.getData() );
            return createMsg ( true, "Done" );
        }

        WidgetCreator.savePreset = function ( options ) {
            WidgetCreator.saveUiPreset();
            
            // Process Options
            if(options && options.hasOwnProperty('updateProps')) {
                for ( var i = 0; i < options.updateProps.length; i++ ) {
                    Espm.UiPreset.setProp( options.updateProps[i].key, options.updateProps[i].value );
                }
            }
        
            var position = -1;
            if( options && options.hasOwnProperty('position') ) {
                position = parseInt(options.position);
            }

            Espm.UiPreset.save( position );
            Espm.Presets.saveToDisk();
            
            return createMsg ( true, "Done" );
        }

        WidgetCreator.overwritePreset = function( key, val, options ) {
            // Save SUI data
            WidgetCreator.saveUiPreset();
            Espm.UiPreset.setProp( key, val );

            // Process Options
            var index = -1;
            if(options && options.hasOwnProperty('position')) {
                index = parseInt(options.position);
            } else {
                index = Espm.Presets.getIndex( key, val );
            }

            Espm.Presets.addUnique( Espm.UiPreset.get(), key, {position: index, silently: true} );
            Espm.Presets.saveToDisk();
            return createMsg ( true, "Done" );
        }

        WidgetCreator.saveLastUsed = function() {
            WidgetCreator.overwritePreset( listKey, lastUsedPresetName, {position: -1} );
            return Espm.UiPreset.get();
        }

        WidgetCreator.reset = function() {
            return createMsg( false, "Widget is not loaded.");
        }

        WidgetCreator.loadIndex = function( i ) {
            // Load data in UiPreset
            if( i == 0 ) {
                Espm.UiPreset.reset();
            } else if ( i > 0 ) {
                // Presets don't include [New Preset]
                Espm.UiPreset.loadIndex( i-1 );
            } else if ( i < 0 ) {
                // Get from back
                Espm.UiPreset.loadIndex( i );
            }
            // Update SUI
            DataPort.renderUiPreset();
        }

        WidgetCreator.attachTo = function ( SUI_Group, listKeyID, Port, Options ) {
            var onloadIndex = 0;
            listKey = String(listKeyID);

            if(! (Port && Port.hasOwnProperty('renderData') && Port.hasOwnProperty('getData')) ) {
                return createMsg( false, "Could not establish data port.");
            }
            DataPort.renderUiPreset = function () {
                Port.renderData( Espm.UiPreset.get() );
            }
            DataPort.getData = Port.getData;

            // Process Options
            if(Options && Options.hasOwnProperty('onloadIndex')) {
                onloadIndex = parseInt(Options.onloadIndex);
            }
            if(Options && Options.hasOwnProperty('lockChar')) {
                if(lockChars.length == 2) {
                    lockChar[0] = String(Options.lockChar[0]);
                    lockChar[1] = String(Options.lockChar[1]);
                }
            }
            if(Options && Options.hasOwnProperty('newPresetName')) {
                newName = String(Options.newPresetName);
            }
            if(Options && Options.hasOwnProperty('lastUsedPresetName')) {
                lastUsedName = String(Options.lastUsedPresetName);
            }
            if(Options && Options.hasOwnProperty('buttonTextSave')) {
                ButtonText.save  = String(Options.buttonTextSave);
            }
            if(Options && Options.hasOwnProperty('buttonTextClear')) {
                ButtonText.clear = String(Options.buttonTextClear);
            }

            function updatePresetData() {
                // Update newPresetName
                updatePresetNames();
                createDropDownList( listKey );
            }

            updatePresetData();

            // Attach new widget to SUI_Group
            presetsDrop = SUI_Group.add('dropdownlist', undefined, presetDropList);
            presetsDrop.alignment = 'fill';
            presetsDrop.selection = getDropDownIndex( onloadIndex, presetDropList.length );

            presetsDrop.onChange = function () { 
                if(updateUI) {
                    // Load data in UiPreset
                    if(this.selection.index == 0) {
                        Espm.UiPreset.reset();
                    } else {
                        Espm.UiPreset.loadIndex( this.selection.index-1 );
                    }
                    DataPort.renderUiPreset();
                    // Update button
                    if( this.selection.text.indexOf(lockChar[0]) == 0 ){
                        presetBut.text = ButtonText.save;
                    } else {
                        presetBut.text = ButtonText.clear;
                    }
                }
            }

            WidgetCreator.reset = function() {
                updateUI = false;
                updatePresetData();
                presetsDrop.removeAll();
                for (var i=0, len=presetDropList.length; i<len; i++) {
                    presetsDrop.add('item', presetDropList[i] );
                };
                updateUI = true;
                presetsDrop.selection = 0;
                return createMsg( true, "Done");
            }

            presetBut = SUI_Group.add('button', undefined, ButtonText.save);

            function _addUiPresetToPresets( defaultName ) {
                var defaultName = defaultName || "";
                    defaultName = String( defaultName );

                var presetName = prompt("Name: ", defaultName, "Save Preset");

                if ( presetName != null ) {
                    if ( presetName.indexOf(lockChar[0]) == 0 ) {
                        alert( "You can't start a preset name with: " + lockChar[0] );
                        // Recurse
                        return _addUiPresetToPresets();
                    }
                    Espm.UiPreset.setProp( listKey, presetName );
                    // Optional?
                    Espm.Presets.addUnique( Espm.UiPreset.get(), listKey, {position:-1} );
                    WidgetCreator.reset();
                    presetsDrop.selection = presetsDrop.items.length-1;
                }
            }

            presetBut.onClick = function () { 
                if( this.text == ButtonText.clear ) {
                    Espm.Presets.remove( presetsDrop.selection.index - 1 );
                    WidgetCreator.reset();
                } else { // Save preset
                    Espm.UiPreset.load( DataPort.getData() );
                    _addUiPresetToPresets();
                }
                Espm.Presets.saveToDisk();
            }
            
            // Load selected dropdown
            WidgetCreator.loadIndex( onloadIndex );
            return createMsg( true, "Done");
        }

    } // End Widget

    // current preset (The presets we manipulate)
    // We need to buils these
    Espm.Presets  = new presetsController( standardPresets );
    
    // create a data controller for UiPreset
    Espm.UiPreset = new presetController( TemplatePreset );
    
    // create widget builder
    Espm.Widget = new widgetCreator();

    // Extend presetController UiPreset
    Espm.UiPreset.save = function( position ) {
        // position or index, negative numbers are calculated from the back -1 == last
        return Espm.Presets.add( Espm.UiPreset.get(), position );
    }

    Espm.UiPreset.loadIndex = function ( index ) {
        var len = Espm.Presets.get().length;
        var i = Math.abs(parseInt(index));
        if(i > len-1) {
            alert("Preset Manager\nLoad index is not a valid preset index: " + index);
            return createMsg ( false, "Not a valid preset index." );
        }
        Espm.UiPreset.load( Espm.Presets.getByIndex( i ) );
        return createMsg ( true, "Done" );
    }

    Espm.UiPreset.reset = function ( ) {
        Espm.UiPreset.load( Template.getInstance() );
    }

    Espm.reset = function( hard ) {
        var hard = (hard == true);
        if( hard ) {
            Espm.Presets.reset();
            Espm.Presets.saveToDisk();
        } else {
            Espm.Presets.loadFromDisk();
        }
        Espm.UiPreset.reset();
        Espm.Widget.reset();
    }

    Espm.format = function ( preset ) {
        return updatePreset ( preset );
    }

    //-------------------------------------------------
    // E N D   P U B L I C   A P I
    //-------------------------------------------------
    
    // I N I T
    //---------    
    // Save the standard presets if not allready exist
    if(!fileExist( filePath ) ){
        if( ! Espm.Presets.saveToDisk() ){
            throw("Failed to start Espm\nUnable to save presets to " + filePath);
        }
    }
    // Load the presets
    Espm.Presets.loadFromDisk();
};

//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
//
// Start JSON
//
//----------------------------------------------------------------------------------
//  json2.js
//  2016-10-28
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://github.com/douglascrockford/JSON-js/blob/master/json2.js

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                        f(this.getUTCMonth() + 1) + "-" +
                        f(this.getUTCDate()) + "T" +
                        f(this.getUTCHours()) + ":" +
                        f(this.getUTCMinutes()) + ":" +
                        f(this.getUTCSeconds()) + "Z"
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === "object" &&
                typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" &&
                    (typeof replacer !== "object" ||
                    typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return "\\u" +
                            ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());

// END presetManager.js


