/* global UrlBuilder */
jQuery(function () {
    var body = jQuery('body');
    body.on('contentloaded', function (e) {
        jQuery(e.target).find('.pagination select[name="page"]').on('change', function () {
            var newPage = jQuery(this).val();

            if (newPage) {
                var urlBuilder = new UrlBuilder().add({ page: newPage });

                window.location.href = urlBuilder.getUrl();
            }
        });
    });
});
