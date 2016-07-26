var fs = require("fs");
var unzip = require('unzip');
var path = require('path');
var mkdir = require('mkdirp');
var saxParser = require('sax').createStream(true);
var saxPath = require('saxpath');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
require('events').EventEmitter.defaultMaxListeners = Infinity;

/* ------------------------------------------------------------------------- */
                          /* Globals */
var store = 'IACUC';

/* ------------------------------------------------------------------------- */

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
    fs.readdir('./extract/'+store, function(err, verfiles) {
      verfiles.sort(function(a, b) {
          return a < b ? -1 : 1;
      });
      var j = 0;
      while(j < 2){
        checkDirectorySync('./'+store);
        var dataURL = './extract/'+store+'/'+verfiles[j]+'/ImportExport.xml';
        console.log('Now dealing with '+dataURL);
        var fileStream = fs.createReadStream(dataURL);
        var streamer = new saxPath.SaXPath(saxParser, '//method');
        streamer.on('match', function(xml) {
          console.log('Now dealing with xml');
          doc = new dom().parseFromString(xml, 'text/xml');
          definingType = xpath.select1("//method/@definingType", doc).value;
          methodname = xpath.select1("//method/@methodname", doc).value;
          checkSubDirectorySync('./'+store+'/'+definingType, definingType, methodname, xml);
        });
        j++;
      }
    });
    });
}


function getImportExport(_callback) {
  var i = 0;
  var dirPath = './Data-'+store+'/';
  fs.readdir(dirPath, function(err, files) {
    files.forEach(function(file, key) {
      //console.log('unzip: store => '+store+"   file => "+file);
      var folderName = path.basename(file,'.zip')
      fs.createReadStream(dirPath+file)
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        var fileName = entry.path;
        var type = entry.type;
        var size = entry.size;
        if (fileName === "importExport\\ImportExport.xml") {
          i++;
          var fullPath = __dirname+'/extract/'+store+'/'+folderName
          fileName = path.basename(fileName)
          mkdir.sync(fullPath)
          var w = entry.pipe(fs.createWriteStream(fullPath+'/'+fileName ));
          w.on('finish', function(){
            _callback();
          });
        }
        else {
          entry.autodrain();
        }
      });
    });
  });
}

parseImportExport();
