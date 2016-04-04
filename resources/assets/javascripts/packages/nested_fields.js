jQuery(document).ready(function () {
    var body = jQuery('body');

    jQuery(document).bind('nestedfieldsinit', function (e) {
        var target = jQuery(e.target);

        if (!target.is('section.nested')) {
            target = target.find('section.nested');
        }

        target.each(function () {
            var block = jQuery(this);
            var list = block.find('.list').first();

            var blockName = block.attr('data-name');
            var itemSelector = '.item[data-name="' + blockName + '"]';

            var newItemSelector = '.item[data-name="' + blockName + '"].new';
            var existingItemSelector = '.item[data-name="' + blockName + '"]:not(.new)';

            block.click(function (event, eventParams) {
                var trigger = jQuery(event.target);

                // webkit browsers go beyond button node when setting click target
                if (!trigger.is('button')) {
                    trigger = trigger.parents('button').first();
                }

                if (!trigger.is('button.add-nested-item') && !trigger.is('button.remove-nested-item')) {
                    // irrelevant click
                    return;
                }

                // skip click on disabled buttons
                if (trigger.prop('disabled')) {
                    return;
                }

                var targetBlock = trigger.parents('section.nested').first();

                if (targetBlock.attr('data-name') !== blockName) {
                    // only react to own clicks
                    return;
                }

                if (trigger.is('.add-nested-item')) {
                    var template = jQuery(targetBlock.data('releaf-template'));

                    if (template.length !== 1) {
                        return;
                    }

                    var newItem = template;

                    newItem.addClass('new');
                    newItem.appendTo(list);
                    newItem.trigger('nestedfieldsreindex', eventParams);

                    if (eventParams && eventParams.no_animation) {
                        newItem.trigger('nestedfieldsitemadd', eventParams);
                        newItem.trigger('contentloaded', eventParams);
                    } else {
                        if (newItem.is('tr, td')) {
                            newItem.css({ opacity: 1 }).hide();
                            newItem.fadeIn('normal', function () {
                                newItem.trigger('nestedfieldsitemadd', eventParams);
                                newItem.trigger('contentloaded', eventParams);
                            });
                        } else {
                            newItem.css({ opacity: 0 });
                            newItem.slideDown('fast', function () {
                                newItem.css({ opacity: 1 }).hide();
                                newItem.fadeIn('fast', function () {
                                    newItem.trigger('nestedfieldsitemadd', eventParams);
                                    newItem.trigger('contentloaded', eventParams);
                                });
                            });
                        }
                    }

                } else if (trigger.is('.remove-nested-item')) {
                    var item = trigger.parents(itemSelector).first();

                    var removeItem = function (item) {
                        item.trigger('contentbeforeremove', eventParams);

                        var parent = item.parent();

                        var destroyInputs = item.find('input.destroy');

                        if (destroyInputs.length > 0) {
                            // mark as destroyable and hide
                            destroyInputs.val(true);

                            item.hide();
                        } else {
                            item.remove();
                        }

                        targetBlock.trigger('nestedfieldsreindex', eventParams);
                        parent.trigger('contentremoved', eventParams);
                    };

                    item.addClass('removed');
                    item.trigger('nestedfieldsitemremove', eventParams);

                    if (eventParams && eventParams.no_animation) {
                        removeItem(item);
                    } else {
                        item.fadeOut('fast', function () {
                            if (item.is('tr,td')) {
                                removeItem(item);
                            } else {
                                item.css({ opacity: 0 }).show().slideUp('fast', function () {
                                    removeItem(item);
                                });
                            }
                        });
                    }
                }
            });

            block.on('nestedfieldsreindex', function () {
                // update data-index attributes and names/ids for all fields inside a block

                // in case of nested blocks, this bubbles up and gets called for
                // each parent block also so that each block can update it's own
                // index in the names

                // only new items are changed.
                // existing items always preserve their original indexes
                // new item indexes start from largest of existing item indexes + 1

                var firstAvailableNewIndex = 0;
                var existingItems = block.find(existingItemSelector);

                existingItems.each(function () {
                    var index = jQuery(this).attr('data-index');

                    if (typeof index === 'undefined') {
                        return;
                    }

                    index = index * 1;

                    if (index >= firstAvailableNewIndex) {
                        firstAvailableNewIndex = index + 1;
                    }
                });

                var newItems = block.find(newItemSelector);
                var index = firstAvailableNewIndex;
                var changeableAttributes = [];

                newItems.each(function () {
                    var item = jQuery(this);
                    item.attr('data-index', index);

                    // this matches both of these syntaxes in attribute values:
                    //
                    // resource[foo_attributes][0][bar] / resource[foo_attributes][_template_][bar]
                    // resource_foo_attributes_0_bar    / resource_foo_attributes__template__bar
                    //

                    var matchPattern = new RegExp('(\\[|_)' +
                                       blockName +
                                       '_attributes(\\]\\[|_)(\\d*|_template_)?(\\]|_)');

                    var searchPattern = new RegExp('((\\[|_)' +
                                        blockName +
                                        '_attributes(\\]\\[|_))(\\d*|_template_)?(\\]|_)', 'g');

                    var replacePattern = '$1' + index + '$5';
                    var attributes = ['name', 'id', 'for'];

                    // collect changeable attributes
                    item.find('input,select,textarea,button,label').each(function () {
                        for (var i = 0; i < attributes.length; i++) {
                            var attribute = jQuery(this).attr(attributes[i]);

                            if (attribute && attribute.match(matchPattern)) {
                                var params = {
                                    element: this,
                                    attribute: attributes[i],
                                    old_value: attribute,
                                    new_value: attribute.replace(searchPattern, replacePattern)
                                };

                                if (params.old_value === params.new_value) {
                                    continue;
                                }
                                changeableAttributes.push(params);
                            }
                        }
                    });

                    index++;
                });

                // perform change in two parts:
                // at first change all changeable attributes to unique temporary
                // strings for ALL affected items and then change the attributes
                // to actual values

                // this is needed so that any code in external
                // beforeattributechange / attributechange handlers
                // does not encounter ID collisions during the process
                // (multiple elements temporarily sharing the same ID)

                // change to temporary values
                var tempValuePrefix = 'nestedfieldsreindex_temporary_value_';

                jQuery.each(changeableAttributes, function (attributeIndex, params) {
                    var element = jQuery(params.element);

                    element.trigger('beforeattributechange', params);
                    element.attr(params.attribute, tempValuePrefix + attributeIndex);
                });

                // change to actual new values
                jQuery.each(changeableAttributes, function (attributeIndex, params) {
                    var element = jQuery(params.element);

                    element.attr(params.attribute, params.new_value);
                    element.trigger('attributechanged', params);
                });

            });

            block.on('sortableupdate', function () {
                block.trigger('nestedfieldsreindex');
            });

            block.on('nestedfieldsitemadd', function (e) {
                var item = jQuery(e.target);

                if (item.attr('data-name') !== blockName) {
                    return; // the added item does not belong to this block
                }

                // focus first visibile field in item
                item.find('input, select, textarea').filter(':visible').first().focus();
            });
        });
    });

    body.on('contentloaded', function (e, eventParams) {
        jQuery(e.target).trigger('nestedfieldsinit', eventParams);
    });
});
