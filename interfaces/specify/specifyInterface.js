module.exports = function(db, dbhost, user, pwd) {

  const specify = require(process.cwd() + '/dbconn/specifyconn')(db, dbhost, user, pwd);

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

  async function getTreeDef(discipline){
    try {
      let treeDefArray = await SpecifyTaxonTreeDef
      .findAll({
        include: [{
          model: SpecifyTaxonTreeDefItem,
          as: 'treeDefItems'
        }, {
          model: SpecifyDiscipline,
          as: 'discipline',
          where: {Name: discipline}
        }]
      })
      console.log('treeDef for discipline ' + discipline + ' found')
      return treeDefArray[0].get({plain:true})//just the treeDefObject
    }
    catch(err){
      console.log('there was an error getting the treeDef for ' + discipline + ': ' + err)
    }
  }

  async function getUserAgent(username){
    try{
      let user = await SpecifyUser.findOne({where: {Name: username}, include: [SpecifyAgent]})
      if (user){
        if (user.IsLoggedIn){
          console.log('User ' + user.Name + ' found. Agent name is ' + user.agent.firstName + ' ' + user.agent.lastName)
          return user.get({plain:true})
        }
        else {
          console.log('This user is not logged in. Please login and try again')
          throw(new Error('user not logged in'))
        }
        
      }
      else {
        console.log('no user found with user name ' + username)
        return null
      }
    }
    catch(err){
      throw err
    }
    
  }

  async function getRootTaxon(treeDef) {

    try {
      let taxa = await SpecifyTaxon.findAll({where: {taxonTreeDefId: treeDef.taxonTreeDefId}, include: ['createdBy', 'parentTaxon'] })
      if (taxa.length > 0){
        console.log("Root taxon 'Life' found for discipline  " +  treeDef.discipline.Name)
        return taxa[0].get({plain:true})
      }
      else {
        console.log('no root taxon found for discipline ' +  treeDef.discipline.Name)
      }
    }
    catch(err){
      throw err
    }
  }

  //get an array of current discipline names
  async function getDisciplines(){
    try {
      let discs = await SpecifyDiscipline.findAll()
      if (discs && discs.length && discs.length > 0){
        var disnames = []
        discs.forEach(disc =>{
          disnames.push(disc.Name)
        })
        console.log (disnames.length + ' disciplines found')
        return disnames
      }
      else {
        console.log('no disciplines found')
      }
    }
    catch(err){
      throw err
    }
  }


  var result = {
    authenticate: authenticate,
    getTreeDef: getTreeDef,
    getUserAgent, getUserAgent,
    getRootTaxon: getRootTaxon,
    getDisciplines: getDisciplines
  }

  return result

}


