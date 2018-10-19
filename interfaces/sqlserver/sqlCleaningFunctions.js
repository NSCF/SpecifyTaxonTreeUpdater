const microtime = require('microtime')
const fs = require('fs')
const {promisify} = require('util');
const LineByLineReader = require('line-by-line')

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

  function timeNow() {
    var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours(),
        m = (d.getMinutes()<10?'0':'') + d.getMinutes();
    return h + ':' + m;
  }

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

  function readMissingTaxaLog(){

    console.log('starting readMissingTaxaLog')

    return new Promise((resolve, reject) => {

      var lines = []

      lr = new LineByLineReader('./sqlCleaning.log');

      lr.on('error', function (err) {
        // 'err' contains error object
        console.log('error reading file' + err)
        reject(err)
      });

      lr.on('line', function (line) {
        // 'line' contains the current line without the trailing newline character.
        console.log('reading a line')
        lines.push(line)
      });

      lr.on('end', function () {
        // All lines are read, file is closed now.
        console.log('finished reading file')
        resolve(lines)
      });

    })
    
  }

  async function getHigherTaxaFromDB(sql, taxon, sqlErrors, perf) {
    var sqlStart = microtime.now()
    try {
      var matchingHigherTaxa = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
    }
    catch(err){
      sqlErrors.push(
        {
          taxonID: taxon.taxonID,
          scientificName: taxon.scientificName,
          error: 'Error fetching higher taxa: ' + err
        }
      )
      return []
    }

    sqlEnd = microtime.now()
    if (perf.qryTimes[taxon.taxonID]){
      perf.qryTimes[taxon.taxonID] += sqlEnd - sqlStart
    }
    else {
      perf.qryTimes[taxon.taxonID] = sqlEnd - sqlStart
    }

    return matchingHigherTaxa

  }

  async function findHigherTaxa(taxonWithMissingHigherTaxa, checkedTaxa, sqlErrors, perf){

    if(taxonWithMissingHigherTaxa.scientificName == 'Agama armata') {
      //pause
    }
    
    var searchTaxonName;
    if (taxonWithMissingHigherTaxa.acceptedSpeciesName){
      searchTaxonName = taxonWithMissingHigherTaxa.acceptedSpeciesName
    }
    else {
      searchTaxonName = taxonWithMissingHigherTaxa.scientificName
    }

    var acceptedName = taxonWithMissingHigherTaxa.acceptedSpeciesName

    //do we have it already?
    if (checkedTaxa[searchTaxonName]) {
      return checkedTaxa[searchTaxonName]
    }

    var sql = `SELECT DISTINCT kingdom, phylum, class, [order], family, genus, scientificName FROM taxon
        WHERE scientificName = '${searchTaxonName}' AND family is not null`
      
    var matchingHigherTaxa = await getHigherTaxaFromDB(sql, taxonWithMissingHigherTaxa, sqlErrors, perf)
    
    if (matchingHigherTaxa.length == 0) {
      //if we used the accepted species name try again with the genus
      var searchGenus = searchTaxonName.split(' ').filter(x => x.length > 0)[0]
      if (checkedTaxa[searchGenus]) {
        return checkedTaxa[searchGenus]
      }
      sql = `SELECT DISTINCT kingdom, phylum, class, [order], family, genus, scientificName FROM taxon
      WHERE genus = '${searchGenus}' AND family is not null`
      matchingHigherTaxa = await getHigherTaxaFromDB(sql, taxonWithMissingHigherTaxa, sqlErrors, perf)
      if (matchingHigherTaxa.length > 0) {
        checkedTaxa[searchGenus] = matchingHigherTaxa
        checkedTaxa[acceptedName] = matchingHigherTaxa
        return matchingHigherTaxa
      }

      //store the genus for later
      var genus1 = searchGenus

      //try with the scientificName
      searchTaxonName = taxonWithMissingHigherTaxa.scientificName
      if (checkedTaxa[searchTaxonName]) {
        return checkedTaxa[searchTaxonName]
      }
      sql = `SELECT DISTINCT kingdom, phylum, class, [order], family, genus, scientificName FROM taxon
      WHERE scientificName = '${searchTaxonName}' AND family is not null`
      matchingHigherTaxa = await getHigherTaxaFromDB(sql, taxonWithMissingHigherTaxa, sqlErrors, perf)
      if (matchingHigherTaxa.length > 0) {
        checkedTaxa[searchTaxonName] = matchingHigherTaxa
        checkedTaxa[acceptedName] = matchingHigherTaxa
        return matchingHigherTaxa
      }
      
      searchGenus = searchTaxonName.split(' ').filter(x => x.length > 0)[0]
      if (checkedTaxa[searchGenus]) {
        return checkedTaxa[searchGenus]
      }
      sql = `SELECT DISTINCT kingdom, phylum, class, [order], family, genus, scientificName FROM taxon
      WHERE genus = '${searchGenus}' AND family is not null`
      matchingHigherTaxa = await getHigherTaxaFromDB(sql, taxonWithMissingHigherTaxa, sqlErrors, perf)
      if (matchingHigherTaxa.length > 0) {
        checkedTaxa[searchGenus] = matchingHigherTaxa
        checkedTaxa[acceptedName] = matchingHigherTaxa
        return matchingHigherTaxa
      }

      //we got nothing
      checkedTaxa[acceptedName] = []
      checkedTaxa[taxonWithMissingHigherTaxa.scientificName] = []
      checkedTaxa[genus1] = []
      checkedTaxa[searchGenus] = []
      return []

    }
    else {
      checkedTaxa[searchTaxonName] = matchingHigherTaxa
      return matchingHigherTaxa
    }
    
  }

  async function updateHigherTaxa(matchingHigherTaxa, taxon, nameErrors, nameUpdates, taxonUpdateCount){

    var uniqueHigherTaxa = matchingHigherTaxa.filter(uniqueHigherTaxaFilter)
    
    if (uniqueHigherTaxa.length > 1){
      addNameError(taxon, nameErrors, 'Multiple higher classifications exist', uniqueHigherTaxa)
      return
    }
    else {

      taxonUpdateCount.count++

      var higherClass = uniqueHigherTaxa[0]
      var updateString = 
        `UPDATE taxon SET kingdom = '${higherClass.kingdom}',  
        phylum = '${higherClass.phylum}', 
        class = '${higherClass.class}',
        [order] = '${higherClass.order}', 
        family = '${higherClass.family}', 
        edits = 'Higher taxon names copied from taxon ${higherClass.scientificName.replace(/'/g, `''`)}.' + CHAR(13)
        WHERE taxonID = ${taxon.taxonID};` //char13 is a line break

      //run it
      try {
        await zodatsaTaxa.query(updateString, { type: QueryTypes.UPDATE })
      }
      catch(err){
        throw(err)
      }

      nameUpdates.updateCount++;
      
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

    var allStart = Date.now()
      
    var sqlStart, sqlEnd = null

    var checkedTaxa = new Set(); //for keeping track of names we've already processed
    var checkedGenera = {} //we need to keep track of these so we can reuse them as genus:matchedTaxaArray
    var taxaProcessed = { count: 0 }

    //our vars
    var uniqueHigherTaxa, matchingHigherTaxa, searchGenus = null

    var taxonUpdateCount = { count: 0 }

    console.log('Processing taxa with missing higher classifications')

    for (const taxon of taxaWithNoHigherClass) {

      var start = microtime.now()

      taxaProcessed.count++

      var matchingHigherTaxa = await findHigherTaxa(taxon, checkedTaxa, sqlErrors, perf)

      if(matchingHigherTaxa.length > 0) {
        try {
          await updateHigherTaxa(matchingHigherTaxa,taxon, nameErrors, nameUpdates, taxonUpdateCount)
        }
        catch(err){
          sqlErrors.push(
            {
              taxonID: taxon.taxonID,
              scientificName: taxon.scientificName,
              error: 'Error updating higher taxa: ' + err
            }
          )
        }
      }

      else {
        addNameError(taxon,nameErrors, 'No higher taxa found', [])
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
    console.log('Total number of taxa updated: ' + nameUpdates.updateCount)

    var totalQryTime = 0
    for (var key in perf.qryTimes) {
      totalQryTime += perf.qryTimes[key]
    }

    console.log('Total database query time in processing: ' + (totalQryTime/1000000).toFixed(2) + 'secs')

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

  async function showUniqueChars(field) {
    console.log('fetching records from DB for unique chars')

    var sql = `SELECT DISTINCT ${field} FROM taxon`

    try{
      var result = await zodatsaTaxa.query(sql, {type: QueryTypes.SELECT} )
    }
    catch(err){
      throw(err)
    }

    if (result.length == 0){
      console.log('Nothing returned from database')
    }
    else {
      console.log(result.length + ' values returned from DB')

      var charcounts = result.map(v => v[field]).join('').split('').reduce((acc, char) => {
        acc[char] = (acc[char] || 0) + 1;
        return acc;
      }, {});

      console.log(Object.keys(charcounts).length + ' unique characters found.')

      console.log('Char\t\tCount')

      for (var char in charcounts){
        console.log(char + '\t\t' + charcounts[char])
      }

    }

  }

  async function replaceSpecialChars(field, table){
    console.log('starting special character replacement')
    var targets = ['[',']','╔. ','╓','÷','Ω','≤','σ','π','Σ','±','‑','–','α','|','µ','Φ','Θ']
    var replacements = ['','','','Ö','ö','ê','ó','å','ã','ä','ñ','-','-','à','','æ','è','é']

    var updateCount = 0

    for (var i = 0; i < targets.length; i++){
      var updatesql = `Update ${table} 
        set ${field} = replace(${field}, N'${targets[i]}', N'${replacements[i]}') 
        output @@rowcount as count 
        where ${field} like N'%${targets[i]}%'`

      try{
        var result = await zodatsaTaxa.query(updatesql, {type: QueryTypes.UPDATE})
      }
      catch(err){
        throw(err)
      }

      updateCount += result[1].rows.length
      
    }

    console.log(updateCount + ' records with special characters updated')

  }

  async function replaceSuperscript(superscriptChar, replaceChar, field, table) {
    
    console.log('starting replace superscript '  + superscriptChar)
    
    var getSuperScript = require('./superscript.js')

    var superChar = getSuperScript(superscriptChar)

    var sql = `UPDATE ${table} 
      SET ${field} = replace(${field}, N'${superChar}' COLLATE SQL_Latin1_General_CP1_CS_AS, '${replaceChar}')
      OUTPUT @@rowcount as count 
      WHERE ${field} like N'%${superChar}%' COLLATE SQL_Latin1_General_CP1_CS_AS;`

    try{
      var result = await zodatsaTaxa.query(sql, {type: QueryTypes.UPDATE})
    }
    catch(err){
      throw(err)
    }

    updateCount = result[1].rows.length

    console.log(`${updateCount} rows updated in ${field}`)

  }

  async function removeDuplicates(){

    console.log('starting delete duplicates')
    
    var duplicatesSql = `select scientificName, Authorship, accepted_species_name, accepted_species_author, count(*) as count from taxon
      group by scientificName, Authorship, accepted_species_name, accepted_species_author
      Having count(*) > 1`
    
    try{
      var duplicates = await zodatsaTaxa.query(duplicatesSql, { type: QueryTypes.SELECT })
    }
    catch(err){
      throw(err)
    }

    var duplicateRecordsCount = duplicates.reduce((total, obj) => total + obj.count, 0)

    console.log(duplicates.length + ' duplicated names found for ' + duplicateRecordsCount + ' records')

    var deleteCount = 0

    for (const duplicate of duplicates){
      var sql = `SELECT * from taxon WHERE scientificName = '${duplicate.scientificName}' `
      
      if (duplicate.Authorship){
        sql += `AND authorship = '${duplicate.Authorship}' `
      }
      else {
        sql += `AND authorship IS NULL `
      }
      
      if (duplicate.accepted_species_name){
        sql += `AND accepted_species_name = '${duplicate.accepted_species_name}' `
      }
      else {
        sql += `AND accepted_species_name IS NULL `
      }

      if (duplicate.accepted_species_author){
        sql += `AND accepted_species_author = '${duplicate.accepted_species_author}';`
      }
      else {
        sql += `AND accepted_species_author IS NULL;`
      }

      try {
        var records = await zodatsaTaxa.query(sql, { type: QueryTypes.SELECT })
      }
      catch(err) {
        throw(err)
      }
  
      var deleteIDs = records.map(r => r.taxonID)
      deleteIDs.shift() //remove the first so we keep one
      if(deleteIDs.length == 0){
        var i = 1
      }

      var deleteSql = `DELETE FROM taxon OUTPUT @@ROWCOUNT as count WHERE taxonID IN (${deleteIDs})`

      try {
        var rowCount = await zodatsaTaxa.query(deleteSql)
      }
      catch(err){
        throw(err)
      }

      deleteCount += rowCount[0][0].count

    }

    console.log(deleteCount + ' records deleted')
    
  }

  return {

    addMissingHigherTaxa: addMissingHigherTaxa,
    removeSingleQuotes: removeSingleQuotes,
    makeTitleCase: makeTitleCase,
    trimStrings: trimStrings, 
    removeDuplicates: removeDuplicates,
    showUniqueChars: showUniqueChars,
    replaceSpecialChars: replaceSpecialChars,
    replaceSuperscript: replaceSuperscript,
    readMissingTaxaLog: readMissingTaxaLog

  }

}