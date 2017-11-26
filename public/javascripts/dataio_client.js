function initMinionService(minion_name) {
    var client = io.connect(
        'http://' +
        window.io_config['addr'] + 
        ':' +
        window.io_config['port'].toString() +
        '/' +
        minion_name
    );

    if (! window.data_bus) {
        window.data_bus = {};
    }
    
    window.data_bus[minion_name] = {};
    window.data_bus[minion_name]['__online__'] = false;
    flushMinionPanel(minion_name);

    client.on('connect', function() {
        window.data_bus[minion_name]['__online__'] = true;
        flushMinionPanel(minion_name);
    });

    client.on('status', function(msg) {
        _.forEach(msg, function(value, key) {
            window.data_bus[minion_name][key] = value;
        });
        flushMinionPanel(minion_name);
    });
}

function flushMinionPanel(minion_name) {
    if (! window.data_bus) {
        return ;
    }
    if (! window.data_bus[minion_name]) {
        return;
    }
    _.forEach($('.data-binded'), function(data_binded_gear) {
        
        var container = $(data_binded_gear);
        var data_bind = container.attr('data-bind'),
            data_type = container.attr('data-type'),
            number_fix = container.attr('number-fix'),
            front_type = container.attr('front-type'),
            front_type = container.attr('front-type');
        var data = window.data_bus[minion_name][data_bind];

        if (
            (data_type == 'boolean') &&
            (front_type == 'light')
        ) {
            if (data) {
                container.removeClass('label-danger');
                container.addClass('label-success');
            } else {
                container.removeClass('label-success');
                container.addClass('label-danger');
            } 
        }

        if (
            (data_type == 'number') &&
            (front_type == 'light')
        ) {
            if (data) {
                if (number_fix) {
                    number_fix = parseInt(number_fix);
                    data = (new Number(data)).toFixed(number_fix);
                }
                $(data_binded_gear).html(data);
            }
        }
    });
}