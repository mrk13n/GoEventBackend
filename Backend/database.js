const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const sequelize = new Sequelize('goeventdb', 'goevent', '991325', {
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
                Passwords.sync({force: false});
                Followers.sync({force: false});
                Categories.sync({force: false})
                    .then(() => {
                        Interests.sync({force: false});
                    });
            });

        User.hasOne(Passwords);
        Passwords.belongsTo(User, { foreignKey: 'userId' });
        User.belongsToMany(User, { through: Followers, as: 'myFollowers', foreignKey: 'userId' });
        User.belongsToMany(User, { through: Followers, as: 'follower', foreignKey: 'followerId' });
        Followers.belongsTo(Followers, { through: Followers, as: 'myFollowers', foreignKey: 'userId' });
        Followers.belongsTo(Followers, { through: Followers, as: 'follower', foreignKey: 'followerId' });
        User.belongsToMany(Categories, { through: Interests, as: 'myCategories', foreignKey: 'userId' });
        Categories.belongsToMany(User, { through: Interests, as: 'userCategory', foreignKey: 'categoryId' });
        Interests.belongsTo(Interests, { through: Interests, as: 'myCategories', foreignKey: 'userId' });
        Interests.belongsTo(Interests, { through: Interests, as: 'userCategory', foreignKey: 'categoryId' });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define('users', {
    id: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    surname: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    company: { type: Sequelize.STRING, allowNull: true },
    birth: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
    phone: { type: Sequelize.STRING(11), allowNull: true, unique: true },
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
    userId: { type: Sequelize.STRING, allowNull: false },
    categoryId: { type: Sequelize.STRING, allowNull: false }
}, {
    createdAt: false,
    updatedAt: false,
    freezeTableName: true
});

const Passwords = sequelize.define('passwords', {
    userId: { type: Sequelize.STRING, allowNull: false, primaryKey: true, unique: true },
    password: { type: Sequelize.STRING, allowNull: true },
    googlePassword: { type: Sequelize.STRING, allowNull: true },
    facebookPassword: { type: Sequelize.STRING, allowNull: true },
    vkPassword: { type: Sequelize.STRING, allowNull: true }
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
exports.Passwords = Passwords;
