// FORM = 50
// CAPITOL = 1060
// Rânduri statice
// Cap.III: Rând.010 = Rând.020 + Rând.030, Col.*

function sumCap1060_Rind010() {
    var rowIds = {
        "010": "119149",
        "020": "119150",
        "030": "119151"
    };

    // În capitolul 1060 sunt definite 5 coloane.
    for (var col = 1; col <= 5; col++) {
        var sum = 0;

        sum += parseInt(
            $("#50_1060_" + rowIds["020"] + "_020_" + col).val(),
            10
        ) || 0;

        sum += parseInt(
            $("#50_1060_" + rowIds["030"] + "_030_" + col).val(),
            10
        ) || 0;

        $("#50_1060_" + rowIds["010"] + "_010_" + col)
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    }
}

function f_Capitol_1060() {
    sumCap1060_Rind010();
}

$(document).ready(function () {
    f_Capitol_1060();

    $("input:not([type='button']):not([readonly]):not([disabled])")
        .on("change", f_Capitol_1060);

    $(document).on(
        "change",
        "input:not([type='button']):not([readonly]):not([disabled])",
        f_Capitol_1060
    );
});
