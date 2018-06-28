const Taxon = require('./models/taxon')(sequelize, Sequelize.DataTypes);

Taxon.findAll({attributes:['name']}).then(taxa => {
    taxa.forEach(taxon => {
      console.log(taxon.name)
    });
  })