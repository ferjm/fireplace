(function() {
var a = require('assert');
var assert = a.assert;
var contains = a.contains;
var eq_ = a.eq_;
var mock = a.mock;

var mobilenetwork = require('mobilenetwork');
var user = require('user');
var utils = require('utils');

// Region can be inferred from MCC.
// Carrier can be inferred from MCC+MNC.

test('no MCC, no MNC', function(done) {
    var network = mobilenetwork.getNetwork('', '');
    eq_(network.region, null);
    eq_(network.carrier, null);
    done();
});

test('yes MCC, no MNC', function(done, fail) {
    var network = mobilenetwork.getNetwork('214', '');
    eq_(network.region, 'es');
    eq_(network.carrier, 'telefonica');  // Because Telefonica is the only carrier in Spain.
    done();
});

test('yes MCC, no MNC, not exclusive', function(done, fail) {
    var network = mobilenetwork.getNetwork('334', '');
    eq_(network.region, 'mx');
    eq_(network.carrier, null);  // Because there are multiple carriers in Mexico.
    done();
});

test('no MCC, yes MNC', function(done, fail) {
    var network = mobilenetwork.getNetwork('', '005');
    eq_(network.region, null);
    eq_(network.carrier, null);
    done();
});

test('yes MCC, yes MNC', function(done, fail) {
    var network = mobilenetwork.getNetwork('214', '005');
    eq_(network.region, 'es');
    eq_(network.carrier, 'telefonica');
    done();
});

test('yes MCC, yes MNC, no SPN', function(done, fail) {
    var network = mobilenetwork.getNetwork('262', '001');
    eq_(network.region, 'de');
    eq_(network.carrier, 'deutsche_telekom');
    done();
});

test('yes MCC, yes MNC, yes SPN', function(done, fail) {
    var network = mobilenetwork.getNetwork('262', '001', 'congstar.de');
    eq_(network.region, 'de');
    eq_(network.carrier, 'congstar');
    done();
});

test('no carrier+region', function(done) {
    user.clear_settings();
    eq_(user.get_setting('carrier_sim'), null);
    eq_(user.get_setting('region_sim'), null);

    var navigator_ = {mozMobileConnection: null};
    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), null);
    eq_(user.get_setting('region_sim'), null);

    done();
});

test('carrier+region for Telefónica España SIM via querystring', function(done, fail) {
    user.clear_settings();

    mobilenetwork.detectMobileNetwork({}, {
        getVars: function () {
            return {mcc: '214', mnc: '005'};
        }
    });

    eq_(user.get_setting('carrier_sim'), 'telefonica');
    eq_(user.get_setting('region_sim'), 'es');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnection', function(done) {
    user.clear_settings();

    var navigator_ = {mozMobileConnection: {lastKnownNetwork: '214-005'}};

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'telefonica');
    eq_(user.get_setting('region_sim'), 'es');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnection lastKnownHomeNetwork', function(done) {
    user.clear_settings();

    var navigator_ = {mozMobileConnection: {lastKnownHomeNetwork: '262-001'}};

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'deutsche_telekom');
    eq_(user.get_setting('region_sim'), 'de');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnections', function(done) {
    user.clear_settings();

    var navigator_ = {
        mozMobileConnections: [
            {lastKnownNetwork: '202-005'},
            {lastKnownNetwork: '214-005'},
        ]
    };

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'deutsche_telekom');
    eq_(user.get_setting('region_sim'), 'gr');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnections with SPN', function(done) {
    user.clear_settings();

    var navigator_ = {
        mozMobileConnections: [{
            // This should match what the device typically returns. In particular,
            // note that the SPN is only included in `lastKnownHomeNetwork`.
            lastKnownHomeNetwork: '262-001-congstar',
            lastKnownNetwork: '262-001'
        }]
    };

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'congstar');
    eq_(user.get_setting('region_sim'), 'de');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnections with garbage', function(done) {
    user.clear_settings();

    var navigator_ = {
        mozMobileConnections: [
            {lastKnownNetwork: '999-666'},
            {lastKnownNetwork: '214-005'},
        ]
    };

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'telefonica');
    eq_(user.get_setting('region_sim'), 'es');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnections with weird lastKnownNetwork first', function(done) {
    user.clear_settings();

    var navigator_ = {
        mozMobileConnections: [
            {lastKnownNetwork: 'weirdstring'},
            {lastKnownNetwork: '214-005'},
        ]
    };

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'telefonica');
    eq_(user.get_setting('region_sim'), 'es');

    done();
});

test('carrier+region for SIM via navigator.mozMobileConnections lastKnownHomeNetwork', function(done) {
    user.clear_settings();

    var navigator_ = {
        mozMobileConnections: [
            {lastKnownHomeNetwork: '202-005'},
            {lastKnownNetwork: '214-005'},
        ]
    };

    mobilenetwork.detectMobileNetwork(navigator_);

    eq_(user.get_setting('carrier_sim'), 'deutsche_telekom');
    eq_(user.get_setting('region_sim'), 'gr');

    done();
});

})();
