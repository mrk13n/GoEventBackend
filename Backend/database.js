const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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
        User.sync({force: false})
            .then(() => {
                Categories.sync({force: false});
                Interests.sync({force: false});
            });

        User.belongsToMany(User, { through: Followers, as: 'User', foreignKey: 'userId' });
        User.belongsToMany(User, { through: Followers, as: 'Follower', foreignKey: 'followerId' });
        Followers.belongsTo(Followers, { through: Followers, as: 'User', foreignKey: 'userId' });
        Followers.belongsTo(Followers, { through: Followers, as: 'Follower', foreignKey: 'followerId' });
        User.belongsToMany(Categories, { through: Interests, as: 'Users', foreignKey: 'userId' });
        Categories.belongsToMany(User, { through: Interests, as: 'Categories', foreignKey: 'categoryId' });
        Interests.belongsTo(Interests, { through: Interests, as: 'Users', foreignKey: 'userId' });
        Interests.belongsTo(Interests, { through: Interests, as: 'Categories', foreignKey: 'categoryId' });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define('users', {
    id: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    surname: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    company: { type: Sequelize.STRING, allowNull: true },
    birth: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
    phone: { type: Sequelize.INTEGER, allowNull: true, unique: true },
    can: { type: Sequelize.STRING(1000), allowNull: true },
    look: { type: Sequelize.STRING(1000), allowNull: true },
    contacts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    communication: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    qr: { type: Sequelize.TEXT, allowNull: false },
    avatar: { type: Sequelize.TEXT, allowNull: true }
}, {
    freezeTableName: true,
});

const Followers = sequelize.define('followers', {
    id: { type: Sequelize.INTEGER, allowNull: false, unique: true, primaryKey: true, autoIncrement: true },
    userId: { type: Sequelize.STRING, allowNull: false },
    followerId: { type: Sequelize.STRING, allowNull: false }
}, {
    createdAt: false,
    updatedAt: false,
    freezeTableName: true
});

const Categories = sequelize.define('categories', {
    id: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false }
}, {
    createdAt: false,
    updatedAt: false,
    freezeTableName: true
});

const Interests = sequelize.define('interests', {
    id: { type: Sequelize.INTEGER, allowNull: false, unique: true, primaryKey: true, autoIncrement: true },
    userId: { type: Sequelize.STRING, allowNull: false },
    categoryId: { type: Sequelize.STRING, allowNull: false }
}, {
    createdAt: false,
    updatedAt: false,
    freezeTableName: true
});

exports.Op = Op;
exports.User = User;
exports.Followers = Followers;
exports.Categories = Categories;
exports.Interests = Interests;
