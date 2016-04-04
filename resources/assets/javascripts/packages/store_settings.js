jQuery(function () {
    var body = jQuery('body');
    var settingsPath = body.data('settings-path');

    body.on('settingssave', function (event, keyOrSettings, value) {
        if (!settingsPath) {
            return;
        }

        var settings = keyOrSettings;
        if (typeof settings === 'string') {
            settings = {};
            settings[keyOrSettings] = value;
        }

        jQuery.ajax({
            url: settingsPath,
            data: { settings: settings },
            type: 'POST',
            dataType: 'json'
        });
    });
});
