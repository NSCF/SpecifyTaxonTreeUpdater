var prompt = require('prompt')

var db = 'up';
var dbhost = 'localhost';
var user = 'ian'
var pwd = 'regalis'

var specify = require('./interfaces/specify/specifyInterface')(db, dbhost, user, pwd)

var funcs = require('./interfaces/taxaMigrationFunctions.js')

//show disciplines
funcs.showDisciplines(specify).then(_ => {

  var discipline = 'Herpetology'
  specify.getTreeDef(discipline).then(treeDef => {
    specify.getMaxNodeNumber(treeDef).then(num => {
      console.log('Maximum node number for ' + discipline + ': ' + num)
    })
    .catch(err =>{
      console.log(err)
    })
  })
  .catch(err => {
    console.log(err)
  }) 
  
}).catch(err => console.log(err))