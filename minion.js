"use strict";

var _ = require('lodash');
var dataio = require('./dataio').getDataIOInstance();

var futil = require('./futil');
var _l = futil.getLogger('minion.js');

const FRAME_EXCEPTION = ['value', 'start', 'length'];

function Minion(
    minion_json_object,
    minion_json_instance
) {
    this.minion_info = minion_json_object;
    this.minion_instance = minion_json_instance;
    this.module_name = this.minion_info['name'];
    this.name = this.minion_info['name'] + "/" +
        this.minion_instance['name'];
    this.data = [];

    _.forEach(
        this.minion_info['frames'],
        function(frame) {
            var frame_data = {};
            frame_data['value'] = null;
            frame_data['_last_update'] = null;
            _.forEach(
                frame,
                function(value, key) {
                    if (!key in FRAME_EXCEPTION) {
                        frame_data[key] = value;
                    }
                }
            );
        }
    );

    this.io = dataio.of(this.name).on('connection', function(socket) {
        _l.info("Setting up data io for " + this.name);
    });

    this.getInfo = function(info_name) {
        return this.minion_info[info_name];
    }

    this.OnRecvMessage = function(msg, rinfo) {
        _l.debug(
            "Minion said : \n" +
            "Package recv from \n" + rinfo.address + 
            ":" + rinfo.port +
            " : \n" + msg.toString('hex')
        );
        var io = this.io;
        var name = this.name;
        var prefix = '';
        _.forEach(this.minion_info['frames'], function(frame) {
            if (frame['if_group_by']) {
                var prefix_value = readFromBuffer(
                    msg,
                    frame['type'],
                    frame['start'],
                    frame['length']
                );
                if (frame['type'] == 'enum') {
                    prefix_value = '0x' + prefix_value;
                    prefix_value = frame['enum_values'][prefix_value];
                }
                prefix += prefix_value + '/';
            }
        });
        var data = {};
        _.forEach(this.minion_info['frames'], function(frame) {
            if (frame['if_group_by']) {
                return ;
            }
            frame['value'] = 
                readFromBuffer(
                    msg,
                    frame['type'],
                    frame['start'],
                    frame['length']
                );
            if (frame['type'] == 'enum') {
                frame['value'] = '0x' + frame['value'];
                frame['value'] = frame['enum_values'][frame['value']];
            }
        
            data[prefix + frame['name']] = frame['value'];
            _l.info(
                'Minion ' +
                name + 
                ' sent data : '
            );
            _l.info(frame);
        });
        io.emit('status', data);
    }
}

function readFromBuffer(buffer, type, start, length) {
    var value = null;
    switch (type) {
        case 'boolean':
            value = buffer.readInt8(start / 8);
            if (value > 0) {
                value = true;
            } else {
                value = false;
            }
            break;
        case 'int16':
            value = buffer.readInt16BE(start / 8);
            break;
        case 'int32':
            value = buffer.readInt32BE(start / 8);
            break;
        case 'float':
            value = buffer.readFloatBE(start / 8);
            break;
        case 'enum':
            value = buffer.slice(start / 8, length / 8).toString('hex');
            break;
        default:
            break;
    }
    return value;
}

module.exports = Minion;