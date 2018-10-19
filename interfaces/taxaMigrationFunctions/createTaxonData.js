

module.exports = function createTaxonData(zodatsaTaxon, rank, treeDef, parentSpecifyTaxon, userAgent, langCodesMap) {
  

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
  
  try { //this is in a try catch because sometimes there are problems
    var taxonData = {}

    taxonData.parentID = parentSpecifyTaxon.taxonID,
    taxonData.rankID = treeDefItem.RankID,
    taxonData.name = zodatsaTaxon[rank]? zodatsaTaxon[rank].trim() : null,
    taxonData.taxonTreeDefID = treeDef.taxonTreeDefID,
    taxonData.taxonTreeDefItemID = treeDefItem.TaxonTreeDefItemID,
    taxonData.createdByAgentID = userAgent.agentID,
    taxonData.modifiedByAgentID = userAgent.agentID,
    taxonData.originalSANBITaxonID = zodatsaTaxon.taxonID,
    taxonData.remarks = notes

    //handing the distribution records
    if (zodatsaTaxon.distribution && zodatsaTaxon.distribution.length && zodatsaTaxon.distribution.length > 0) {
      
      //common names - get them all, assumes only one common name per record
      simpleJoinDistribution(taxonData, 'commonName', zodatsaTaxon, 'commonName')

      //countries - join them all in a set because each value can contain multiple countries
      var countries = zodatsaTaxon.distribution
        .map(dist => dist.countries) //get all values
        .filter(val => val) //remove nulls, empties, etc
        .filter(val => typeof val == 'string') // only strings
        .map(val => val.trim()) //trim them
        .filter(onlyUnique)

      var countriesSet = new Set()
      if (countries.length > 0) {
        for (let val of countries) {
          if (val.includes('|')) { //pipe separators
            val.split('|').map(item => countriesSet.add(item.trim()))
          }
          else if (val.includes(',')) {
            val.split(',').map(item => countriesSet.add(item.trim()))
          }
          else if (val.includes(';')) {
            val.split(';').map(item => countriesSet.add(item.trim()))
          }
          else {
            countriesSet.add(val)
          }
        } 
      }

      var countriesArr = [...countriesSet]

      if (countriesArr.length > 0) {
        taxonData.countries = countriesArr.join('|')
      }

      //SA Distribution -  takes the longest one
      var SAdist = zodatsaTaxon.distribution
        .map(dist => dist.SADistribution) //get all values
        .filter(val => val) //remove nulls, empties, etc
        .filter(val => typeof val == 'string') // only strings
        .map(val => val.trim()) //trim them
        .filter(onlyUnique)

      if (SAdist.length > 0) {
        var longest = SAdist[0]
        for (var i = 1; i < SAdist.length; i++) {
          if (SAdist[i].length > longest.length){
            longest = SAdist[i]
          }
        }
        taxonData.SADistribution = longest
      }

      //nativeStatus - join unique values 
      simpleJoinDistribution(taxonData, 'nativeStatus', zodatsaTaxon, 'nativeStatus')

      //barcodeStatus - also join
      simpleJoinDistribution(taxonData, 'barcodeStatus', zodatsaTaxon, 'barcodeStatus')

      //taxonReferenceSource - also join
      simpleJoinDistribution(taxonData, 'taxonReferenceSource', zodatsaTaxon, 'taxonReferenceSource')

      //publicationDetails -  also join
      simpleJoinDistribution(taxonData, 'publicationDetails', zodatsaTaxon, 'publicationDetails')

      //webReference
      simpleJoinDistribution(taxonData, 'webReference', zodatsaTaxon, 'webReference')

    }

    
      
  }
  catch(err){
    throw err
  }

  //for error checking
  if (taxonData.name == null) {
    var i = 0 //just stopping here
  }

  if (['Species', 'Subspecies'].includes(rank)){
    taxonData.fullName = zodatsaTaxon.scientificName.trim()
    taxonData.author = zodatsaTaxon.Authorship? zodatsaTaxon.Authorship.trim() : null

    taxonData.taxonomicStatus = zodatsaTaxon.taxonStatus? zodatsaTaxon.taxonStatus.trim() : null
    
    if (zodatsaTaxon.accepted_species_name == null 
      || zodatsaTaxon.accepted_species_name.trim() == '' 
      || zodatsaTaxon.scientificName.trim() == zodatsaTaxon.accepted_species_name.trim() ) 
      {
        taxonData.isAccepted = true
    }
    else { //these are synonyms
      taxonData.tempAcceptedTaxonName = zodatsaTaxon.accepted_species_name.trim()
      taxonData.tempAcceptedTaxonAuthor = zodatsaTaxon.accepted_species_author.trim()
      taxonData.isAccepted = false
    }

    //handling common names
    if (zodatsaTaxon.commonNames && zodatsaTaxon.commonNames.length && zodatsaTaxon.commonNames.length > 0) {

      //filter out anything with ??
      //those with &#39 have the values split into language_iso - rejoin with ' and no language code
      //map the language codes

      var fixedNames = zodatsaTaxon.commonNames
        .filter(record => record.name) //remove nulls, empties, etc
        .filter(record => !record.name.includes('??'))
        .map(record => {
          if (record.name.includes('&#39')) {
            record.name = record.name.replace(/&#39/g, "'") + record.languageISO.replace(/&#39/g, "'")
            record.languageISO = null
          }

          if (record.languageISO) {
            var newlangISO = langCodesMap[record.languageISO] || null
            record.languageISO = newlangISO
          }

          return record

        })

      if (fixedNames.length > 0) {
        taxonData.allCommonNames = []
        for (var record of fixedNames) {
          taxonData.allCommonNames.push({
            name: record.name,
            language: record.languageIso, 
            createdByAgentID: userAgent.agentID, 
            modifiedByAgentID: userAgent.agentID
          })
        }
      }
    }

    //handing taxon references - concatenate with pipes

    if(zodatsaTaxon.taxonReferences && zodatsaTaxon.taxonReferences.length && zodatsaTaxon.taxonReferences.length > 0) {
      var concatRefList = zodatsaTaxon.taxonReferences
        .filter(ref => ref.authors || ref.year || ref.title || ref.text)
        .map(ref => `${ref.authors || ''} (${ref.year || ''}) ${ref.title || ''} ${ref.text  || ''}`.trim())
        .join('|')

      var refIDList = zodatsaTaxon.taxonReferences
        .map(ref => ref.referenceID)
        .join('|')
      
    taxonData.taxonReferences = concatRefList  
    taxonData.originalSANBIReferenceIDs = refIDList

    }
  }
  else {
    taxonData.fullName = zodatsaTaxon[rank]? zodatsaTaxon[rank].trim() : null,
    taxonData.isAccepted = true //the default
  }

  return taxonData

}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

function simpleJoinDistribution(taxonData, taxonDataField, zodatsaTaxon, zodatsaTaxonField) {
  var arr = zodatsaTaxon.distribution
        .map(dist => dist[zodatsaTaxonField]) //get all values
        .filter(val => val) //remove nulls, empties, etc
        .filter(val => typeof val == 'string') // only strings
        .map(val => val.trim()) //trim them
        .filter(onlyUnique)

      if (arr.length > 0) {
        taxonData[taxonDataField] = arr.join('|')
      }
}