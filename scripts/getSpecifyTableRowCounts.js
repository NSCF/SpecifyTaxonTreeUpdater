var specifydb = 'taxbackbone';
var specifyhost = 'localhost';
var user = 'ian'
var pwd = 'regalis'

const specify = require(process.cwd() + '/interfaces/specify/specifyInterface.js')(specifydb, specifyhost, user, pwd)

specify.getTableRowCounts('./temp/specifyRowCounts.csv').catch(err => console.log(err))