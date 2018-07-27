var {onlyUnique} = require(process.cwd() + '/interfaces/taxaMigrationFunctions/Utils') 
var createTaxonData = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createTaxonData')
var findZodatsaTaxa = require(process.cwd() + '/interfaces/taxaMigrationFunctions/findZodatsaTaxa')

module.exports = async function createChildTaxa(parentSpecifyTaxon, zodatsaTaxa, treeDef, specify, userAgent){
  
  var parentRank = treeDef.treeDefItems.find(item => {
    return item.TaxonTreeDefItemID == parentSpecifyTaxon.taxonTreeDefItemId
  }).Name

  var possibleRanks = Object.keys(zodatsaTaxa[0])
  var nextRankIndex = possibleRanks.indexOf(parentRank)
  nextRankIndex++
  var searchRank = possibleRanks[nextRankIndex]
  if (searchRank == 'scientificName'){
    //we reached the end, these were added in the last step, return from the recursion
    return
  }

  var zodatsaTaxaForThisParent = zodatsaTaxa.filter(taxon => taxon[parentRank] == parentSpecifyTaxon.name)

  //we need the unique names for this rank
  //some, like subgenus, dont have names so we need to keep looking
  var childTaxa = []
  var childTaxonNamesForThisRank = zodatsaTaxaForThisParent.map(taxon => taxon[searchRank]).filter( onlyUnique )
  var namesNotNull = childTaxonNamesForThisRank.filter(name => name != null)
  namesNotNull.forEach(name => {
    let taxa = findZodatsaTaxa(name, searchRank, parentSpecifyTaxon.name, parentRank, zodatsaTaxa)
    childTaxa.push.apply(childTaxa, taxa)
  })

  //walk down the tree until we have no nulls
  while (childTaxonNamesForThisRank.includes(null)) {
    nextRankIndex++
    var previousNames = childTaxonNamesForThisRank.filter(name => name != null)
    var previousRank = searchRank
    searchRank = possibleRanks[nextRankIndex]
    if (searchRank == 'scientificName'){
      //we reached the end, these were added in the last step, return from the recursion
      break
    }
    else {
      childTaxonNamesForThisRank = zodatsaTaxaForThisParent.filter(taxon => !previousNames.includes(taxon[previousRank])).map(taxon => taxon[searchRank]).filter( onlyUnique )
      namesNotNull = childTaxonNamesForThisRank.filter(name => name != null)
      namesNotNull.forEach(name => {
        let taxa = findZodatsaTaxa(name, searchRank, parentSpecifyTaxon.name, parentRank, zodatsaTaxa)
        childTaxa.push.apply(childTaxa, taxa)
      })
    }
  }

  var childTaxonData
  var childTaxaNames = childTaxa.map(taxon => taxon.taxon[searchRank]).join(', ')

  //we need to handle any that are subspecies without higher species rank taxa
  if (searchRank == 'Species') {
    var correctedTaxa = []
    for (var obj of childTaxa) {
      //we need an error check for subspecies with no higher species
      let zodatsaTaxon = obj.taxon
      let namesArray = zodatsaTaxon.scientificName.split(' ').filter(str => str.length && str.length > 0)
      let scientificNameIsSubspecies = namesArray.length > 2 && zodatsaTaxon.scientificName.includes('(')
      if (scientificNameIsSubspecies) {
        //deep copy
        let newTaxon = JSON.parse(JSON.stringify(zodatsaTaxon))
        newTaxon.scientificName = namesArray.slice(0, namesArray.length-1).join(' ')
        correctedTaxa.push({taxon: newTaxon, rank: searchRank } )
      }
      else {
        correctedTaxa.push(obj)
      }
    }
    childTaxa = correctedTaxa
  }

  if (childTaxa.length > 0) {
    childTaxonData = childTaxa.map(obj => createTaxonData(obj.taxon, obj.rank, treeDef, parentSpecifyTaxon, userAgent))

    //create the database records
    try {
      var specifyTaxa = await specify.createTaxa(childTaxonData, treeDef)
    }
    catch(err){
      console.log('error creating accepted taxa for ' + parentSpecifyTaxon.name)
      throw err
    }  
  
    parentSpecifyTaxon.children = specifyTaxa
  
    //recurse
    for (var specifyTaxon of specifyTaxa) {
      try {
        await createChildTaxa(specifyTaxon, zodatsaTaxa, treeDef, specify, userAgent)
      }
      catch(err){
        throw err
      }
    }
    return
  }
  else {
    return
  }
}