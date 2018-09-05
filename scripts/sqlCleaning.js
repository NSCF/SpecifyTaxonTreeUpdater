/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
VERY IMPORTANT BEFORE STARTING
Manual changes are required on the db as follows:
- change column names to appropriate case (especially for the taxon table), no spaces. Check models for what those column names should
- change table names to appropriate singular terms
- change Infraspecies to subspecies!!!! in the taxon table


!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/
var db = 'zodatsa_backbone';
var dbhost = 'localhost';

var cleaningFuncs = require('../interfaces/sqlserver/sqlCleaningFunctions.js')(db, dbhost)

var trimFields = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'subgenus', 'species', 'subspecies']

/*
console.log('staring data cleaning with removing quotes')
cleaningFuncs.removeSingleQuotes(trimFields).then(_ => {
  console.log('removing quotes complete, starting remove trim strings')
  cleaningFuncs.trimStrings(trimFields).then( _ => {
    console.log('trim strings complete, starting to add missing higher taxa')
    cleaningFuncs.addMissingHigherTaxa().then( _ => console.log('Higher taxa cleaning complete')).catch(err => {console.log(': ' + err)})
  }).catch(err => {console.log(': ' + err)})
}).catch(err => {console.log(': ' + err)})
*/
cleaningFuncs.addMissingHigherTaxa().then( _ => console.log('Higher taxa cleaning complete')).catch(err => {console.log(': ' + err)})