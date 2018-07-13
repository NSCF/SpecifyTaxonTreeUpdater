var db = 'zodatsa_checklist';
var dbhost = 'localhost';

var cleaningFuncs = require('../interfaces/sqlserver/sqlCleaningFunctions.js')(db, dbhost)

cleaningFuncs.addMissingHigherTaxa()