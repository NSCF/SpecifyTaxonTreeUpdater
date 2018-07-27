var findTaxonInTree = require(process.cwd() + '/interfaces/taxaMigrationFunctions/findTaxonInTree')

function findSynonyms(treeNode, synonymObject){
  //synonyms is an array

  if (treeNode.rankId >= 220) {
    var i = 2
  }

  if(treeNode.tempAcceptedTaxonName) {
    synonymObject.synonyms.push(treeNode)
  }

  if (treeNode.children){
    for (var node of treeNode.children){
      findSynonyms(node, synonymObject)
    }
  }
  else {
    return
  }
}

module.exports = async function(taxonTree) {
  
  var synErrors = []

  //get the synonyms
  var synonymObject = {synonyms: []}
  findSynonyms(taxonTree, synonymObject)

  for (var syn of synonymObject.synonyms) {

    var acceptedTaxon = { node: null}
    findTaxonInTree('fullName', syn.tempAcceptedTaxonName, taxonTree, acceptedTaxon)

    if (acceptedTaxon.node) {
      syn.acceptedId = acceptedTaxon.node.taxonId //we save this later after adding the node numbers
    }
    else {
      synErrors.push(syn)
    }
    
  }

  return synErrors //we don't need to return anything, taxonTree is modified in place

}