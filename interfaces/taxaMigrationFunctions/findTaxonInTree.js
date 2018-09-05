module.exports = function findAcceptedTaxon(synonym, node, result) {
  if (node.scientificName == synonym.tempAcceptedTaxonName && node.author == synonym.tempAcceptedTaxonAuthor) {
    result.node = node
    return true
  }

  var found = false
  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    var children = node.children.map(child => child.name).join(', ')
    for (var childNode of node.children) {
      if (node.scientificName == synonym.tempAcceptedTaxonName && node.author == synonym.tempAcceptedTaxonAuthor) {
        result.node = childNode
        return true
      }
      found = findTaxonInTree(synonym, childNode, result)
    }
    return found
  }
}//depth first search that returns the taxon