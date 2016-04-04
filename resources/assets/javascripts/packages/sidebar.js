jQuery(function () {
    var body = jQuery('body');

    var sideCompactOverlay = jQuery('<div />').addClass('side-compact-overlay').appendTo(body);

    sideCompactOverlay.bind('click', function () {
        body.trigger('sidecompactcloseall');
    });

    var firstLevelSideItems = jQuery();

    body.on('sidecompactcloseall', function () {
        firstLevelSideItems.filter('.open').trigger('sidecompactitemclose');
    });

    body.on('sidecompactchange', function () {
        firstLevelSideItems.trigger('collapsericonupdate');
    });

    body.on('contentloaded', function (e) {
        var header = jQuery(e.target).find('header').addBack().filter('body > header');

        if (header.length < 1) {
            return;
        }

        header.on('click', function () {
            // add additional trigger on header to close opened compact submenu
            // because header is above the side compact overlay
            if (!body.hasClass('side-compact') || firstLevelSideItems.filter('.open').length < 1) {
                return false;
            }

            body.trigger('sidecompactcloseall');
            return false;
        });
    });

    body.on('contentloaded', function (e) {
        var sidebar = jQuery(e.target).find('aside').addBack().filter('body > aside');

        if (sidebar.length < 1) {
            return;
        }

        firstLevelSideItems = sidebar.find('nav > ul > li');

        firstLevelSideItems.on('sidecompactitemopen', function () {
            body.trigger('sidecompactcloseall');
            jQuery(this).addClass('open');
            sideCompactOverlay.show();
        });

        firstLevelSideItems.on('sidecompactitemclose', function () {
            jQuery(this).removeClass('open');
            sideCompactOverlay.hide();
        });

        firstLevelSideItems.on('sidecompacttoggle', function () {
            var item = jQuery(this);
            var event = (item.is('.open')) ? 'sidecompactitemclose' : 'sidecompactitemopen';
            item.trigger(event);
        });

        firstLevelSideItems.on('collapsericonupdate', function () {
            var item = jQuery(this);
            var collapsed = item.hasClass('collapsed');
            var compact = body.hasClass('side-compact');
            var collapserIcon = item.find('.collapser i');

            collapserIcon.toggleClass('fa-chevron-down', !compact && collapsed);
            collapserIcon.toggleClass('fa-chevron-up', !compact && !collapsed);
            collapserIcon.toggleClass('fa-chevron-right', compact);
        });

        sidebar.find('.compacter button').on('click', function () {
            var button = jQuery(this);
            var icon = button.find('i').first();
            var titleAttribute;

            if (body.hasClass('side-compact')) {
                body.trigger('sidecompactcloseall');
                body.trigger('settingssave', ['releaf.side.compact', false]);
                body.removeClass('side-compact');
                icon.addClass('fa-angle-double-left').removeClass('fa-angle-double-right');
                titleAttribute = 'title-collapse';
            } else {
                body.trigger('settingssave', ['releaf.side.compact', true]);
                body.addClass('side-compact');
                icon.addClass('fa-angle-double-right').removeClass('fa-angle-double-left');
                titleAttribute = 'title-expand';
            }

            button.attr('title', button.data(titleAttribute));
            body.trigger('sidecompactchange');
        });

        body.trigger('sidecompactchange');

        sidebar.find('> nav .collapser button').on('click', function (e) {
            if (body.hasClass('side-compact')) {
                return; // allow click to bubble up to trigger
            }

            var item = jQuery(this).closest('li');

            e.stopPropagation();
            item.toggleClass('collapsed');
            jQuery(this).blur();

            item.trigger('collapsericonupdate');

            var collapsed = item.hasClass('collapsed');
            var settingKey = 'releaf.menu.collapsed.' + item.data('name');

            body.trigger('settingssave', [settingKey, collapsed]);

        });

        sidebar.find('> nav span.trigger').click(function () {
            if (body.hasClass('side-compact')) {
                var item = jQuery(this).closest('li');
                item.trigger('sidecompacttoggle');
            } else {
                jQuery(this).find('.collapser button').trigger('click');
            }
        });
    });
});
