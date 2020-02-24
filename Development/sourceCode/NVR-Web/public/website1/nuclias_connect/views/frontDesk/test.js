/**
 * Created by chencheng on 17-11-22.
 */
'use strict';
var ipp = require('ipp');
var PDFDocument = require('pdfkit');
var blobStream = require('blob-stream');

exports.Generate = function (req, res) {

    var printer = ipp.Printer("http://NPI977E4E.local.:631/ipp/printer");
    var doc = new PDFDocument({margin:0});
    doc.text(".", 0, 780);
    console.log('ccccc');
    /*
     doc.pipe(function(pdf){
     console.log('ccc');
     var printer = ipp.Printer("http://NPI977E4E.local.:631/ipp/printer");
     console.log('cccc');
     var msg = {
     "operation-attributes-tag": {
     "requesting-user-name": "William",
     "job-name": "My Test Job",
     "document-format": "application/pdf"
     },
     data: pdf
     };
     printer.execute("Print-Job", msg, function(err, res){
     console.log(res);
     });
     });
     */
    var stream = doc.pipe(blobStream());
    console.log('ccc');

    var printer = ipp.Printer("http://cp02.local.:631/ipp/printer");
    console.log('cccc');
    var msg = {
        "operation-attributes-tag": {
            "requesting-user-name": "Bumblebee",
            "job-name": "whatever.pdf",
            "document-format": "application/pdf"
        },
        "job-attributes-tag":{
            "media-col": {
                "media-source": "tray-2"
            }
        }
        , data: stream
    };
    console.log('ccccc');
    printer.execute("Print-Job", msg, function(err, res){
        console.log(err);
        console.log(res);
    });

}

Generate();