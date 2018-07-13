var splitSynonyms = function(synString, taxonName){
  if (synString != '') {
    var synSplit = synString.split('|') //split each synonym entry into its own string

    //from graphemica.com
    var upperRegex = new RegExp('^[A-ZÀ-ÖØ-ÝĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĴĶĹĻĽĿŁŃŅŇŌŎŐŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸŹŻŻƁƇƉƊƓƗƵǑǓǤǦǨǪǬǴǸǺǾȀȂȄȆȈȊȌȎȐȒȔȖȘȚȞȤȦȨȪȬȮȰȲȺȻȽȾɃɄɆɈɌɎǕǗǙǛǞǠЀЁЇӐӒӖӼӾԞ]+$')
    var yearRegex = new RegExp(/^\d{4}[a-z]{0,1}?:?$/)

    //for the results
    var synObjects = []
    var synErrors = []

    //now parse each one
    synSplit.forEach(syn => {
      synstrSplit = syn.split(' ')
      
      //we need the indices of each all caps string so we know what the author part is
      var firstAllcapsInd =  synstrSplit.findIndex(str => {return upperRegex.test(str)})

      if (firstAllcapsInd){
        //the author is everything from the first all caps to the year
        var yearInd = synstrSplit.findIndex(str => { return yearRegex.test(str)})

        if (yearInd < 0) {
          synErrors.push({syn: syn, 
            error: 'no valid year found'})
          return
        }

        //check if there's a  '—' 
        var dashInd = synstrSplit.findIndex(str => str == '—')
        var lastTaxonInd = null
        if (dashInd < 0){
          lastTaxonInd = firstAllcapsInd - 1
        }
        else
        {
          lastTaxonInd = dashInd - 1
        }

        //check if it's [sic]
        var sicInd = synstrSplit.findIndex(str => str == '[sic]')
        if (sicInd > 0){
          lastTaxonInd--;
        }

        var author = synstrSplit.slice(firstAllcapsInd, yearInd).join(' ')
        var chrysonym = false
        var page = null
        var year = synstrSplit[yearInd]

        var syntaxon = synstrSplit.slice(0, lastTaxonInd + 1).join(' ')
        if (syntaxon == taxonName && dashInd >= 0){
          chrysonym = true
        }

        if (year.includes(':')){ //then we have a page
          page = synstrSplit[synstrSplit.length - 1]
          if (isNaN(page)){            
            synErrors.push({syn: syn, 
              error: 'page number is not valid'})
            return //end this iteration 
          }
          else {
            
            page = Number(page)
            //drop the ':'
            year = year.replace(':', '')
            
          }
        }

        if (isNaN(year) || year.length != 4){
          synErrors.push({
            syn: syn, 
            error: 'year is not valid'
          })
          return //end this iteration 
        }
        else {
          year = Number(year)
        }
      
        var synObj = {
            "taxon" : syntaxon
          , "author" : author
          , "year" : year
          , "page" : page
          , "chrysonym": chrysonym
          , "sic": sicInd < 0 ? false : true
        }

        synObjects.push(synObj)

      }
      else {
        synErrors.push({syn: syn, 
        error: 'no uppercase author string'}) //we didn't find an author
      }

    })

    return {
      synonyms: synObjects,
      synonymErrors: synErrors
    }

  }
  else {
    return null;
  }
    
}

module.exports = splitSynonyms