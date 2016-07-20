var fs = require("fs");
var unzip = require('unzip')
var path = require('path')
var mkdir = require('mkdirp')

var zipFileArray = ['Version 0.0.63.zip', 'Version 0.0.62.zip']

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
