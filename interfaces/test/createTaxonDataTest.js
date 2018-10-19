
var createTaxonData = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createTaxonData')

var mssqldb = 'zodatsa_backbone'
var mssqlhost = 'localhost'

const sqlserver = require(process.cwd() + '/interfaces/sqlserver/sqlserverInterface.js')(mssqldb, mssqlhost)

var specifydb = 'taxbackbone';
var specifyhost = 'localhost';
var user = 'ian'
var pwd = 'regalis'

const specify = require(process.cwd() + '/interfaces/specify/specifyInterface.js')(specifydb, specifyhost, user, pwd)

var disciplineName = 'Reptiles'
var userName = 'ian'
var whereTaxon = {Class: 'Reptilia'}

require(process.cwd() + '/interfaces/taxaMigrationFunctions/getLanguageCodesMap')(process.cwd() + '/temp/lang_codes.csv')
.then(langCodesMap => {
  specify.getUserAgent(userName)
  .then(userAgent => {
    //get the treedef and the treedef items
    specify.getTreeDef(disciplineName)
    .then(treeDef => {
      
      //get the root taxon
      specify.getRootTaxon(treeDef)
      .then(rootTaxon => {
        
        //sql server search params
        var params = { 
          //raw: true,
          where: whereTaxon, 
          limit: 50,
          include:  [
            {model: sqlserver.SqlCommonName, as: 'commonNames'}, 
            {model: sqlserver.SqlDistribution, as: 'distribution'}, 
            {model: sqlserver.SqlReference, as: 'taxonReferences'}
          ]
        }
  
        sqlserver.getTaxa(params)
        .then(zodatsaTaxa => {
          try {
            var taxonData = []; 
            for (let zodatsaTaxon of zodatsaTaxa){
              taxonData.push(createTaxonData(zodatsaTaxon, 'Species', treeDef, rootTaxon, userAgent, langCodesMap))
            }
            
          }
          catch(err){
            throw(err)
          }
        
          var i = 2
        }) 
        .catch(err => {
          console.log('Error getting taxa from zodatsa database: ' + err)
        })
      })
      .catch(err =>{
        console.log('Error getting root taxon for ' + disciplineName + ': ' + err)
      })
    }) 
    .catch(err => {
      console.log('Error finding discipline record for ' + disciplineName + ': ' + err)
    })
  })
  .catch(err => {
    console.log('Error getting userAgent for ' + userName + ': ' + err)
  })
})
.catch(err => {
  console.log('Error getting languageCodes: ' + err)
})








