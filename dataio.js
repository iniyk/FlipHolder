"use strict";

var futil = require('./futil');
var _l = futil.getLogger('dataio.js');

var io;

function getDataIOInstance() {
    if (! io) {
        var config = require('./config.json');
        
        var config_port = config['data_socket']['port'];
        if (! config_port) {
            config_port = 3010;
        }

        io = require('socket.io').listen(config_port)
        
        io.on('connection', function (socket) {
            _l.info('IO connected.');

            socket.on('disconnect', function () {
                _l.info('IO disconnected.');
            });
        });
    }
    return io;
}

function handler(req, res) {
    res.writeHead(200);
}

module.exports.getDataIOInstance = getDataIOInstance;