(function() {

    $(document).ready(function() {
        $.ajax("/list", {
            success: function(files) {
                var container = $(".movies tbody");

                $.each(files, function() {
                    container.append($(
                        "<tr>" +
                            "<td colspan='2'>" + this.path + "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td>" + this.original + "</td>" +
                            "<td>" + this.renamed + "</td>" +
                        "</tr>"
                    ));
                });
            }
        });
    });

}());
