//node modules
var transform = require('stream-transform');


//my modules
const splitSynonyms = require('./splitSynonyms.js')
const splitSubspecies = require('./splitSubspecies.js')
const replaceCoordinateSymbols = require('./replaceCoordinateSymbols.js')

var transformer = transform(function(record){
    
  //sort out the grouped fields first
  var distrSplit = replaceCoordinateSymbols(record[9]).split('||')
  var distribution = distrSplit[0];
  var typeLocality = distrSplit[1].replace('Type locality: ', '')

  var subSpecies = splitSubspecies(record[7])
  
  var taxonObj = { 
      "higherClass" : record[0]
      , "genus" : record[1]
      , "species" : record[2]
      , "authorName" : record[3]
      , "authorYear" : record[4]
      , "authorParenthesis" : record[5]
      , "synonyms" : splitSynonyms(record[6], record[1] + ' ' + record[2])
      , "subspecies" : subspecies
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

transformer.on('error', function(err){
    console.log('error in transformer: ' + err)
})

transformer.on('finish', function(){
    console.log('transformer finished')
})

module.exports = transformer