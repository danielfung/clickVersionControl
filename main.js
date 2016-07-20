var fs = require("fs");
var unzip = require('unzip')
var path = require('path')
var mkdir = require('mkdirp')

var dirPath = './Data/';  //directory path
var fileType = '.zip'; //file extension
var files = [];
fs.readdir(dirPath, function(err,list){
    if(err) throw err;
    for(var i=0; i<list.length; i++)
    {
        if(path.extname(list[i])===fileType)
        {
            files.push(list[i]); //store the file name into the array files
        }
    }
    for(var i=0; i < list.length; i++) {
      var folderName = path.basename( list[i],'.zip')
      console.log(folderName);
      fs.createReadStream(dirPath+list[i])
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
        } else {
          entry.autodrain();
        }
      });

    }
});
