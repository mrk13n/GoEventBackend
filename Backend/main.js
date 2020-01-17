const express = require('express');
const https = require('https');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const api = require('./api');

const configureEndpoints = (app) => {
    app.post('/api/registration/', api.registration);
    app.post('/api/login/', api.login);
};

const startServer = (port) => {
    const app = express();

    app.use(morgan('dev'));

    app.use(bodyParser.urlencoded());
    app.use(bodyParser.json());

    app.use(cors());

    configureEndpoints(app);

    const privateKey  = fs.readFileSync(__dirname + '/../selfsigned.key', 'utf8');
    const certificate = fs.readFileSync(__dirname + '/../selfsigned.crt', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(port, () => {
        console.log('My Application Running on http://localhost:'+port+'/');
    });
};

exports.startServer = startServer;
