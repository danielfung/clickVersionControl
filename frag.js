var fs = require("fs");
var saxParser = require('sax').createStream(true);
var saxPath = require('saxpath');
var path = require('path');

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}

checkDirectorySync("./parse");
var searchFor = 'nameMapping';
var folders = getDirectories('./extract');
folders.forEach(function(value){
  var dataURL = './extract/'+value+'/ImportExport.xml';
  var count = 0;
  var fileStream = fs.createReadStream(dataURL);
  var streamer = new saxPath.SaXPath(saxParser, '//'+searchFor);
  fs.exists('./parse/'+searchFor+'.xml', function(exists) {
    if (exists) {
      fs.writeFileSync('./parse/'+searchFor+'.xml', 0)
      streamer.on('match', function(xml) {
        fs.appendFileSync('./parse/'+searchFor+'.xml', xml, {encoding:'utf8'})
      });
      fileStream.pipe(saxParser);
    }
    else {
      streamer.on('match', function(xml) {
        fs.appendFileSync('./parse/'+searchFor+'.xml', xml, {encoding:'utf8'})
      });;
      fileStream.pipe(saxParser);
    }
  });
});
