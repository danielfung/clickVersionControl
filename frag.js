var fs = require("fs");
var path = require('path');
var mkdir = require('mkdirp');
var AdmZip = require('adm-zip');
var xmldom = require('xmldom').DOMParser;

/* ------------------------------------------------------------------------- */
                          /* Globals */
var store = 'IACUC';

/* ------------------------------------------------------------------------- */

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
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

function getImportExport(zipFile, folderName) {
  var dirPath = './Data-'+store+'/';
  var zip = new AdmZip(dirPath+zipFile);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records
  zipEntries.forEach(function(zipEntry) {
    if (zipEntry.entryName == "importExport\\ImportExport.xml") {
      checkDirectorySync('./'+store);
      var xml = zip.readAsText("importExport\\ImportExport.xml");
      var tag, definingType, methodName;
      doc = new xmldom().parseFromString(xml, 'text/xml');
      tag = doc.getElementsByTagName('method');
      for(var i = 0; i < tag.length; i++) {
          methodName = tag[i].getAttribute('methodname');
          definingType = tag[i].getAttribute('definingType');
          data = doc.getElementsByTagName("method")[i].childNodes;
          checkSubDirectorySync('./'+store+'/'+definingType, definingType, methodName, data);
      }
    }
  });
}

var files = fs.readdirSync('./Data-'+store+'/')
              .map(function(v) {
                return { name:v,
                  time:fs.statSync('./Data-'+store+'/' + v).mtime.getTime()
                };
              })
              .sort(function(a, b) { return a.time - b.time; })
              .map(function(v) { return v.name; });

var sourceFile = require('./config'+store+'.txt');
files.forEach(function(zipFile){
  var time = fs.statSync('./Data-'+store+'/' + zipFile).mtime.getTime();
  var lastTime = sourceFile.lastdate;
  if(lastTime >= time) {
    // the late date modified is larger than current means we did it before
    // do nothing
  }
  else {
    // the current time is larger than last time means its a new file
    // update the time
    fs.writeFileSync('./config'+store+'.txt', 'module.exports = { lastdate : '+time+' };');
    fs.appendFileSync('./log'+store+'.txt', '\n------------------ New Start -----------------', {encoding:'utf8'});
    fs.appendFileSync('./log'+store+'.txt', 'Start Time:'+getDateTime()+'\n', {encoding:'utf8'});
    fs.appendFileSync('./log'+store+'.txt', 'zip => '+zipFile+'\n', {encoding:'utf8'});
    var folderName = path.basename(zipFile,'.zip');
    getImportExport(zipFile, folderName);
  }
});
