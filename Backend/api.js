const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const saltRounds  = 10;
const secret = '044f034ddeb087766de732c592d49b699d41249395f3b155070f866572857a8c3b7ad9ec64a2c8610e9be56b6b9475a2b178c1fb9aeab6639effa3af4f9ca2d3';
const Op = db.Op;
const User = db.User;
const Followers = db.Followers;
const Categories = db.Categories;
const Interests = db.Interests;

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send({ error: 'Token is not valid!' });

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(403).send({ error: 'Forbidden!' });
        req.user = user;
        next();
    });
};

exports.categories = (req, res) => {
    Categories.findAll()
        .then(categories => {
            return res.status(200).send(categories);
        });
};

exports.registration = (req, res) => {
    const topics = req.body.topics;
    let interests = [];
    const email = req.body.email;
    const data = {
        password: req.body.password,
        name: req.body.name,
        surname: req.body.surname,
    };

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(email, salt, (err, code) => {
            data.id = code;
            if (topics) {
                topics.forEach(item => {
                    interests.push({ userId: data.id, categoryId: item });
                });
            }
            QRCode.toDataURL(data.id, (err, url) => {
                if (err) throw err;
                bcrypt.hash(data.password, salt, (err, password) => {
                    data.password = password;
                    data.qr = url;
                    User
                        .findOrCreate({ where: { email: email }, defaults: data })
                        .then(([user, created]) => {
                            if (created) {
                                const token = jwt.sign(user.get({ plain: true }).id, secret);
                                if (interests.length > 0) {
                                    Interests.bulkCreate(interests)
                                        .then(() => {
                                            return res.status(201).send({ auth: token });
                                        });
                                }
                                return res.status(201).send({ auth: token });
                            } else {
                                return res.status(409).send({ error: 'User with this email exists!' });
                            }
                        });
                });
            });
        });
    });
};

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User
        .findOne({ where: { email: email } })
        .then(async (user) => {
            if (user) {
                const checkPassword = await bcrypt.compare(password, user.password);
                if (checkPassword) {
                    const token = jwt.sign(user.get({ plain: true }).id, secret);
                    return res.status(200).send({ auth: token });
                } else {
                    return res.status(401).send({ error: 'Incorrect Password!' });
                }
            } else {
                return res.status(404).send({ error: 'User Not Found!' });
            }
        })
};

exports.findUser = (req, res) => {
    User.findOne({ where: { id: req.user }, include: [{ model: User, as: 'myFollowers' }, { model: Categories, as: 'user' }] })
        .then((user) => {
            if (user) {
                return res.send(user.get({ plain: true }));
            } else {
                return res.status(404).send({ error: 'Not Found!' });
            }
        });
};

exports.follow = (req, res) => {
    const follower = req.body.follower;

    User.findAll({ where: { [Op.or]: [{ id: req.user }, { id: follower }] } })
        .then(users => {
            if (users.length === 2) {
                Followers.findOrCreate({ where: { userId: req.user, followerId: follower }})
                    .then(([user, created]) => {
                        if (created) {
                            return res.send(user.get({ plain: true }));
                        } else {
                            return res.status(409).send({ error: 'You are following this user!' });
                        }
                    })
            } else {
                return res.status(404).send({ error: 'Only 2 users must be in request!' });
            }
        });
};

// exports.delete = (req, res) => {
//     const id = req.body.id;
//
//     User.destroy({ where: { id: id } })
//         .then(() => {
//             return User.findAll()
//                 .then((users) => {
//                     res.send(users);
//                 })
//         });
// };
