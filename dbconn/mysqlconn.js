module.exports = function(database, host, user, pwd, Sequelize){
    const sequelize = new Sequelize(database, user, pwd, {
    host: host,
    dialect: 'mysql',
    operatorsAliases: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    });

    return sequelize;
    
}