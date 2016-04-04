/*global jQuery*/
jQuery(function () {
    var body = jQuery('body');

    body.on('loadingstart', '.button', function (e) {
        var button = jQuery(e.target);

        if (button.hasClass('loading')) {
            return;
        }

        button.addClass('loading');

        button.data('disabled-before-loading', button.prop('disabled'));

        button.prop('disabled', true);

        var loader = jQuery('<i />').addClass('loader fa fa-spin fa-spinner');
        button.append(loader);
    });

    body.on('loadingend', '.button', function (e) {
        var button = jQuery(e.target);
        button.find('.loader').remove();

        var disabledBeforeLoading = button.data('disabled-before-loading');

        if (typeof disabledBeforeLoading !== 'undefined' && !disabledBeforeLoading) {
            button.prop('disabled', false);
        }

        button.removeClass('loading');
    });
});
