var getMap = require('../taxaMigrationFunctions/mapLanguageCodes')

var file = process.cwd() + '/temp/lang_codes.csv'

var result;

console.log('getting language codes')
getMap(file)
.then(codesmap => {
  result = codesmap
  console.log('Codes map fetched')
})
.catch(err => console.log(err))