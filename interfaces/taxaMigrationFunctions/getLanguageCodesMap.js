var fs = require('fs')
var csv = require('fast-csv')

module.exports = async function(languagescsv) {

  try{
    var lang = await getCSV(languagescsv)
  }
  catch(err) {
    throw err
  }

  //codesmap is an object with key as the three letter code and the value as the two letter code
  var codesmap = {}

  for (var i = 1; i < lang.length; i++) {
    var threeletter = lang[i][4]
    var twoletter = lang[i][3]
    codesmap[threeletter] = twoletter
  }

  return codesmap

}

function getCSV(csvfile){
  return new Promise((resolve, reject) => {
    var stream = fs.createReadStream(csvfile);

    var arr = []
    var csvStream = csv( {header: true, objectMode: true} )
        .on("data", function(data){
            arr.push(data);
        })
        .on("end", function(){
            resolve(arr)
        })
        .on('error', function(err) {
          reject(err)
        });

    stream.pipe(csvStream);
  })
}

