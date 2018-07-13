/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taxonReference', {
    taxonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'taxonID'
    },
    referencesId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'references_id'
    }
  }, {
    tableName: 'taxon_references'
  });
};
