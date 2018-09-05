var fs = require('fs')
const {promisify} = require('util');
const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);
const {QueryTypes} = require('sequelize')

var mssqldb = 'zodatsa_backbone'
var mssqlhost = 'localhost'

const sqlserver = require(process.cwd() + '/interfaces/sqlserver/sqlserverInterface.js')(mssqldb, mssqlhost)

//get the disciplines manually for disciplineTaxa.txt (copy paste)


readFile('./scripts/disciplineTaxa.txt', 'utf8').then(async data => {

  var qryParamObjects = []
  var lines = data.split('\r\n')
  var results = []
  for (var line of lines) {
    
    if (line == "Taxa	Rank") continue //for the header row

    var parts = line.split('\t')
    var taxonNames = parts[0].split(',')
    var quotedNames = []
    for (var name of taxonNames) {
      quotedNames.push('\'' + name.trim() + '\'')
    }
    nameString = quotedNames.join(',')

    rank = parts[1].trim()

    qryParamObjects.push( {
      taxonNames: nameString,
      rank: rank
    })

  }

  
  for (var params of qryParamObjects){
    var taxonCountSQL = `SELECT COUNT(*) FROM taxon WHERE [${params.rank}] IN (${params.taxonNames})`
    var validCountSQL = `SELECT COUNT(*) FROM taxon WHERE [${params.rank}] IN (${params.taxonNames}) AND taxon.taxonstatus = 'accepted name'`

    try {
      var taxonCount = await sqlserver.query(taxonCountSQL, {type: QueryTypes.SELECT})
      var validCount = await sqlserver.query(validCountSQL, {type: QueryTypes.SELECT})
    }
    catch(err) {
      console.log('error getting counts for ' + params.taxonNames)
    }

    results.push({
      taxonCount: taxonCount[0][""],
      validCount: validCount[0][""]
    })
    
  }

  result = results
  console.log('all counts fetched')

  //write to file
  console.log('writing results to file')
  var fileName = 'scripts/disciplineTaxonCounts.txt'
  await appendFile(fileName, 'Taxon Count' + '\t' + 'ValidCount' + '\r\n')
  for (var result of results){
    await appendFile(fileName, result.taxonCount + '\t' + result.validCount + '\r\n')
  }
  

  //print them
  console.log('Taxon Count' + '\t\t\t' + 'ValidCount')
  for (var result of results) {
    console.log(result.taxonCount + '\t\t\t\t' + result.validCount)
  }

  console.log('all done')

}).catch(err => { 
  console.log(err) 
})



