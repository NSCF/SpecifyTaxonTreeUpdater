/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reference', {
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id'
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
    tableName: 'references'
  });
};
