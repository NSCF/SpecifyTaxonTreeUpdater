/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taxon', {
    taxonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'taxonID'
    },
    kingdom: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Kingdom'
    },
    phylum: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Phylum'
    },
    class: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Class'
    },
    order: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Order'
    },
    family: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Family'
    },
    genus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Genus'
    },
    subgenus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'subgenus'
    },
    species: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Species'
    },
    subspecies: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Infraspecies'
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
    }
  }, {
    tableName: 'taxa'
  });
};
