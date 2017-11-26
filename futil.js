"use strict";

var path = require('path');
var fs = require('fs');
var dgram = require('dgram');
var log4js = require('log4js');
var config = require('./config.json');

var logger_dict;

if (config['log4js']) {
    log4js.configure(config['log4js']);
} else {
    log4js.configure({
        appenders: {
            console: { type: "console" },
            file: { type: "file", filename: "logs/flipholder.log" },
            express_file: { type: "file", filename: "logs/express_connect.log" }
        },
        categories: {
            default: { appenders: ["console", "file"], level: "info" },
            express_connect: { appenders: ["console", "express_file"], level: "debug" }
        }
    });
}

function _p(path_for_normal) {
    return path.normalize(path_for_normal);
}

function getLogger(module_name) {
    if (! logger_dict) {
        logger_dict = {};
    }
    if (! logger_dict[module_name]) {
        logger_dict[module_name] = new Logger(module_name);
    }
    
    return logger_dict[module_name].logger;
}

function Logger(module_name) {
    this.module_name = module_name;
    this.logger = log4js.getLogger(this.module_name);
}

// Logger.prototype.log = function(log_level, log_info) {
//     console.log(this.logger.level);
//     console.log(this.module_name);
//     log_level = log_level.toLowerCase();
    
//     switch (log_level) {
//         case 'info':
//             this.logger.info(log_info);
//             break;
//         default:
//             break;
//     }
// }

function readJson(path_to_json, callback) {
    fs.readFile(
        _p(path_to_json),
        'utf8',
        function (err, data) {
            var obj = null;
            if (err) {
                console.log(err);
            } else {
                obj = JSON.parse(data);
            }
            callback(err, obj);
        }
    );
}

var valid_protocol = {"udp4": true};

function validAddress(addr) {
    var reg_valid_ip = 
        /^(((25[0-5]|2[0-4]d|1d{2}|[1-9]d|[0-9]).){3}(25[0-5]|2[0-4]d|1d{2}|[1-9]d|[0-9]))$/;
    return reg_valid_ip.test(addr);
}

function validPort(port) {
    if (typeof port == "string") {
        var reg_valid_port = /^([0-9]+)$/;
        if (reg_valid_port.test(port)) {
            port = parseInt(port);
        } else {
            return false;
        }
    }

    if (typeof port == "number") {
        if (port - Math.floor(port) > 0.0) {
            return false;
        }
        if (port > 65535) {
            return false;
        }
        if (port < 1) {
            return false;
        }

        return true;
    }
    return false;
}

function validProtocol(protocol) {
    return valid_protocol[protocol];
}

module.exports._p = _p;
module.exports.readJson = readJson;
module.exports.validAddress = validAddress;
module.exports.validPort = validPort;
module.exports.validProtocol = validProtocol;
module.exports.Logger = Logger;
module.exports.getLogger = getLogger;