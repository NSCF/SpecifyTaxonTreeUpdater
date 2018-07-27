module.exports = function findTaxonInTree(searchField, searchVal, node, result) {
  if (node[searchField] == searchVal) {
    result.node = node
    return true
  }

  var found = false
  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    var children = node.children.map(child => child.name).join(', ')
    for (var childNode of node.children) {
      if (childNode[searchField] == searchVal) {
        result.node = childNode
        return true
      }
      found = findTaxonInTree(searchField, searchVal, childNode, result)
    }
    return found
  }
}//depth first search that returns the taxon