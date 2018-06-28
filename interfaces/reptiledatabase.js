const fs = require('fs')
const parse = require('csv-parse');
var transform = require('stream-transform');
const iconv = require('iconv-lite');
var replaceStream = require('replacestream');

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


var reptileDatabase = [];

var parser = parse({delimiter: '\t', skip_empty_lines: true, relax: true}); // we need relax to deal with the line error problem

parser.on('error', function(err){
    console.log('error in parser: ' + err)
})

parser.on('finish', function(){
    console.log('parser finished')
})

var replaceCoordinateSymbols = function(str) {

  return str
  .replace(new RegExp('º', 'g'), '°')
  .replace(new RegExp('´', 'g'), '\'')
  .replace(new RegExp('ʹ', 'g'), '\'')

} //standardizes symbols for degrees, minutes, and seconds

var splitSynonyms = function(synString){
  if (synString != '') {
    var synonymsSplit = synString.split('|')
    var synRegex = new RegExp('((?: ?[A-Z]?[a-z]+)+)(\b[A-Z\&, ]+\b)(\d{4})')
    var synObjects = []
    var synErrors = []
    synonymsSplit.forEach(function(syn) {
      if (synRegex.test(syn)) {
        var match = syn.match(synRegex)
        var synObj = {
          "taxon" : match[1].replace(/ {2,}/g, ' ')
          , "author" : match[2]
          , "year" : match[3]
          , "page" : match[4] || null
        }

        synObjects.push(synObj)
      }
      else {
        synErrors.push(syn)
      }
    })

    return {
      synonyms: synObjects,
      synonymErrors: synErrors
    }

  }
  else {
    return null;
  }
    
}

var splitSubspecies = function(subspeciesString) {
  if (subspeciesString != '') {
    var sspSplit = subspeciesString.split('|')
    var sspRegex = new RegExp('([A-Z, a-z]+) +([A-Z, \&]+) +(\d{4})\:? +(\d+)?')
    var sspObjects = []
    var sspErrors = []
    sspSplit.forEach(function(ssp) {
      if (synRegex.test(ssp)) {
        var match = ssp.match(sppRegex)
        var sspObj = {
          "taxon" : match[1].replace(/ {2,}/g, ' ')
          , "author" : match[2]
          , "year" : match[3]
          , "page" : match[4] || null
        }

        sspObjects.push(sspObj)
      }
      else {
        sspErrors.push(ssp)
      }
    })

    return {
      subspecies: sspObjects,
      subpseciesErrors: sspErrors
    }

  }
  else {
    return null
  }
}


var transformer = transform(function(record){
    
  //sort out the grouped fields first
  var distrSplit = replaceCoordinateSymbols(record[9]).split('||')
  var distribution = distrSplit[0];
  var typeLocality = distrSplit[1].replace('Type locality: ', '')
  
  var taxonObj = { 
      "higherClass" : record[0]
      , "genus" : record[1]
      , "species" : record[2]
      , "authorName" : record[3]
      , "authorYear" : record[4]
      , "authorParenthesis" : record[5]
      , "synonyms" : splitSynonyms(record[6])
      , "subspecies" : splitSubspecies(record[7])
      , "commonNames" : record[8]
      , "distribution" :  distribution
      , "typeLocality" : typeLocality
      , "comments" : record[10]
      , "typeSpecimens" :  replaceCoordinateSymbols(record[12])
      , "links" : record[13]
      , "referencenumbers" : record[14]
      , "etymology" : record[15]
      , "code" : record[16]
      , "reproductiveMode" : record[17]
    };
  
    return taxonObj;
  
})

transformer.on('readable', function(){
  while(row = transformer.read()){
    reptileDatabase.push(row);
  }
});

transformer.on('error', function(err){
    console.log('error in transformer: ' + err)
})

transformer.on('finish', function(){
    console.log('transformer finished')
})


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