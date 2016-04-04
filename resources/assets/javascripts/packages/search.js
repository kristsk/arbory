/* global UrlBuilder */
jQuery(function () {
    'use strict';
    var body = jQuery('body');

    body.on('searchinit', 'form', function (e) {
        var request;
        var timeout;
        var form = jQuery(e.target);
        var allInputElements = 'input, select';

        // Set up options.
        var options = form.data('search-options');
        var defaults = {
            result_blocks: {
                main_section: {
                    result_selector: 'section',
                    target: 'main > section:first'
                }
            },
            rebind: false
        };

        options = jQuery.extend(true, defaults, options);

        var elements = {
            inputs: jQuery(),
            submit: jQuery()
        };

        var collectAllElements = function () {
            elements.inputs = jQuery(allInputElements);
            elements.submit = form.find('button[type="submit"]');
        };

        var setPreviousValues = function () {
            elements.inputs.each(function () {
                var input = jQuery(this);
                input.data('previous-value', getCurrentValue(input));
            });
        };

        var getCurrentValue = function (input) {
            if (input.is('input[type="checkbox"]:not(:checked)')) {
                return '';
            } else if (!(input.is('input[type="checkbox"]:checked'))) {
                return input.val();
            } else {
                return (input.val() || '');
            }
        };

        var startSearch = function () {
            // Cancel previous timeout.
            clearTimeout(timeout);

            // Store previous values for all inputs.
            setPreviousValues();

            // Cancel previous unfinished request.
            if (request) {
                request.abort();
            }

            timeout = setTimeout(function () {
                elements.submit.trigger('loadingstart');

                // Construct url.
                var formUrl = form.attr('action');
                var url = new UrlBuilder({ baseUrl: formUrl });
                url.add(form.serializeArray());

                if ('replaceState' in window.history) {
                    window.history.replaceState(window.history.state, window.title, url.getUrl());
                }

                url.add({ ajax: 1 });

                // Send request.
                request = jQuery.ajax({
                    url: url.getUrl(),
                    success: function (response) {
                        form.trigger('searchresponse', response);
                        form.trigger('searchend');
                    }
                });
            }, 200);
        };

        var stopSearch = function () {
            elements.submit.trigger('loadingend');
        };

        var startSearchOnValueChange = function () {
            var input = jQuery(this);

            if (getCurrentValue(input) === input.data('previous-value')) {
                return;
            }

            form.trigger('searchstart');
        };

        form.on('searchresponse', function (e, response) {
            response = jQuery('<div />').append(response);

            // For each result block find its content in response and copy it
            // to its target container.

            for (var key in options.result_blocks) {
                if (options.result_blocks.hasOwnProperty(key)) {
                    var block = options.result_blocks[key];
                    var content = response.find(block.result_selector).first().html();

                    jQuery(block.target).html(content);
                    jQuery(block.target).trigger('contentloaded');
                }
            }

            if (options.rebind) {
                collectAllElements();
            }
        });

        form.on('change keyup', allInputElements, startSearchOnValueChange);
        form.on('searchstart', startSearch);
        form.on('searchend', stopSearch);

        collectAllElements();
        setPreviousValues();
    });

    jQuery('.view-index form.search').trigger('searchinit');
});
