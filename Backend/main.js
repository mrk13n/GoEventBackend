const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const api = require('./api');

const configureEndpoints = (app) => {
    app.post('/api/registration/', api.registration);
    app.post('/api/login/', api.login);
    app.post('/api/follow/', api.follow);
    app.get('/api/find/', api.authenticateToken, api.findUser);
    app.get('/api/categories/', api.categories);
    // app.post('/api/delete/', api.delete);
};

const startServer = (port) => {
    const app = express();

    app.use(morgan('dev'));

    app.use(bodyParser.urlencoded());
    app.use(bodyParser.json());

    app.use(cors());

    configureEndpoints(app);

    app.listen(port, () => {
        console.log('My Application Running on http://localhost:'+port+'/');
    });
};

exports.startServer = startServer;
