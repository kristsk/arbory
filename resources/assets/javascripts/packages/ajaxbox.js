/* global UrlBuilder */
jQuery(document).ready(function () {
    var ajaxBoxLinkSelector = 'a.ajaxbox',
        xhr,
        body = jQuery('body');

    var openAjaxBox = function (params) {
        var popupConfig = {
            showCloseBtn: false,
            modal: params.modal,
            callbacks: {
                open: function () {
                    this.contentContainer.trigger('ajaxboxaftershow', [this, params]);
                },

                beforeClose: function () {
                    this.contentContainer.trigger('ajaxboxbeforeclose');
                }
            }
        };

        if (params.type === 'image') {
            popupConfig.items = { src: params.url };
            popupConfig.type = 'image';
        } else {
            popupConfig.items = { src: params.content, type: 'inline' };
        }

        jQuery.magnificPopup.open(popupConfig);
    };

    var closeAjaxBox = function () {
        jQuery.magnificPopup.close();
    };

    body.on('ajaxboxaftershow', function (e, ajaxBox, params) {
        ajaxBox.contentContainer.addClass('ajaxbox-inner');

        // enable drag with header
        if (ajaxBox.wrap.draggable !== undefined) {
            ajaxBox.wrap.draggable({
                handle: ajaxBox.contentContainer.find('section header').first()
            });
        }

        // insert close button if header exists and box is not modal
        if (!params.modal) {
            var closeContainer = ajaxBox.contentContainer.first();

            if (params.type !== 'image') {
                closeContainer = ajaxBox.contentContainer.find('section header').first();
            }

            if (closeContainer.length > 0) {
                var closeIcon = jQuery('<i />').addClass('fa fa-times');
                var closeButton = jQuery('<button />').attr('type', 'button').
                                  addClass('button secondary close only-icon').append(closeIcon);

                closeButton.on('click', function () {
                    closeAjaxBox();
                });

                closeContainer.append(closeButton);
            }
        }

        // focus on cancel button in footer if found
        var cancelButton = ajaxBox.contentContainer.
                           find('section footer .button[data-type="cancel"]').first();

        if (cancelButton.length > 0) {
            cancelButton.bind('click', function () {
                body.trigger('ajaxboxclose');

                return false;
            });

            cancelButton.focus();
        }

        ajaxBox.contentContainer.trigger('contentloaded');
        ajaxBox.contentContainer.trigger('ajaxboxdone', params);
    });

    body.on('ajaxboxinit', function (e) {
        var target = jQuery(e.target);

        // init links
        var links = (target.is(ajaxBoxLinkSelector)) ? target : target.find(ajaxBoxLinkSelector);

        links.on('click', function () {
            var link = jQuery(this);

            var params = {
                url: new UrlBuilder(link.attr('href')).add({ ajax: 1 }).getUrl(),
                modal: link.is('[data-modal]'),
                trigger: link
            };

            if (link.attr('rel') === 'image') {
                params.type = 'image';
            }

            link.trigger('ajaxboxopen', params);

            return false;
        });

    });

    body.on('ajaxboxopen', function (e, params) {
        // params expects either url or content
        if ('content' in params) {
            openAjaxBox(params);
        } else if ('url' in params) {
            if ('trigger' in params) {
                params.trigger.trigger('loadingstart');
            }

            if (xhr) {
                xhr.abort();
            }

            xhr = jQuery.ajax({
                url: params.url,
                type: 'get',
                success: function (data) {
                    params.content = data;
                    openAjaxBox(params);
                }
            });
        }
    });

    body.on('ajaxboxdone', function (e, params) {
        if (params && ('trigger' in params)) {
            params.trigger.trigger('loadingend');
        }

        jQuery(e.target).find('.dialog').trigger('contentdone');
    });

    body.on('ajaxboxclose', function () {
        closeAjaxBox();
    });

    // attach ajaxboxinit to all loaded content
    body.on('contentloaded', function (e) {
        // reinit ajaxbox for all content that gets replaced via ajax
        jQuery(e.target).trigger('ajaxboxinit');
    });
});
