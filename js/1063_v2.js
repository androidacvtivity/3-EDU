// FORM = 50
// CAPITOL = 1063
// Rânduri statice
//
// Autosuma pe rând:
// (Col.1) = Sum (Col.2 + Col.3) (Rînd.*)
//
// Autosuma existentă:
// Rând.01 = Rând.02 + Rând.03 + Rând.04 + Rând.05 + Rând.06 +
//           Rând.07 + Rând.08 + Rând.09 + Rând.10, Col.*
//
// Capitolul 1063: 10 rânduri, 8 coloane.

var cap1063RowIds = {
    "01": "119187",
    "02": "119188",
    "03": "119185",
    "04": "119189",
    "05": "119186",
    "06": "119190",
    "07": "119191",
    "08": "119192",
    "09": "119193",
    "10": "119184"
};


// ------------------------------------------------------------
// Col.1 = Col.2 + Col.3 pentru fiecare rând
// ------------------------------------------------------------
function sumCap1063_Col1() {

    Object.keys(cap1063RowIds).forEach(function (rind) {

        var id = cap1063RowIds[rind];

        var col2 =
            parseInt(
                $("#50_1063_" + id + "_" + rind + "_2").val(),
                10
            ) || 0;

        var col3 =
            parseInt(
                $("#50_1063_" + id + "_" + rind + "_3").val(),
                10
            ) || 0;

        var sum = col2 + col3;

        $("#50_1063_" + id + "_" + rind + "_1")
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    });
}


// ------------------------------------------------------------
// Rând.01 = Rând.02 + ... + Rând.10
// pentru toate cele 8 coloane
// ------------------------------------------------------------
function sumCap1063_Rind01() {

    var sourceRows = [
        "02", "03", "04", "05", "06",
        "07", "08", "09", "10"
    ];

    for (var col = 1; col <= 8; col++) {

        var sum = 0;

        for (var i = 0; i < sourceRows.length; i++) {

            var rind = sourceRows[i];

            sum += parseInt(
                $("#50_1063_" +
                    cap1063RowIds[rind] +
                    "_" + rind +
                    "_" + col
                ).val(),
                10
            ) || 0;
        }

        $("#50_1063_" +
            cap1063RowIds["01"] +
            "_01_" + col
        )
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    }
}


// ------------------------------------------------------------
// Funcția principală
// ------------------------------------------------------------
function f_Capitol_1063() {

    // 1. Calculăm Col.1 = Col.2 + Col.3
    // pentru toate rândurile sursă.
    sumCap1063_Col1();

    // 2. Păstrăm autosuma existentă:
    // R01 = R02 + ... + R10.
    sumCap1063_Rind01();

    // 3. Recalculăm Col.1 pentru R01 după autosuma verticală.
    sumCap1063_Col1();
}


$(document).ready(function () {

    f_Capitol_1063();

    $("input:not([type='button']):not([readonly]):not([disabled])")
        .on("change", f_Capitol_1063);

    $(document).on(
        "change",
        "input:not([type='button']):not([readonly]):not([disabled])",
        f_Capitol_1063
    );
});