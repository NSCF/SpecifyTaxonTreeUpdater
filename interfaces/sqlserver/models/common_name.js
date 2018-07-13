/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('commonName', {
    taxonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'taxonID'
    },
    commonNameElementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'common_name_element_id'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'name'
    },
    languageIso: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'language_iso'
    }
  }, {
    tableName: 'common_names'
  });
};
