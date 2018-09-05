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