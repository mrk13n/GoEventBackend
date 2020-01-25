const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const Joi = require('@hapi/joi');
const nodemailer = require("nodemailer");
const saltRounds  = 10;
const secret = '044f034ddeb087766de732c592d49b699d41249395f3b155070f866572857a8c3b7ad9ec64a2c8610e9be56b6b9475a2b178c1fb9aeab6639effa3af4f9ca2d3';
const User = db.User;
const Followers = db.Followers;
const Categories = db.Categories;
const Interests = db.Interests;
const Passwords = db.Passwords;

const loginSchema = Joi.object({
    email: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.([A-Za-z]{2,4})?)*$'))
        .required(),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.{6,})'))
        .required()
});

const registrationSchema = Joi.object({
    email: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.([A-Za-z]{2,4})?)*$'))
        .required(),
    name: Joi.string()
        .pattern(new RegExp('^[A-ZА-ЯІЇЄҐЁ]+[a-zA-Zа-яА-ЯІіЇїЄєҐґЁё \'`-]{1,19}$'))
        .required(),
    surname: Joi.string()
        .pattern(new RegExp('^[A-ZА-ЯІЇЄҐЁ]+[a-zA-Zа-яА-ЯІіЇїЄєҐґЁё \'`-]{1,19}$'))
        .required(),
    avatar: Joi.string()
        .empty('')
        .default(null)
        .allow(null),
});

const updateSchema = Joi.object({
    id: Joi.string()
        .required(),
    name: Joi.string()
        .pattern(new RegExp('^[A-ZА-ЯІЇЄҐЁ]+[a-zA-Zа-яА-ЯІіЇїЄєҐґЁё \'`-]{1,19}$'))
        .required(),
    surname: Joi.string()
        .pattern(new RegExp('^[A-ZА-ЯІЇЄҐЁ]+[a-zA-Zа-яА-ЯІіЇїЄєҐґЁё \'`-]{1,19}$'))
        .required(),
    email: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.([A-Za-z]{2,4})?)*$'))
        .required(),
    birth: Joi.date()
        .required(),
    contacts: Joi.boolean()
        .required(),
    communication: Joi.boolean()
        .required(),
    company: Joi.string()
        .empty('')
        .default(null)
        .allow(null),
    phone: Joi.string()
        .empty('')
        .default(null)
        .allow(null)
        .pattern(new RegExp('^((8|\\+7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$')),
    can: Joi.string()
        .empty('')
        .default(null)
        .allow(null)
        .max(1000),
    look: Joi.string()
        .empty('')
        .default(null)
        .allow(null)
        .max(1000)
});

const sendMail = async (to, key) => {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'goevent.dev@gmail.com',
            pass: 'qwe123Qaz'
        }
    });

    let email = await transporter.sendMail({
        from: 'goevent-no-reply@gmail.com',
        to: to,
        subject: "Recovery password",
        text: "Hello. Please confirm your email to change password with this key: " + key + '\nKey is valid only 10 minutes!',
    });

    console.log("Message sent: %s", email.messageId);
};

const successSendMail = async (to) => {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'goevent.dev@gmail.com',
            pass: 'qwe123Qaz'
        }
    });

    let email = await transporter.sendMail({
        from: 'goevent-no-reply@gmail.com',
        to: to,
        subject: "Successful update",
        text: 'Hello. Your password was updated successfully!',
    });

    console.log("Message sent: %s", email.messageId);
};

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

exports.socialAuth = (req, res) => {
    const email = req.body.email;
    let password;
    switch (req.body.type) {
        case 'google':
            password = req.body.googlePassword;
            break;
        case 'facebook':
            password = req.body.facebookPassword;
            break;
        case 'vk':
            password = req.body.vkPassword;
            break;
    }

    const { error, value } = Joi.string().pattern(new RegExp('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.([A-Za-z]{2,4})?)*$')).required().validate(email);

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    User.findOne({ where: { email: value }, include: [Passwords]})
        .then(async (user) => {
            if (user) {
                const userPass = user.password[req.body.type + 'Password'];
                if (userPass) {
                    const checkPassword = await bcrypt.compare(password, user.password[req.body.type + 'Password']);
                    if (checkPassword) {
                        const token = jwt.sign(user.get({ plain: true }).id, secret);
                        return res.status(200).send({ auth: token });
                    } else {
                        return res.status(401).send({ error: 'Something went wrong with your account!' });
                    }
                } else {
                    bcrypt.genSalt(saltRounds, (err, salt) => {
                        bcrypt.hash(password, salt, (err, pass) => {
                            Passwords.findOne({ where: { userId: user.id }})
                                .then((passwords) => {
                                    let insertData;
                                    switch (req.body.type) {
                                        case 'google':
                                            insertData = { googlePassword: pass };
                                            break;
                                        case 'facebook':
                                            insertData = { facebookPassword: pass };
                                            break;
                                        case 'vk':
                                            insertData = { vkPassword: pass };
                                            break;
                                    }
                                    passwords.update(insertData)
                                        .then((passwords) => {
                                            const token = jwt.sign(user.get({ plain: true }).id, secret);
                                            return res.status(200).send({ auth: token });
                                        })
                                });
                        })
                    })
                }
            } else {
                return res.status(404).send({ notFound: true });
            }
        });
};

exports.registration = (req, res) => {
    const email = req.body.email;
    const topics = req.body.topics;
    const avatar = req.body.type === 'general' ? null : req.body.avatar;
    let password = req.body.password;
    let interests = [];
    switch (req.body.type) {
        case 'google':
            password = req.body.googlePassword;
            break;
        case 'facebook':
            password = req.body.facebookPassword;
            break;
        case 'vk':
            password = req.body.vkPassword;
            break;
    }
    const data = {
        name: req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1),
        surname: req.body.surname.charAt(0).toUpperCase() + req.body.surname.slice(1),
        avatar: avatar,
    };

    const { error, value } = registrationSchema.validate({ email: email, name: data.name, surname: data.surname, avatar: avatar });

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    if (req.body.type === 'general') {
        const { error, value } = Joi.string().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.{6,})')).required().validate(password);
        if (error) return res.status(400).send({ error: 'Validate problems!' });
        password = value;
    }

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(value.email, salt, (err, code) => {
            data.id = code;
            if (topics) {
                topics.forEach(item => {
                    interests.push({ userId: data.id, categoryId: item });
                });
            }
            QRCode.toDataURL(data.id, (err, url) => {
                if (err) throw err;
                bcrypt.hash(password, salt, (err, password) => {
                    data.qr = url;

                    User.findOrCreate({ where: { email: value.email }, defaults: data })
                        .then(([user, created]) => {
                            if (created) {
                                const token = jwt.sign(user.get({ plain: true }).id, secret);
                                let insertData = {
                                    userId: user.id
                                };
                                switch (req.body.type) {
                                    case 'general':
                                        insertData.password = password;
                                        break;
                                    case 'google':
                                        insertData.googlePassword = password;
                                        break;
                                    case 'facebook':
                                        insertData.facebookPassword = password;
                                        break;
                                    case 'vk':
                                        insertData.vkPassword = password;
                                        break;
                                }
                                Passwords.create(insertData)
                                    .then(() => {
                                        if (interests.length > 0) {
                                            Interests.bulkCreate(interests)
                                                .then(() => {
                                                    return res.status(201).send({ auth: token });
                                                });
                                        } else {
                                            return res.status(201).send({ auth: token });
                                        }
                                    });
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
    const { error, value } = loginSchema.validate({ email: email, password: password });

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    User
        .findOne({ where: { email: value.email }, include: [Passwords]})
        .then(async (user) => {
            if (user) {
                if (user.password['password']) {
                    const checkPassword = await bcrypt.compare(password, user.password['password']);
                    if (checkPassword) {
                        const token = jwt.sign(user.get({ plain: true }).id, secret);
                        return res.status(200).send({ auth: token });
                    } else {
                        return res.status(401).send({ error: 'Incorrect Password!' });
                    }
                } else {
                    return res.status(401).send({ error: 'Incorrect Password!' });
                }
            } else {
                return res.status(404).send({ error: 'User Not Found!' });
            }
        })
};

exports.findUser = (req, res) => {
    User.findOne({ where: { id: req.user }, include: [{ model: User, as: 'myFollowers' }, { model: Categories, as: 'myCategories' }] })
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

    User.findOne({ where: { id: req.user } })
        .then((user) => {
            if (user) {
                User.findOne({ where: { id: follower } })
                    .then((follower) => {
                        if (follower) {
                            if (user.id === follower.id) {
                                return res.status(409).send({ error: 'You can not follow your self!' });
                            } else {
                                Followers.findOrCreate({ where: { userId: req.user, followerId: follower.id }})
                                    .then(([followers, created]) => {
                                        if (created) {
                                            return res.status(200).send({ name: follower.name, surname: follower.surname, avatar: follower.avatar, company: follower.company });
                                        } else {
                                            return res.status(409).send({ error: 'You are following this user!' });
                                        }
                                    });
                            }
                        } else {
                            return res.status(404).send({ error: 'Follower Not Found!' })
                        }
                    });
            } else {
                return res.status(404).send({ error: 'You are not User!' })
            }
        });
};

exports.update = (req, res) => {
    const name = req.body.name;
    const surname = req.body.surname;
    const birth = req.body.birth;
    const company = req.body.company;
    const email = req.body.email;
    const phone = req.body.phone;
    const can = req.body.can;
    const look = req.body.look;
    const contacts = req.body.contacts;
    const communication = req.body.communication;
    const data = {
        id: req.user,
        name: name,
        surname: surname,
        birth: birth,
        company: company,
        email: email,
        phone: phone,
        can: can,
        look: look,
        contacts: contacts,
        communication: communication
    };

    const { error, value } = updateSchema.validate(data);

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    User.findByPk(req.user)
        .then((user) => {
            if (user) {
                user.update(value)
                    .then((user) => {
                        res.status(200).send({ success: user });
                    });
            } else {
                return res.status(404).send({ error: 'Invalid token, user not found!' });
            }
        })
};

exports.recovery = (req, res) => {
    const email = req.body.email;
    const { error, value } = Joi.string().pattern(new RegExp('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.([A-Za-z]{2,4})?)*$')).required().validate(email);

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    User.findOne({ where: { email: value } })
        .then(async (user) => {
            if (user) {
                try {
                    const token = jwt.sign({ email: user.email }, secret, { expiresIn: '10m' });
                    await sendMail(user.email, token);
                    return res.status(200).send({ success: true });
                } catch (e) {
                    return res.status(500).send({ error: e.message })
                }
            } else {
                return res.status(404).send({ error: 'User Not Found!' })
            }
        })
};

exports.updatePassword = (req, res) => {
    const password = req.body.password;
    const { error, value } = Joi.string().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.{6,})')).required().validate(password);

    if (error) return res.status(400).send({ error: 'Validate problems!' });

    User.findOne({ where: { email: req.user.email }})
        .then((user) => {
            if (user) {
                bcrypt.genSalt(saltRounds, (err, salt) => {
                    bcrypt.hash(value, salt, (err, pass) => {
                        Passwords.findOrCreate({ where: { userId: user.id }, defaults: { password: pass }})
                            .then(async ([passwords, created]) => {
                                if (created) {
                                    try {
                                        await successSendMail(user.email);
                                        const token = jwt.sign(user.get({ plain: true }).id, secret);
                                        return res.status(200).send({ auth: token })
                                    } catch (e) {
                                        return res.status(500).send({ error: e.message })
                                    }
                                } else {
                                    passwords.update({ password: pass })
                                        .then(async (passwords) => {
                                            try {
                                                await successSendMail(user.email);
                                                const token = jwt.sign(user.get({ plain: true }).id, secret);
                                                return res.status(200).send({ auth: token })
                                            } catch (e) {
                                                return res.status(500).send({ error: e.message })
                                            }
                                        });
                                }
                            });
                    });
                });
            } else {
                return res.status(404).send({ error: 'User with this key not found!' });
            }
        })
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
