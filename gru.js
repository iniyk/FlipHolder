"use strict";

var dgram = require('dgram');
var _ = require("lodash");
var path = require("path");
var async = require("async");
var futil = require("./futil");
var Minion = require('./minion');
var _p = futil._p;
var _l = futil.getLogger('gru.js');

var listeners = null; // []

_l.info("log4gru.js is started.");

function LoadMinions(minions_json_path, callback_load_minions) {
    _l.info(
        "Start to read minions json from " +
        minions_json_path
    );
    futil.readJson(
        minions_json_path,
        function(err, minions_json) {
            if (err) {
                _l.error(err);
                callback_load_minions(err, []);
            } else {
                _l.info("Read minions json successed.");
                var minions_list = minions_json['minions'];
                async.map(
                    minions_list,
                    function(minion_name, callback_async_map) {
                        _l.info(
                            "Reading minion json " +
                            minion_name + 
                            " from path " +
                            path.join(
                                minions_json['path_prefix'],
                                minion_name
                            )
                        );
                        var minion_json_path = 
                            path.join(
                                minions_json['path_prefix'],
                                minion_name
                            ) + 
                            ".json";
                        LoadMinion(
                            minion_json_path,
                            callback_async_map
                        );
                    },
                    function(err, minions) {
                        if (err) {
                            _l.error(err);
                        }
                        _l.info("Loaded all minions.");
                        var minions_ret = 
                            _.reduce(
                                minions,
                                function(flattened, other) {
                                    return flattened.concat(other);
                                },
                                []
                            );
                        callback_load_minions(err, minions_ret);
                    }
                )
            }
        }
    ); 
}

function LoadMinion(minion_json_path, callback_load_minion) {
    futil.readJson(
        minion_json_path,
        function(err, minion_json) {
            if (err) {
                _l.error(err);
                callback_load_minion(err, []);
            } else {
                var minion_instances_json =
                    minion_json['instances'];
                if (minion_instances_json) {
                    async.map(
                        minion_instances_json,
                        function(minion_instance_network_json, callback_async_map) {
                            var minion_instance =
                                new Minion(
                                    minion_json,
                                    minion_instance_network_json
                                );
                            var listener = BindListenInstance(
                                minion_instance,
                                minion_instance_network_json
                            );
                            
                            if (listener) {
                                if (! listeners) {
                                    listeners = [];
                                }
                                listeners.push(listener);
                            }
                            
                            if (listener) {
                                callback_async_map(null, minion_instance);
                            } else {
                                callback_async_map(new Error("Can not create instance of minison."), null);
                            }
                        },
                        function(err, minion_instances) {
                            if (err) {
                                _l.error(err);
                            }
                            
                            callback_load_minion(err, minion_instances);
                        }
                    );
                }
            }
        }
    );
}

function BindListenInstance(
    minion_instance,
    minion_instance_network_json
) {
    var listener = null;
    if (
        minion_instance_network_json["protocol"] &&
        (futil.validProtocol(minion_instance_network_json["protocol"]))
    ) {
        
        
        if (!futil.validPort(minion_instance_network_json["local_port"])) {
            err_info = minion_instance_network_json["local_port"] + "is not a valid port.";
            _l.error(err_info);
            return null;
        }

        listener = dgram.createSocket(minion_instance_network_json["protocol"]);
        if (! listener) return null;

        listener.on("error", function (err) {
            _l.error("Error while listening:\n" + err.stack);
            listener.close();
        });
        
        listener.on("message", function (data, rinfo) {
            _l.info(
                "Package recv from \n" + rinfo.address + 
                ":" + rinfo.port +
                " : \n" + data.toString('hex')
            );

            minion_instance.OnRecvMessage(data, rinfo);
        });
        
        listener.on("listening", function () {
            var address = listener.address();
            _l.info(
                "Start to listen " +
                address.address + ":" + address.port +
                " for instance of " + minion_instance.name +
                " which named " + minion_instance_network_json.name
            );
        });

        if (futil.validAddress(minion_instance_network_json["local_addr"])) {
            listener.bind(
                minion_instance_network_json["local_port"],
                minion_instance_network_json["local_addr"]
            );
        } else {
            listener.bind(minion_instance_network_json["local_port"]);
        }
    } else {
        var err_info = minion_instance_network_json["protocol"] + " is not a valid protocol.";
        _l.error(err_info);
        return null;
    }    
    return listener;
}

module.exports.LoadMinions = LoadMinions;