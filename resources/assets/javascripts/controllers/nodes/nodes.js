jQuery(function () {
    var body = jQuery('body.controller-releaf-content-nodes');

    body.on('contentloaded', function (e) {
        var block = jQuery(e.target);

        // item collapse / expand
        block.find('.collection li .collapser').click(function () {
            var item = jQuery(this).closest('.collection li');
            var shouldExpand = item.is('.collapsed');
            var eventName = shouldExpand ? 'nodeitemexpand' : 'nodeitemcollapse';

            item.trigger(eventName);

            var settingKey = 'content.tree.expanded.' + item.data('id');
            body.trigger('settingssave', [settingKey, shouldExpand]);
        });

        block.find('.collection li').bind('nodeitemcollapse', function (e) {
            e.stopPropagation();

            var item = jQuery(e.target);
            item.addClass('collapsed');
            item.children('.collapser-cell').find('.collapser i').
                                             removeClass('fa-chevron-down').
                                             addClass('fa-chevron-right');

        });

        block.find('.collection li').bind('nodeitemexpand', function (e) {
            e.stopPropagation();

            var item = jQuery(e.target);
            item.removeClass('collapsed');
            item.children('.collapser-cell').find('.collapser i').
                                             removeClass('fa-chevron-right').
                                             addClass('fa-chevron-down');

        });

        // slug generation
        var nameInput = block.find('.node-fields .field[data-name="name"] input');
        var slugField = block.find('.node-fields .field[data-name="slug"]');

        if (nameInput.length && slugField.length) {
            var slugInput = slugField.find('input');
            var slugButton = slugField.find('.generate');
            var slugLink = slugField.find('a');

            slugInput.on('sluggenerate', function () {
                var url = slugInput.attr('data-generator-url');

                slugButton.trigger('loadingstart');
                jQuery.get(url, { name: nameInput.val() }, function (slug) {
                    slugInput.val(slug);
                    slugLink.find('span').text(encodeURIComponent(slug));
                    slugButton.trigger('loadingend');
                }, 'text');
            });

            slugButton.click(function () {
                slugInput.trigger('sluggenerate');
            });

            if (nameInput.val() === '') {
                // bind onchange slug generation only if starting out with an empty name
                nameInput.change(function () {
                    slugInput.trigger('sluggenerate');
                });
            }
        }
    });

    body.on('click', '.dialog .node-cell label', function () {
        jQuery('.dialog .node-cell label').removeClass('selected');
        jQuery(this).addClass('selected');
    });
});
