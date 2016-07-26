var fs = require("fs");
var unzip = require('unzip');
var path = require('path');
var mkdir = require('mkdirp');
var saxParser = require('sax').createStream(true);
var saxPath = require('saxpath');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

/* ------------------------------------------------------------------------- */
                          /* Globals */
var value = 'Version 0.0.8'+'.zip';
var store = 'IACUC';
var folderName = path.basename(value,'.zip')

/* ------------------------------------------------------------------------- */

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

function checkSubDirectorySync(directory, definingType, methodname, xml) {
  try {
    fs.statSync(directory);
    fs.writeFileSync('./'+store+'/'+definingType+'/'+methodname, '');
    fs.appendFileSync('./'+store+'/'+definingType+'/'+methodname, xml, {encoding:'utf8'});
  } catch(e) {
    fs.mkdirSync(directory);
    fs.appendFileSync('./'+store+'/'+definingType+'/'+methodname, xml, {encoding:'utf8'});
  }
}

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}

function parseImportExport() {
  getImportExport(function() {
        console.log('Finished unzipping');
        checkDirectorySync('./'+store);
        var dataURL = './extract/'+folderName+'/ImportExport.xml';
        var fileStream = fs.createReadStream(dataURL);
        var streamer = new saxPath.SaXPath(saxParser, '//method');
        streamer.on('match', function(xml) {
          doc = new dom().parseFromString(xml, 'text/xml');
          definingType = xpath.select1("//method/@definingType", doc).value;
          methodname = xpath.select1("//method/@methodname", doc).value;
          checkSubDirectorySync('./'+store+'/'+definingType, definingType, methodname, xml);
        });
        fileStream.pipe(saxParser);
    });
}


function getImportExport(_callback) {
  var dirPath = './Data/';
  fs.createReadStream(dirPath+value)
  .pipe(unzip.Parse())
  .on('entry', function (entry) {
    var fileName = entry.path;
    var type = entry.type;
    var size = entry.size;
    console.log(fileName);
    if (fileName === "importExport\\ImportExport.xml") {
      var fullPath = __dirname + '/extract/' + folderName
      fileName = path.basename(fileName)
      mkdir.sync(fullPath)
      var w = entry.pipe(fs.createWriteStream(fullPath + '/' + fileName ));
      w.on('finish', function(){
        _callback();
      });
    }
    else {
      entry.autodrain();
    }
  });
}

parseImportExport();
