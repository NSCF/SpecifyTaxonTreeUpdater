const microtime = require('microtime')
const fs = require('fs')
const {promisify} = require('util');

const appendFile = promisify(fs.appendFile)

module.exports = function(db, dbhost) {

  const zodatsaTaxa = require(process.cwd() + '/interfaces/sqlserver/sqlserverInterface.js')(db, dbhost)

  var {Op, QueryTypes} = require('sequelize') //we need this for the where objects

  /*
  //TAXA THAT ARE MISSING SPECIES NAMES
  var where = {
    species: null
  }
  var taxaWithNoScientificName = null
  var t = zodatsaTaxa.getTaxa(where).then(res => taxaWithNoScientificName = res).catch(err => console.log(err.name))

  var nameErrors = []
  var saveErrors = []
  taxaWithNoScientificName.forEach(taxon => {
    var spArray = taxon.scientificName.split(' ')
    spArray = spArray.filter(elem => {
      return elem != ''
    }) //just clean it up in case there are extra spaces

    taxon.species = spArray[1] //the first element is the genus name
    
    if (spArray.length >= 2){ //theres a subspecies
      
      if (spArray.length > 2) { //there is a problem
        nameErrors.push({taxonID: taxon.taxonId, scientificName: taxon.scientificName})
      }
      else {
        taxon.subspecies = spArray[2]
        taxon.save().catch((err) => {
          saveErrors.push({taxonID: taxon.taxonId, scientificName: taxon.scientificName, err: err})
        })
      }
    }

  });

  */

  //ADDING HIGHER TAXA WHERE MISSING
  //we need this so that we have synonyms when we call the taxa for a discipline

  //we need helper functions

  //for arrays of primitive types, from https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
  }

  //for unique objects from an array
  function uniqueObjects(objectArray){
    return [...new Set(objectArray.map(obj => JSON.stringify(obj)))].map(str=>JSON.parse(str))
  }

  //for summarizing the name errors at the end
  function nameErrorsSummary(nameErrors){
    var summary = {errorCount: 0}
    nameErrors.forEach(err=>{
      summary.errorCount++
      if (summary[err.error]) {
        summary[err.error]++
      }
      else {
        summary[err.error] = 1
      }
    })

    return summary
  }

  //to check a random subset of errors
  //from https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
  function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  function createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, whereField, nameUpdates, update, genusSearch, taxonUpdateCount){
    if (matchingHigherTaxa.length > 1){
      addNameError(taxon, nameErrors, 'Multiple higher classifications exist', matchingHigherTaxa)
    }
    else {
      
      taxonUpdateCount.count++
      
      var propertyName = null;
      if (whereField == 'accepted_species_name'){
        propertyName = 'acceptedSpeciesName'
      }
      else {
        propertyName = whereField
      }
      nameUpdates.updateCount++;
      var higherClass = matchingHigherTaxa[0]
      update.updateString += 
        'UPDATE taxon SET kingdom = \'' + higherClass.kingdom + 
        '\', phylum = \'' + higherClass.phylum + 
        '\', class = \'' + higherClass.class + 
        '\', [order] = \'' + higherClass.order + 
        '\', family = \'' + higherClass.family + 
        '\', edits = \'Higher taxa copied from taxon ' + matchingHigherTaxa[0].scientificName.replace(/'/g, `''`) + ' using ' + whereField + ' ' + taxon[propertyName] + '\' + CHAR(13)' + //CHAR(13) adds a newline so that each edit can be seen separately.
        ' output @@ROWCOUNT as affectedrows' //so we can work out how many updates were actually made

      //we need to do upldates differently if it's for general to prevent overwriting other updates
      if (genusSearch){
        update.updateString += ' WHERE taxonID =  ' + taxon.taxonID + ';'
      } 
      else {
        update.updateString += ' WHERE ' + whereField + ' = \'' + taxon[propertyName] + '\' AND family is null;'
      } 
    }
  }

  function addQryError(taxon, qryErrors, err){
    qryErrors.push(
      {
        taxonID: taxon.taxonID,
        taxon: taxon.scientificName,
        acceptedName: taxon.acceptedSpeciesName,
        status: taxon.taxonStatus,
        error: err
      }
    )
  }

  function addNameError(taxon, nameErrors, errMsg, matchingHigherTaxa) {
    nameErrors.push(
      {
        taxonID: taxon.taxonID,
        taxon: taxon.scientificName,
        acceptedName: taxon.acceptedSpeciesName,
        error: errMsg,
        higherClass: matchingHigherTaxa
      }
    )
  }

  function uniqueHigherTaxaFilter(val, index, arr){
    
    var searchInd = arr.findIndex(innerVal => {
      return val.kingdom == innerVal.kingdom && 
        val.phylum == innerVal.phylum && 
        val.order == innerVal.order && 
        val.class == innerVal.class && 
        val.family == innerVal.family &&
        val.genus == innerVal.genus
    })
    
    return  searchInd == index

  }

  async function addMissingHigherTaxa(){

    //to keep track of performance
    var perf = {
      qryTimes: {},
      allTimes: [], //we want this per taxon
      totalTime: null
    }

    var where = { 
      family: null
    }
    
    console.log('fetching taxa')

    var nameErrors = []
    var sqlErrors = []
    var nameUpdates = { updateCount: 0 }
    

    //fetch the taxa that are missing higher classification
    try {
      var taxaWithNoHigherClass = await zodatsaTaxa.getTaxa({where: where, raw: true})
    }
    catch(err) {
      console.log('Error fetching taxa with no higher classification')
      throw err
    }

    //get the initial set of higher taxa
    var sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon WHERE TRIM(scientificName) IN (\''
    var taxonNames = new Set() //so we only have unique
    taxaWithNoHigherClass.forEach(taxon=>{
      if (taxon.acceptedSpeciesName) { //some are empty strings
        taxonNames.add(taxon.acceptedSpeciesName)
      }
    })

    sql += [...taxonNames].join('\',\'')
    sql += '\') AND family is not null'

    //get the higher taxa
    console.log('fetching higher taxa')
    try {
      var higherTaxa = await zodatsaTaxa.query(sql,{ type: QueryTypes.SELECT })
    }
    catch(err){
      console.log('Error getting higher taxa')
      throw (err)
    }

    if (higherTaxa && higherTaxa.length && higherTaxa.length > 0) {

      console.log(higherTaxa.length + ' higher taxa successfully fetched')

      var allStart = Date.now()
      
      var sqlStart, sqlEnd = null

      var update = { updateString: '' } //an object to hold the update string so we can pass it to functions
      var checkedTaxa = new Set(); //for keeping track of names we've already processed
      var checkedGenera = {} //we need to keep track of these so we can reuse them as genus:matchedTaxaArray
      var taxaProcessed = { count: 0 }

      //our vars
      var uniqueHigherTaxa, matchingHigherTaxa, searchGenus = null

      var taxonUpdateCount = { count: 0 }

      console.log('Processing taxa with missing higher classifications')

      for (const taxon of taxaWithNoHigherClass) {

        var start = microtime.now()

        //find higher taxa using the acceptedSpeciesName
        if (taxon.acceptedSpeciesName) { 

          if (!checkedTaxa.has(taxon.acceptedSpeciesName)) {
            matchingHigherTaxa = higherTaxa.filter(itm => {return itm.scientificName == taxon.acceptedSpeciesName.trim() })
            if (matchingHigherTaxa.length > 0) {
              createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, false, taxonUpdateCount)
              checkedTaxa.add(taxon.acceptedSpeciesName)
              taxaProcessed.count++
            }
            else {
              //try the accepted name genus with our initial higherTaxa
              searchGenus = taxon.acceptedSpeciesName.trim().split(' ').filter(x => x.length > 0)[0]
              if (!checkedTaxa.has(searchGenus)) {
                matchingHigherTaxa = higherTaxa.filter(itm => {return itm.genus.trim() == searchGenus })
                if (matchingHigherTaxa.length > 0) {
                  //we need to filter just those that have unique higher classification
                  uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                  createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, true, taxonUpdateCount)
                  checkedTaxa.add(searchGenus)
                  checkedGenera[searchGenus] = uniqueHigherTaxa
                  taxaProcessed.count++
                }
                else {
    
                  //see if we can find the genus in the database
                  sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon ' +
                    'WHERE TRIM(genus) = \'' + searchGenus + '\' AND family is not null'

                  sqlStart = microtime.now()
                  try {
                    matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
                  }
                  catch(err){
                    sqlErrors.push(
                      {
                        taxonID: taxon.taxonID,
                        scientificName: taxon.scientificName,
                        error: err
                      }
                    )
                    continue;
                  }

                  sqlEnd = microtime.now()
                  if (perf.qryTimes[taxon.taxonID]){
                    perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
                  }
                  else {
                    perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
                  }
                  
                  if (matchingHigherTaxa.length > 0) {
                    uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                    createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, true, taxonUpdateCount)
                    checkedTaxa.add(searchGenus)
                    checkedGenera[searchGenus] = uniqueHigherTaxa
                    taxaProcessed.count++
                  }
                  else {
                    //try the scientificName with the results we have already
                    if (!checkedTaxa.has(taxon.scientificName)) {
                      matchingHigherTaxa = higherTaxa.filter(itm => {return itm.scientificName == taxon.scientificName.trim() })
                      if (matchingHigherTaxa.length > 0) {
                        createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, false, taxonUpdateCount)
                        checkedTaxa.add(taxon.scientificName)
                        taxaProcessed.count++
                      }
                      else {

                        //check in the database
                        sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon ' +
                          'WHERE TRIM(scientificName) = \'' + taxon.scientificName.trim() + '\' AND family is not null'
                        
                        sqlStart = microtime.now()
                        try {
                          matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
                        }
                        catch(err){
                          sqlErrors.push(
                            {
                              taxonID: taxon.taxonID,
                              scientificName: taxon.scientificName,
                              error: err
                            }
                          )
                          continue
                        }

                        sqlEnd = microtime.now()
                        if (perf.qryTimes[taxon.taxonID]){
                          perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
                        }
                        else {
                          perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
                        }
                        
                        if (matchingHigherTaxa.length > 0) {
                          uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                          createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, false, taxonUpdateCount)
                          checkedTaxa.add(searchGenus)
                          checkedGenera[searchGenus] = uniqueHigherTaxa
                          taxaProcessed.count++
                        }
                        else {
                          //try the scientificName genus with what we have
                          searchGenus = taxon.scientificName.trim().split(' ').filter(x => x.length > 0)[0]
                          if (!checkedTaxa.has(searchGenus)){
                            matchingHigherTaxa = higherTaxa.filter(itm => {return itm.genus.trim() == searchGenus })
                            if (matchingHigherTaxa.length > 0) {
                              //we need to filter just those that have unique higher classification
                              var uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                              createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, true, taxonUpdateCount)
                              checkedTaxa.add(searchGenus)
                              checkedGenera[searchGenus] = uniqueHigherTaxa
                              taxaProcessed.count++
                            }
                            else {
                              //check the database using the genus part of the scientificName
                              sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon ' +
                                'WHERE TRIM(genus) = \'' + searchGenus + '\' AND family is not null'
                              
                              sqlStart = microtime.now()
                              try {
                                matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
                              }
                              catch(err){
                                sqlErrors.push(
                                  {
                                    taxonID: taxon.taxonID,
                                    scientificName: taxon.scientificName,
                                    error: err
                                  }
                                )
                                continue
                              }

                              sqlEnd = microtime.now()
                              if (perf.qryTimes[taxon.taxonID]){
                                perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
                              }
                              else {
                                perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
                              }
                              
                              if (matchingHigherTaxa.length > 0) {
                                uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                                createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, true, taxonUpdateCount)
                                checkedTaxa.add(searchGenus)
                                checkedGenera[searchGenus] = uniqueHigherTaxa
                                taxaProcessed.count++
                              }
                              else {
                                //we really have nothing
                                addNameError(taxon, nameErrors, 'No higher taxa found')
                                taxaProcessed.count++
                              }                         
                            }
                          }
                          else { //reuse the higher taxon for this genus
                            matchingHigherTaxa = checkedGenera[searchGenus]
                            createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, true, taxonUpdateCount)
                            taxaProcessed.count++
                          }                        
                        }                     
                      }
                    }
                    else {
                      taxaProcessed.count++
                    }
                  }                
                }
              }
              else { //reuse the higher taxon for this genus
                matchingHigherTaxa = checkedGenera[searchGenus]
                createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, true, taxonUpdateCount)
                taxaProcessed.count++
              }
            }
          }
          else {
            taxaProcessed.count++
          }    
        }
        else {
          //try the scientificName with the results we have already
          if (!checkedTaxa.has(taxon.scientificName)) {
            matchingHigherTaxa = higherTaxa.filter(itm => {return itm.scientificName == taxon.scientificName.trim() })
            if (matchingHigherTaxa.length > 0) {
              createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, false, taxonUpdateCount)
              checkedTaxa.add(taxon.scientificName)
              taxaProcessed.count++
            }
            else {

              //check in the database
              sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon ' +
                'WHERE TRIM(scientificName) = \'' + taxon.scientificName.trim() + '\' AND family is not null'
              
              sqlStart = microtime.now()
              try {
                matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
              }
              catch(err){
                sqlErrors.push(
                  {
                    taxonID: taxon.taxonID,
                    scientificName: taxon.scientificName,
                    error: err
                  }
                )
                continue
              }

              sqlEnd = microtime.now()
              if (perf.qryTimes[taxon.taxonID]){
                perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
              }
              else {
                perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
              }
              
              if (matchingHigherTaxa.length > 0) {
                uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'scientificName', nameUpdates, update, false, taxonUpdateCount)
                checkedTaxa.add(searchGenus)
                checkedGenera[searchGenus] = uniqueHigherTaxa
                taxaProcessed.count++
              }
              else {
                //try the scientificName genus with what we have
                searchGenus = taxon.scientificName.trim().split(' ').filter(x => x.length > 0)[0]
                if (!checkedTaxa.has(searchGenus)){
                  matchingHigherTaxa = higherTaxa.filter(itm => {return itm.genus.trim() == searchGenus })
                  if (matchingHigherTaxa.length > 0) {
                    //we need to filter just those that have unique higher classification
                    uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                    createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'genus', nameUpdates, update, true, taxonUpdateCount)
                    checkedTaxa.add(searchGenus)
                    checkedGenera[searchGenus] = uniqueHigherTaxa
                    taxaProcessed.count++
                  }
                  else {
                    //check the database using the genus part of the scientificName
                    sql = 'SELECT DISTINCT kingdom, phylum, class, [order], family, genus, TRIM(scientificName) as scientificName FROM taxon ' +
                      'WHERE TRIM(genus) = \'' + searchGenus + '\' AND family is not null'
                    
                    sqlStart = microtime.now()
                    try {
                      matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
                    }
                    catch(err){
                      sqlErrors.push(
                        {
                          taxonID: taxon.taxonID,
                          scientificName: taxon.scientificName,
                          error: err
                        }
                      )
                      continue
                    }

                    sqlEnd = microtime.now()
                    if (perf.qryTimes[taxon.taxonID]){
                      perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
                    }
                    else {
                      perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
                    }
                    
                    if (matchingHigherTaxa.length > 0) {
                      uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
                      createUpdateStatement(uniqueHigherTaxa, nameErrors, taxon, 'genus', nameUpdates, update, true, taxonUpdateCount)
                      checkedTaxa.add(searchGenus)
                      checkedGenera[searchGenus] = uniqueHigherTaxa
                      taxaProcessed.count++
                    }
                    else {
                      //we really have nothing
                      addNameError(taxon, nameErrors, 'No higher taxa found')
                      taxaProcessed.count++
                    }                         
                  }
                }
                else { //reuse the higher taxon for this genus
                  matchingHigherTaxa = checkedGenera[searchGenus]
                  createUpdateStatement(matchingHigherTaxa, nameErrors, taxon, 'accepted_species_name', nameUpdates, update, true, taxonUpdateCount)
                  taxaProcessed.count++
                }                        
              }                     
            }
          }
          else {
            taxaProcessed.count++
          }
        }

        var end = microtime.now()
        perf.allTimes.push(end-start)

        //for testing only
        /*
        if (perf.allTimes.length == 1578) { //its 1579!!!
          var pause = null;
          //break
        }
        
        
        if ([1000, 2000, 5000, 7000, 10000, 12000, 15000].includes(perf.allTimes.length)){
          var pause = null;
          //break
        }
        */
        

      }

      var allEnd = Date.now()

      perf.totalTime = allEnd - allStart
      console.log('Time to process results: ' + (perf.totalTime/1000).toFixed(2) + 'secs')

      //print the summary of errors
      var errorSummary = nameErrorsSummary(nameErrors)
      console.log('ERRORS:' + errorSummary.errorCount)
      for (var key in errorSummary){
        if (key != 'errorCount') {
          console.log(key + ': ' + errorSummary[key])
        }

      }

      console.log('Total number of taxa processed: ' + taxaProcessed.count)

      console.log('Taxa used to produce UPDATE statements: ' + taxonUpdateCount.count)

      var totalQryTime = 0
      for (var key in perf.qryTimes) {
        totalQryTime += perf.qryTimes[key]
      }

      console.log('Total database query time in processing: ' + (totalQryTime/1000000).toFixed(2) + 'secs')
      
      var updateStart = Date.now()
      console.log('Updating higher taxa')
      try {
        var updateQryResults = await zodatsaTaxa.query(update.updateString)
      }
      catch(err){
        console.log('Error running updates: ')
        throw err
      }

      var updateTime = Date.now() - updateStart

      var updateRowCount = 0
      var rowCountArr = updateQryResults[0]
      for (var count of rowCountArr){
        updateRowCount += count.affectedrows
      }

      console.log('Records updated: ' + updateRowCount)

      console.log('Update time: ' + (updateTime/1000).toFixed(2) + 'secs') 

      console.log('Writing errors to log file')
      try {
        err = await appendFile(process.cwd() + '/interfaces/sqlserver/sqlCleaning.log', JSON.stringify(nameErrors) + '\r\n\r\n\r\n')
        if (err) {
          throw err
        }
      }
      catch(err){
        console.log('error writing to log file')
        throw err
      }
        
      return;

    }
    else {
      console.log('no higher taxa returned')
      return; 
    }

  }

  async function removeSingleQuotes(checkColsArray){
    if (!checkColsArray || !Array.isArray(checkColsArray) || checkColsArray.length == 0) {
      console.log('invalid taxon ranks array provided')
      return
    }
    
    var updateSql = ''

    var promiseArr = []

    console.log('Fetching names with single quotes')
    for (var col of checkColsArray) {
      
      var fetchQryStart = Date.now()

      var sql = 'SELECT [' + col + '] from taxon WHERE [' +  col + '] LIKE \'%\'\'\'' //we need the brackets for 'order'
      promiseArr.push(zodatsaTaxa.query(sql, { type: QueryTypes.SELECT }))
      
    }

    try {
      var namesWithSingleQuotesArr = await Promise.all(promiseArr)
    }
    catch(err){
      console.log('Error fetching names with single quotes')
      throw err
    }
    var qryTime = Date.now() - fetchQryStart
    var namesCount = namesWithSingleQuotesArr.map(arr=> arr.length).reduce((a, b) => a + b)
    console.log('Query time: ' + (qryTime/1000).toFixed(2) + 'secs') 
    
    

    if (namesCount > 0){
      console.log(namesCount + ' names found with single quotes')
      var singleQuoteRegex = new RegExp('\'','g')
      var uniqueNames
      for (const [index, namesObjArr] of namesWithSingleQuotesArr.entries()) {
        if (namesObjArr.length > 0) {
          var uniqueNames = namesObjArr.map(namesObj => namesObj[checkColsArray[index]]).filter(onlyUnique)
          for (var name of uniqueNames) {
            var strippedName = name.replace(singleQuoteRegex, '')
            var quotedName = name.replace(singleQuoteRegex, '\'\'') //we need the double quotes for SQL WHERE clause
            updateSql += 'UPDATE taxon SET [' + checkColsArray[index] + '] = \'' + 
              strippedName + '\' output @@rowcount as rowsaffected WHERE [' + checkColsArray[index] + '] = \'' + quotedName + '\';'
          }
        }
      }
  
      var updateStart = Date.now()
      try {
        var updateResults = await zodatsaTaxa.query(updateSql)
      }
      catch(err) {
        console.log('Error in updating names with single quotes')
        throw(err)
      }
  
      var updateTime = Date.now() - updateStart
  
      var updateRowCount = updateResults[0].length
  
      console.log('Records updated: ' + updateRowCount)
  
      console.log('Update time: ' + (updateTime/1000).toFixed(2) + 'secs') 
  
      return
    }
    else {
      console.log('No names found with single quotes')
      return
    }

  }//there are cases where we have taxon names surrounded by quotes. This should be run before any other functions

  async function makeTitleCase(checkColsArray) {
    if (!checkColsArray || !Array.isArray(checkColsArray) || checkColsArray.length == 0) {
      console.log('invalid taxon ranks array provided')
      return
    }
    
    var updateSql = ''

    var promiseArr = []

    console.log('Fetching names not in title case')
    for (var col of checkColsArray) {
      
      var fetchQryStart = Date.now()

      var sql = `SELECT [${col}] FROM taxon WHERE LEFT([${col}],1) != UPPER(LEFT([${col}],1)) COLLATE SQL_Latin1_General_CP1_CS_AS OR
        SUBSTRING([${col}], 2, LEN([${col}])) != LOWER(SUBSTRING([${col}], 2, LEN([${col}]))) COLLATE SQL_Latin1_General_CP1_CS_AS`
      
      promiseArr.push(zodatsaTaxa.query(sql, { type: QueryTypes.SELECT }))
      
    }

    try {
      var namesNotIntitleCase = await Promise.all(promiseArr)
    }
    catch(err){
      console.log('Error fetching names with single quotes')
      throw err
    }
    var qryTime = Date.now() - fetchQryStart
    var namesCount = namesNotIntitleCase.map(arr=> arr.length).reduce((a, b) => a + b)
    console.log('Query time: ' + (qryTime/1000).toFixed(2) + 'secs') 

    if (namesCount > 0){
      console.log(namesCount + ' names records found not in title case')
      var uniqueNames
      for (const [index, namesObjArr] of namesNotIntitleCase.entries()) {
        if (namesObjArr.length > 0) {
          var uniqueNames = namesObjArr.map(namesObj => namesObj[checkColsArray[index]]).filter(onlyUnique)
          for (var name of uniqueNames) {
            var titleCaseName = name[0].toUpperCase() + name.slice(1, name.length).toLowerCase()
            updateSql += 'UPDATE taxon SET [' + checkColsArray[index] + '] = \'' + 
              titleCaseName + '\' output @@rowcount as rowsaffected WHERE [' + checkColsArray[index] + '] = \'' + name + '\' COLLATE SQL_Latin1_General_CP1_CS_AS;'
          }
        }
      }
  
      var updateStart = Date.now()
      try {
        var updateResults = await zodatsaTaxa.query(updateSql)
      }
      catch(err) {
        console.log('Error in updating names with single quotes')
        throw(err)
      }
  
      var updateTime = Date.now() - updateStart
  
      var updateRowCount = updateResults[0].length
  
      console.log('Records updated: ' + updateRowCount)
  
      console.log('Update time: ' + (updateTime/1000).toFixed(2) + 'secs') 
  
      return
    }
    else {
      console.log('No names found with single quotes')
      return
    }

  }

  async function trimStrings(fields) {
    for (var field of fields) {
      var sql = `SELECT DISTINCT [${field}] FROM taxon WHERE [${field}] LIKE ' %' OR [${field}] LIKE '% '`
      try {
        var taxaWithWhiteSpace = await zodatsaTaxa.query(sql, {type: QueryTypes.SELECT})
      }
      catch(err) {
        console.log(err)
      }
      

      //so we just have the names
      var taxonNames = []
      for (var taxonObj of taxaWithWhiteSpace){
        taxonNames.push(taxonObj[Object.keys(taxonObj)[0]])
      }

      var updateSQL = ''
      for (var name of taxonNames){
        var trimmedName = name.trim()
        if (trimmedName == '') {
          updateSQL += `UPDATE taxon SET [${field}] = NULL WHERE [${field}] = '${name}';`
        }
        else {
          updateSQL += `UPDATE taxon SET [${field}] = '${name.trim().replace(/'/g, `''`)}' WHERE [${field}] = '${name.replace(/'/g, `''`)}';`
        }
        
      }

      if (updateSQL != '') {
        try {
          await zodatsaTaxa.query(updateSQL, {type: QueryTypes.SELECT})
          var i = 0
        }
        catch(err) {
          console.log(err)
        }
      }
    }
  }

  return {

    addMissingHigherTaxa: addMissingHigherTaxa,
    removeSingleQuotes: removeSingleQuotes,
    makeTitleCase: makeTitleCase,
    trimStrings: trimStrings

  }

}