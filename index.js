const Sequelize = require('sequelize');
const db = 'sptaxontree';
const dbhost = 'localhost';
const user = 'ian'
const pwd = 'regalis'
var sequelize = require('./dbconn/mysqlconn')(db, dbhost, user, pwd, Sequelize);
