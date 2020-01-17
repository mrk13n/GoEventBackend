const db = require('./database');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const saltRounds  = 10;
const User = db.User;

exports.registration = (req, res) => {
    const topics = req.body.topics ? req.body.topics : [];
    const email = req.body.email;
    const data = {
        password: req.body.password,
        name: req.body.name,
        surname: req.body.surname,
        topics: topics
    };

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(email, salt, (err, code) => {
            data.code = code;
            QRCode.toDataURL(data.code, (err, url) => {
                if (err) throw err;
                bcrypt.hash(data.password, salt, (err, password) => {
                    data.password = password;
                    data.qr = url;
                    User
                        .findOrCreate({ where: { email: email }, defaults: data })
                        .spread((user, created) => {
                            if (created) {
                                res.send(user.get({ plain: true }))
                            } else {
                                res.send({ isExists: true })
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
                    res.send(user);
                } else {
                    res.send({ incorrectPassword: true })
                }
            } else {
                res.send({ notFound: true });
            }
        })
};

exports.findQrCode = (req, res) => {
    const hash = req.body.hash;

    User
        .findOne({ where: { code: hash }, attributes: ['code'] })
        .then((user) => {
            res.send(user);
        })
};
