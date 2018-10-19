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

//var trimFields = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'subgenus', 'species', 'subspecies']

//var trimFields = ['authorship', 'accepted_species_author']

//cleaningFuncs.trimStrings(trimFields).then( _ => {console.log('trim strings complete')}).catch(err => {console.log(': ' + err)})

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

//cleaningFuncs.addMissingHigherTaxa().then( _ => console.log('Higher taxa cleaning complete')).catch(err => {console.log(': ' + err)})

//cleaningFuncs.removeDuplicates().then( _ => console.log('Finished removing duplicates')).catch(err => {console.log(': ' + err)})

//cleaningFuncs.showUniqueChars('Authorship').then( _ => {console.log('unique chars complete')}).catch(err => {console.log(': ' + err)})

//cleaningFuncs.replaceSpecialChars('accepted_species_author', 'taxon').then( _ => {console.log('special character replacement complete')}).catch(err => {console.log(': ' + err)})

//cleaningFuncs.replaceSuperscript('n','ü','Authorship','taxon').then( _ => {console.log('superscript replacement complete')}).catch(err => {console.log(': ' + err)})

var lines
cleaningFuncs.readMissingTaxaLog().then(res => lines = res).catch(err=> console.log('there was an error'))

var x = 2