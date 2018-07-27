var addNodeNumbers = require('../taxaMigrationFunctions/addNodeNumbers')

var tree = require('./tree.js')

var numberTracker = {
  number: 0
}

addNodeNumbers(tree, numberTracker)

JSON.stringify(tree)