/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taxonReference', {
    taxonID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'taxonID'
    },
    referenceID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'referenceID'
    }
  }, {
    tableName: 'taxonreference'
  });
};
