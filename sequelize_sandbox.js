//for testing tutorial code

const Task = sequelize.define('task', {
    title: Sequelize.STRING,
    rating: { type: Sequelize.STRING, defaultValue: 3 }
  })