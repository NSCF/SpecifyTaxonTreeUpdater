/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taxon', {
    taxonID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'taxonID'
    },
    Kingdom: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Kingdom'
    },
    Phylum: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Phylum'
    },
    Class: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Class'
    },
    Order: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Order'
    },
    Family: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Family'
    },
    Genus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Genus'
    },
    Subgenus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Subgenus'
    },
    Species: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Species'
    },
    Subspecies: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Subspecies'
    },
    scientificName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'scientificName'
    },
    authorship: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Authorship'
    },
    scienfiticNameAuthorship: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'scienfiticNameAuthorship'
    },
    taxonStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'taxonStatus'
    },
    acceptedSpeciesName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'accepted_species_name'
    },
    acceptedSpeciesAuthor: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'accepted_species_author'
    },
    edits: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'edits'
    }
  }, {
    tableName: 'taxon'
  });
};
