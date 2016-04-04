jQuery(function () {
    var body = jQuery('body');
    var container = body.children('.notifications').first();

    var iconBaseClass = 'icon fa';

    var iconsByType = {
        info: 'fa-info',
        success: 'fa-check',
        error: 'fa-times-circle'
    };

    var notifications = {};

    var closeIcon = jQuery('<i />').addClass('fa fa-times');
    var closeButton = jQuery('<button type="button" />').
                      addClass('close button only-icon').append(closeIcon).
                      attr('title', container.attr('data-close-text'));

    closeButton.click(function () {
        var notificationId = jQuery(this).closest('.notification').attr('data-id');

        body.trigger('notificationremove', notificationId);
    });

    var getParams = function (customParams) {
        var randomId;

        do {
            randomId = Math.random().toString(16).slice(2);
        } while (typeof notifications[randomId] !== 'undefined');

        // set defaults and then override with customParams
        var params = {
            id: randomId,
            type: 'info',
            closable: true,

            // default closable notifications to automatic closing after a timeout;
            // default non-closable notifications to never close automatically
            duration: (('closable' in customParams) && !customParams.closable) ? null : 5,
            message: '',
            html: null,
            icon: (('type' in customParams) && (customParams.type in iconsByType)) ?
                iconsByType[customParams.type] :
                iconsByType.info
        };

        jQuery.extend(params, customParams);

        return params;
    };

    var getNotificationIds = function (params) {
        var notificationIds = [];

        if (typeof params === 'string') {
            // locate notification by id
            notificationIds.push(params);
        } else if (typeof params === 'object') {
            // match multiple notifications by params
            jQuery.each(notifications, function (notificationId, notification) {
                var notificationParams = notification.data('params');

                var allParamsMatch = true;

                jQuery.each(params, function (param, value) {
                    if ((typeof notificationParams[param] === 'undefined') || (notificationParams[param] !== value)) {
                        allParamsMatch = false;
                        return false;
                    }
                });

                if (allParamsMatch) {
                    notificationIds.push(notificationId);
                }
            });
        }

        return notificationIds;
    };

    body.on('notificationsinit', function () {
        body.on('notificationadd', function (e, customParams) {
            // adds or updates a notification

            var notification;
            var params = getParams(customParams);
            var isNew = false;

            if (typeof notifications[params.id] === 'undefined') {
                isNew = true;

                notification = jQuery('<div />').addClass('notification').
                               attr('data-id', params.id);
                notification.append(jQuery('<i />'));
                notification.append(jQuery('<div />').addClass('content'));

                notifications[params.id] = notification;
                notification.hide();
                notification.appendTo(container);

            }

            notification = notifications[params.id];
            notification.data('params', params);
            notification.attr('data-type', params.type);

            notification.children('i').removeClass().addClass(iconBaseClass + ' ' + params.icon);

            // check whether notification already have close button added
            if (params.closable && notification.find('.close').length === 0) {
                notification.append(closeButton.clone(true));
            } else if (!params.closable) {
                notification.find('.close').remove();
            }

            if (typeof params.html !== 'string') {
                params.html = jQuery('<div />').addClass('message').text(params.message);
            }

            notification.find('.content').html(params.html);

            if (isNew) {
                notification.fadeIn('slow', function () {
                    body.trigger('notificationadded', { notification: notification });
                });
            } else {
                body.trigger('notificationupdated', { notification: notification });
            }
        });

        body.on('notificationremove', function (e, params) {
            // removes single or multiple notifications
            var removableNotificationIds = getNotificationIds(params);

            jQuery.each(removableNotificationIds, function (index, notificationId) {
                if (typeof notifications[notificationId] === 'undefined') {
                    return;
                }

                var notification = notifications[notificationId];

                var timer = notification.data('removal-timer');
                clearTimeout(timer);

                notification.fadeOut('fast', function () {
                    notification.css({ opacity: 0 }).show().slideUp('fast', function () {
                        notification.remove();
                    });
                });

                delete(notifications[notificationId]);
            });

        });

        body.on('notificationremovedelayed', function (e, removalParams) {
            // sets up removal timer for a single notification
            // accepts id and duration in removalParams
            var notificationId = removalParams.id;

            if (typeof notifications[notificationId] === 'undefined') {
                return;
            }

            var notification = notifications[notificationId];

            notification.data('removal-timer', setTimeout(function () {
                body.trigger('notificationremove', notificationId);
            }, removalParams.duration * 1000));

        });

        body.on('notificationadded notificationupdated', function (e, eventParams) {
            if (!('notification' in eventParams)) {
                return;
            }
            var notification = eventParams.notification;

            var params = notification.data('params');

            var timer = notification.data('removal-timer');
            clearTimeout(timer);

            if (params.duration) {
                var removalParams = {
                    id: params.id,
                    duration: params.duration
                };

                body.trigger('notificationremovedelayed', removalParams);

            }

        });

        body.on('notificationaddflash', '.flash', function () {
            // convert .flash notice to notification
            var params =
            {
                type: jQuery(this).attr('data-type'),
                message: jQuery(this).text().trim()
            };

            var id = jQuery(this).attr('data-id');

            if (typeof id !== 'undefined') {
                params.id = id;
            }

            body.trigger('notificationadd', params);
            jQuery(this).remove();

        });

    });

    body.trigger('notificationsinit');

    // attach notificationaddflash to all loaded content
    body.on('contentloaded', function (e) {
        jQuery(e.target).find('.flash').trigger('notificationaddflash');
    });
});
