
//Adauga aici (Col.1) = Sum (Col.2+3) (Rînd.*) - autosuma - dar sa n u strici autosumele existente 
// FORM = 50
// CAPITOL = 1063
// Rânduri statice
// Rând.01 = Rând.02 + Rând.03 + Rând.04 + Rând.05 + Rând.06 +
//           Rând.07 + Rând.08 + Rând.09 + Rând.10, Col.*
//
// Capitolul 1063: 10 rânduri, 8 coloane.

function sumCap1063_Rind01() {
    var rowIds = {
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

    var sourceRows = [
        "02", "03", "04", "05", "06",
        "07", "08", "09", "10"
    ];

    // În capitolul 1063 sunt definite 8 coloane.
    for (var col = 1; col <= 8; col++) {
        var sum = 0;

        for (var i = 0; i < sourceRows.length; i++) {
            var rind = sourceRows[i];

            sum += parseInt(
                $("#50_1063_" + rowIds[rind] + "_" + rind + "_" + col).val(),
                10
            ) || 0;
        }

        $("#50_1063_" + rowIds["01"] + "_01_" + col)
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    }
}

function f_Capitol_1063() {
    sumCap1063_Rind01();
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
