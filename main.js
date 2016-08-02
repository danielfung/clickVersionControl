var fs = require("fs");
var path = require('path');
var mkdir = require('mkdirp');
var AdmZip = require('adm-zip');
var xmldom = require('xmldom').DOMParser;
var util = require('util')
var spawnSync = require('child_process').spawnSync;
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();

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

function checkSubDirectorySync(directory, definingType, methodname, xml, store) {
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

function getImportExport(store, zipFile, folderName, _callback) {
  var sourceFile = require('./config.txt');
  var patchFolder = sourceFile.pathtoPatch;
  var dirPath = patchFolder;
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
          checkSubDirectorySync('./'+store+'/'+definingType, definingType, methodName, data, store);
      }
    }
  });
  fs.appendFileSync('./log'+store+'.txt', 'End Time:'+getDateTime()+'\n', {encoding:'utf8'});
  _callback();
}

function gatherData() {
  var sourceFile = require('./config.txt');
  var patchFolder = sourceFile.pathtoPatch;
  var files = fs.readdirSync(patchFolder)
                .map(function(v) {
                  return { name:v,
                    time:fs.statSync(patchFolder + v).mtime.getTime()
                  };
                })
                .sort(function(a, b) { return a.time - b.time; })
                .map(function(v) { return v.name; });

  files.forEach(function(zipFile){
    var time = fs.statSync(patchFolder + zipFile).mtime.getTime();
    var string = zipFile,
        substring = "Version";
    if(string.indexOf(substring) !== -1) {
      if(lastTime >= time) {
        // the late date modified is larger than current means we did it before
        // do nothing
        console.log("There's no new files found");
      }
      else {
        // the current time is larger than last time means its a new file
        // update the time
        fs.writeFileSync('./config.txt', 'module.exports = { storename:"'+store+'", lastdate:"'+time+'", pathtoPatch:"'+patchFolder+'", cronTime:"'+cronTimer+'" };');
        lastTime = time;
        fs.appendFileSync('./log'+store+'.txt', '\n------------------ New Start -----------------\n', {encoding:'utf8'});
        fs.appendFileSync('./log'+store+'.txt', 'Start Time:'+getDateTime()+'\n', {encoding:'utf8'});
        fs.appendFileSync('./log'+store+'.txt', 'zip => '+zipFile+'\n', {encoding:'utf8'});

        var folderName = path.basename(zipFile,'.zip');
        getImportExport(store, zipFile, folderName, function(){
          fs.writeFileSync('./push.bat',' git checkout -b '+store+'\n git checkout '+store+ '\n git push --set-upstream origin '+store+'\n git add .\n git commit -m "'+folderName+'"\n git push \n');
          var r = spawnSync('cmd.exe', ['/c', 'push.bat']);
          console.log(r.stdout.toString());
        });
      }
    }
    else {
      // do nothing, not an Version
    }
  });
}

var sourceFile = require('./config.txt');
var lastTime = sourceFile.lastdate;
var store = sourceFile.storename;
var cronTimer = sourceFile.cronTime;

var j =schedule.scheduleJob(cronTimer, function(){
  gatherData();
});

j;
