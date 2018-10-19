/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('commonName', {
    taxonID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'taxonID'
    },
    commonNameElementID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'common_name_element_id'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'name'
    },
    languageISO: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'language_iso'
    }
  }, {
    tableName: 'common_name'
  });
};
