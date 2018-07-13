const Sequelize = require('sequelize');
const config = require('./sqlserverconfig')

module.exports = function(database, host){

  config.host = host
  config.database = database
  config.define = {timestamps:false}
  config.logging = false

  config.pool = {
    max: 20000,
    min: 0,
    acquire: 30000,
    idle: 10000
  }

  return new Sequelize(config);

}