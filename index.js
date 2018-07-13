
//create the connection to Specify
var db = 'sptaxontree';
var dbhost = 'localhost';
var user = 'ian'
var pwd = 'regalis'

var specify = require('./interfaces/specify/specifyInterface')(db, dbhost, user, pwd)

//test it
var t = specify.authenticate().catch(err => {e = err; console.log(err.name)})

//get the user/agent details for your username
var username = 'ianicus'
var user = null
var t = specify.getUserAgent(username).then(result => user = result).catch(err => {console.log(err.name)})

//get the disciplines
var t = specify.getDisciplines().then(discs => console.log(discs)).catch(err=>console.log(err.name))

//get the taxonTreeDef for a discipline
var treeDef = null
var discipline = 'Reptiles'
var t = specify.getTreeDef(discipline).then(def => treeDef = def).catch(err=>console.log(err.name))

//Get the data from SQL Server

//create the sequelize connection to the MS SQL Server database
var db = 'zodatsa_checklist';
var dbhost = 'localhost';

const zodatsaTaxa = require('./dbconn/sqlserverconn.js')(db, dbhost)



