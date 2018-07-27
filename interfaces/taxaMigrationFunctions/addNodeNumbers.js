module.exports = function addNodeNumbers(treeNode, numberTracker) {

  //treeNode is a SpecifyTaxon instance
  treeNode.nodeNumber = numberTracker.number

  if (treeNode.children && treeNode.children.length > 0) {
    for (var node of treeNode.children){
      numberTracker.number++
      addNodeNumbers(node, numberTracker)
      treeNode.highestChildNodeNumber = numberTracker.number
    }
  }
  else {
    treeNode.highestChildNodeNumber = numberTracker.number
    return
  }

}//depth first tree traversal. numberTracker.number should have the starting number for the root taxon to begin with 