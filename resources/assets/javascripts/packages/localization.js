jQuery(function () {
    var body = jQuery('body');

    var overlay = jQuery('<div />').addClass('localization-menu-overlay').appendTo(body);

    overlay.bind('click', function () {
        body.trigger('localizationmenucloseall');
    });

    body.bind('localizationinit', function (e) {
        var block = jQuery(e.target);

        e.stopPropagation();

        var fields;

        if (block.is('.field.i18n')) {
            fields = block;
        } else {
            fields = block.find('.field.i18n');
        }

        if (fields.length < 1) {
            return;
        }

        fields.bind('localizationmenuopen', function () {
            var field = jQuery(this);

            // close all other open menus
            body.trigger('localizationmenucloseall');

            var menu = field.data('localization-menu');

            field.attr('data-localization-menu-open', true);

            menu.appendTo(body);

            field.trigger('localizationmenuposition');

            overlay.show();

            menu.show();
        });

        fields.bind('localizationmenuclose', function () {
            var field = jQuery(this);

            var menu = field.data('localization-menu');

            var localizationSwitch = field.data('localization-switch');

            menu.hide().appendTo(localizationSwitch);

            overlay.hide();

            field.removeAttr('data-localization-menu-open');
        });

        fields.bind('localizationmenutoggle', function () {
            var field = jQuery(this);
            var event = field.attr('data-localization-menu-open') ?
                        'localizationmenuclose' :
                        'localizationmenuopen';

            field.trigger(event);
        });

        fields.bind('localizationmenuposition', function () {
            var field = jQuery(this);

            if (!field.attr('data-localization-menu-open')) {
                return;
            }

            var menu = field.data('localization-menu');

            var trigger = field.data('localization-switch-trigger');

            var triggerOffset = trigger.offset();

            menu.css({
                left: triggerOffset.left + trigger.outerWidth() - menu.outerWidth(),
                top: triggerOffset.top + trigger.outerHeight()
            });
        });

        fields.find('.localization-switch .trigger').click(function () {
            jQuery(this).closest('.field.i18n').trigger('localizationmenutoggle');
        });

        fields.find('.localization-menu-items button').click(function () {
            var button = jQuery(this);
            var locale = button.attr('data-locale');
            var menu = button.closest('.localization-menu-items');
            var field = menu.data('field');
            var localizationBox = field.find('.localization[data-locale="' + locale + '"]');

            body.trigger('localizationmenucloseall');

            localizationBox.trigger('localizationlocaleactivate');
        });

        fields.bind('localizationlocaleset', function (e, params) {
            var field = jQuery(this);
            var locale = params.locale;
            var localizationBoxes = field.find('.localization[data-locale]');
            var targetBox = localizationBoxes.filter('[data-locale="' + locale + '"]');
            var otherBoxes = localizationBoxes.not(targetBox);

            targetBox.addClass('active');
            otherBoxes.removeClass('active');

            var triggerLabel = field.find('.localization-switch .trigger .label');

            triggerLabel.text(locale);
        });

        fields.find('.localization').bind('localizationlocaleactivate', function () {
            var localizationBox = jQuery(this);
            var locale = localizationBox.attr('data-locale');

            var form = localizationBox.closest('form');

            form.find('.field.i18n').trigger('localizationlocaleset', { locale: locale });

            body.trigger('settingssave', ['releaf.i18n.locale', locale]);
        });

        var inputSelector = 'input[type!="hidden"],textarea,select';

        fields.find(inputSelector).bind('focusprepare', function (e) {
            var localizationBox = (jQuery(e.target).closest('.localization'));

            if (localizationBox.length < 1) {
                return;
            }

            // focus target is inside a i18n localization box
            if (!localizationBox.is('.active')) {
                localizationBox.trigger('localizationlocaleactivate');
            }
        });

        fields.each(function () {
            var field = jQuery(this);
            var localizationSwitch = field.find('.localization-switch').first();

            field.data('localization-switch', localizationSwitch);

            field.data('localization-switch-trigger', localizationSwitch.find('.trigger').first());

            var menu = localizationSwitch.find('menu').first();

            field.data('localization-menu', menu);

            menu.data('field', field);
        });
    });

    body.bind('localizationmenucloseall', function () {
        body.find('.field.i18n[data-localization-menu-open]').trigger('localizationmenuclose');
    });

    // attach localizationinit to all loaded content
    body.on('contentloaded', function (e) {
        // reinit localization for all content that gets replaced via ajax
        jQuery(e.target).trigger('localizationinit');
    });
});
