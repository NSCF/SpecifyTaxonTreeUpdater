const Sequelize = require('sequelize');

var fs = require('fs')

function appendSQL(sql){

    fs.appendFile('SqlLog.txt', sql + '\r\n\r\n', function (err) {
        if (err) throw err;
        //console.log('Saved!');
      });

}

module.exports = function(database, host, user, pwd){
    const sequelize = new Sequelize(database, user, pwd, {
    dialect: 'mysql',
    operatorsAliases: false,

    host: host,
    user: user,
    password: pwd,
    database: database,

    logging: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },

    define: {
        timestamps: true,
        createdAt: 'timestampCreated',
        updatedAt: 'timestampModified'
        }

    });

    return sequelize;
    
}