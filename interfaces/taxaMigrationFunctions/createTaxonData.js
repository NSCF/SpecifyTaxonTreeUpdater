module.exports = function createTaxonData(zodatsaTaxon, rank, treeDef, parentSpecifyTaxon, userAgent) {
  

  var treeDefItem = treeDef.treeDefItems.find(item => {
    return item.Name == rank
  })

  if (!treeDefItem){
    throw new Error('problem with rank for ' + zodatsaTaxon.scientificName)
  }

  //check it
  if (!zodatsaTaxon[rank]){
    throw new Error('problem with rank for ' + zodatsaTaxon.scientificName)
  }

  var notes = zodatsaTaxon.edits
  if (notes){
    notes += '; Taxon created on bulk import from existing data'
  }
  else {
    notes = 'Taxon created on bulk import from existing data'
  }
  
  try {
    var taxonData = {}

    taxonData.parentId = parentSpecifyTaxon.taxonId,
    taxonData.rankId = treeDefItem.RankID,
    taxonData.name = zodatsaTaxon[rank]? zodatsaTaxon[rank].trim() : null,
    taxonData.taxonTreeDefId = treeDef.taxonTreeDefId,
    taxonData.taxonTreeDefItemId = treeDefItem.TaxonTreeDefItemID,
    taxonData.createdByAgentId = userAgent.agentId,
    taxonData.modifiedByAgentId = userAgent.agentId,
    taxonData.taxonomicStatus = zodatsaTaxon.taxonStatus? zodatsaTaxon.taxonStatus.trim() : null,
    taxonData.remarks = notes
      
  }
  catch(err){
    throw err
  }

  //for error checking
  if (taxonData.name == null) {
    var i = 0 //just stopping here
  }

  if (['species', 'subspecies'].includes(rank.toLowerCase())){
    taxonData.fullName = zodatsaTaxon.scientificName.trim()
    taxonData.author = zodatsaTaxon.Authorship? zodatsaTaxon.Authorship.trim() : null
    
    if (zodatsaTaxon.accepted_species_name == null 
      || zodatsaTaxon.accepted_species_name.trim() == '' 
      || zodatsaTaxon.scientificName.trim() == zodatsaTaxon.accepted_species_name.trim() ) 
      {
        taxonData.isAccepted = true
    }
    else { //these are synonyms
      taxonData.tempAcceptedTaxonName = zodatsaTaxon.accepted_species_name.trim()
      taxonData.isAccepted = false
    }

  }
  else {
    taxonData.fullName = zodatsaTaxon[rank]? zodatsaTaxon[rank].trim() : null,
    taxonData.isAccepted = true //the default
  }

  return taxonData

}