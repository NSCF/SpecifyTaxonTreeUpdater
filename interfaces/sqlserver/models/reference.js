/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reference', {
    referenceID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      field: 'referenceID'
    },
    authors: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'authors'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'year'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'title'
    },
    text: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'text'
    }
  }, {
    tableName: 'reference'
  });
};
