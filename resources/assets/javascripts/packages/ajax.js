jQuery(document).ready(function () {
    var body = jQuery('body');

    body.on('contentreplace', function (e, content, selector) {
        if (content && ('status' in content) && ('getResponseHeader' in content)) {
            // use content only if the response has valid 200 and html content type
            var status = content.status;

            if (status !== 200) {
                return;
            }

            var contentType = content.getResponseHeader('content-type');

            if (!contentType || !contentType.match(/html/)) {
                return;
            }

            content = content.responseText;
        }

        var newNode;

        if (typeof selector === 'undefined') {
            // no selector given, whole content is the new node
            newNode = content;
        } else {
            // selector given, find matching node in given content
            content = jQuery('<html />').append(content);
            newNode = content.find(selector);
        }

        // oldNode defaults to event target if no selector given
        var oldNode = jQuery(e.target);

        // but matches self or descendants if selector is given
        if (typeof selector !== 'undefined' && !oldNode.is(selector)) {
            oldNode = oldNode.find(selector);
        }

        oldNode.replaceWith(newNode);

        newNode.trigger('contentloaded');
    });

    // use setTimeout to trigger this after all scripts have been loaded
    // and attached their initial handlers for this event
    setTimeout(function () {
        body.trigger('contentloaded');
        body.trigger('contentdone');
    }, 0);
});
