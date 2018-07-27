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

var checkColumnsTitleCase = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'subgenus']

cleaningFuncs.removeSingleQuotes(checkColumnsTitleCase)
  .then(_ => {
    console.log('Single quotes removal complete')
    cleaningFuncs.addMissingHigherTaxa().then( _ => console.log('Higher taxa cleaning complete')).catch(err => {throw err})
  })
  .catch(err => {console.log(': ' + err)})