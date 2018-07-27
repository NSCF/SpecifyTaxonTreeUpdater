/* jshint indent: 2 */

module.exports = function(sequelizeInstance, DataTypes) {
  return sequelizeInstance.define('taxon', {
    taxonId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'TaxonID'
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
    author: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'Author'
    },
    citesStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'CitesStatus'
    },
    colStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'COLStatus'
    },
    commonName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'CommonName'
    },
    cultivarName: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'CultivarName'
    },
    environmentalProtectionStatus: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'EnvironmentalProtectionStatus'
    },
    esaStatus: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'EsaStatus'
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'FullName'
    },
    groupNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'GroupNumber'
    },
    guid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'GUID'
    },
    highestChildNodeNumber: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'HighestChildNodeNumber'
    },
    isAccepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'IsAccepted'
    },
    isHybrid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'IsHybrid', 
      defaultValue: false
    },
    isisNumber: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'IsisNumber'
    },
    labelFormat: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'LabelFormat'
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'Name'
    },
    ncbiTaxonNumber: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'NcbiTaxonNumber'
    },
    nodeNumber: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'NodeNumber'
    },
    number1: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'Number1'
    },
    number2: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'Number2'
    },
    number3: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Number3'
    },
    number4: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Number4'
    },
    number5: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Number5'
    },
    rankId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      field: 'RankID'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Remarks'
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'Source'
    },
    taxonomicSerialNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'TaxonomicSerialNumber'
    },
    iucnStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'Text1'
    },
    iucnStatusCriteria: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'Text2'
    },
    iucnAssessmentType: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text3'
    },
    iucnAssessmentYear: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text4'
    },
    topsStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text5'
    },
    unitInd1: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitInd1'
    },
    unitInd2: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitInd2'
    },
    unitInd3: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitInd3'
    },
    unitInd4: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitInd4'
    },
    unitName1: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitName1'
    },
    unitName2: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitName2'
    },
    unitName3: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitName3'
    },
    unitName4: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'UnitName4'
    },
    usfwsCode: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'UsfwsCode'
    },
    visibility: {
      type: DataTypes.INTEGER(4),
      allowNull: true,
      field: 'Visibility'
    },
    nsslSensitive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo1'
    },
    exotic: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo2'
    },
    yesNo3: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo3'
    },
    hybridParent2Id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'taxon',
        key: 'TaxonID'
      },
      field: 'HybridParent2ID'
    },
    hybridParent1Id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'taxon',
        key: 'TaxonID'
      },
      field: 'HybridParent1ID'
    },
    taxonTreeDefId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'taxontreedef',
        key: 'TaxonTreeDefID'
      },
      field: 'TaxonTreeDefID'
    },
    acceptedId: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'taxon',
        key: 'TaxonID'
      },
      field: 'AcceptedID'
    },
    parentId: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'taxon',
        key: 'TaxonID'
      },
      field: 'ParentID'
    },
    taxonTreeDefItemId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'taxontreedefitem',
        key: 'TaxonTreeDefItemID'
      },
      field: 'TaxonTreeDefItemID'
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
    visibilitySetById: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'specifyuser',
        key: 'SpecifyUserID'
      },
      field: 'VisibilitySetByID'
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
    integer1: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'Integer1'
    },
    integer2: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'Integer2'
    },
    integer3: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'Integer3'
    },
    integer4: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'Integer4'
    },
    integer5: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'Integer5'
    },
    taxonomicStatus: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'Text10'
    },
    tempAcceptedTaxonName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'Text11'
    },
    text12: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'Text12'
    },
    text13: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'Text13'
    },
    text14: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text14'
    },
    text15: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text15'
    },
    text16: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text16'
    },
    text17: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text17'
    },
    text18: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text18'
    },
    text19: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text19'
    },
    text20: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'Text20'
    },
    nsslURL: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text6'
    },
    text7: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text7'
    },
    text8: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text8'
    },
    text9: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Text9'
    },
    yesNo10: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo10'
    },
    yesNo11: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo11'
    },
    yesNo12: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo12'
    },
    yesNo13: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo13'
    },
    yesNo14: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo14'
    },
    yesNo15: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo15'
    },
    yesNo16: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo16'
    },
    yesNo17: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo17'
    },
    yesNo18: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo18'
    },
    yesNo19: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo19'
    },
    yesNo4: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo4'
    },
    yesNo5: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo5'
    },
    yesNo6: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo6'
    },
    yesNo7: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo7'
    },
    yesNo8: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo8'
    },
    yesNo9: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'YesNo9'
    }
  }, {
    tableName: 'taxon'
  });
};
