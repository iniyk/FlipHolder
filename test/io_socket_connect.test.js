"use strict";

var _ = require('lodash');
var should = require('should');
var io = require('socket.io-client');

var minion_client_mock = require("./mocks/minion_client.mock");

describe('test/io_socket_connect.test.js', function () {
    it('data should recv 0x60 0x01 2450 50.3', function (done) {
        var socket = io('http://localhost:3010/server/center01');

        socket.on('status', function (data) {
            console.log(data);
            data = new Buffer(data);
            data.readInt8(0).should.equal(0x60);
            data.readInt8(1).should.equal(0x01);
            data.readInt32LE(2).should.equal(2450);
            (Math.abs(data.readFloatLE(6) - 50.3)).should.lessThan(1e-6);

            socket.removeAllListeners();
            socket.close();
            done();
        });
        socket.connect();
        
        setTimeout(function () {
            minion_client_mock.start_once();
        }, 100);
    });
});