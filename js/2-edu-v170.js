(function ($) {
    Drupal.behaviors.edu2 = {
        attach: function (context, settings) {
            // Scrie doar numere
            jQuery("table").on(
                "keypress",
                "input.float, input.numeric",
                function (event) {
                    if (isNumberPressed(this, event) === false) {
                        event.preventDefault();
                    }
                }
            );
            // Step 1: When CA changes, store the filter preference and re-open CB if it's open
            jQuery('#CAP1').on('change', 'select[name*="CAP1_R_CA"], select[id*="CAP1_R_CA"]', function () {
                var $row = jQuery(this).closest('tr');
                var caPrefix = (jQuery(this).val() || '').split('-')[0].trim();
                var $cb = $row.find('select[name*="CAP1_R_CB"], select[id*="CAP1_R_CB"]');
                if (!$cb.length) return;

                // Store the current CA filter on the CB element
                $cb.data('ca-prefix', caPrefix);

                // Clear current CB selection when CA changes
                $cb.val('').trigger('change');
            });

            // Step 2: After Select2 loads its dropdown results, filter the visible items
            jQuery('#CAP1').on('select2:open', 'select[name*="CAP1_R_CB"], select[id*="CAP1_R_CB"]', function () {
                var $cb = jQuery(this);
                var caPrefix = $cb.data('ca-prefix') || '';

                // Use MutationObserver to wait for results to render
                var dropdown = document.querySelector('.select2-results__options');
                if (!dropdown) return;

                var observer = new MutationObserver(function () {
                    filterSelect2Results(caPrefix);
                });
                observer.observe(dropdown, { childList: true, subtree: true });

                // Also filter immediately in case results are already rendered
                setTimeout(function () {
                    filterSelect2Results(caPrefix);
                }, 100);
            });

            function filterSelect2Results(caPrefix) {
                jQuery('.select2-results__option').each(function () {
                    var text = jQuery(this).text().trim();
                    if (!text || text === '') return;

                    var code = text.split(/[\s\-]/)[0].trim();
                    var dots = (code.match(/\./g) || []).length;

                    var show = true;
                    if (caPrefix === '30') {
                        show = dots >= 2;
                    } else if (caPrefix === '10' || caPrefix === '20' || caPrefix === '40') {
                        show = dots === 1;
                    }

                    jQuery(this).toggle(show);
                });
            }
        },

    };

    //   document.addEventListener('DOMContentLoaded', function () {
    //   const select = document.getElementById('NTII');

    //   const options = [
    //     { value: '1', label: '1 - Școala profesională' },
    //     { value: '2', label: '2 - Centru de excelență' },
    //     { value: '3', label: '3 - Colegii' }
    //   ];

    //   options.forEach(opt => {
    //     const option = document.createElement('option');
    //     option.value = opt.value;
    //     option.textContent = opt.label;
    //     select.appendChild(option);
    //   });
    // });
    webform.afterLoad.edu2 = function () {
        formatYearSelectOptions();
        setCap9R01BinaryOptions();
    };

    // Turnă anii din selectbox-ul YEAR (ex: 2026) în ani de studii (ex: 2026/2027)
    function formatYearSelectOptions() {
        var $yearSelects = jQuery('select[id*="YEAR"], select[name*="YEAR"]');

        $yearSelects.each(function () {
            var $select = jQuery(this);

            $select.find('option').each(function () {
                var $option = jQuery(this);
                var val = $option.val();
                var year = parseInt(val, 10);

                if (!isNaN(year) && val !== '') {
                    // Evită dublarea textului dacă afterLoad se declanșează de mai multe ori
                    if ($option.text().indexOf('/') === -1) {
                        $option.text(year + '/' + (year + 1));
                    }
                }
            });

            // Dacă select-ul folosește Select2, reîmprospătează afișarea
            if ($select.hasClass('select2-hidden-accessible') || $select.data('select2')) {
                $select.trigger('change.select2');
            }
        });
    }

    // Setează valorile 0/1 pentru selectbox-urile Cap.9 Rînd.01 Col.1,3,4,5,6
    function setCap9R01BinaryOptions() {
        var fields = [
            'CAP9_R01_C1',
            'CAP9_R01_C3',
            'CAP9_R01_C4',
            'CAP9_R01_C5',
            'CAP9_R01_C6',
        ];

        // Citim valoarea salvată direct din datele webform-ului, nu din DOM,
        // ca să nu depindem de ordinea în care rulează scripturile la load/refresh.
        var savedValues =
            (Drupal.settings &&
                Drupal.settings.mywebform &&
                Drupal.settings.mywebform.values) ||
            {};

        fields.forEach(function (fieldId) {
            var $select = jQuery(
                '#' + fieldId + ', select[name*="' + fieldId + '"], select[id*="' + fieldId + '"]'
            );

            $select.each(function () {
                var $s = jQuery(this);

                var savedVal = savedValues[fieldId];
                savedVal = savedVal === undefined || savedVal === null ? '' : String(savedVal);

                $s.empty();
                $s.append(jQuery('<option>', { value: '', text: '- Selectați -' }));
                $s.append(jQuery('<option>', { value: '1', text: '1' }));
                $s.append(jQuery('<option>', { value: '0', text: '0' }));

                // Repunem valoarea salvată (0 sau 1), indiferent dacă DOM-ul a fost
                // deja populat de framework la momentul acesta sau nu.
                if (savedVal === '1' || savedVal === '0') {
                    $s.val(savedVal);
                }

                if ($s.hasClass('select2-hidden-accessible') || $s.data('select2')) {
                    $s.trigger('change.select2');
                }
            });
        });
    }

    webform.validators.edu49cap1 = function () {
        var values = Drupal.settings.mywebform.values;
        var errors = webform.errors;

        // Helper function pentru conversie sigură
        function toFloat(val) {
            if (typeof val === "undefined" || val === null || val === "") {
                return 0;
            }
            var parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
        }

        // Rândurile statice de sumarizare și detaliu din Cap.1
        var summaryRows = ["10", "20", "30", "40"];
        var totalRow = "50";
        var femeiRow = "60";
        var countryRow = "70";
        // Coloanele disponibile în Cap.1
        var cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        var allRows = summaryRows.concat([totalRow, femeiRow, countryRow]);
        var dynParentRows = ["10", "20", "30", "40", "70"];
        var dynC1 = values["CAP1_R10_C1_FILIAL"];
        var dynC2 = values["CAP1_R10_C2_FILIAL"];
        var dynC3 = values["CAP1_R10_C3_FILIAL"];
        var dynC4 = values["CAP1_R10_C4_FILIAL"];
        var dynC5 = values["CAP1_R10_C5_FILIAL"];
        var dynC6 = values["CAP1_R10_C6_FILIAL"];
        var dynC7 = values["CAP1_R10_C7_FILIAL"];
        var dynC8 = values["CAP1_R10_C8_FILIAL"];
        var dynC9 = values["CAP1_R10_C9_FILIAL"];
        var dynC10 = values["CAP1_R10_C10_FILIAL"];
        var dynC11 = values["CAP1_R10_C11_FILIAL"];
        var dynC12 = values["CAP1_R10_C12_FILIAL"];

        var cap2DetailRows = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
        var cap2Cols = [1, 2, 3, 4, 5, 6, 7, 8];

        var cap3RowsMain = ["01", "02"];
        /*------------------49-001------------------*/
        //autosuma
        /*------------------49-014------------------*/
        // Cap.1 Col.A (codul meseriei) nu trebuie să se repete între rândurile dinamice
        // ale aceluiași grup (CAP1_10 / CAP1_20 / CAP1_30 / CAP1_40 / CAP1_70)
        dynParentRows.forEach(function (r) {
            var caValues = values["CAP1_R" + r + "_CA_FILIAL"] || [];

            for (var i = 0; i < caValues.length; i++) {
                var vi = (caValues[i] || "").toString().trim();
                if (!vi) continue;

                for (var j = 0; j < i; j++) {
                    var vj = (caValues[j] || "").toString().trim();
                    if (vj && vj === vi) {
                        webform.errors.push({
                            fieldName: "CAP1_R" + r + "_CA_FILIAL",
                            index: i,
                            options: { hide_title: true },
                            msg: Drupal.t(
                                "Cod eroare 49-014: Cap.1 codul meseriei de la rândul dinamic " + (i + 1) +
                                " (grup " + r + ") este identic cu cel de la rândul " + (j + 1),
                                {}
                            ),
                        });
                        break; // un singur mesaj de eroare per rând duplicat
                    }
                }
            }
        });
        /*------------------49-002------------------*/
        // Cap.1 (Rînd.050) ≥ Cap.1 (Rînd.060) (Col*)
        cols.forEach(function (c) {
            var r050 = toFloat(values["CAP1_R" + totalRow + "_C" + c]);
            var r060 = toFloat(values["CAP1_R" + femeiRow + "_C" + c]);

            if (r050 < r060) {
                webform.errors.push({
                    fieldName: "CAP1_R" + totalRow + "_C" + c,
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-002: Cap.1 Rînd.050 trebuie să fie ≥ Rînd.060 pe coloana " + c,
                        {}
                    ),
                });
            }
        });
        /*------------------49-003------------------*/
        // Cap.1 (Col.1) ≥ Cap.1 (Col.2) (Rînd.*)
        allRows.forEach(function (r) {
            var c1 = toFloat(values["CAP1_R" + r + "_C1"]);
            var c2 = toFloat(values["CAP1_R" + r + "_C2"]);
            if (c1 < c2) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-003: Cap.1 Col.1 (Total) trebuie să fie ≥ Col.2 (Femei) la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC1 = values["CAP1_R" + r + "_C1_FILIAL"];
            var dynC2 = values["CAP1_R" + r + "_C2_FILIAL"];

            for (var i = 0; i < dynC1.length; i++) {
                if (toFloat(dynC1[i]) < toFloat(dynC2[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C1_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-003: Cap.1 Col.1 trebuie să fie ≥ Col.2 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-004------------------*/
        // Cap.1 (Col.1) ≥ Cap.1 (Col.3) (Rînd.*)
        allRows.forEach(function (r) {
            var c1 = toFloat(values["CAP1_R" + r + "_C1"]);
            var c3 = toFloat(values["CAP1_R" + r + "_C3"]);
            if (c1 < c3) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-004: Cap.1 Col.1 trebuie să fie ≥ Col.3 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC1 = values["CAP1_R" + r + "_C1_FILIAL"];
            var dynC3 = values["CAP1_R" + r + "_C3_FILIAL"];

            for (var i = 0; i < dynC1.length; i++) {
                if (toFloat(dynC1[i]) < toFloat(dynC3[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C1_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-004: Cap.1 Col.1 trebuie să fie ≥ Col.3 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-005------------------*/
        // Cap.1 (Col.1) ≥ Cap.1 (Col.4) (Rînd.*)
        allRows.forEach(function (r) {
            var c1 = toFloat(values["CAP1_R" + r + "_C1"]);
            var c4 = toFloat(values["CAP1_R" + r + "_C4"]);
            if (c1 < c4) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-005: Cap.1 Col.1 trebuie să fie ≥ Col.4 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC1 = values["CAP1_R" + r + "_C1_FILIAL"];
            var dynC4 = values["CAP1_R" + r + "_C4_FILIAL"];

            for (var i = 0; i < dynC1.length; i++) {
                if (toFloat(dynC1[i]) < toFloat(dynC4[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C1_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-005: Cap.1 Col.1 trebuie să fie ≥ Col.4 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-006------------------*/
        // Cap.1 (Col.7) = Cap.1 ∑(Col.4 + Col.5 + Col.6) (Rînd.*)
        // Note: rows 010, 020, 040 have no Col.6 (marked ✖), so sum = Col.4 + Col.5 only
        // Rows 030, 050, 060, 070 have Col.6, so sum = Col.4 + Col.5 + Col.6
        var rowsWithoutC6 = ["010", "020", "040"];
        var rowsWithC6 = ["030", "050", "060", "070"];

        rowsWithoutC6.forEach(function (r) {
            var c7 = toFloat(values["CAP1_R" + r + "_C7"]);
            var sum = Math.round((toFloat(values["CAP1_R" + r + "_C4"]) + toFloat(values["CAP1_R" + r + "_C5"])) * 100) / 100;
            c7 = Math.round(c7 * 100) / 100;
            if (c7 !== sum) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C7",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-006: Cap.1 Rînd." + r + " Col.7 trebuie să fie egal cu Col.4 + Col.5 (" + sum + ")",
                        {}
                    ),
                });
            }
        });

        rowsWithC6.forEach(function (r) {
            var c7 = toFloat(values["CAP1_R" + r + "_C7"]);
            var sum = Math.round((toFloat(values["CAP1_R" + r + "_C4"]) + toFloat(values["CAP1_R" + r + "_C5"]) + toFloat(values["CAP1_R" + r + "_C6"])) * 100) / 100;
            c7 = Math.round(c7 * 100) / 100;
            if (c7 !== sum) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C7",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-006: Cap.1 Rînd." + r + " Col.7 trebuie să fie egal cu Col.4 + Col.5 + Col.6 (" + sum + ")",
                        {}
                    ),
                });
            }
        });

        // Dynamic rows: 010, 020, 040 have no C6; 030 has C6
        var dynRowsWithoutC6 = ["010", "020", "040"];
        var dynRowsWithC6 = ["030"];

        dynRowsWithoutC6.forEach(function (r) {
            var dynC4 = values["CAP1_R" + r + "_C4_FILIAL"] || [];
            var dynC5 = values["CAP1_R" + r + "_C5_FILIAL"] || [];
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"] || [];

            for (var i = 0; i < dynC7.length; i++) {
                var c7 = Math.round(toFloat(dynC7[i]) * 100) / 100;
                var sum = Math.round((toFloat(dynC4[i]) + toFloat(dynC5[i])) * 100) / 100;
                if (c7 !== sum) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C7_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-006: Cap.1 Col.7 trebuie să fie egal cu Col.4 + Col.5 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });

        dynRowsWithC6.forEach(function (r) {
            var dynC4 = values["CAP1_R" + r + "_C4_FILIAL"] || [];
            var dynC5 = values["CAP1_R" + r + "_C5_FILIAL"] || [];
            var dynC6 = values["CAP1_R" + r + "_C6_FILIAL"] || [];
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"] || [];

            for (var i = 0; i < dynC7.length; i++) {
                var c7 = Math.round(toFloat(dynC7[i]) * 100) / 100;
                var sum = Math.round((toFloat(dynC4[i]) + toFloat(dynC5[i]) + toFloat(dynC6[i])) * 100) / 100;
                if (c7 !== sum) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C7_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-006: Cap.1 Col.7 trebuie să fie egal cu Col.4 + Col.5 + Col.6 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-007------------------*/
        dynParentRows.forEach(function (r) {
            var dynC1 = values["CAP1_R" + r + "_C1_FILIAL"];
            var dynC2 = values["CAP1_R" + r + "_C2_FILIAL"];
            var dynC5 = values["CAP1_R" + r + "_C5_FILIAL"];
            var dynC6 = values["CAP1_R" + r + "_C6_FILIAL"];
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"];
            var dynC8 = values["CAP1_R" + r + "_C8_FILIAL"];
            var dynC8 = values["CAP1_R" + r + "_C9_FILIAL"];
        });
        allRows.forEach(function (r) {
            var c7 = toFloat(values["CAP1_R" + r + "_C7"]);
            var c8 = toFloat(values["CAP1_R" + r + "_C8"]);
            if (c7 < c8) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C7",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-007: Cap.1 Col.7 trebuie să fie ≥ Col.8 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"] || [];
            var dynC8 = values["CAP1_R" + r + "_C8_FILIAL"] || [];

            for (var i = 0; i < dynC7.length; i++) {
                if (toFloat(dynC7[i]) < toFloat(dynC8[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C7_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-007: Cap.1 Col.7 trebuie să fie ≥ Col.8 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-008------------------*/
        // Cap.1 (Col.7) ≥ Cap.1 (Col.9) (Rînd.*)
        allRows.forEach(function (r) {
            var c7 = toFloat(values["CAP1_R" + r + "_C7"]);
            var c9 = toFloat(values["CAP1_R" + r + "_C9"]);
            if (c7 < c9) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C7",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-008: Cap.1 Col.7 trebuie să fie ≥ Col.9 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"];
            var dynC9 = values["CAP1_R" + r + "_C9_FILIAL"];

            // Guard: if arrays don't exist, skip
            if (!dynC7 || !dynC9) return;

            for (var i = 0; i < dynC7.length; i++) {
                //Skip rows where BOTH C7 and C9 are empty (row being deleted or not yet filled)
                if ((dynC7[i] === "" || dynC7[i] === null || typeof dynC7[i] === "undefined") &&
                    (dynC9[i] === "" || dynC9[i] === null || typeof dynC9[i] === "undefined")) {
                    continue;
                }

                if (toFloat(dynC7[i]) < toFloat(dynC9[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C7_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-008: Cap.1 Col.7 trebuie să fie ≥ Col.9 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-009------------------*/
        // Cap.1 (Col.10) ≥ Cap.1 (Col.11) (Rînd.*)
        allRows.forEach(function (r) {
            var c10 = toFloat(values["CAP1_R" + r + "_C10"]);
            var c11 = toFloat(values["CAP1_R" + r + "_C11"]);
            if (c10 < c11) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C10",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-009: Cap.1 Col.10 trebuie să fie ≥ Col.11 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC10 = values["CAP1_R" + r + "_C10_FILIAL"];
            var dynC11 = values["CAP1_R" + r + "_C11_FILIAL"];

            // Guard: if arrays don't exist, skip
            if (!dynC10 || !dynC11) return;

            for (var i = 0; i < dynC10.length; i++) {
                // Skip rows where BOTH C10 and C11 are empty
                if ((dynC10[i] === "" || dynC10[i] === null || typeof dynC10[i] === "undefined") &&
                    (dynC11[i] === "" || dynC11[i] === null || typeof dynC11[i] === "undefined")) {
                    continue;
                }

                if (toFloat(dynC10[i]) < toFloat(dynC11[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C10_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-009: Cap.1 Col.10 trebuie să fie ≥ Col.11 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });
        /*------------------49-010------------------*/
        // Cap.1 (Col.10) ≥ Cap.1 (Col.12) (Rînd.*)
        allRows.forEach(function (r) {
            var c10 = toFloat(values["CAP1_R" + r + "_C10"]);
            var c12 = toFloat(values["CAP1_R" + r + "_C12"]);
            if (c10 < c12) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C10",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-010: Cap.1 Col.10 trebuie să fie ≥ Col.12 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC10 = values["CAP1_R" + r + "_C10_FILIAL"];
            var dynC12 = values["CAP1_R" + r + "_C12_FILIAL"];

            // Guard: if arrays don't exist, skip
            if (!dynC10 || !dynC12) return;

            for (var i = 0; i < dynC10.length; i++) {
                // Skip rows where BOTH C10 and C11 are empty
                if ((dynC10[i] === "" || dynC10[i] === null || typeof dynC10[i] === "undefined") &&
                    (dynC12[i] === "" || dynC12[i] === null || typeof dynC12[i] === "undefined")) {
                    continue;
                }

                if (toFloat(dynC10[i]) < toFloat(dynC12[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C10_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-010: Cap.1 Col.10 trebuie să fie ≥ Col.12 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });

        /*------------------49-011 - 49-015------------------*/
        // var digitGroupMap = [
        //   { row: '010', digit: '1', code: '49-011' },
        //   { row: '020', digit: '2', code: '49-012' },
        //   { row: '030', digit: '3', code: '49-013' },
        //   { row: '040', digit: '5', code: '49-015' }
        // ];
        // // Coloanele numerice disponibile per rând (Col.6 lipsește la 010/020/040)
        // var colsPerRow = {
        //   '010': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
        //   '020': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
        //   '030': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        //   '040': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]
        // };

        // digitGroupMap.forEach(function (group) {
        //   var r          = group.row;
        //   var expDigit   = group.digit;
        //   var errCode    = group.code;
        //   // CA_FILIAL = array de coduri extrase din CB (ex: ["1.23", "1.45", "2.01"])
        //   var caValues = values['CAP1_R' + r + '_CA_FILIAL'];
        //   // Dacă rândul nu există în formular, sărim
        //   if (!caValues || !caValues.length) return;
        //   var rowCols = colsPerRow[r] || cols;
        //   rowCols.forEach(function (c) {
        //     var staticVal  = toFloat(values['CAP1_R' + r + '_C' + c]);
        //     var dynArr     = values['CAP1_R' + r + '_C' + c + '_FILIAL'] || [];
        //     var dynSum     = 0;
        //     for (var i = 0; i < caValues.length; i++) {
        //       // Prima cifră din codul CA (ex: "1.23" → "1", "3" → "3")
        //       var code      = (caValues[i] + '').trim();
        //       var firstChar = code.charAt(0);
        //       if (firstChar === expDigit) {
        //         dynSum += toFloat(dynArr[i]);
        //       }
        //     }
        //     // Rotunjire pentru a evita erori floating-point
        //     dynSum    = Math.round(dynSum    * 100) / 100;
        //     staticVal = Math.round(staticVal * 100) / 100;
        //     if (staticVal !== dynSum) {
        //       webform.errors.push({
        //         fieldName: 'CAP1_R' + r + '_C' + c,
        //         options: { hide_title: true },
        //         msg: Drupal.t(
        //           'Cod eroare ' + errCode + ': Cap.1 Rînd.' + r + ' Col.' + c +
        //           ' (' + staticVal + ') trebuie să fie egal cu suma rândurilor al căror cod specialitate începe cu cifra ' +
        //           expDigit + ' (' + dynSum + ')',
        //           {}
        //         )
        //       });
        //     }
        //   });
        // });
        /*------------------49-016------------------*/
        //Cap.1(Rînd.070)= ∑( Rînd  pe codul țării (Anexa-3))   (Col*)

        /*------------------49-017------------------*/
        // Cap.1 (Col.2) ≠ 0 respectiv (Col.8) ≠ 0
        // Dacă există date în Cap.1 (Col.1 > 0), atunci Col.2 și Col.8 nu trebuie să fie 0
        allRows.forEach(function (r) {
            var c2 = toFloat(values["CAP1_R" + r + "_C2"]);
            var c8 = toFloat(values["CAP1_R" + r + "_C8"]);

            // BUG FIX: report error on the ZERO field (c8 is 0 → error on C8, not C2)
            if (c2 !== 0 && c8 === 0) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C8",          // was incorrectly "_C2"
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-017: Cap.1 Col.8 trebuie să fie ≠ 0 la rândul " + r, {}
                    ),
                });
            }
        });

        // Rânduri dinamice pentru 49-017 
        dynParentRows.forEach(function (r) {
            var dynC2row = values["CAP1_R" + r + "_C2_FILIAL"];
            var dynC8row = values["CAP1_R" + r + "_C8_FILIAL"];
            if (!dynC2row || !dynC2row.length) return;

            for (var i = 0; i < dynC2row.length; i++) {
                var dc2 = toFloat(dynC2row[i]);
                var dc8 = toFloat(dynC8row[i]);

                if (dc2 !== 0 && dc8 === 0) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C8_FILIAL",  // was "CAP1_R_C8" — missing row+suffix
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t("Cod eroare 49-017: Cap.1 Col.8 trebuie să fie ≠ 0 la rândul dinamic " + (i + 1) + " (grup " + r + ")", {}),
                    });
                }
            }
        });
        /*==================== CAP.2 ====================*/
        /*------------------49-018------------------*/
        // Cap.2 (Rînd.01)= Cap.2 ∑(Rînd.02-20) (Col*) 
        //autosum
        /*------------------49-019 - 49-024------------------*/
        // Col comparisons per row: Rînd.01-20
        var cap2AllRows = cap2DetailRows.concat(["20"]);
        var cap2ColChecks = [
            { a: 1, b: 2, err: "49-019" },
            { a: 3, b: 4, err: "49-020" },
            { a: 5, b: 6, err: "49-021" },
            { a: 7, b: 8, err: "49-022" },
            { a: 5, b: 7, err: "49-023" },
            { a: 6, b: 8, err: "49-024" },
        ];

        cap2AllRows.forEach(function (r) {
            cap2ColChecks.forEach(function (chk) {
                var ca = toFloat(values["CAP2_R" + r + "_C" + chk.a]);
                var cb = toFloat(values["CAP2_R" + r + "_C" + chk.b]);
                if (ca < cb) {
                    webform.errors.push({
                        fieldName: "CAP2_R" + r + "_C" + chk.a,
                        options: { hide_title: true },
                        msg: Drupal.t("Cod eroare " + chk.err + ": Cap.2 Col." + chk.a + " trebuie să fie ≥ Col." + chk.b + " la rândul " + r, {}),
                    });
                }
            });
        });
        /*------------------49-025 - 49-032------------------*/
        // Cap.2 (Rînd.01) = Cap.1 (Rînd.050 / 040) pe coloane specifice

        var cap2Row = "01";

        // Mapare reguli
        var cap2ToCap1Map = [
            { cap2Col: 1, cap1Row: "50", cap1Col: 10, err: "49-025" },
            { cap2Col: 2, cap1Row: "50", cap1Col: 12, err: "49-026" },
            { cap2Col: 3, cap1Row: "50", cap1Col: 1, err: "49-027" },
            { cap2Col: 4, cap1Row: "50", cap1Col: 3, err: "49-028" },
            { cap2Col: 5, cap1Row: "50", cap1Col: 7, err: "49-029" },
            { cap2Col: 6, cap1Row: "50", cap1Col: 9, err: "49-030" },
            { cap2Col: 7, cap1Row: "40", cap1Col: 7, err: "49-031" },
            { cap2Col: 8, cap1Row: "40", cap1Col: 9, err: "49-032" }
        ];

        cap2ToCap1Map.forEach(function (rule) {

            var cap2Val = toFloat(values["CAP2_R" + cap2Row + "_C" + rule.cap2Col]);
            var cap1Val = toFloat(values["CAP1_R" + rule.cap1Row + "_C" + rule.cap1Col]);

            // rotunjire la 2 zecimale pentru siguranță
            cap2Val = Math.round(cap2Val * 100) / 100;
            cap1Val = Math.round(cap1Val * 100) / 100;

            if (cap2Val !== cap1Val) {
                webform.errors.push({
                    fieldName: "CAP2_R" + cap2Row + "_C" + rule.cap2Col,
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare " + rule.err +
                        ": Cap.2 Rînd.01 Col." + rule.cap2Col +
                        " trebuie să fie egal cu Cap.1 Rînd." +
                        rule.cap1Row + " Col." + rule.cap1Col,
                        {}
                    ),
                });
            }

        });
        /*==================== END CAP.2 ====================*/

        /*==================== CAP.3 VALIDĂRI ====================*/
        /*------------------49-033------------------*/
        // autosum
        /*------------------49-034------------------*/
        // Col.3 ≥ Col.4
        cap3RowsMain.forEach(function (r) {

            var c3 = toFloat(values["CAP3_R" + r + "_C3"]);
            var c4 = toFloat(values["CAP3_R" + r + "_C4"]);

            if (c3 < c4) {
                webform.errors.push({
                    fieldName: "CAP3_R" + r + "_C3",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-034: Col.3 trebuie să fie ≥ Col.4 la rândul " + r,
                        {}
                    ),
                });
            }
        });


        /*------------------49-035------------------*/
        // Col.5 ≥ Col.6
        cap3RowsMain.forEach(function (r) {

            var c5 = toFloat(values["CAP3_R" + r + "_C5"]);
            var c6 = toFloat(values["CAP3_R" + r + "_C6"]);

            if (c5 < c6) {
                webform.errors.push({
                    fieldName: "CAP3_R" + r + "_C5",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-035: Col.5 trebuie să fie ≥ Col.6 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        /*------------------49-036------------------*/
        // Rînd.02 Col.1 Cap.3 = Rînd.050 Col.1 Cap.1

        if (toFloat(values["CAP3_R02_C1"]) !== toFloat(values["CAP1_R50_C1"])) {
            webform.errors.push({
                fieldName: "CAP3_R02_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-036: Cap.3 Rînd.02 Col.1 trebuie să fie egal cu Cap.1 Rînd.050 Col.1",
                    {}
                ),
            });
        }
        /*------------------49-037------------------*/
        // Rînd.02 Col.5 Cap.3 = Rînd.040 Col.1 Cap.1

        if (toFloat(values["CAP3_R02_C5"]) !== toFloat(values["CAP1_R40_C1"])) {
            webform.errors.push({
                fieldName: "CAP3_R02_C5",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-037: Cap.3 Rînd.02 Col.5 trebuie să fie egal cu Cap.1 Rînd.040 Col.1",
                    {}
                ),
            });
        }
        /*------------------49-038------------------*/
        // (R02 Col.2 + Col.3) = (R10 + R20 + R30) Col.1 Cap.1

        var cap3Sum = toFloat(values["CAP3_R02_C2"]) + toFloat(values["CAP3_R02_C3"]);
        var cap1Sum =
            toFloat(values["CAP1_R10_C1"]) +
            toFloat(values["CAP1_R20_C1"]) +
            toFloat(values["CAP1_R30_C1"]);

        cap3Sum = Math.round(cap3Sum * 100) / 100;
        cap1Sum = Math.round(cap1Sum * 100) / 100;

        if (cap3Sum !== cap1Sum) {
            webform.errors.push({
                fieldName: "CAP3_R02_C2",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-038: Cap.3 (Rînd.02 Col.2+Col.3) trebuie să fie egal cu Cap.1 (Rînd.010+020+030) Col.1",
                    {}
                ),
            });
        }


        /*------------------49-039------------------*/
        // Rînd.030 – maxim 2 zecimale

        var raw030 = values["CAP3_R030_C1"];

        if (raw030 !== undefined && raw030 !== null && raw030 !== "") {

            var strVal = String(raw030).trim();

            // Înlocuim virgula cu punct pentru uniformizare
            strVal = strVal.replace(",", ".");

            // Verificăm dacă este număr valid
            if (isNaN(strVal)) {
                webform.errors.push({
                    fieldName: "CAP3_R030_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-039: Rînd.030 trebuie să fie număr valid",
                        {}
                    ),
                });
            } else {

                // Verificăm numărul de zecimale
                var parts = strVal.split(".");
                if (parts.length > 1 && parts[1].length > 2) {
                    webform.errors.push({
                        fieldName: "CAP3_R030_C1",
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-039: Rînd.030 poate avea maxim 2 zecimale",
                            {}
                        ),
                    });
                }
            }
        }


        /*------------------49-040------------------*/
        // Rînd.010, 020, 040 – numere întregi

        ["010", "020", "040"].forEach(function (r) {

            var val = values["CAP3_R" + r + "_C1"];

            if (val && !/^\d+$/.test(String(val))) {
                webform.errors.push({
                    fieldName: "CAP3_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-040: Rînd." + r + " trebuie să fie număr întreg",
                        {}
                    ),
                });
            }
        });


        /*------------------49-041------------------*/
        // Rînd.040 ≤ Cap.1 Rînd.050 Col.7
        if (toFloat(values["CAP3_R040_C1"]) > toFloat(values["CAP1_R50_C7"])) {
            webform.errors.push({
                fieldName: "CAP3_R040_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-041: Cap.3 Rînd.040 trebuie să fie ≤ Cap.1 Rînd.050 Col.7",
                    {}
                ),
            });
        }
        /*------------------49-064------------------*/
        // Cap.3 Rînd.010, 020 ≠ 0 dacă Cap.1 Rînd.050 (Col.7 - Col.8) ≠ 0
        var cap1r050c7c8diff = Math.round((toFloat(values["CAP1_R50_C7"]) - toFloat(values["CAP1_R50_C8"])) * 100) / 100;

        if (cap1r050c7c8diff !== 0) {
            ["010", "020"].forEach(function (r) {
                if (toFloat(values["CAP3_R" + r + "_C1"]) === 0) {
                    webform.errors.push({
                        fieldName: "CAP3_R" + r + "_C1",
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-064: Cap.3 Rînd." + r + " trebuie să fie ≠ 0 deoarece Cap.1 Rînd.050 (Col.7 - Col.8) ≠ 0",
                            {}
                        ),
                    });
                }
            });
        }
        /*------------------49-065------------------*/
        // Dacă Cap.1 Rînd.050 Col.1 ≠ 0 atunci Cap.3 Rînd.030 și Rînd.040 ≠ 0
        if (toFloat(values["CAP1_R50_C1"]) !== 0) {
            ["030", "040"].forEach(function (r) {
                if (toFloat(values["CAP3_R" + r + "_C1"]) === 0) {
                    webform.errors.push({
                        fieldName: "CAP3_R" + r + "_C1",
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-065: Cap.3 Rînd." + r + " trebuie să fie ≠ 0 deoarece Cap.1 Rînd.050 Col.1 ≠ 0",
                            {}
                        ),
                    });
                }
            });
        }
        /*==================== END CAP.3 ====================*/
        /*==================== CAP.4 VALIDĂRI ====================*/
        /*------------------49-042------------------*/
        // R010 Col.1 = Cap.1 R50 Col.7
        var v1 = parseFloat(String(values["CAP4_R010_C1"] || 0).replace(",", "."));
        var v2 = parseFloat(String(values["CAP1_R50_C7"] || 0).replace(",", "."));

        if (isNaN(v1)) v1 = 0;
        if (isNaN(v2)) v2 = 0;

        if (v1 !== v2) {
            webform.errors.push({
                fieldName: "CAP4_R010_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-042: Cap.4 Rînd.010 Col.1 trebuie să fie egal cu Cap.1 Rînd.050 Col.7",
                    {}
                ),
            });
        }
        /*------------------49-043------------------*/

        var c4_2 = parseFloat(String(values["CAP4_R010_C2"] || 0).replace(",", "."));
        var c1_8 = parseFloat(String(values["CAP1_R50_C8"] || 0).replace(",", "."));

        if (isNaN(c4_2)) c4_2 = 0;
        if (isNaN(c1_8)) c1_8 = 0;

        if (c4_2 !== c1_8) {
            webform.errors.push({
                fieldName: "CAP4_R010_C2",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-043: Cap.4 Rînd.010 Col.2 trebuie să fie egal cu Cap.1 Rînd.050 Col.8",
                    {}
                ),
            });
        }
        /*------------------49-044------------------*/

        var c4_3 = parseFloat(String(values["CAP4_R010_C3"] || 0).replace(",", "."));
        var c1_1 = parseFloat(String(values["CAP1_R50_C1"] || 0).replace(",", "."));

        if (isNaN(c4_3)) c4_3 = 0;
        if (isNaN(c1_1)) c1_1 = 0;

        if (c4_3 !== c1_1) {
            webform.errors.push({
                fieldName: "CAP4_R010_C3",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-044: Cap.4 Rînd.010 Col.3 trebuie să fie egal cu Cap.1 Rînd.050 Col.1",
                    {}
                ),
            });
        }
        /*------------------49-045------------------*/

        var c4_4 = parseFloat(String(values["CAP4_R010_C4"] || 0).replace(",", "."));
        var c1_2 = parseFloat(String(values["CAP1_R50_C2"] || 0).replace(",", "."));

        if (isNaN(c4_4)) c4_4 = 0;
        if (isNaN(c1_2)) c1_2 = 0;

        if (c4_4 !== c1_2) {
            webform.errors.push({
                fieldName: "CAP4_R010_C4",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-045: Cap.4 Rînd.010 Col.4 trebuie să fie egal cu Cap.1 Rînd.050 Col.2",
                    {}
                ),
            });
        }
        /*------------------49-046------------------*/
        ["010", "042", "052", "040"].forEach(function (r) {
            var c1 = parseFloat(String(values["CAP4_R" + r + "_C1"] || 0).replace(",", "."));
            var c2 = parseFloat(String(values["CAP4_R" + r + "_C2"] || 0).replace(",", "."));

            if (isNaN(c1)) c1 = 0;
            if (isNaN(c2)) c2 = 0;

            if (c1 < c2) {
                webform.errors.push({
                    fieldName: "CAP4_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-046: Cap.4 Col.1 trebuie să fie ≥ Col.2 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-047------------------*/
        ["010", "042", "052", "040"].forEach(function (r) {
            var c3 = parseFloat(String(values["CAP4_R" + r + "_C3"] || 0).replace(",", "."));
            var c4 = parseFloat(String(values["CAP4_R" + r + "_C4"] || 0).replace(",", "."));

            if (isNaN(c3)) c3 = 0;
            if (isNaN(c4)) c4 = 0;

            if (c3 < c4) {
                webform.errors.push({
                    fieldName: "CAP4_R" + r + "_C3",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-047: Cap.4 Col.3 trebuie să fie ≥ Col.4 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-048 CORENT------------------*/

        // Cap.4: Rînd.010 = ∑(Rînduri dinamice) pentru fiecare coloană (Col.1, Col.2, Col.3, Col.4)
        // Cap.4: Rînd.010 = ∑(Rînduri dinamice) pentru fiecare coloană (Col.1, Col.2, Col.3, Col.4)
        // for (let i = 1; i <= 4; i++) {
        //   const colKey = `C${i}`;
        //   const total = parseFloat(values[`CAP4_R010_${colKey}`]) || 0;

        //   let sum = new Decimal(0);
        //   const rowCount = values[`CAP4_R_${colKey}`]?.length || 0;

        //   for (let j = 0; j < rowCount; j++) {
        //     const val = values[`CAP4_R_${colKey}`]?.[j];
        //     if (!val) continue;
        //     sum = sum.plus(new Decimal(val || 0));
        //   }

        //   if (!sum.eq(new Decimal(total))) {
        //     errors.push({
        //       weight: 31,
        //       msg: `Cod eroare 49-048: Cap.4 Rînd 010 Col.${i}: [Rînd.010] = ∑[Rînduri dinamice] (${total}) ≠ (${sum.toNumber()})`,
        //     });
        //   }
        // }
        /*==================== END CAP.4 ====================*/
        /*==================== Cap.5 VALIDĂRI ====================*/
        /*------------------ Cap.5 Val.1 ------------------*/
        // Cap.5 (Col.1) = Cap.5 ∑(Col.2-3) (Rînd.*)

        var cap5Rows = ["01", "02", "03", "04", "05", "06", "07", "08"];

        cap5Rows.forEach(function (r) {
            var c1 = toFloat(values["CAP5_R" + r + "_C1"]);
            var c2 = toFloat(values["CAP5_R" + r + "_C2"]);
            var c3 = toFloat(values["CAP5_R" + r + "_C3"]);

            if (c1 !== (c2 + c3)) {
                webform.errors.push({
                    fieldName: "CAP5_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare Cap.5-01: Rînd." + r +
                        " Col.1 trebuie să fie egală cu Col.2 + Col.3",
                        {}
                    ),
                });
            }
        });


        /*------------------ Cap.5 Val.2 ------------------*/
        // Cap.5 (Col.1) ≥ Cap.5 (Col.*) (Rînd.*)

        var cap5Cols = [2, 3, 4, 5, 6, 7, 8];

        cap5Rows.forEach(function (r) {
            var c1 = toFloat(values["CAP5_R" + r + "_C1"]);

            cap5Cols.forEach(function (c) {
                var cx = toFloat(values["CAP5_R" + r + "_C" + c]);

                if (c1 < cx) {
                    webform.errors.push({
                        fieldName: "CAP5_R" + r + "_C1",
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare Cap.5-02: Rînd." + r +
                            " Col.1 trebuie să fie ≥ Col." + c,
                            {}
                        ),
                    });
                }
            });
        });

        /*==================== END CAP.5 ====================*/
        /*==================== Cap.6 VALIDĂRI ====================*/
        var CAP6Cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var CAP6AllRows = ["010", "020", "030", "040", "050", "060", "070", "080", "090"];
        /*------------------49-051------------------*/
        // Cap.6 (Col.1) = Cap.6 (Col.2 + Col.4 + Col.6) (Rînd.*)
        CAP6AllRows.forEach(function (r) {
            var c1 = toFloat(values["CAP6_R" + r + "_C1"]);
            var c2 = toFloat(values["CAP6_R" + r + "_C2"]);
            var c4 = toFloat(values["CAP6_R" + r + "_C4"]);
            var c6 = toFloat(values["CAP6_R" + r + "_C6"]);
            var sum246 = Math.round((c2 + c4 + c6) * 100) / 100;

            if (c1 < sum246) {
                webform.errors.push({
                    fieldName: "CAP6_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-051: Cap.6 Col.1 trebuie să fie egal cu Col.2 + Col.4 + Col.6 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-052------------------*/
        // Cap.6 (Col.2) ≥ Cap.6 (Col.3) (Rînd.*)
        CAP6AllRows.forEach(function (r) {
            var c2 = toFloat(values["CAP6_R" + r + "_C2"]);
            var c3 = toFloat(values["CAP6_R" + r + "_C3"]);

            if (c2 < c3) {
                webform.errors.push({
                    fieldName: "CAP6_R" + r + "_C2",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-052: Cap.6 Col.2 trebuie să fie ≥ Col.3 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-053------------------*/
        // Cap.6 (Col.4) ≥ Cap.6 (Col.5) (Rînd.*)
        CAP6AllRows.forEach(function (r) {
            var c4 = toFloat(values["CAP6_R" + r + "_C4"]);
            var c5 = toFloat(values["CAP6_R" + r + "_C5"]);

            if (c4 < c5) {
                webform.errors.push({
                    fieldName: "CAP6_R" + r + "_C4",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-053: Cap.6 Col.4 trebuie să fie ≥ Col.5 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-054------------------*/
        // Cap.6 (Col.6) ≥ Cap.6 (Col.7) (Rînd.*)
        CAP6AllRows.forEach(function (r) {
            var c6 = toFloat(values["CAP6_R" + r + "_C6"]);
            var c7 = toFloat(values["CAP6_R" + r + "_C7"]);

            if (c6 < c7) {
                webform.errors.push({
                    fieldName: "CAP6_R" + r + "_C6",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-054: Cap.6 Col.6 trebuie să fie ≥ Col.7 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-055------------------*/
        // Cap.6 (Col.1) = Cap.6 (Col.8 + Col.9) (Rînd.*)
        CAP6AllRows.forEach(function (r) {
            var c1 = toFloat(values["CAP6_R" + r + "_C1"]);
            var c8 = toFloat(values["CAP6_R" + r + "_C8"]);
            var c9 = toFloat(values["CAP6_R" + r + "_C9"]);
            var sum89 = Math.round((c8 + c9) * 100) / 100;

            if (c1 !== sum89) {
                webform.errors.push({
                    fieldName: "CAP6_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-055: Cap.6 Col.1 trebuie să fie egal cu Col.8 + Col.9 la rândul " + r,
                        {}
                    ),
                });
            }
        });
        /*------------------49-056------------------*/
        // Cap.6 Rînd.020 ≥ Cap.6 Rînd.030 (Col.1–10)
        // Cap.6 Rînd.050 ≥ Cap.6 Rînd.060 (Col.1–10)
        [{ parent: "020", child: "030" }, { parent: "050", child: "060" }].forEach(function (pair) {
            CAP6Cols.forEach(function (c) {
                var cp = toFloat(values["CAP6_R" + pair.parent + "_C" + c]);
                var cc = toFloat(values["CAP6_R" + pair.child + "_C" + c]);

                if (cp < cc) {
                    webform.errors.push({
                        fieldName: "CAP6_R" + pair.parent + "_C" + c,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-056: Cap.6 Rînd." + pair.parent + " trebuie să fie ≥ Rînd." + pair.child + " la coloana " + c,
                            {}
                        ),
                    });
                }
            });
        });
        /*==================== END Cap.6 ====================*/
        /*==================== CAP.7 VALIDĂRI ====================*/
        /*------------------49-057------------------*/
        // Cap.7 Rînd.X Col.2 ≥ Cap.6 Rînd.X ∑(Col.3 + Col.5 + Col.7)
        ["010", "020", "030", "040", "050", "060", "070", "080"].forEach(function (r) {
            var cap7c2 = toFloat(values["CAP7_R" + r + "_C2"]);
            var cap6sum = Math.round((
                toFloat(values["CAP6_R" + r + "_C3"]) +
                toFloat(values["CAP6_R" + r + "_C5"]) +
                toFloat(values["CAP6_R" + r + "_C7"])
            ) * 100) / 100;
            cap7c2 = Math.round(cap7c2 * 100) / 100;

            if (cap7c2 < cap6sum) {
                webform.errors.push({
                    fieldName: "CAP7_R" + r + "_C2",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-057: Cap.7 Rînd." + r + " Col.2 trebuie să fie ≥ Cap.6 Rînd." + r + " ∑(Col.3+Col.5+Col.7) (" + cap6sum + ")",
                        {}
                    ),
                });
            }
        });
        /*------------------49-058------------------*/
        // Cap.7 Col.N ≥ Col.N+1 (total ≥ femei) pentru toate perechile, toate rândurile
        var CAP7Rows = ["010", "020", "030", "040", "050", "060", "070", "080"];
        var CAP7ColPairs = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22]];

        CAP7Rows.forEach(function (r) {
            CAP7ColPairs.forEach(function (pair) {
                var ca = toFloat(values["CAP7_R" + r + "_C" + pair[0]]);
                var cb = toFloat(values["CAP7_R" + r + "_C" + pair[1]]);

                if (ca < cb) {
                    webform.errors.push({
                        fieldName: "CAP7_R" + r + "_C" + pair[0],
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-058: Cap.7 Rînd." + r + " Col." + pair[0] + " trebuie să fie ≥ Col." + pair[1],
                            {}
                        ),
                    });
                }
            });
        });

        /*------------------49-059------------------*/
        // Cap.7 Rînd.020 ≥ Cap.7 Rînd.030 (Col.1–22)
        CAP7ColPairs.forEach(function (pair) {
            [pair[0], pair[1]].forEach(function (c) {
                var r020 = toFloat(values["CAP7_R020_C" + c]);
                var r030 = toFloat(values["CAP7_R030_C" + c]);

                if (r020 < r030) {
                    webform.errors.push({
                        fieldName: "CAP7_R020_C" + c,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-059: Cap.7 Rînd.020 trebuie să fie ≥ Rînd.030 la coloana " + c,
                            {}
                        ),
                    });
                }
            });
        });
        /*------------------49-060------------------*/
        // Cap.7 Rînd.050 ≥ Cap.7 Rînd.060 (Col.1–22)
        CAP7ColPairs.forEach(function (pair) {
            [pair[0], pair[1]].forEach(function (c) {
                var r050 = toFloat(values["CAP7_R050_C" + c]);
                var r060 = toFloat(values["CAP7_R060_C" + c]);

                if (r050 < r060) {
                    webform.errors.push({
                        fieldName: "CAP7_R050_C" + c,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-060: Cap.7 Rînd.050 trebuie să fie ≥ Rînd.060 la coloana " + c,
                            {}
                        ),
                    });
                }
            });
        });
        /*------------------49-061------------------*/
        // Cap.7 Rînd.X Col.1 = Cap.6 Rînd.X Col.1 (Rînd.010–080)
        ["010", "020", "030", "040", "050", "060", "070", "080"].forEach(function (r) {
            var cap7 = Math.round(toFloat(values["CAP7_R" + r + "_C1"]) * 100) / 100;
            var cap6 = Math.round(toFloat(values["CAP6_R" + r + "_C1"]) * 100) / 100;

            if (cap7 !== cap6) {
                webform.errors.push({
                    fieldName: "CAP7_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-061: Cap.7 Rînd." + r + " Col.1 trebuie să fie egal cu Cap.6 Rînd." + r + " Col.1",
                        {}
                    ),
                });
            }
        });
        /*==================== END Cap.7 ====================*/
        /*==================== CAP.8 VALIDĂRI ====================*/
        /*------------------49-062------------------*/
        // Cap.8 Rînd.01 Col.1 ≤ Cap.1 Rînd.050 Col.7
        var cap8c1 = Math.round(toFloat(values["CAP8_R01_C1"]) * 100) / 100;
        var cap1r050c7 = Math.round(toFloat(values["CAP1_R50_C7"]) * 100) / 100;

        if (cap8c1 > cap1r050c7) {
            webform.errors.push({
                fieldName: "CAP8_R01_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-062: Cap.8 Rînd.01 Col.1 trebuie să fie ≤ Cap.1 Rînd.050 Col.7",
                    {}
                ),
            });
        }
        /*------------------49-063------------------*/
        // Cap.8 Rînd.01 Col.1 ≥ Cap.8 Rînd.01 Col.2
        var cap8c2 = Math.round(toFloat(values["CAP8_R01_C2"]) * 100) / 100;

        if (cap8c1 < cap8c2) {
            webform.errors.push({
                fieldName: "CAP8_R01_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-063: Cap.8 Rînd.01 Col.1 trebuie să fie ≥ Col.2",
                    {}
                ),
            });
        }

        /*==================== END Cap.8 ====================*/
        /*==================== CAP.9 VALIDĂRI ====================*/
        /*------------------49-064------------------*/
        // Cap.9 Rînd.01 Col.1,3,4,5,6 trebuie să fie 0 sau 1
        [1, 3, 4, 5, 6].forEach(function (c) {
            var val = toFloat(values["CAP9_R01_C" + c]);

            if (val !== 0 && val !== 1) {
                webform.errors.push({
                    fieldName: "CAP9_R01_C" + c,
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-064: Cap.9 Rînd.01 Col." + c + " trebuie să fie 0 sau 1",
                        {}
                    ),
                });
            }
        });
        /*==================== END Cap.9 ====================*/
        /*==================== Cap.10 VALIDĂRI ====================*/
        /*------------------49-083------------------*/
        // Cap.10 (Col.1) ≥ Cap.10 (Col.2) (Rînd.*)
        // Total calculatoare ≥ conectate la rețea
        ["010", "020", "030", "040", "050", "060"].forEach(function (r) {
            var c1 = toFloat(values["CAP10_R" + r + "_C1"]);
            var c2 = toFloat(values["CAP10_R" + r + "_C2"]);

            if (c1 < c2) {
                webform.errors.push({
                    fieldName: "CAP10_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-083: Cap.10 Col.1 trebuie să fie ≥ Col.2 (conectate la rețea) la rândul " + r,
                        {}
                    ),
                });
            }
        });

        /*------------------49-084------------------*/
        // Cap.10 (Col.1) ≥ Cap.10 (Col.3) (Rînd.*)
        // Total calculatoare ≥ conectate la Internet
        ["010", "020", "030", "040", "050", "060"].forEach(function (r) {
            var c1 = toFloat(values["CAP10_R" + r + "_C1"]);
            var c3 = toFloat(values["CAP10_R" + r + "_C3"]);

            if (c1 < c3) {
                webform.errors.push({
                    fieldName: "CAP10_R" + r + "_C1",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-084: Cap.10 Col.1 trebuie să fie ≥ Col.3 (conectate la Internet) la rândul " + r,
                        {}
                    ),
                });
            }
        });

        /*------------------49-085------------------*/
        // Cap.10 (Rînd.070) Col.1 = 0 sau 1 (dispune de WEB-site: da/nu)
        var CAP10_r070_c1 = toFloat(values["CAP10_R070_C1"]);

        if (CAP10_r070_c1 !== 0 && CAP10_r070_c1 !== 1) {
            webform.errors.push({
                fieldName: "CAP10_R070_C1",
                options: { hide_title: true },
                msg: Drupal.t(
                    "Cod eroare 49-085: Cap.10 Rînd.070 Col.1 (dispune de WEB-site) trebuie să fie 0 sau 1",
                    {}
                ),
            });
        }

        /*==================== END Cap.10 ====================*/

        /*==================== END ====================*/
        webform.validatorsStatus["edu49cap1"] = 1;
        validateWebform();
    };

})(jQuery);

function changeIdLanguage(elem) {
    // 1. Găsim rândul curent pe care se află dropdown-ul modificat
    var $row = jQuery(elem).closest("tr");

    // 2. Extragem valoarea selectată (ex: "067 - Ucraineană" sau "067")
    var selectedValue = jQuery(elem).val() || "";

    // 3. Păstrăm doar ID-ul, ignorând textul de după cratimă (dacă există)
    var selectedCode = selectedValue.split("-")[0].trim();

    // 4. Căutăm celula din stânga (codul limbii) care are atributul field terminat în "_CA"
    var $col1 = $row
        .find("input[field]")

        .filter(function () {
            var f = (this.getAttribute("field") || "").trim();
            return /_CA$/.test(f); // Se asigură că targetează field-ul CAP4_R_CA
        })
        .first();

    // 5. Fallback (în caz că nu e găsit după "field", căutăm după "id")
    if (!$col1.length) {
        $col1 = $row
            .find("input[id]")
            .filter(function () {
                var id = (this.id || "").trim();
                return /_CA/.test(id);
            })
            .first();
    }

    // 6. Inserăm codul extras în input-ul corespunzător
    if ($col1.length) {
        $col1.val(selectedCode).trigger("change");
    }
}
function changeProfId(elem) {
    var $row = jQuery(elem).closest("tr");
    var selectedValue = jQuery(elem).val() || "";
    var selectedCode = selectedValue.split("-")[0].trim();

    // Determinăm secțiunea Cap.1 (10/20/30/40) și adăugăm prefixul
    // corespunzător codului selectat; secțiunea 70 rămâne neschimbată.
    var $section = jQuery(elem).closest(
        '#CAP1_10, #CAP1_20, #CAP1_30, #CAP1_40'
    );
    var sectionId = $section.length ? $section.attr("id") : "";
    var rowPrefixMap = {
        CAP1_10: "1",
        CAP1_20: "2",
        CAP1_30: "3",
        CAP1_40: "4",
    };
    var rowPrefix = rowPrefixMap[sectionId] || "";

    if (selectedCode && rowPrefix) {
        selectedCode = rowPrefix + selectedCode;
    }

    var $col1 = $row
        .find("input[field]")
        .filter(function () {
            var f = (this.getAttribute("field") || "").trim();
            return /_CA$/.test(f);
        })
        .first();

    if (!$col1.length) {
        $col1 = $row
            .find("input[id]")
            .filter(function () {
                var id = (this.id || "").trim();
                return /_CA/.test(id);
            })
            .first();
    }

    if ($col1.length) {
        $col1.val(selectedCode).trigger("change");
    }
}