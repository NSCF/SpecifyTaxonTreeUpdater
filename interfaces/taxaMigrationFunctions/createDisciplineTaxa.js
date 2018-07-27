const util = require('util');
const fs = require('fs');

const appendFile = util.promisify(fs.appendFile)

var {QueryTypes} = require('sequelize')
var createTaxonData = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createTaxonData')
var createChildTaxa = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createChildTaxa')
var addAcceptedTaxonIDs = require(process.cwd() + '/interfaces/taxaMigrationFunctions/addAcceptedTaxonIDs')
var addNodeNumbers = require (process.cwd() + '/interfaces/taxaMigrationFunctions/addNodeNumbers')
var saveTaxonTree = require (process.cwd() + '/interfaces/taxaMigrationFunctions/saveTaxonTree')

module.exports = async function createDisciplineTaxa(disciplineName, taxaDefs, specify, mssqldb, userName) {
  if (!disciplineName || !taxaDefs || !Array.isArray(taxaDefs) || !taxaDefs.length > 0){
    console.log('Invalid input parameters')
    return
  }

  //check we have valid taxaDefs
  if (taxaDefs.some(def =>{ Object.keys(def).length != 1 })) {
    console.log('Invalid taxaDefs parameter. taxaDefs must be an array of { rank: taxonName } objects')
    return
  }

  var dtString = new Date().toISOString().split('.')[0].replace('T','').replace(/-/g,'').replace(/:/g,'')
  const logFile = process.cwd() + '/logs/taxaMigration/' + disciplineName + dtString + '.log'

  //get the column names from sql server
  //get the taxa from the zodatsa db
  try {
    var oneRow = await mssqldb.query(`SELECT top 1 * FROM taxon`, { type: QueryTypes.SELECT} )
  }
  catch(err){
    console.log('Error getting taxa from zodatsa database')
    throw err
  }
  var cols = Object.keys(oneRow[0])
  var scientificNameindex = cols.indexOf('scientificName')
  cols = cols.slice(0, scientificNameindex)
  for (var def of taxaDefs){
    var key = Object.keys(def)[0]
    if (!cols.includes(key)){
      console.log('Invalid taxaDefs parameter. taxaDefs must be an array of { rank: taxonName } objects')
    }
  }

  //get the userAgent
  try {
    var user = await specify.getUserAgent(userName)
  } 
  catch(err) {
    throw err
  }

  var userAgent = user.agent

  //make sure the user is signed in and has permission to modify taxonomy
  if (user){
    if (!user.IsLoggedIn || user.UserType != 'FullAccess'){
      throw new Error('User must be logged into Specify and be of type Manager')
    }
  }
  else {
    throw new Error('no user found with user name ' + username)
  }

  
  //get the treedef and the treedef items
  try {
    var treeDef = await specify.getTreeDef(disciplineName)
  } 
  catch(err) {
    console.log('Error find discipline record for ' + disciplineName)
    throw err
  }

  //get the root taxon
  try {
    var rootTaxon = await specify.getRootTaxon(treeDef)
  }
  catch(err){
    console.log('Error getting root taxon for ' + disciplineName)
    throw err
  }
  rootTaxon.children = []

  //delete any taxa that exist there already, except for the root
  try {
    var destroyed = await specify.deleteTaxa( treeDef )
  }
  catch(err) {
    console.log('error deleting existing taxa for this discipline')
    throw err
  }

  if (destroyed && destroyed > 0)  {
    var plural
    if (destroyed == 1) {
      plural = 'taxon'
    }
    else {
      plural = 'taxa'
    }
    console.log(destroyed + ' ' + plural + ' ' + 'deleted')
  }

  var synonymErrors = []

  //The data migration for accepted taxa
  for (def of taxaDefs) {

    var highestDisciplineRank = Object.keys(def)[0]
    var highestRankTaxonName = def[highestDisciplineRank]

    //get the taxa from the zodatsa db
    console.log('fetching zodatsa taxa for ' + highestDisciplineRank + ' ' + highestRankTaxonName)
    try {
      var zodatsaTaxa = await mssqldb.query(`SELECT * FROM taxon WHERE [${highestDisciplineRank}] = '${highestRankTaxonName}'`, { type: QueryTypes.SELECT})
    }
    catch(err){
      console.log('Error getting taxa from zodatsa database')
      throw err
    }

    //create the Specify record for this starting taxon
    var taxonData = createTaxonData(zodatsaTaxa[0], highestDisciplineRank, treeDef, rootTaxon, userAgent)

    try {
      var firstHigherTaxonArry = await specify.createTaxa([taxonData], treeDef, rootTaxon.name)
    }
    catch(err){
      throw err
    }

    var firstHigherTaxon = firstHigherTaxonArry[0]

    //specifyTaxon is now the higherTaxon. Get the children and create the Specify records
    //this creates everything recursively
    //this does the accepted taxa only
    try {
      await createChildTaxa(firstHigherTaxon, zodatsaTaxa, treeDef, specify, userAgent)
    }
    catch(err) {
      throw(err)
    }
    
    rootTaxon.children.push(firstHigherTaxon)

  }

  //add the synonyms
  try {
    var errors = await addAcceptedTaxonIDs(rootTaxon)
    synonymErrors.push.apply(synonymErrors, errors)
  }
  catch(err){
    throw err
  }

  if (synonymErrors.length > 0) {
    try {
      await appendFile(logFile, 'SYNONYM ERRORS:\r\n' + JSON.stringify(synonymErrors))
    }
    catch(err){
      console.log('error writing to logfile: ' + err)
    }
  }


  //add the node numbers
  var numberTracker = { number: 1 }
  addNodeNumbers(rootTaxon, numberTracker)

  //save the tree
  try {
    var saveErrors = await saveTaxonTree(rootTaxon)
  }
  catch(err) {
    throw err //this shouldnt happen
  }

  if (saveErrors.length > 0) {
    console.log('There were errors saving to the database')
    try {
      await appendFile(logFile, 'SAVE ERRORS:\r\n' + JSON.stringify(saveErrors))
    }
    catch(err){
      console.log('error writing to logfile: ' + err)
    }
  }

  //we should be done
  return

}//taxaDefs is an array of { rank: taxonName } objects