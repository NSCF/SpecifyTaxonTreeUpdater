var splitSubspecies = function(subspeciesString) {
  if (subspeciesString != '') {
    var sspSplit = subspeciesString.split('|')
    var sspRegex = new RegExp('([A-Z, a-z]+) +([A-Z, \&]+) +(\d{4})\:? +(\d+)?')
    var sspObjects = []
    var sspErrors = []
    sspSplit.forEach(function(ssp) {
      if (sspRegex.test(ssp)) {
        var match = ssp.match(sppRegex)
        var sspObj = {
          "taxon" : match[1].replace(/ {2,}/g, ' ')
          , "author" : match[2]
          , "year" : match[3]
          , "page" : match[4] || null
        }

        sspObjects.push(sspObj)
      }
      else {
        sspErrors.push(ssp)
      }
    })

    return {
      subspecies: sspObjects,
      subpseciesErrors: sspErrors
    }

  }
  else {
    return null
  }
}

module.exports = splitSubspecies