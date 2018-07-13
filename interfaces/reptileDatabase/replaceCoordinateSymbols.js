var replaceCoordinateSymbols = function(str) {

  return str
  .replace(new RegExp('º', 'g'), '°')
  .replace(new RegExp('´', 'g'), '\'')
  .replace(new RegExp('ʹ', 'g'), '\'')

} //standardizes symbols for degrees, minutes, and seconds

module.exports = replaceCoordinateSymbols