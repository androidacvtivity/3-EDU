
// FORM = 49
// CAPITOL = 1053
// Rânduri statice
//
// Autosume conform formulelor din Excel:
// Rând.010 = Rând.020 + Rând.040, pe fiecare coloană
// Rând.040 = Rând.050 + Rând.070 + Rând.080, pe fiecare coloană
//
// Capitolul 1053 are 10 coloane active.

function sumCap1053_Col1() {
    Object.keys(cap1053RowIds).forEach(function (rind) {
        var id = cap1053RowIds[rind];

        var col2 = parseInt(
            $("#49_1053_" + id + "_" + rind + "_2").val(),
            10
        ) || 0;

        var col4 = parseInt(
            $("#49_1053_" + id + "_" + rind + "_4").val(),
            10
        ) || 0;

        var col6 = parseInt(
            $("#49_1053_" + id + "_" + rind + "_6").val(),
            10
        ) || 0;

        var total = col2 + col4 + col6;

        $("#49_1053_" + id + "_" + rind + "_1")
            .val(total !== 0 ? total : "")
            .prop("readonly", true);
    });
}
var cap1053RowIds = {
    "010": "117678",
    "020": "117676",
    "030": "117673",
    "040": "117672",
    "050": "117677",
    "060": "117670",
    "070": "117674",
    "080": "117675",
    "090": "117671"
};

function sumCap1053_Rind040() {
    var sourceRows = ["050", "070", "080"];

    for (var col = 1; col <= 10; col++) {
        var sum = 0;

        for (var i = 0; i < sourceRows.length; i++) {
            var rind = sourceRows[i];

            sum += parseInt(
                $("#49_1053_" + cap1053RowIds[rind] + "_" + rind + "_" + col).val(),
                10
            ) || 0;
        }

        $("#49_1053_" + cap1053RowIds["040"] + "_040_" + col)
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    }
}

function sumCap1053_Rind010() {
    var sourceRows = ["020", "040"];

    for (var col = 1; col <= 10; col++) {
        var sum = 0;

        for (var i = 0; i < sourceRows.length; i++) {
            var rind = sourceRows[i];

            sum += parseInt(
                $("#49_1053_" + cap1053RowIds[rind] + "_" + rind + "_" + col).val(),
                10
            ) || 0;
        }

        $("#49_1053_" + cap1053RowIds["010"] + "_010_" + col)
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    }
}

function f_Capitol_1053() {
    // 040 trebuie calculat primul, deoarece 010 depinde de 040.
    sumCap1053_Rind040();
    sumCap1053_Rind010();

    sumCap1053_Col1();
}

$(document).ready(function () {
    f_Capitol_1053();

    $("input:not([type='button']):not([readonly]):not([disabled])")
        .on("change", f_Capitol_1053);

    $(document).on(
        "change",
        "input:not([type='button']):not([readonly]):not([disabled])",
        f_Capitol_1053
    );
});
