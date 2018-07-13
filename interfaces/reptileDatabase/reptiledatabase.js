//node modules
const fs = require('fs')
const iconv = require('iconv-lite');
const replaceStream = require('replacestream');

//my modules
const parser = require('./taxonParser')
const transformer = require('./taxonTransformer')

//main
const filepath = 'C:\\Users\\engelbrechti\\Google Drive\\SANBI NSCF\\NSCF Data WG\\Current projects\\Checklist standardization\\Global lists\\Reptile database\\reptile_database_2018_02\\'
const inputFile = filepath + 'reptile_database_2018_02_small.txt'
//const outputFile = filepath + 'reptile_database_2018_02_replacements.txt'

/*
//This is only for checking if the string replacements work
var writeStream = fs.createWriteStream(outputFile);

writeStream.on('error', function(err){
    console.log('error in write stream: ' + err);
})
writeStream.on('finish', function(){
    console.log('file write complete')
});
*/

var reptileDatabase = []; //this is populated in the transformer


//add the function to populate reptileDatabase
transformer.on('readable', function(){
  while(row = transformer.read()){
    reptileDatabase.push(row);
  }
});

// run the transformation
    fs.createReadStream(inputFile)
    .pipe(iconv.decodeStream('ucs2'))
    .pipe(replaceStream(String.fromCharCode(29), '')) //GS character
    .pipe(replaceStream(String.fromCharCode(11), '|')) //VT character
    .pipe(replaceStream(new RegExp('\d(´)','g'), '$1\''))
    //.pipe(replaceStream(String.fromCharCode(0), '')) //NUL - not needed it seems
    //.pipe(writeStream);null;
    .pipe(parser)
    .pipe(transformer);null;