//Adauga si aceasta autosuma te rog
//Cap.III (Rind. 010) = Sum (Rînd.020-030)(Col *) 


// FORM = 50
// CAPITOL = 1060
// Rânduri statice
// Cap.III: pentru fiecare rând
// Col.1 = Col.2 + Col.3 + Col.4 + Col.5

function sumCap1060_Col1() {
    var rowIds = {
        "010": "119149",
        "020": "119150",
        "030": "119151"
    };

    Object.keys(rowIds).forEach(function (rind) {
        var sum = 0;

        // Col.1 = suma coloanelor 2-5
        for (var col = 2; col <= 5; col++) {
            sum += parseInt(
                $("#50_1060_" + rowIds[rind] + "_" + rind + "_" + col).val(),
                10
            ) || 0;
        }

        $("#50_1060_" + rowIds[rind] + "_" + rind + "_1")
            .val(sum !== 0 ? sum : "")
            .prop("readonly", true);
    });
}

function f_Capitol_1060() {
    sumCap1060_Col1();
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