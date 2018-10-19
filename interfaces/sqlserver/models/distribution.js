module.exports = function(sequelize, DataTypes) {
  return sequelize.define('distribution', {
    taxonID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'taxonID'
    },
    commonName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'commonName'
    },
    countries: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'countries'
    },
    SADistribution: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'SADistribution'
    },
    nativeStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'nativeStatus'
    },
    barcodeStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'barcodeStatus'
    },
    taxonReferenceSource: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'taxonReferenceSource'
    },
    publicationDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'publicationDetails'
    },
    webReference: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'webReference'
    }
  }, {
    tableName: 'distribution'
  });
};