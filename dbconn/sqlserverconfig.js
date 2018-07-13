module.exports = {
  dialect: 'mssql',
  dialectModulePath: 'sequelize-msnodesqlv8',
  dialectOptions: {
    driver: 'SQL Server Native Client 11.0', //you may need to change this depending on your installed version. Open SQL Server Configuration Manager to
    instanceName: 'SQLEXPRESS',
    trustedConnection: true
  },
  operatorsAliases: false 
}