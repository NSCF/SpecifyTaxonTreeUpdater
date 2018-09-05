var {onlyUnique} = require(process.cwd() + '/interfaces/taxaMigrationFunctions/Utils') 
var createTaxonData = require(process.cwd() + '/interfaces/taxaMigrationFunctions/createTaxonData')
var findZodatsaTaxa = require(process.cwd() + '/interfaces/taxaMigrationFunctions/findZodatsaTaxa')

module.exports = async function createChildTaxa(parentSpecifyTaxon, zodatsaTaxaForThisParent, treeDef, specify, userAgent){
  
  var parentTreeDefItem = treeDef.treeDefItems.find(item => item.TaxonTreeDefItemID == parentSpecifyTaxon.taxonTreeDefItemId)
  
  if(!parentTreeDefItem) {
    var i = 1
  }

  var nextTreeDefItem = treeDef.treeDefItems.find(item => item.ParentItemID == parentTreeDefItem.TaxonTreeDefItemID)

  if (!nextTreeDefItem){
    return
  }

  var parentRank = parentTreeDefItem.Name
  var searchRank = nextTreeDefItem.Name

  //get the names for this rank
  var childTaxonNamesForThisRank = zodatsaTaxaForThisParent.map(taxon => taxon[searchRank]).filter( onlyUnique )

  //It may not exist, so check if required and proceed down the tree if not
  while (childTaxonNamesForThisRank.every(name => name == undefined)){
    if (nextTreeDefItem.IsEnforced) {
      throw new Error('taxon names are missing for the required rank ' + searchRank)
    }
    else {
      nextTreeDefItem = treeDef.treeDefItems.find(item => item.ParentItemID == nextTreeDefItem.TaxonTreeDefItemID)
      if (nextTreeDefItem) {
        searchRank = nextTreeDefItem.Name
        childTaxonNamesForThisRank = zodatsaTaxaForThisParent.map(taxon => taxon[searchRank]).filter( onlyUnique )
      }
      else {
        return
      }
    }
  }

  //get the zodatsa records for the names, excluding null
  var childTaxonObjects = []
  var namesNotNull = childTaxonNamesForThisRank.filter(name => name != null)

  if (namesNotNull.length > 0){
    namesNotNull.forEach(name => {
      let taxa = findZodatsaTaxa(name, searchRank, parentSpecifyTaxon.name, parentRank, zodatsaTaxaForThisParent)
      childTaxonObjects.push.apply(childTaxonObjects, taxa)
    })
  }

  while (childTaxonNamesForThisRank.includes(null) && nextTreeDefItem) {
    var zodatsaTaxaWithNullsForLastRank = zodatsaTaxaForThisParent.filter(taxon => taxon[searchRank] ==  null)
    nextTreeDefItem = treeDef.treeDefItems.find(item => item.ParentItemID == nextTreeDefItem.TaxonTreeDefItemID)
    if (nextTreeDefItem) {
      var searchRank = nextTreeDefItem.Name

      childTaxonNamesForThisRank = zodatsaTaxaWithNullsForLastRank.map(taxon => taxon[searchRank]).filter( onlyUnique )
  
      while (childTaxonNamesForThisRank.every(name => name == undefined)){
        if (nextTreeDefItem.IsEnforced) {
          throw new Error('taxon names are missing for the required rank ' + searchRank)
        }
        else {
          nextTreeDefItem = treeDef.treeDefItems.find(item => item.ParentItemID == nextTreeDefItem.TaxonTreeDefItemID)
          if (nextTreeDefItem) {
            childTaxonNamesForThisRank = zodatsaTaxaWithNullsForLastRank.map(taxon => taxon[searchRank]).filter( onlyUnique )
          }
          else {
            break
          }
        }
      }
  
      namesNotNull = childTaxonNamesForThisRank.filter(name => name != null)
  
      if (namesNotNull.length > 0){
        namesNotNull.forEach(name => {
          let taxa = findZodatsaTaxa(name, searchRank, parentSpecifyTaxon.name, parentRank, zodatsaTaxaForThisParent)
          childTaxonObjects.push.apply(childTaxonObjects, taxa)
        })
      }
    }
  }

  var childTaxonData
  var childTaxaNames = childTaxonObjects.map(obj => {
    return obj.taxon[obj.rank]
  }).join(', ')

  //we need to handle any that are subspecies without higher species rank taxa
  if (searchRank == 'Species') {
    var correctedTaxa = []
    for (var obj of childTaxonObjects) {
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
    childTaxonObjects = correctedTaxa
  }

  if (childTaxonObjects.length > 0) {
    childTaxonData = childTaxonObjects.map(obj => createTaxonData(obj.taxon, obj.rank, treeDef, parentSpecifyTaxon, userAgent))

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

      var specifyTaxonTreeDefItem = treeDef.treeDefItems.find(item => item.TaxonTreeDefItemID == specifyTaxon.taxonTreeDefItemId)
      var specifyTaxonRank = specifyTaxonTreeDefItem.Name
      var zodatsaTaxaForThisTaxon = zodatsaTaxaForThisParent.filter(taxon => taxon[specifyTaxonRank] == specifyTaxon.name)

      try {
        await createChildTaxa(specifyTaxon, zodatsaTaxaForThisTaxon, treeDef, specify, userAgent)
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