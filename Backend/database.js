const Sequelize = require('sequelize');

const sequelize = new Sequelize('4_dev_kit_ru_db', '4_dev_kit_ru_usr', 'yh29TtE5oZYqdqCX', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define('users', {
    id: { type: Sequelize.INTEGER, allowNull: false, unique: true, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false },
    surname: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    company: { type: Sequelize.STRING, allowNull: true },
    birth: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
    phone: { type: Sequelize.INTEGER, allowNull: true, unique: true },
    can: { type: Sequelize.STRING(1000), allowNull: true },
    look: { type: Sequelize.STRING(1000), allowNull: true },
    friends: { type: Sequelize.TEXT, allowNull: true, get() { return this.getDataValue('friends') ? this.getDataValue('friends').split(';') : null }, set(value) { value.length > 0 ? this.setDataValue('friends', value.join(';')) : null } },
    topics: { type: Sequelize.TEXT, allowNull: true, get() { return this.getDataValue('topics') ? this.getDataValue('topics').split(';') : null }, set(value) { value.length > 0 ? this.setDataValue('topics', value.join(';')) : null },  },
    contacts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    communication: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    qr: { type: Sequelize.TEXT, allowNull: false, unique: true },
    code: { type: Sequelize.STRING, allowNull: false },
    avatar: { type: Sequelize.TEXT, allowNull: true }
}, {
    freezeTableName: true,
});

User.sync({force: false});

exports.User = User;
