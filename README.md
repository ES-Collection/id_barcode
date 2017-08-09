InDesign Barcode Generator
==========================

Easily generate EAN-13 based barcodes in InDesign.

Use [`id_barcode.jsx`](https://github.com/gitbruno/id_barcode/raw/master/id_barcode.jsx) if you just want to use the plugin.

[![Stories in Ready](https://badge.waffle.io/GitBruno/id_barcode.png?label=ready&title=Ready)](https://waffle.io/GitBruno/id_barcode)
[![Stories In Progress](https://badge.waffle.io/GitBruno/id_barcode.png?label=In%20Progress&title=In%20Progress)](https://waffle.io/GitBruno/id_barcode)

## Supported codes & symbologies

### EAN-13
The International Article Number (EAN) is a 13-digit barcode symbology. The EAN-13 barcode is used worldwide for marking products often sold at retail point of sale.

### ISBN  
An International Standard Book Number (ISBN) is an unambiguous identifiers for books and other nonperiodic media. Both ISBN-10 and ISBN-13 are supported. InDesign Barcode Maker automatically formats (hyphenate) the ISBN, so you can paste in a string of numbers.

### ISSN  
An International Standard Serial Number (ISSN) is an 8-digit code used to identify periodicals like newspapers, journals and magazines.

### ISMN
The International Standard Music Number (ISMN) is a unique number for the identification of all notated music publications.


## Features

### Add-on Barcodes

InDesign Barcode maker can add a 2-digit EAN-2, or 5-digit EAN-5 supplemental barcode, placed on the right-hand side. These add-on barcodes are generally used for newspapers, journals, magazines and periodicals to indicate the current year's issue number. Or for books and weighed products like food to indicate suggested retail price (MSRP).

### Bar Width Adjustments (BWR)

Bar Width Adjustment (also referred to as Bar Width Reduction, or BWR) is a method for adjusting the bars of a barcode to compensate for dot gain. You can enter the Bar Width Reduction in microns, milliinches (mil), millimeters or inches or actual dots.

### Custom fonts

You can choose any font you like. (OCR-B is recommended)

### Custom Height

InDesign Barcode Maker can adjust the height of the barcode to suit your needs. Sizes are standardized but width and height are allowed to vary within certain limits. It is permitted to vary the width down to roughly 80% and up to 200%. In addition it is permitted to reduce the height to some degree, this is dependend on the intended ussage. So always make sure you check your requirements.

### Align options

To automatically align the barcode make a selection and run the script.
It will find elements with  script-label `barcode_box` and adds it to your selection options.

