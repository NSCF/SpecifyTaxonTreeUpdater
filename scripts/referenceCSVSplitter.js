var fs = require('fs')
var csv = require('fast-csv')

var stream = fs.createReadStream(process.cwd() + '/temp/references.csv', {encoding: 'utf-8'});


var dataArray = []
var csvStream = csv({ headers: true })
    .on("data", function(data){
      dataArray.push(data)
    })
    .on("end", function(){
      console.log("done reading data");

      var start = 0
      var div = 4000
      var fileNum = 1
      var totalFiles = Math.ceil(dataArray.length/4000)
      while (start < dataArray.length) {
        console.log(`Writing file ${fileNum}`)
        
        var writeData = dataArray.slice(start, div)
      
        var ws = fs.createWriteStream(process.cwd() + `/temp/references_slice${fileNum}.csv`, { encoding: "utf8" });
        function finishMessage(num, totalFiles) {
            return function() {
              console.log(`File ${num} finished`)
              if (num == totalFiles) console.log('Remember to save as ANSI in Notepad if you want to use these for Specify!!!')
          }
        } //a closure
        
        ws.on('finish', finishMessage(fileNum));

        csv
          .write(writeData, { headers: true })
          .pipe(ws);

        start = div + 1
        fileNum++
        div = fileNum * 4000

      }
        
    });

    console.log('reading csv')
stream.pipe(csvStream);