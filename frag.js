var fs = require("fs");
var saxParser = require('sax').createStream(true);
var saxPath = require('saxpath');
var path = require('path');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

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

var store = 'IACUC';
checkDirectorySync('./'+store);
var folders = getDirectories('./extract');
folders.forEach(function(value){
  var dataURL = './extract/'+value+'/ImportExport.xml';
  var fileStream = fs.createReadStream(dataURL);
  var streamer = new saxPath.SaXPath(saxParser, '//method');
  streamer.on('match', function(xml) {
    doc = new dom().parseFromString(xml);
    definingType = xpath.select1("/method/@definingType", doc).value;
    methodname = xpath.select1("/method/@methodname", doc).value;
    console.log(methodname);
    checkSubDirectorySync('./'+store+'/'+definingType, definingType, methodname, xml);
  });
  fileStream.pipe(saxParser);
});
