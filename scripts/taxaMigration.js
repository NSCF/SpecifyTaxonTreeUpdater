//make sure the data are cleaned first

var createDisciplineTaxa = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createDisciplineTaxa.js')
var showDisciplines = require(process.cwd() + '/interfaces/taxaMigrationFunctions/showDisciplines.js')

var specifydb = 'up';
var specifyhost = 'localhost';
var user = 'ian'
var pwd = 'regalis'

var mssqldb = 'zodatsa_test'
var mssqlhost = 'localhost'

const sqlserver = require(process.cwd() + '/interfaces/sqlserver/sqlserverInterface.js')(mssqldb, mssqlhost)
const specify = require(process.cwd() + '/interfaces/specify/specifyInterface.js')(specifydb, specifyhost, user, pwd)


//var t = showDisciplines(specify).then().catch(err => console.log(err))

var taxaDefs = [ {Phylum: 'Arthropoda'}]


var t = createDisciplineTaxa('test', taxaDefs, specify, sqlserver, 'ian').catch(err => {
  console.log(err.message)
})