//remember to cd down to this directory

var findTaxonInTree = require('../taxaMigrationFunctions/findTaxonInTree')

var tree = require('./tree.js')

var result = { node: null }

var found = findTaxonInTree('name', 'species7', tree, result, [])
Object.keys(result)