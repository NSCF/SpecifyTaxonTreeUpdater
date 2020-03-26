module.exports = function(db, dbhost, user, pwd) {

  const specify = require(process.cwd() + '/dbconn/specifyconn')(db, dbhost, user, pwd); //a Sequelizer instance

  var {Op, QueryTypes} = require('sequelize')

  //create the Specify models
  const SpecifyAgent = specify.import(process.cwd() + '/interfaces/specify/models/agent')
  const SpecifyCommonName = specify.import(process.cwd() + '/interfaces/specify/models/commonnametx')
  const SpecifyDiscipline = specify.import(process.cwd() + '/interfaces/specify/models/discipline')
  const SpecifyUser = specify.import(process.cwd() + '/interfaces/specify/models/specifyuser')
  const SpecifyTaxon = specify.import(process.cwd() + '/interfaces/specify/models/taxon')
  const SpecifyTaxonCitation = specify.import(process.cwd() + '/interfaces/specify/models/taxoncitation')
  const SpecifyTaxonTreeDef = specify.import(process.cwd() + '/interfaces/specify/models/taxontreedef')
  const SpecifyTaxonTreeDefItem = specify.import(process.cwd() + '/interfaces/specify/models/taxontreedefitem')

  //define the relationships
  SpecifyUser.hasOne(SpecifyAgent, {foreignKey: 'SpecifyUserID'})
  SpecifyTaxon.hasMany(SpecifyCommonName, {as : 'allCommonNames', foreignKey: 'taxonID' })
  SpecifyTaxon.belongsTo(SpecifyTaxonTreeDef,{as: 'treeDef', foreignKey: 'TaxonTreeDefID'})
  SpecifyTaxon.belongsTo(SpecifyTaxonTreeDefItem, {as: 'treeDefItem', foreignKey: 'TaxonTreeDefItemID'})
  SpecifyTaxon.belongsTo(SpecifyAgent, {as: 'createdBy', foreignKey: 'CreatedByAgentID'})
  SpecifyTaxon.belongsTo(SpecifyAgent, {as: 'modifiedBy', foreignKey: 'ModifiedByAgentID'})
  SpecifyTaxon.belongsTo(SpecifyTaxon, {as: 'parentTaxon', foreignKey: 'ParentID'})
  //SpecifyDiscipline.hasOne(SpecifyTaxonTreeDef, {as: 'treeDef', foreignKey: 'TaxonTreeDefID') //hasOne only supports sourceKey from V5.0.0 upwards, still to be released. See https://github.com/sequelize/sequelize/issues/8105
  SpecifyTaxonTreeDef.hasOne(SpecifyDiscipline, {as: 'discipline', foreignKey: 'TaxonTreeDefID'})
  SpecifyTaxonTreeDef.hasMany(SpecifyTaxonTreeDefItem, {as: 'treeDefItems', foreignKey: 'TaxonTreeDefID'})

  async function authenticate(){
    
    try {
      await specify.authenticate()
      console.log('Database connection has been established successfully.');
      return
    }
    catch(err){
      throw err
    }

  }

  async function getTreeDef(disciplineName){
    try {
      let treeDefArray = await SpecifyTaxonTreeDef
      .findAll({
        include: [{
          model: SpecifyTaxonTreeDefItem,
          as: 'treeDefItems'
        }, {
          model: SpecifyDiscipline,
          as: 'discipline',
          where: {Name: disciplineName}
        }]
      })
      console.log('treeDef for discipline ' + disciplineName + ' found')
      return treeDefArray[0].get({plain:true})//just the treeDefObject
    }
    catch(err){
      console.log('there was an error getting the treeDef for ' + disciplineName + ': ' + err)
    }
  }

  async function getMaxNodeNumber(treeDef){
    
    try {
      var highestNodeTaxa = await SpecifyTaxon.findAll( {where:{taxonTreeDefID: treeDef.taxonTreeDefID} , order:[['nodeNumber', 'DESC']], limit: 1} )
    }
    catch(err) {
      console.log('there was an error getting the node number')
      throw err
    }

    return highestNodeTaxa[0].nodeNumber

    //note that it should be easier to get the highestNodeNumber value for the root taxon

  }

  async function getUserAgent(username){
    try{
      var user = await SpecifyUser.findOne({where: {Name: username}, include: [SpecifyAgent]})
    }
    catch(err){
      throw err
    }

    if (user) {
      return user.get({plain:true})
    }
    else {
      return null
    }
  }

  async function getRootTaxon(treeDef) {

    try {
      let taxa = await SpecifyTaxon.findAll({where: {taxonTreeDefID: treeDef.taxonTreeDefID, parentID: null} })
      if (taxa.length > 0){
        console.log("Root taxon found for discipline  " +  treeDef.discipline.Name)
        return taxa[0]
      }
      else {
        throw new Error('no root taxon found for discipline ' +  treeDef.discipline.Name)
      }
    }
    catch(err){
      throw err
    }
  }

  async function getDisciplines(){
    try {
      let discs = await SpecifyDiscipline.findAll()
      if (discs && discs.length && discs.length > 0){
        var disnames = []
        discs.forEach(disc =>{
          disnames.push(disc.Name)
        })
        console.log (disnames.length + ' disciplines found')
        
      }
      else {
        console.log('no disciplines found')
      }
    }
    catch(err){
      throw err
    }

    return disnames

  }

  async function createTaxa(taxaData, treeDef) {
    
    if (!Array.isArray(taxaData) || taxaData.length == 0){
      console.log('Invalid taxa data provided to createTaxa')
      throw new Error('Invalid taxa data provided to createTaxa')
    }

    //use a date value for searching the database for added records
    var now = new Date()

    //because we have common names we have to create each record individually (bulkCreate does not support child records)
    for (var taxonData of taxaData) {
      try {
        await SpecifyTaxon.create(taxonData, {
          include: [{
            model: SpecifyCommonName,
            foreignKey: 'taxonID',
            as: 'allCommonNames'
          }]
        })
      }
      catch(err) {
        throw err
      }
    }
    
    /*
    //create the taxon records
    try {
      var t = await SpecifyTaxon.bulkCreate(taxaData)
    }
    catch(err){
      throw err
    }
    */

    //then query it again to get all the values
    //first we need the names
    var searchIDs = taxaData.map(taxonData => taxonData.originalSANBITaxonID)
    var where = {
      originalSANBITaxonID: { [Op.in]: searchIDs },
      taxonTreeDefID: treeDef.taxonTreeDefID,
      timestampCreated: { [Op.gte]: now }
    }
    try {
      var returnTaxa = await SpecifyTaxon.findAll({ where: where })
    }
    catch(err) {
      console.log('Error fetching created taxa from Specify')
      throw err
    }

    return returnTaxa
  
  }

  async function deleteTaxa(treeDef) {

    //delete commonnames
    var commonNameDeleteSQL = `DELETE cn FROM commonnametx cn JOIN taxon t on t.taxonid = cn.taxonid WHERE t.taxontreedefID = ${treeDef.taxonTreeDefID}`

    //we need to remove the accepted IDs first to avoid problems
    var updateAcceptedIDSQL = `UPDATE taxon SET acceptedID = null  WHERE taxontreedefID = ${treeDef.taxonTreeDefID} AND parentID IS NOT NULL`
    var deleteSQL = `DELETE FROM taxon WHERE taxontreedefID = ${treeDef.taxonTreeDefID} AND parentID IS NOT NULL ORDER BY parentID DESC` 
    try {
      await specify.query(commonNameDeleteSQL, {type:  QueryTypes.BULKDELETE } )
      await specify.query(updateAcceptedIDSQL, {type:  QueryTypes.BULKUPDATE } )
      var res = await specify.query(deleteSQL, {type:  QueryTypes.BULKDELETE } )
    }
    catch(err) {
      throw err
    }

    return res

  }//takes the same options as .destroy

  async function getTableRowCounts(csvFile) {

    //get the table names
    try {
      var tables = await specify.query(`SELECT table_name as tbl FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${db}'`, {type:  QueryTypes.SELECT })
    }
    catch(err) {
      throw(err)
    }

    var rowCounts = {}
    for (var table of tables){
      var count = await specify.query(`SELECT COUNT(*) AS count FROM ${table.tbl}`, {type:  QueryTypes.SELECT })
      rowCounts[table.tbl] = count[0].count
    }

    var fs = require('fs')
    var csv = require('fast-csv')

    var ws = fs.createWriteStream(csvFile, { flags: 'a', includeEndRowDelimiter: true });
    csv
      .write([rowCounts], {headers: true})
      .pipe(ws);

    console.log('done writing CSV')

  }

  var result = {

    authenticate: authenticate,
    getTreeDef: getTreeDef,
    getUserAgent, getUserAgent,
    getRootTaxon: getRootTaxon,
    getDisciplines: getDisciplines, 
    createTaxa: createTaxa, 
    getMaxNodeNumber: getMaxNodeNumber,
    deleteTaxa: deleteTaxa,
    getTableRowCounts: getTableRowCounts

  }

  return result

}


