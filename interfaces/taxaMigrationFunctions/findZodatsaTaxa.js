module.exports = function(name, rank, parentName, parentRank, zodatsaTaxa){
  
  //we need to know if this is a leaf taxon so that we know whether to consider synonyms or not (not for leaf taxa)
  var leafTaxon = false
  if (rank.toLowerCase() == 'subspecies') {
    leafTaxon = true
  }
  else if (rank.toLowerCase() == 'species') {
    var taxa = zodatsaTaxa.filter(taxon => taxon[rank] == name && taxon[parentRank] == parentName)
    if (taxa.every(taxon => taxon.Subspecies = null)) {
      leafTaxon = true
    }
  }

  result = []
  if (leafTaxon) {
    var leafTaxa = zodatsaTaxa.filter(taxon => taxon[rank] == name && taxon[parentRank] == parentName)
    for (var taxon of leafTaxa) {
      result.push(
        {
          taxon: taxon,
          rank: rank
        }
      )
    }
  }
  else {
    var exemplartaxon = zodatsaTaxa.find(taxon => taxon[rank] == name && taxon[parentRank] == parentName)
    result.push(
      {
        taxon: exemplartaxon,
        rank: rank
      }
    )
  }

  return result

}