// Updated 25 July 2017

var GS1_Prefixes = {
    
    // https://www.gs1.org/company-prefix

    // BEWARE company prefixes are saved as numbers! (Asuming a three digit string)
    // The parsed string (0 - 19) means '000' – '019' and not '0000' – '0019'

    companyPrefixes: [
        [   0,   0,  "Unused"], // to avoid collision with GTIN-8
        [   1,  19,  "UPC-A United States and Canada"],
        [  20,  29,  "UPC-A Restricted distribution"],
        [  30,  39,  "UPC-A United States Drugs"],
        [  40,  49,  "UPC-A Restricted"],
        [  50,  59,  "UPC-A Coupons"],
        [  60,  99,  "UPC-A United States and Canada"],
        [ 100, 139,  "United States"],
        [ 200, 299,  "Restricted distribution"],    // (MO defined)
        [ 300, 379,  "France and Monaco"],
        [ 380, 380,  "Bulgaria"],
        [ 383, 383,  "Slovenia"],
        [ 385, 385,  "Croatia"],
        [ 387, 387,  "Bosnia and Herzegovina"],
        [ 389, 389,  "Montenegro"],
        [ 390, 390,  "Kosovo"],
        [ 400, 440,  "Germany"],
        [ 450, 459,  "Japan"],
        [ 460, 469,  "Russia"],
        [ 470, 470,  "Kyrgyzstan"],
        [ 471, 471,  "Taiwan"],
        [ 474, 474,  "Estonia"],
        [ 475, 475,  "Latvia"],
        [ 476, 476,  "Azerbaijan"],
        [ 477, 477,  "Lithuania"],
        [ 478, 478,  "Uzbekistan"],
        [ 479, 479,  "Sri Lanka"],
        [ 480, 480,  "Philippines"],
        [ 481, 481,  "Belarus"],
        [ 482, 482,  "Ukraine"],
        [ 483, 483,  "Turkmenistan"],
        [ 484, 484,  "Moldova"],
        [ 485, 485,  "Armenia"],
        [ 486, 486,  "Georgia"],
        [ 487, 487,  "Kazakhstan"],
        [ 488, 488,  "Tajikistan"],
        [ 489, 489,  "Hong Kong"],
        [ 490, 499,  "Japan"],
        [ 500, 509,  "United Kingdom"],
        [ 520, 521,  "Greece"],
        [ 528, 528,  "Lebanon"],
        [ 529, 529,  "Cyprus"],
        [ 530, 530,  "Albania"],
        [ 531, 531,  "Macedonia"],
        [ 535, 535,  "Malta"],
        [ 539, 539,  "Republic of Ireland"],
        [ 540, 549,  "Belgium and Luxembourg"],
        [ 560, 560,  "Portugal"],
        [ 569, 569,  "Iceland"],
        [ 570, 579,  "Denmark, Faroe Islands and Greenland"],
        [ 590, 590,  "Poland"],
        [ 594, 594,  "Romania"],
        [ 599, 599,  "Hungary"],
        [ 600, 601,  "South Africa"],
        [ 603, 603,  "Ghana"],
        [ 604, 604,  "Senegal"],
        [ 608, 608,  "Bahrain"],
        [ 609, 609,  "Mauritius"],
        [ 611, 611,  "Morocco"],
        [ 613, 613,  "Algeria"],
        [ 615, 615,  "Nigeria"],
        [ 616, 616,  "Kenya"],
        [ 618, 618,  "Ivory Coast"],
        [ 619, 619,  "Tunisia"],
        [ 620, 620,  "Tanzania"],
        [ 621, 621,  "Syria"],
        [ 622, 622,  "Egypt"],
        [ 623, 623,  "Brunei"],
        [ 624, 624,  "Libya"],
        [ 625, 625,  "Jordan"],
        [ 626, 626,  "Iran"],
        [ 627, 627,  "Kuwait"],
        [ 628, 628,  "Saudi Arabia"],
        [ 629, 629,  "United Arab Emirates"],
        [ 640, 649,  "Finland"],
        [ 690, 699,  "China"],
        [ 700, 709,  "Norway"],
        [ 729, 729,  "Israel"],
        [ 730, 739,  "Sweden"],
        [ 740, 740,  "Guatemala"],
        [ 741, 741,  "El Salvador"],
        [ 742, 742,  "Honduras"],
        [ 743, 743,  "Nicaragua"],
        [ 744, 744,  "Costa Rica"],
        [ 745, 745,  "Panama"],
        [ 746, 746,  "Dominican Republic"],
        [ 750, 750,  "Mexico"],
        [ 754, 755,  "Canada"],
        [ 759, 759,  "Venezuela"],
        [ 760, 769,  "Switzerland and Liechtenstein"],
        [ 770, 771,  "Colombia"],
        [ 773, 773,  "Uruguay"],
        [ 775, 775,  "Peru"],
        [ 777, 777,  "Bolivia"],
        [ 778, 779,  "Argentina"],
        [ 780, 780,  "Chile"],
        [ 784, 784,  "Paraguay"],
        [ 786, 786,  "Ecuador"],
        [ 789, 790,  "Brazil"],
        [ 800, 839,  "Italy, San Marino and Vatican City"],
        [ 840, 849,  "Spain and Andorra"],
        [ 850, 850,  "Cuba"],
        [ 858, 858,  "Slovakia"],
        [ 859, 859,  "Czech Republic"],
        [ 860, 860,  "Serbia"],
        [ 865, 865,  "Mongolia"],
        [ 867, 867,  "North Korea"],
        [ 868, 869,  "Turkey"],
        [ 870, 879,  "Netherlands"],
        [ 880, 880,  "South Korea"],
        [ 884, 884,  "Cambodia"],
        [ 885, 885,  "Thailand"],
        [ 888, 888,  "Singapore"],
        [ 890, 890,  "India"],
        [ 893, 893,  "Vietnam"],
        [ 896, 896,  "Pakistan"],
        [ 899, 899,  "Indonesia"],
        [ 900, 919,  "Austria"],
        [ 930, 939,  "Australia"],
        [ 940, 949,  "New Zealand"],
        [ 950, 950,  "GS1 Global Office"],      // Special applications
        [ 951, 951,  "EPCglobal"],              // Special applications
        [ 955, 955,  "Malaysia"],
        [ 958, 958,  "Macau"],
        [ 960, 960,  "GS1 UK"],
        [ 961, 969,  "GS1 Global Office"],      // GTIN-8
        [ 977, 977,  "ISSN"],
        [ 978, 978,  "ISBN"],
        [ 979, 979,  "ISMN"],
        [ 980, 980,  "Refund receipt"],
        [ 981, 984,  "Coupon"],                 // Common Currency 
        [ 990, 999,  "Coupon"]
    ],

    getPrefixInfo : function ( prefix ) {
        // Param prefix: String of 3 digits
        var p = parseInt( prefix );
    
        for (var i = this.companyPrefixes.length-1; i >= 0; i--) {
            if(p >= this.companyPrefixes[i][0] && p <= this.companyPrefixes[i][1]) {
                return this.companyPrefixes[i][2];
            }
        }

        // Prefixes not listed above are reserved by 
        // GS1 Global Office for allocations in non-member 
        // countries and for future use.
        return "Reserved";
    }
}