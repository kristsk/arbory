jQuery(document).ready(function () {
    var body = jQuery('body');

    jQuery(document).bind('associatedsetsinit', function (e) {
        var targetSelector = '.field.type-associated-set';
        var target = jQuery(e.target);

        if (!target.is(targetSelector)) {
            target = target.find(targetSelector);
        }

        target.each(function () {
            var block = jQuery(this);
            var checkboxes = block.find('input.keep');

            checkboxes.bind('click', function () {
                var checkbox = jQuery(this);
                var destroy = checkbox.siblings('input.destroy');

                destroy.val(checkbox.prop('checked') ? 'false' : 'true');
            });
        });

    });

    body.on('contentloaded', function (e, eventParams) {
        jQuery(e.target).trigger('associatedsetsinit', eventParams);
    });
});
