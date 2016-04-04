var RemoteValidator = function (form) {
    var validator = this;
    var body = jQuery('body');

    // selector for field input matching
    var inputSelector = 'input[type!="hidden"],textarea,select';
    var submitElementSelector = 'input[type="submit"], input[type="image"], button';

    validator.form = form;
    validator.clicked_button = null;

    validator.form.on('click.rails', submitElementSelector, function (event) {
        var target = jQuery(event.target);

        // webkit sends inner button elements as event targets instead of the button
        // so catch if the click is inside a button element and change the target if needed
        var closestButton = target.closest('button');

        if (closestButton.length > 0) {
            target = closestButton;
        }

        // register only submit buttons - buttons with
        // type="submit" or without type attribute at all
        // direct target[0].type property is used because of
        // inconsistent attr() method return values
        // between older and newer jQuery versions
        if (target.is('button') && target[0].type !== 'submit') {
            return;
        }

        validator.clicked_button = target;
    });

    validator.form.on('ajax:beforeSend', function (event, xhr) {
        xhr.validation_id = 'v' + new Date().getTime() + Math.random();
        validator.form.attr('data-validation-id', xhr.validation_id);

        if (validator.clicked_button) {
            validator.clicked_button.trigger('loadingstart');
        }
    });

    validator.form.on('ajax:complete', function (event, xhr) {
        var jsonResponse;
        var eventParams = {
            validation_id: xhr.validation_id
        };

        switch (xhr.status) {
            // validation + saving ok
            case 303:
                try {
                    jsonResponse = jQuery.parseJSON(xhr.responseText);
                } catch (error) {
                    validator.form.trigger('validation:fail', [validator, eventParams]);
                    break;
                }

                eventParams.response = jsonResponse;
                validator.form.trigger('validation:ok', [validator, eventParams]);
                break;

            // validation ok
            case 200:
                eventParams.response = xhr;
                validator.form.trigger('validation:ok', [validator, eventParams]);
                break;

            // validation returned errors
            case 422:
                try {
                    jsonResponse = jQuery.parseJSON(xhr.responseText);
                } catch (error) {
                    validator.form.trigger('validation:fail', [validator, eventParams]);
                    break;
                }
                eventParams.response = jsonResponse;

                var errors = [];

                jQuery.each(jsonResponse.errors, function (fieldName, fieldErrors) {
                    jQuery.each(fieldErrors, function (index, error) {
                        var errorObject = {
                            message: error.message,
                            errorCode: error.error_code,
                            fieldName: fieldName
                        };

                        if ('data' in error) {
                            errorObject.data = error.data;
                        }
                        errors.push(errorObject);
                    });
                });

                jQuery.each(errors, function (index, error) {
                    var eventTarget = null;

                    var field = validator.form.
                                find('[name="' + error.fieldName + '"],[name="' + error.fieldName + '[]"]').
                                filter(':not([type="hidden"])').first();

                    eventParams.error = error;

                    if (field && field.length > 0) {
                        eventTarget = field;
                    } else {
                        eventTarget = validator.form;
                    }

                    eventTarget.trigger('validation:error', [validator, eventParams]);

                });

                break;

            // something wrong in the received response
            default:
                validator.form.trigger('validation:fail', [validator, eventParams]);
                break;
        }

        validator.form.trigger('validation:end', [validator, eventParams]);
    });

    validator.form.on('validation:ok', function (event, v, eventParams) {
        if (!eventParams || !eventParams.response) {
            return;
        }

        if ('url' in eventParams.response) {
            // json redirect url received
            // prevent validator's built in submit_form on ok
            event.preventDefault();
            document.location.href = eventParams.response.url;
        } else if ('getResponseHeader' in eventParams.response) {
            // prevent validator's built in submit_form on ok
            event.preventDefault();

            body.trigger('contentreplace', [eventParams.response, '> header']);
            body.trigger('contentreplace', [eventParams.response, '> aside']);
            body.trigger('contentreplace', [eventParams.response, '> main']);
        }
    });

    validator.form.on('validation:error', function (event, v, eventParams) {
        var errorNode = null;
        var error = eventParams.error;
        var target = jQuery(event.target);
        var form = (target.is('form')) ? target : target.closest('form');

        if (target.is(inputSelector)) {
            var fieldBox = target.parents('.field').first();

            if (fieldBox.length !== 1) {
                return;
            }

            var wrap = (fieldBox.is('.i18n')) ? target.closest('.localization') : fieldBox;

            var errorBox = wrap.find('.error-box');

            if (errorBox.length < 1) {
                errorBox = jQuery('<div class="error-box"><div class="error"></div></div>');
                errorBox.appendTo(wrap.find('.value').first());
            }

            errorNode = errorBox.find('.error');
            errorNode.attr('data-validation-id', eventParams.validation_id);
            errorNode.text(error.message);

            fieldBox.addClass('has-error');

            if (fieldBox.is('.i18n')) {
                wrap.addClass('has-error');
            }
        } else if (target.is('form')) {
            var formErrorBox = form.find('.form-error-box');

            if (formErrorBox.length < 1) {
                var formErrorBoxContainer = form.find('.body').first();

                if (formErrorBoxContainer.length < 1) {
                    formErrorBoxContainer = form;
                }

                formErrorBox = jQuery('<div class="form-error-box"></div>');
                formErrorBox.prependTo(formErrorBoxContainer);
            }

            // reuse error node if it has the same text
            formErrorBox.find('.error').each(function () {
                if (errorNode) {
                    return;
                }

                var error = jQuery(this);

                if (error.text() === error.message) {
                    errorNode = error;
                }
            });

            var newErrorNode = !errorNode;

            if (newErrorNode) {
                errorNode = jQuery('<div class="error"></div>');
            }

            errorNode.attr('data-validation-id', eventParams.validation_id);
            errorNode.text(error.message);

            if (newErrorNode) {
                errorNode.appendTo(formErrorBox);
            }

            form.addClass('has-error');

            var parent = formErrorBox.parent();

            // Scroll to formErrorBox
            parent.scrollTop(formErrorBox.offset().top - parent.offset().top + parent.scrollTop());
        }

        form.find('.button.loading').trigger('loadingend');
    });

    validator.form.on('validation:end', function (event, v, eventParams) {
        // remove all errors left from earlier validations
        var lastValidationId = form.attr('data-validation-id');

        if (eventParams.validation_id !== lastValidationId) {
            // do not go further if this is not the last validation
            return;
        }

        eventParams.except_validation_id = lastValidationId;

        form.trigger('validation:clearerrors', [v, eventParams]);

        // if error fields still exist, focus to first visible

        // locate first input inside visible error fields,
        // but for i18n fields exclude inputs inside .localization without .has-error

        var focusTarget = form.find('.field.has-error').
                          filter(':visible').find(inputSelector).
                          not('.localization:not(.has-error) *').first();

        focusTarget.trigger('focusprepare');

        focusTarget.focus();

    });

    validator.form.on('validation:clearerrors', function (event, v, eventParams) {

        // trigger this to clear existing errors in form
        // optional eventParams.exceptValidationId can be used
        // to preserve errors created by that specific validation

        var exceptValidationId = (eventParams && ('exceptValidationId' in eventParams)) ?
                                 eventParams.except_validation_id :
                                 null;

        // remove field errors
        form.find('.field.has-error').each(function () {
            var errorBoxes;
            var field = jQuery(this);

            // in case of i18n fields there may be multiple error boxes inside a single field
            errorBoxes = field.find('.error-box');

            errorBoxes.each(function () {
                var errorBox = jQuery(this);

                var errorNode = errorBox.find('.error');

                if (!exceptValidationId || errorNode.attr('data-validation-id') !== exceptValidationId) {
                    if (field.is('.i18n')) {
                        errorBox.closest('.localization').removeClass('has-error');
                    }
                    errorBox.remove();
                }
            });

            // see if any error boxes are left in the field.
            errorBoxes = field.find('.error-box');

            if (errorBoxes.length < 1) {
                field.removeClass('has-error');
            }
        });

        // remove form errors
        if (form.hasClass('has-error')) {
            var formErrorBox = form.find('.form-error-box');
            var formErrorsRemain = false;

            formErrorBox.find('.error').each(function () {
                var errorNode = jQuery(this);

                if (!exceptValidationId || errorNode.attr('data-validation-id') !== exceptValidationId) {
                    errorNode.remove();
                } else {
                    formErrorsRemain = true;
                }
            });

            if (!formErrorsRemain) {
                formErrorBox.remove();
                form.removeClass('has-error');
            }
        }
    });

    jQuery(document).on('validation:ok validation:error validation:fail', 'form', function (event, validator) {
        if (validator !== validator || event.isDefaultPrevented() || !validator.form[0]) {
            return;
        }

        switch (event.type) {
            case 'validation:ok':
                validator.submit_form();
                break;

            case 'validation:error':
                validator.clicked_button = null;
                break;

            // fail (internal validation failure, not a user error)
            case 'validation:fail':
                validator.submit_form();
                break;
        }
    });
};

RemoteValidator.prototype.submit_form = function () {
    var validator = this;

    // add originally clicked submit button to form as a hidden field
    if (validator.clicked_button) {
        var button = validator.clicked_button.first();
        var name = button.attr('name');

        if (name) {
            var input = validator.form.find('input[type="hidden"][name="' + name + '"]');

            if (input.length < 1) {
                input = jQuery('<input />').
                        attr('type', 'hidden').
                        attr('name', button.attr('name'));

                input.appendTo(validator.form);
            }

            input.val(button.val());
        }
    }

    validator.form[0].submit();
};

jQuery(function () {
    // define validation handlers
    jQuery(document).on('validation:init', 'form', function (event) {
        if (event.isDefaultPrevented()) {
            return;
        }

        var form = jQuery(event.target);

        if (form.data('validator')) {
            // multiple validators on a single form are not supported
            // a validator already exists. return
            return;
        }

        form.data('validator', new RemoteValidator(form));

        // validation initalized finished, add data attribute for it (used by automatized test, etc)
        form.attr('data-remote-validation-initialized', true);

    });

    // attach remote validation to any new default forms after any content load
    jQuery('body').on('contentloaded', function (event) {
        var block = jQuery(event.target);
        var forms = (block.is('form[data-remote-validation]')) ?
                    block :
                    block.find('form[data-remote-validation]');

        forms.trigger('validation:init');
    });
});
