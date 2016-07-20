var fs = require("fs");
var unzip = require('unzip');
var path = require('path');
var mkdir = require('mkdirp');
var EventEmitter=require('events').EventEmitter;
var filesEE=new EventEmitter();

var zipFileArray = [];

fs.readdir('./Data',function(err,files){
  if(err) throw err;
  files.forEach(function(file){
    zipFileArray.push(file);
  });
  filesEE.emit('files_ready');
});

filesEE.on('files_ready',function(){
  zipFileArray.forEach(function(value){
    var dirPath = './Data/';
    var folderName = path.basename(value,'.zip')
    fs.createReadStream(dirPath+value)
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        var fileName = entry.path;
        var type = entry.type; // 'Directory' or 'File'
        var size = entry.size;
        if (fileName === "importExport\\ImportExport.xml") {
          var fullPath = __dirname + '/Data/' + folderName
          fileName = path.basename( fileName )
          mkdir.sync(fullPath)
          entry.pipe(fs.createWriteStream( fullPath + '/' + fileName ))
        }
        else {
          entry.autodrain();
        }
    });
  });
});
