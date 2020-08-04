/**
 * Created by bulusli on 2016/3/29.
 */

function getData() {
    $.ajax({
        url: "/promise",
        type: "get",
        dataType: "text",
        cache: false,
        success: function (data) {
            $("body").html(data);
        }
    });

}
