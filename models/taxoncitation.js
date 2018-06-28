/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('taxoncitation', {
    taxonCitationId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'TaxonCitationID'
    },
    timestampCreated: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'TimestampCreated'
    },
    timestampModified: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'TimestampModified'
    },
    version: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'Version'
    },
    number1: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Number1'
    },
    number2: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Number2'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Remarks'
    },
    text1: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text1'
    },
    text2: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text2'
    },
    yesNo1: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo1'
    },
    yesNo2: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo2'
    },
    modifiedByAgentId: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'agent',
        key: 'AgentID'
      },
      field: 'ModifiedByAgentID'
    },
    taxonId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'taxon',
        key: 'TaxonID'
      },
      field: 'TaxonID'
    },
    createdByAgentId: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'agent',
        key: 'AgentID'
      },
      field: 'CreatedByAgentID'
    },
    referenceWorkId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'referencework',
        key: 'ReferenceWorkID'
      },
      field: 'ReferenceWorkID'
    }
  }, {
    tableName: 'taxoncitation',
    timestamps: true,
    createdAt: 'timestampCreated',
    updatedAt: 'timestampModified'
  });
};
