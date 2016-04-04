jQuery(function () {
    var body = jQuery('body');

    var controller = jQuery('.controller-releaf-i18n-database-translations');
    var importForm = controller.find('form.import');
    var importFile = importForm.find('input[type="file"]');
    var importButton = controller.find('button[name="import"]');

    importButton.click(function () {
        importFile.click();
    });

    importFile.change(function () {
        body.trigger('toolboxcloseall');
        importForm.submit();
    });
});
