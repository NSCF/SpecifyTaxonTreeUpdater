

module.exports = function(db, dbhost) {

  const zodatsaTaxa = require(process.cwd() + '/interfaces/sqlserver/sqlserverInterface.js')(db, dbhost)

  var {Op, QueryTypes} = require('sequelize') //we need this for the where objects

  /*
  //TAXA THAT ARE MISSING SPECIES NAMES
  var where = {
    species: null
  }
  var taxaWithNoScientificName = null
  var t = zodatsaTaxa.getTaxa(where).then(res => taxaWithNoScientificName = res).catch(err => console.log(err.name))

  var nameErrors = []
  var saveErrors = []
  taxaWithNoScientificName.forEach(taxon => {
    var spArray = taxon.scientificName.split(' ')
    spArray = spArray.filter(elem => {
      return elem != ''
    }) //just clean it up in case there are extra spaces

    taxon.species = spArray[1] //the first element is the genus name
    
    if (spArray.length >= 2){ //theres a subspecies
      
      if (spArray.length > 2) { //there is a problem
        nameErrors.push({taxonID: taxon.taxonId, scientificName: taxon.scientificName})
      }
      else {
        taxon.subspecies = spArray[2]
        taxon.save().catch((err) => {
          saveErrors.push({taxonID: taxon.taxonId, scientificName: taxon.scientificName, err: err})
        })
      }
    }

  });

  */

  //ADDING HIGHER TAXA WHERE MISSING
  //we need this so that we have synonyms when we call the taxa for a discipline

  //we need helper functions

  //for unique objects from an array
  function uniqueObjects(objectArray){
    return [...new Set(objectArray.map(obj => JSON.stringify(obj)))].map(str=>JSON.parse(str))
  }

  //for summarizing the name errors at the end
  function nameErrorsSummary(nameErrors){
    var summary = {errorCount: 0}
    nameErrors.forEach(err=>{
      summary.errorCount++
      if (summary[err.status]) {
        summary[err.status]++
      }
      else {
        summary[err.status] = 1
      }
    })

    return summary
  }

  //to check a random subset of errors
  //from https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
  function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  function createUpdateStatement(matchingHigherTaxa, nameErrors, whereField, nameUpdates, update){
    if (matchingHigherTaxa.length > 1){
      addNameError(taxon, nameErrors, 'Multiple higher classifications exist', matchingHigherTaxa)
    }
    else {
      nameUpdates.updateCount++;
      var higherClass = matchingHigherTaxa[0]
      update.updateString += 
        'UPDATE taxa SET kingdom = \'' + higherClass.kingdom + 
        '\', phylum = \'' + higherClass.phylum + 
        '\', class = \'' + higherClass.class + 
        '\', [order] = \'' + higherClass.order + 
        '\', family = \'' + higherClass.family + 
        '\' WHERE ' + whereField + ' = \'' + taxon[whereField] + '\';'
    }
  }

  function addQryError(taxon, qryErrors, err){
    qryErrors.push(
      {
        taxonID: taxon.taxonId,
        taxon: taxon.scientificName,
        acceptedName: taxon.acceptedSpeciesName,
        status: taxon.taxonStatus,
        error: err
      }
    )
  }

  function addNameError(taxon, nameErrors, errMsg, matchingHigherTaxa) {
    nameErrors.push(
      {
        taxonID: taxon.taxonId,
        taxon: taxon.scientificName,
        acceptedName: taxon.acceptedSpeciesName,
        error: errMsg,
        higherClass: matchingHigherTaxa
      }
    )
  }

  function uniqueHigherTaxaFilter(val, index, arr){
    
    var searchInd = arr.findIndex(innerVal => {
      return val.kingdom == innerVal.kingdom && 
        val.phylum == innerVal.phylum && 
        val.order == innerVal.order && 
        val.class == innerVal.class && 
        val.family == innerVal.family &&
        val.genus == innerVal.genus
    })
    
    return  searchInd == index

  }

  async function addMissingHigherTaxa(){

    var where = { 
      family: null
    }
    
    console.log('fetching taxa')

    var nameErrors = []
    var nameUpdates = { updateCount: 0 }
    
    try {
      var taxaWithNoHigherClass = await zodatsaTaxa.getTaxa({where: where, raw: true})
    }
    catch(err) {
      console.log('Error fetching taxa with no higher classification')
      throw err
    }

    
    var sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxa WHERE TRIM(scientificName) IN (\''
    var taxonNames = new Set() //so we only have unique
    taxaWithNoHigherClass.forEach(taxon=>{
      if (taxon.acceptedSpeciesName) { //some are empty strings
        taxonNames.add(taxon.acceptedSpeciesName)
      }
    })

    sql += [...taxonNames].join('\',\'')
    sql += '\') AND family is not null'

    //get the higher taxa
    console.log('fetching higher taxa')
    try{
      var higherTaxa = await zodatsaTaxa.query(sql,{ type: QueryTypes.SELECT })
    }
    catch(err){
      console.log('Error getting higher taxa')
      throw (err)
    }

    if (higherTaxa && higherTaxa.length && higherTaxa.length > 0) {

      var update = { updateString: '' } //an object to hold the update string so we can pass it to functions
      var checkedTaxa = new Set();

      taxaWithNoHigherClass.forEach((taxon, index) => {

        //find higher taxa using the acceptedSpeciesName
        
        //have we processed this acceptedName already?
        if (!checkedTaxa.has(taxon.acceptedSpeciesName)) {
          
          var matchingHigherTaxa = higherTaxa.filter(itm => {return itm.scientificName == taxon.acceptedSpeciesName.trim() })
          if (matchingHigherTaxa.length > 0) {
            createUpdateStatement(matchingHigherTaxa, nameErrors, 'accepted_species_name', nameUpdates, update)
            checkedTaxa.add(taxon.acceptedSpeciesName)
          }
          else {
            //try the accepted name genus
            var searchGenus = taxon.acceptedSpeciesName.trim().split(' ').filter(x => x.length > 0)[0]
            matchingHigherTaxa = higherTaxa.filter(itm => {return itm.genus.trim() == searchGenus })
            if (matchingHigherTaxa.length > 0) {
              //we need to filter just those that have unique higher classification
              var uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
              createUpdateStatement(uniqueHigherTaxa, nameErrors, 'genus', nameUpdates, update)
              checkedTaxa.add(searchGenus)
            }
            else {
              //use the scientificName
              if (!checkedTaxa.has(taxon.scientificName)) {
                matchingHigherTaxa = higherTaxa.filter(itm => {return itm.scientificName == taxon.scientificName.trim() })
                if (matchingHigherTaxa.length > 0) {
                  createUpdateStatement(matchingHigherTaxa, nameErrors, 'scientificName', nameUpdates, update)
                  checkedTaxa.add(taxon.scientificName)
                }
                else {
                  //try the scientificName genus
                  var searchGenus = taxon.scientificName.trim().split(' ').filter(x => x.length > 0)[0]
                  matchingHigherTaxa = higherTaxa.filter(itm => {return itm.genus.trim() == searchGenus })
                  if (matchingHigherTaxa.length > 0) {
                    //we need to filter just those that have unique higher classification
                    var uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                    createUpdateStatement(uniqueHigherTaxa, nameErrors, 'genus', nameUpdates, update)
                    checkedTaxa.add(searchGenus)
                  }
                  else {
                    addNameError(taxon, nameErrors, 'No higher taxa found')
                  }
                }
              }
            }
          }
        }
      })

      //print the summary of errors
      console.log(nameErrorsSummary(nameErrors))

      //get a random sample
      console.log(getRandom(nameErrors, 10))

      var i = 2

      /*
      zodatsaTaxa.query(update)
        .then(_ => {console.log('Higher taxa added for ' + nameUpdates + ' taxa')})
        .catch(err=>{
          console.log('Error updating higher taxa: ' + err)
        })
      */

    }
    else {
      console.log('no higher taxa returned')
    }

  }

  return {
    addMissingHigherTaxa: addMissingHigherTaxa
  }

}









