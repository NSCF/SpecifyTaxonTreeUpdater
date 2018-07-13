module.exports = function(db, dbhost) {

  const zodatsaTaxa = require(process.cwd() + '/dbconn/sqlserverconn.js')(db, dbhost)

  const SqlTaxon = zodatsaTaxa.import(process.cwd() + '/interfaces/sqlserver/models/taxon')
  const SqlReference = zodatsaTaxa.import(process.cwd() + '/interfaces/sqlserver/models/reference')
  const SqlCommonName = zodatsaTaxa.import(process.cwd() + '/interfaces/sqlserver/models/common_name')
  const SqlTaxonReference = zodatsaTaxa.import(process.cwd() + '/interfaces/sqlserver/models/taxon_reference')

  SqlTaxon.hasMany(SqlCommonName, {as: 'commonNames'})
  
  async function authenticate(){
    zodatsaTaxa.authenticate()
      .then(() => {
        console.log('Connection to ' + zodatsaTaxa.config.dialectOptions.instanceName + ' has been established successfully.');
      })
      .catch(err => {
        console.error('Unable to connect to the database:', err.name);
      });
  }

  async function getTaxa(params){

    try {
      let taxa = await SqlTaxon.findAll(params)
      if (taxa && taxa.length && taxa.length > 0){
        console.log(taxa.length + ' taxa returned')
        return taxa
      }
      else {
        console.log('no taxa returned')
      }
    }
    catch(err){
      throw err
    }
    
  }

  async function query(sql, options){
    try{
      let result = zodatsaTaxa.query(sql, options)
      return result
    }
    catch(err){
      throw err
    }

  }//return sequelizer.query as a promise

  return {
    authenticate: authenticate,
    getTaxa: getTaxa,
    query: query
  }

}