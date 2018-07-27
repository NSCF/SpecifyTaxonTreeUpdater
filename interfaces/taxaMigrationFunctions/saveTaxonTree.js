async function saveNodeAndChildren(treeNode, saveErrors){
  
  try{
    var saveresult = await treeNode.save()
  }
  catch(err) {
    saveErrors.push({
      node: treeNode,
      error: err
    })
  }

  if (treeNode.children && Array.isArray(treeNode.children) && treeNode.children.length > 0) {
    for (var node of treeNode.children) {
      try {
        await saveNodeAndChildren(node, saveErrors)
      }
      catch(err){
        throw(err)
      }
    }
  }
  else {
    return
  }
}

module.exports = async function(taxonTree) {
  var saveErrors = []
  try{
    await saveNodeAndChildren(taxonTree, saveErrors)
  }
  catch(err){
    throw err
  }
 
  return saveErrors;
}