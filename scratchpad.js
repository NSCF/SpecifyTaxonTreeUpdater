var arr = [
      {a: 1, b: 2, c: 3},
      {a: 2, b: 2, c: 3},
      {a: 1, b: 4, c: 7},
      {a: 1, b: 2, c: 3}]

var uniqueArr = [...new Set(arr.map(obj => JSON.stringify(obj)))].map(str=>JSON.parse(str))

var {Op, QueryTypes} = require('sequelize') //we need this for the where objects


var taxa = null
zodatsaTaxa.query('select top 10 kingdom, phylum, class, [order], family, genus, scientificName from taxa where family is not null', { type: QueryTypes.SELECT }).then(res => {taxa = res;console.log('Done')}).catch(err=> console.log(err))

var filteredTaxa = taxa.filter(uniqueHigherTaxaFilter)
