"use strict";

var DEST_PORT = 6551;
var PACKAGE_SIZE = 80 / 8;
var SEND_INTER = 1000;

var dgram = require('dgram');
var last_send = clock();
var inter_id;

var clientSocket = dgram.createSocket('udp4');
var send_package_cnt = 0;
var buf01 = new Buffer(PACKAGE_SIZE);
var buf02 = new Buffer(PACKAGE_SIZE);
var buf03 = new Buffer(PACKAGE_SIZE);

buf01.writeInt8(0x60, 0);
buf02.writeInt8(0x61, 0);
buf03.writeInt8(0x31, 0);

function clock() {
    var diff = process.hrtime();
    return (diff[0] * 1e9 + diff[1]) / 1e6;
}

function send_msg() {
    var now_send = clock();
    buf01.writeUInt8(Math.floor(Math.random() * 255), 1);
    buf02.writeUInt8(Math.floor(Math.random() * 255), 1);
    buf03.writeUInt8(Math.floor(Math.random() * 255), 1);

    buf01.writeInt32BE(Math.floor(Math.random() * 4000), 2);
    buf02.writeInt32BE(Math.floor(Math.random() * 4000), 2);
    buf03.writeInt32BE(Math.floor(Math.random() * 4000), 2);

    buf01.writeFloatBE(Math.random() * 100, 6);
    buf02.writeFloatBE(Math.random() * 100, 6);
    buf03.writeFloatBE(Math.random() * 100, 6);

    clientSocket.send(buf01, DEST_PORT, '127.0.0.1');
    clientSocket.send(buf02, DEST_PORT, '127.0.0.1');
    clientSocket.send(buf03, DEST_PORT, '127.0.0.1');

    console.log("Send 1 msg using %d ms", now_send - last_send);
    last_send = now_send;
}

function start() {
    last_send = clock();
    inter_id = setInterval(send_msg, SEND_INTER);
}

function stop() {
    if (inter_id) {
        clearInterval(inter_id);
    }
}

if (!module.parent) {
    start();
} else {
    module.exports.start_once = send_msg;
    module.exports.start = start;
    module.exports.stop = stop;
}
