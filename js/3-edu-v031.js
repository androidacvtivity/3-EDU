(function ($) {
    Drupal.behaviors.edu3 = {
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

    webform.afterLoad.edu3 = function () {
        formatYearSelectOptions();
    };

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
        function toDecimal(val) {
            if (typeof val === "undefined" || val === null || val === "") {
                return new Decimal(0);
            }
            var num = parseFloat(val);
            return isNaN(num) ? new Decimal(0) : new Decimal(val);
        }
        // Rândurile statice de sumarizare și detaliu din Cap.1
        var summaryRows = ["10", "20", "30", "40"];
        var totalRow = "50";
        var dualRow = "51";
        var disabRow = "60";
        var countryRow = "70";
        // Coloanele disponibile în Cap.1 (rândurile 10-40, 50, 51, 60, 70 merg pînă la Col.17)
        var cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

        var allRows = summaryRows.concat([totalRow, dualRow, disabRow, countryRow]);
        var dynParentRows = ["10", "20", "30", "40", "70"];
        /*------------------49-001------------------*/
        // Cap.1 (Rînd.50) ≥ Cap.1 (Rînd.051) (Col*)
        cols.forEach(function (c) {
            var r050 = toFloat(values["CAP1_R" + totalRow + "_C" + c]);
            var r051 = toFloat(values["CAP1_R" + dualRow + "_C" + c]);

            if (r050 < r051) {
                webform.errors.push({
                    fieldName: "CAP1_R" + totalRow + "_C" + c,
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-001: Cap.1 Rînd.50 trebuie să fie ≥ Rînd.51 pe coloana " + c,
                        {}
                    ),
                });
            }
        });
        /*------------------49-002------------------*/
        // Cap.1 (Rînd.050) ≥ Cap.1 (Rînd.060) (Col*)
        cols.forEach(function (c) {
            var r050 = toFloat(values["CAP1_R" + totalRow + "_C" + c]);
            var r060 = toFloat(values["CAP1_R" + disabRow + "_C" + c]);

            if (r050 < r060) {
                webform.errors.push({
                    fieldName: "CAP1_R" + totalRow + "_C" + c,
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-002: Cap.1 Rînd.50 trebuie să fie ≥ Rînd.060 pe coloana " + c,
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
                        "Cod eroare 49-003: Cap.1 Col.1 trebuie să fie ≥ Col.2 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC1 = values["CAP1_R" + r + "_C1_FILIAL"];
            var dynC2 = values["CAP1_R" + r + "_C2_FILIAL"];
            if (!dynC1 || !dynC2) return;

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
            if (!dynC1 || !dynC3) return;

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
            if (!dynC1 || !dynC4) return;

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
        // Cap.1 (Col.3) ≥ Cap.1 (Col.5) (Rînd.*)
        allRows.forEach(function (r) {
            var c3 = toFloat(values["CAP1_R" + r + "_C3"]);
            var c5 = toFloat(values["CAP1_R" + r + "_C5"]);
            if (c3 < c5) {
                webform.errors.push({
                    fieldName: "CAP1_R" + r + "_C3",
                    options: { hide_title: true },
                    msg: Drupal.t(
                        "Cod eroare 49-006: Cap.1 Col.3 trebuie să fie ≥ Col.5 la rândul " + r,
                        {}
                    ),
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC3 = values["CAP1_R" + r + "_C3_FILIAL"];
            var dynC5 = values["CAP1_R" + r + "_C5_FILIAL"];
            if (!dynC3 || !dynC5) return;

            for (var i = 0; i < dynC3.length; i++) {
                if (toFloat(dynC3[i]) < toFloat(dynC5[i])) {
                    webform.errors.push({
                        fieldName: "CAP1_R" + r + "_C3_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-006: Cap.1 Col.3 trebuie să fie ≥ Col.5 la rândul dinamic " + (i + 1) + " (grup " + r + ")",
                            {}
                        ),
                    });
                }
            }
        });

        /*------------------49-007------------------*/
        // Cap.1 (Col.12) = Sum (Col.4, Col.6, Col.8, Col.10) (Rînd.*)
        allRows.forEach(function (r) {
            var c4 = toDecimal(values["CAP1_R" + r + "_C4"]);
            var c6 = toDecimal(values["CAP1_R" + r + "_C6"]);
            var c8 = toDecimal(values["CAP1_R" + r + "_C8"]);
            var c10 = toDecimal(values["CAP1_R" + r + "_C10"]);
            var c12 = toDecimal(values["CAP1_R" + r + "_C12"]);
            var sum4681012 = c4.plus(c6).plus(c8).plus(c10);

            if (!c12.equals(sum4681012)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C12",
                    weight: 10,
                    msg: `Cod eroare 49-007: Cap.1 Col.12 trebuie să fie egal cu suma Col.4 + Col.6 + Col.8 + Col.10 la rândul ${r}: (${c12}) ≠ (${sum4681012}).`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC4 = values["CAP1_R" + r + "_C4_FILIAL"];
            var dynC6 = values["CAP1_R" + r + "_C6_FILIAL"];
            var dynC8 = values["CAP1_R" + r + "_C8_FILIAL"];
            var dynC10 = values["CAP1_R" + r + "_C10_FILIAL"];
            var dynC12 = values["CAP1_R" + r + "_C12_FILIAL"];
            if (!dynC12 || !dynC4 || !dynC6 || !dynC8 || !dynC10) return;

            for (var i = 0; i < dynC12.length; i++) {
                var sum = toDecimal(dynC4[i])
                    .plus(toDecimal(dynC6[i]))
                    .plus(toDecimal(dynC8[i]))
                    .plus(toDecimal(dynC10[i]));
                if (!toDecimal(dynC12[i]).equals(sum)) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C12_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-007: Cap.1 Col.12 trebuie să fie egal cu suma Col.4 + Col.6 + Col.8 + Col.10 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-008------------------*/
        // Cap.1 (Col.14) = Sum (Col.5, Col.7, Col.9, Col.11) (Rînd.*)
        allRows.forEach(function (r) {
            var c5 = toDecimal(values["CAP1_R" + r + "_C5"]);
            var c7 = toDecimal(values["CAP1_R" + r + "_C7"]);
            var c9 = toDecimal(values["CAP1_R" + r + "_C9"]);
            var c11 = toDecimal(values["CAP1_R" + r + "_C11"]);
            var c14 = toDecimal(values["CAP1_R" + r + "_C14"]);
            var sum5791114 = c5.plus(c7).plus(c9).plus(c11);

            if (!c14.equals(sum5791114)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C14",
                    weight: 10,
                    msg: `Cod eroare 49-008: Cap.1 Col.14 trebuie să fie egal cu suma Col.5 + Col.7 + Col.9 + Col.11 la rândul ${r}: (${c14}) ≠ (${sum5791114}).`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC5 = values["CAP1_R" + r + "_C5_FILIAL"];
            var dynC7 = values["CAP1_R" + r + "_C7_FILIAL"];
            var dynC9 = values["CAP1_R" + r + "_C9_FILIAL"];
            var dynC11 = values["CAP1_R" + r + "_C11_FILIAL"];
            var dynC14 = values["CAP1_R" + r + "_C14_FILIAL"];
            if (!dynC14 || !dynC5 || !dynC7 || !dynC9 || !dynC11) return;

            for (var i = 0; i < dynC14.length; i++) {
                var sum = toDecimal(dynC5[i])
                    .plus(toDecimal(dynC7[i]))
                    .plus(toDecimal(dynC9[i]))
                    .plus(toDecimal(dynC11[i]));
                if (!toDecimal(dynC14[i]).equals(sum)) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C14_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-008: Cap.1 Col.14 trebuie să fie egal cu suma Col.5 + Col.7 + Col.9 + Col.11 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-009------------------*/
        // Cap.1 (Col.12) ≥ (Col.13) (Rînd.*)
        allRows.forEach(function (r) {
            var c12 = toDecimal(values["CAP1_R" + r + "_C12"]);
            var c13 = toDecimal(values["CAP1_R" + r + "_C13"]);
            if (c12.lessThan(c13)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C12",
                    weight: 10,
                    msg: `Cod eroare 49-009: Cap.1 Col.12 trebuie să fie ≥ Col.13 la rândul ${r}.`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC12 = values["CAP1_R" + r + "_C12_FILIAL"];
            var dynC13 = values["CAP1_R" + r + "_C13_FILIAL"];
            if (!dynC12 || !dynC13) return;

            for (var i = 0; i < dynC12.length; i++) {
                if (toDecimal(dynC12[i]).lessThan(toDecimal(dynC13[i]))) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C12_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-009: Cap.1 Col.12 trebuie să fie ≥ Col.13 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-010------------------*/
        // Cap.1 (Col.12) ≥ (Col.14) (Rînd.*)
        allRows.forEach(function (r) {
            var c12 = toDecimal(values["CAP1_R" + r + "_C12"]);
            var c14 = toDecimal(values["CAP1_R" + r + "_C14"]);
            if (c12.lessThan(c14)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C12",
                    weight: 10,
                    msg: `Cod eroare 49-010: Cap.1 Col.12 trebuie să fie ≥ Col.14 la rândul ${r}.`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC12 = values["CAP1_R" + r + "_C12_FILIAL"];
            var dynC14 = values["CAP1_R" + r + "_C14_FILIAL"];
            if (!dynC12 || !dynC14) return;

            for (var i = 0; i < dynC12.length; i++) {
                if (toDecimal(dynC12[i]).lessThan(toDecimal(dynC14[i]))) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C12_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-010: Cap.1 Col.12 trebuie să fie ≥ Col.14 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-011------------------*/
        // Cap.1 (Col.15) ≥ (Col.16) (Rînd.*)
        allRows.forEach(function (r) {
            var c15 = toDecimal(values["CAP1_R" + r + "_C15"]);
            var c16 = toDecimal(values["CAP1_R" + r + "_C16"]);
            if (c15.lessThan(c16)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C15",
                    weight: 10,
                    msg: `Cod eroare 49-011: Cap.1 Col.15 trebuie să fie ≥ Col.16 la rândul ${r}.`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC15 = values["CAP1_R" + r + "_C15_FILIAL"];
            var dynC16 = values["CAP1_R" + r + "_C16_FILIAL"];
            if (!dynC15 || !dynC16) return;

            for (var i = 0; i < dynC15.length; i++) {
                if (toDecimal(dynC15[i]).lessThan(toDecimal(dynC16[i]))) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C15_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-011: Cap.1 Col.15 trebuie să fie ≥ Col.16 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-012------------------*/
        // Cap.1 (Col.15) ≥ (Col.17) (Rînd.*)
        allRows.forEach(function (r) {
            var c15 = toDecimal(values["CAP1_R" + r + "_C15"]);
            var c17 = toDecimal(values["CAP1_R" + r + "_C17"]);
            if (c15.lessThan(c17)) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C15",
                    weight: 10,
                    msg: `Cod eroare 49-012: Cap.1 Col.15 trebuie să fie ≥ Col.17 la rândul ${r}.`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC15 = values["CAP1_R" + r + "_C15_FILIAL"];
            var dynC17 = values["CAP1_R" + r + "_C17_FILIAL"];
            if (!dynC15 || !dynC17) return;

            for (var i = 0; i < dynC15.length; i++) {
                if (toDecimal(dynC15[i]).lessThan(toDecimal(dynC17[i]))) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C15_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-012: Cap.1 Col.15 trebuie să fie ≥ Col.17 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-013------------------*/
        // Regula 18: Dacă Cap.I (Col.2) ≠ 0, atunci (Col.13) ≠ 0 (Rînd.*)
        // Implicație într-un singur sens: Col.13 este obligatoriu doar când
        // Col.2 este diferită de 0.
        allRows.forEach(function (r) {
            var c2 = toDecimal(values["CAP1_R" + r + "_C2"]);
            var c13 = toDecimal(values["CAP1_R" + r + "_C13"]);

            if (!c2.isZero() && c13.isZero()) {
                errors.push({
                    fieldName: "CAP1_R" + r + "_C13",
                    weight: 10,
                    msg: `Cod eroare 49-018: Dacă Cap.1 Col.2 ≠ 0, atunci Col.13 ≠ 0 la rândul ${r}: Col.2 = (${c2}), Col.13 = (${c13}).`,
                });
            }
        });

        dynParentRows.forEach(function (r) {
            var dynC2 = values["CAP1_R" + r + "_C2_FILIAL"];
            var dynC13 = values["CAP1_R" + r + "_C13_FILIAL"];
            if (!dynC2 || !dynC13) return;

            for (var i = 0; i < dynC2.length; i++) {
                var c2 = toDecimal(dynC2[i]);
                var c13 = toDecimal(dynC13[i]);

                if (!c2.isZero() && c13.isZero()) {
                    errors.push({
                        fieldName: "CAP1_R" + r + "_C13_FILIAL",
                        weight: 10,
                        index: i,
                        msg: `Cod eroare 49-018: Dacă Cap.1 Col.2 ≠ 0, atunci Col.13 ≠ 0 la rândul dinamic ${i + 1} (grup ${r}).`,
                    });
                }
            }
        });

        /*------------------49-014------------------*/
        // Cap.1 Col.A (codul meseriei) nu trebuie să se repete între rândurile
        // dinamice ale aceluiași grup (CAP1_10 / 20 / 30 / 40 / 51 / 70)
        dynParentRows.concat([dualRow]).forEach(function (r) {
            var caValues = values["CAP1_R" + r + "_CA_FILIAL"];
            if (!caValues) return;
            if (!Array.isArray(caValues)) caValues = [caValues];

            for (var i = 0; i < caValues.length; i++) {
                var vi = (caValues[i] || "").toString().trim();
                if (!vi) continue;

                for (var j = 0; j < i; j++) {
                    var vj = (caValues[j] || "").toString().trim();
                    if (vj && vj === vi) {
                        errors.push({
                            fieldName: "CAP1_R" + r + "_CA_FILIAL",
                            weight: 10,
                            index: i,
                            msg: `Cod eroare 49-014: Cap.1 codul meseriei de la rândul dinamic ${i + 1} (grup ${r}) este identic cu cel de la rândul ${j + 1}`,
                        });
                        break; // un singur mesaj de eroare per rând duplicat
                    }
                }
            }
        });

        /*------------------49-161------------------*/
        // Cap.1 (Rînd.51, rânduri dinamice, Col.B): fiecare cod trebuie să existe
        // în Col.B a rândurilor dinamice din Cap.1 Rînd.10, 20, 30 sau 40.
        // Codurile din Rînd.10-40 au un prefix (1/2/3/4) adăugat de changeProfId,
        // deci prima cifră se ignoră la comparare.
        (function () {
            var r51Codes = values["CAP1_R" + dualRow + "_CB_FILIAL"];
            if (!r51Codes) return;
            if (!Array.isArray(r51Codes)) r51Codes = [r51Codes];

            var knownCodes = {};
            ["10", "20", "30", "40"].forEach(function (r) {
                var list = values["CAP1_R" + r + "_CB_FILIAL"];
                if (!list) return;
                if (!Array.isArray(list)) list = [list];
                list.forEach(function (code) {
                    code = (code === null || typeof code === "undefined") ? "" : String(code).trim();
                    if (code.length > 1) {
                        knownCodes[code.substring(1)] = true; // fără prima cifră (prefix)
                    }
                });
            });

            for (var i = 0; i < r51Codes.length; i++) {
                var code = (r51Codes[i] === null || typeof r51Codes[i] === "undefined")
                    ? "" : String(r51Codes[i]).trim();
                if (code === "") continue;

                if (!knownCodes[code]) {
                    errors.push({
                        fieldName: "CAP1_R" + dualRow + "_CB_FILIAL",
                        index: i,
                        options: { hide_title: true },
                        msg: Drupal.t(
                            "Cod eroare 49-161: Cap.1 Rînd.51 Col.B, rândul dinamic " + (i + 1) +
                            ": codul (" + code + ") nu există în Col.B din Cap.1 Rînd.10, 20, 30, 40.",
                            {}
                        ),
                    });
                }
            }
        })();

        /*------------------Cap.II: regulile 20-27------------------*/
        // Cap.II are rândurile statice R01-R18, fără rânduri dinamice (_FILIAL).
        var cap2Rows = [
            "01", "02", "03", "04", "05", "06", "07", "08", "09",
            "10", "11", "12", "13", "14", "15", "16", "17", "18",
        ];

        // Perechile de coloane (Col.mai mare ≥ Col.mai mic) și numărul regulii
        // din listă, în ordine: 20-27.
        var cap2Pairs = [
            { greater: 1, smaller: 2, rule: 20 },
            { greater: 3, smaller: 4, rule: 21 },
            { greater: 5, smaller: 6, rule: 22 },
            { greater: 7, smaller: 8, rule: 23 },
            { greater: 9, smaller: 10, rule: 24 },
            { greater: 11, smaller: 12, rule: 25 },
            { greater: 13, smaller: 14, rule: 26 },
            { greater: 15, smaller: 16, rule: 27 },
        ];

        cap2Pairs.forEach(function (pair) {
            cap2Rows.forEach(function (r) {
                var cGreater = toDecimal(values["CAP2_R" + r + "_C" + pair.greater]);
                var cSmaller = toDecimal(values["CAP2_R" + r + "_C" + pair.smaller]);

                if (cGreater.lessThan(cSmaller)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C" + pair.greater,
                        weight: 20,
                        msg: `Cod eroare 49-0${pair.rule}: Cap.II Col.${pair.greater} trebuie să fie ≥ Col.${pair.smaller} la rândul ${r}: (${cGreater}) < (${cSmaller}).`,
                    });
                }
            });
        });

        /*------------------Cap.II vs Cap.I: regulile 28-35 (Rînd.01)------------------*/
        // Aceste reguli compară CAP2 Rînd.01 cu diverse rânduri/coloane din CAP1.
        // Toate cele patru rânduri implicate (10, 20, 30, 40, 50) sunt
        // statice, deci nu e nevoie de tratare a rândurilor dinamice (_FILIAL).
        (function () {
            var cap2R01C1 = toDecimal(values["CAP2_R01_C1"]);
            var cap2R01C2 = toDecimal(values["CAP2_R01_C2"]);
            var cap2R01C3 = toDecimal(values["CAP2_R01_C3"]);
            var cap2R01C4 = toDecimal(values["CAP2_R01_C4"]);
            var cap2R01C5 = toDecimal(values["CAP2_R01_C5"]);

            var cap1R050C15 = toDecimal(values["CAP1_R50_C15"]);
            var cap1R050C17 = toDecimal(values["CAP1_R50_C17"]);
            var cap1R030C15 = toDecimal(values["CAP1_R30_C15"]);
            var cap1R040C15 = toDecimal(values["CAP1_R40_C15"]);
            var cap1R030C17 = toDecimal(values["CAP1_R30_C17"]);
            var cap1R040C17 = toDecimal(values["CAP1_R40_C17"]);
            var cap1R010C15 = toDecimal(values["CAP1_R10_C15"]);
            var cap1R020C15 = toDecimal(values["CAP1_R20_C15"]);
            var cap1R010C17 = toDecimal(values["CAP1_R10_C17"]);
            var cap1R020C17 = toDecimal(values["CAP1_R20_C17"]);
            var cap1R040C1 = toDecimal(values["CAP1_R40_C1"]);
            var cap1R050C1 = toDecimal(values["CAP1_R50_C1"]);

            /*------------------49-028------------------*/
            // Cap.II (Rînd.01)(Col.1) = Cap.I (Rînd.50)(Col.15)
            if (!cap2R01C1.equals(cap1R050C15)) {
                errors.push({
                    fieldName: "CAP2_R01_C1",
                    weight: 20,
                    msg: `Cod eroare 49-028: Cap.II Rînd.01 Col.1 trebuie să fie egal cu Cap.1 Rînd.50 Col.15: (${cap2R01C1}) ≠ (${cap1R050C15}).`,
                });
            }

            /*------------------49-029------------------*/
            // Cap.II (Rînd.01)(Col.3) = Cap.I (Rînd.50)(Col.17)
            if (!cap2R01C3.equals(cap1R050C17)) {
                errors.push({
                    fieldName: "CAP2_R01_C3",
                    weight: 20,
                    msg: `Cod eroare 49-029: Cap.II Rînd.01 Col.3 trebuie să fie egal cu Cap.1 Rînd.50 Col.17: (${cap2R01C3}) ≠ (${cap1R050C17}).`,
                });
            }

            /*------------------49-030------------------*/
            // Cap.II (Rînd.01)(Col.2) = Cap.I (Rînd.30+40)(Col.15)
            var sum030040C15 = cap1R030C15.plus(cap1R040C15);
            if (!cap2R01C2.equals(sum030040C15)) {
                errors.push({
                    fieldName: "CAP2_R01_C2",
                    weight: 20,
                    msg: `Cod eroare 49-030: Cap.II Rînd.01 Col.2 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.15: (${cap2R01C2}) ≠ (${sum030040C15}).`,
                });
            }

            /*------------------49-031------------------*/
            // Cap.II (Rînd.01)(Col.4) = Cap.I (Rînd.30+40)(Col.17)
            var sum030040C17 = cap1R030C17.plus(cap1R040C17);
            if (!cap2R01C4.equals(sum030040C17)) {
                errors.push({
                    fieldName: "CAP2_R01_C4",
                    weight: 20,
                    msg: `Cod eroare 49-031: Cap.II Rînd.01 Col.4 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.17: (${cap2R01C4}) ≠ (${sum030040C17}).`,
                });
            }

            /*------------------49-032------------------*/
            // Cap.II (Rînd.01)(Col.1) = Cap.II (Rînd.01)(Col.2) + Cap.I(Rînd.10+20)(Col.15)
            var expected032 = cap2R01C2.plus(cap1R010C15).plus(cap1R020C15);
            if (!cap2R01C1.equals(expected032)) {
                errors.push({
                    fieldName: "CAP2_R01_C1",
                    weight: 20,
                    msg: `Cod eroare 49-032: Cap.II Rînd.01 Col.1 trebuie să fie egal cu Cap.II Rînd.01 Col.2 + Cap.1 (Rînd.10+20) Col.15: (${cap2R01C1}) ≠ (${expected032}).`,
                });
            }

            /*------------------49-033------------------*/
            // Cap.II (Rînd.01)(Col.3) = Cap.II (Rînd.01)(Col.4) + Cap.I(Rînd.10+20)(Col.17)
            var expected033 = cap2R01C4.plus(cap1R010C17).plus(cap1R020C17);
            if (!cap2R01C3.equals(expected033)) {
                errors.push({
                    fieldName: "CAP2_R01_C3",
                    weight: 20,
                    msg: `Cod eroare 49-033: Cap.II Rînd.01 Col.3 trebuie să fie egal cu Cap.II Rînd.01 Col.4 + Cap.1 (Rînd.10+20) Col.17: (${cap2R01C3}) ≠ (${expected033}).`,
                });
            }

            /*------------------49-034------------------*/
            // Cap.II (Rînd.01)(Col.1) - Cap.II (Rînd.01)(Col.3) = Cap.I (Rînd.50)(Col.15) - Cap.I(Rînd.50)(Col.17)
            var diffCap2 = cap2R01C1.minus(cap2R01C3);
            var diffCap1 = cap1R050C15.minus(cap1R050C17);
            if (!diffCap2.equals(diffCap1)) {
                errors.push({
                    fieldName: "CAP2_R01_C1",
                    weight: 20,
                    msg: `Cod eroare 49-034: Cap.II Rînd.01 (Col.1 - Col.3) trebuie să fie egal cu Cap.1 Rînd.50 (Col.15 - Col.17): (${diffCap2}) ≠ (${diffCap1}).`,
                });
            }

            /*------------------49-035------------------*/
            // Cap.II (Rînd.01)(Col.5) = Cap.I (Rînd.40)(Col.1)
            if (!cap2R01C5.equals(cap1R050C1)) {
                errors.push({
                    fieldName: "CAP2_R01_C5",
                    weight: 20,
                    msg: `Cod eroare 49-035 Cap.II Rînd.01 Col.5 trebuie să fie egal cu Cap.1 Rînd.50 Col.1: (${cap2R01C5}) ≠ (${cap1R050C1}).`,
                });
            }

            var cap2R01C6 = toDecimal(values["CAP2_R01_C6"]);
            var cap2R01C7 = toDecimal(values["CAP2_R01_C7"]);
            var cap2R01C8 = toDecimal(values["CAP2_R01_C8"]);
            var cap2R01C9 = toDecimal(values["CAP2_R01_C9"]);
            var cap2R01C10 = toDecimal(values["CAP2_R01_C10"]);
            var cap2R01C11 = toDecimal(values["CAP2_R01_C11"]);
            var cap2R01C12 = toDecimal(values["CAP2_R01_C12"]);
            var cap2R01C13 = toDecimal(values["CAP2_R01_C13"]);
            var cap2R01C14 = toDecimal(values["CAP2_R01_C14"]);
            var cap2R01C15 = toDecimal(values["CAP2_R01_C15"]);
            var cap2R01C16 = toDecimal(values["CAP2_R01_C16"]);

            var cap1R050C3 = toDecimal(values["CAP1_R50_C3"]);
            var cap1R030C1 = toDecimal(values["CAP1_R30_C1"]);
            var cap1R030C3 = toDecimal(values["CAP1_R30_C3"]);
            var cap1R040C3 = toDecimal(values["CAP1_R40_C3"]);
            var cap1R050C12 = toDecimal(values["CAP1_R50_C12"]);
            var cap1R050C14 = toDecimal(values["CAP1_R50_C14"]);
            var cap1R030C12 = toDecimal(values["CAP1_R30_C12"]);
            var cap1R040C12 = toDecimal(values["CAP1_R40_C12"]);
            var cap1R030C14 = toDecimal(values["CAP1_R30_C14"]);
            var cap1R040C14 = toDecimal(values["CAP1_R40_C14"]);
            var cap1R010C4 = toDecimal(values["CAP1_R10_C4"]);
            var cap1R010C6 = toDecimal(values["CAP1_R10_C6"]);
            var cap1R030C4 = toDecimal(values["CAP1_R30_C4"]);
            var cap1R030C6 = toDecimal(values["CAP1_R30_C6"]);
            var cap1R010C5 = toDecimal(values["CAP1_R10_C5"]);
            var cap1R010C7 = toDecimal(values["CAP1_R10_C7"]);
            var cap1R030C5 = toDecimal(values["CAP1_R30_C5"]);
            var cap1R030C7 = toDecimal(values["CAP1_R30_C7"]);

            /*------------------49-036------------------*/
            // Cap.II (Rînd.01)(Col.7) = Cap.I (Rînd.50)(Col.3)
            if (!cap2R01C7.equals(cap1R050C3)) {
                errors.push({
                    fieldName: "CAP2_R01_C7",
                    weight: 20,
                    msg: `Cod eroare 49-036: Cap.II Rînd.01 Col.7 trebuie să fie egal cu Cap.1 Rînd.50 Col.3: (${cap2R01C7}) ≠ (${cap1R050C3}).`,
                });
            }

            /*------------------49-037------------------*/
            // Cap.II (Rînd.01)(Col.6) = Cap.I (Rînd.30+40)(Col.1)
            var sum030040C1 = cap1R030C1.plus(cap1R040C1);
            if (!cap2R01C6.equals(sum030040C1)) {
                errors.push({
                    fieldName: "CAP2_R01_C6",
                    weight: 20,
                    msg: `Cod eroare 49-037: Cap.II Rînd.01 Col.6 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.1: (${cap2R01C6}) ≠ (${sum030040C1}).`,
                });
            }

            /*------------------49-038------------------*/
            // Cap.II (Rînd.01)(Col.8) = Cap.I (Rînd.30+40)(Col.3)
            var sum030040C3 = cap1R030C3.plus(cap1R040C3);
            if (!cap2R01C8.equals(sum030040C3)) {
                errors.push({
                    fieldName: "CAP2_R01_C8",
                    weight: 20,
                    msg: `Cod eroare 49-038: Cap.II Rînd.01 Col.8 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.3: (${cap2R01C8}) ≠ (${sum030040C3}).`,
                });
            }

            /*------------------49-039------------------*/
            // Cap.II (Rînd.01)(Col.9) = Cap.I (Rînd.50)(Col.12)
            if (!cap2R01C9.equals(cap1R050C12)) {
                errors.push({
                    fieldName: "CAP2_R01_C9",
                    weight: 20,
                    msg: `Cod eroare 49-039: Cap.II Rînd.01 Col.9 trebuie să fie egal cu Cap.1 Rînd.50 Col.12: (${cap2R01C9}) ≠ (${cap1R050C12}).`,
                });
            }

            /*------------------49-040------------------*/
            // Cap.II (Rînd.01)(Col.11) = Cap.I (Rînd.50)(Col.14)
            if (!cap2R01C11.equals(cap1R050C14)) {
                errors.push({
                    fieldName: "CAP2_R01_C11",
                    weight: 20,
                    msg: `Cod eroare 49-040: Cap.II Rînd.01 Col.11 trebuie să fie egal cu Cap.1 Rînd.50 Col.14: (${cap2R01C11}) ≠ (${cap1R050C14}).`,
                });
            }

            /*------------------49-041------------------*/
            // Cap.II (Rînd.01)(Col.10) = Cap.I (Rînd.30+40)(Col.12)
            var sum030040C12 = cap1R030C12.plus(cap1R040C12);
            if (!cap2R01C10.equals(sum030040C12)) {
                errors.push({
                    fieldName: "CAP2_R01_C10",
                    weight: 20,
                    msg: `Cod eroare 49-041: Cap.II Rînd.01 Col.10 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.12: (${cap2R01C10}) ≠ (${sum030040C12}).`,
                });
            }

            /*------------------49-042------------------*/
            // Cap.II (Rînd.01)(Col.12) = Cap.I (Rînd.30+40)(Col.14)
            var sum030040C14 = cap1R030C14.plus(cap1R040C14);
            if (!cap2R01C12.equals(sum030040C14)) {
                errors.push({
                    fieldName: "CAP2_R01_C12",
                    weight: 20,
                    msg: `Cod eroare 49-042: Cap.II Rînd.01 Col.12 trebuie să fie egal cu Cap.1 (Rînd.30+40) Col.14: (${cap2R01C12}) ≠ (${sum030040C14}).`,
                });
            }

            /*------------------49-043------------------*/
            // Cap.II (Rînd.01)(Col.13) = Cap.I (Rînd.10+30)(Col.4+Col.6)
            var sum010030C4C6 = cap1R010C4.plus(cap1R010C6).plus(cap1R030C4).plus(cap1R030C6);
            if (!cap2R01C13.equals(sum010030C4C6)) {
                errors.push({
                    fieldName: "CAP2_R01_C13",
                    weight: 20,
                    msg: `Cod eroare 49-043: Cap.II Rînd.01 Col.13 trebuie să fie egal cu Cap.1 (Rînd.10+30) (Col.4+Col.6): (${cap2R01C13}) ≠ (${sum010030C4C6}).`,
                });
            }

            /*------------------49-044------------------*/
            // Cap.II (Rînd.01)(Col.14) = Cap.I (Rînd.30)(Col.4+Col.6)
            var sum030C4C6 = cap1R030C4.plus(cap1R030C6);
            if (!cap2R01C14.equals(sum030C4C6)) {
                errors.push({
                    fieldName: "CAP2_R01_C14",
                    weight: 20,
                    msg: `Cod eroare 49-044: Cap.II Rînd.01 Col.14 trebuie să fie egal cu Cap.1 Rînd.30 (Col.4+Col.6): (${cap2R01C14}) ≠ (${sum030C4C6}).`,
                });
            }

            /*------------------49-045------------------*/
            // Cap.II (Rînd.01)(Col.15) = Cap.I (Rînd.10+30)(Col.5+Col.7)
            var sum010030C5C7 = cap1R010C5.plus(cap1R010C7).plus(cap1R030C5).plus(cap1R030C7);
            if (!cap2R01C15.equals(sum010030C5C7)) {
                errors.push({
                    fieldName: "CAP2_R01_C15",
                    weight: 20,
                    msg: `Cod eroare 49-045: Cap.II Rînd.01 Col.15 trebuie să fie egal cu Cap.1 (Rînd.10+30) (Col.5+Col.7): (${cap2R01C15}) ≠ (${sum010030C5C7}).`,
                });
            }

            /*------------------49-046------------------*/
            // Cap.II (Rînd.01)(Col.16) = Cap.I (Rînd.30)(Col.5+Col.7)
            var sum030C5C7 = cap1R030C5.plus(cap1R030C7);
            if (!cap2R01C16.equals(sum030C5C7)) {
                errors.push({
                    fieldName: "CAP2_R01_C16",
                    weight: 20,
                    msg: `Cod eroare 49-046: Cap.II Rînd.01 Col.16 trebuie să fie egal cu Cap.1 Rînd.30 (Col.5+Col.7): (${cap2R01C16}) ≠ (${sum030C5C7}).`,
                });
            }
        })();

        /*------------------Cap.III: reguli 49-047 - 49-050------------------*/
        // Cap.III are rândurile statice R010 (total bursieri), R020 (buget, fără
        // Col.5) și R030 (contract, Col.1-5). Coloanele sunt: 1=Total,
        // 2=de studii, 3=sociale, 4=de merit, 5=pe bază de contract.
        (function () {
            var cap3Rows = ["010", "020", "030"];

            // 49-047: Cap.III (Rînd.010) = Sum (Rînd.020+030) (Col.*)
            // Rînd.020 nu are Col.5 (marcată ✖ în formular), deci acolo se
            // consideră implicit 0.
            [1, 2, 3, 4, 5].forEach(function (c) {
                var r010 = toDecimal(values["CAP3_R010_C" + c]);
                var r020 = toDecimal(values["CAP3_R020_C" + c]);
                var r030 = toDecimal(values["CAP3_R030_C" + c]);
                var sum = r020.plus(r030);

                if (!r010.equals(sum)) {
                    errors.push({
                        fieldName: "CAP3_R010_C" + c,
                        weight: 30,
                        msg: `Cod eroare 49-047: Cap.III Rînd.010 Col.${c} trebuie să fie egal cu suma Rînd.020+030 Col.${c}: (${r010}) ≠ (${sum}).`,
                    });
                }
            });

            // 49-048: Cap.III (Col.1) = Sum (Col.2-5) (Rînd.*)
            // Rînd.020 nu are Col.5, deci acolo suma se face doar pe Col.2-4.
            cap3Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP3_R" + r + "_C1"]);
                var c2 = toDecimal(values["CAP3_R" + r + "_C2"]);
                var c3 = toDecimal(values["CAP3_R" + r + "_C3"]);
                var c4 = toDecimal(values["CAP3_R" + r + "_C4"]);
                var c5 = toDecimal(values["CAP3_R" + r + "_C5"]);
                var sum = c2.plus(c3).plus(c4).plus(c5);

                if (!c1.equals(sum)) {
                    errors.push({
                        fieldName: "CAP3_R" + r + "_C1",
                        weight: 30,
                        msg: `Cod eroare 49-048: Cap.III Rînd.${r} Col.1 trebuie să fie egal cu suma Col.2-5: (${c1}) ≠ (${sum}).`,
                    });
                }
            });

            // 49-049: Cap.III (Rînd.010)(Col.1) ≤ Cap.I (Rînd.50)(Col.12)
            var cap3R010C1 = toDecimal(values["CAP3_R010_C1"]);
            var cap1R50C12 = toDecimal(values["CAP1_R" + totalRow + "_C12"]);
            if (cap3R010C1.greaterThan(cap1R50C12)) {
                errors.push({
                    fieldName: "CAP3_R010_C1",
                    weight: 30,
                    msg: `Cod eroare 49-049: Cap.III Rînd.010 Col.1 trebuie să fie ≤ Cap.1 Rînd.${totalRow} Col.12: (${cap3R010C1}) > (${cap1R50C12}).`,
                });
            }

            // 49-050: Cap.III (Rînd.020)(Col.1) ≤ Cap.I (Rînd.50)(Col.13)
            var cap3R020C1 = toDecimal(values["CAP3_R020_C1"]);
            var cap1R50C13 = toDecimal(values["CAP1_R" + totalRow + "_C13"]);
            if (cap3R020C1.greaterThan(cap1R50C13)) {
                errors.push({
                    fieldName: "CAP3_R020_C1",
                    weight: 30,
                    msg: `Cod eroare 49-050: Cap.III Rînd.020 Col.1 trebuie să fie ≤ Cap.1 Rînd.${totalRow} Col.13: (${cap3R020C1}) > (${cap1R50C13}).`,
                });
            }
        })();

        /*------------------Cap.IV: reguli 49-052 - 49-064------------------*/
        // Cap.IV are rândurile statice R010, R020, R030 (fără rânduri dinamice),
        // coloane 1-9. Rîndurile din regulile 56-64 se referă la R020 și R030
        // (formularul le afișează ca "020"/"030").
        (function () {
            var cap4Rows = ["010", "020", "030"];

            // 49-052: Cap.IV Col.2 ≥ Col.3 (Rînd.*)
            cap4Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP4_R" + r + "_C2"]);
                var c3 = toDecimal(values["CAP4_R" + r + "_C3"]);
                if (c2.lessThan(c3)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C2",
                        weight: 40,
                        msg: `Cod eroare 49-052: Cap.IV Col.2 trebuie să fie ≥ Col.3 la rândul ${r}: (${c2}) < (${c3}).`,
                    });
                }
            });

            // 49-053: Cap.IV Col.2 ≥ Col.4 (Rînd.*)
            cap4Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP4_R" + r + "_C2"]);
                var c4 = toDecimal(values["CAP4_R" + r + "_C4"]);
                if (c2.lessThan(c4)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C2",
                        weight: 40,
                        msg: `Cod eroare 49-053: Cap.IV Col.2 trebuie să fie ≥ Col.4 la rândul ${r}: (${c2}) < (${c4}).`,
                    });
                }
            });

            // 49-054: Cap.IV Col.5 ≥ Col.6 (Rînd.*)
            cap4Rows.forEach(function (r) {
                var c5 = toDecimal(values["CAP4_R" + r + "_C5"]);
                var c6 = toDecimal(values["CAP4_R" + r + "_C6"]);
                if (c5.lessThan(c6)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C5",
                        weight: 40,
                        msg: `Cod eroare 49-054: Cap.IV Col.5 trebuie să fie ≥ Col.6 la rândul ${r}: (${c5}) < (${c6}).`,
                    });
                }
            });

            // 49-055: Cap.IV Col.8 ≥ Col.9 (Rînd.*)
            cap4Rows.forEach(function (r) {
                var c8 = toDecimal(values["CAP4_R" + r + "_C8"]);
                var c9 = toDecimal(values["CAP4_R" + r + "_C9"]);
                if (c8.lessThan(c9)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C8",
                        weight: 40,
                        msg: `Cod eroare 49-055: Cap.IV Col.8 trebuie să fie ≥ Col.9 la rândul ${r}: (${c8}) < (${c9}).`,
                    });
                }
            });

            // 49-056: Cap.IV (Rînd.020) (Col.*) ≥ (Rînd.030) (Col.*)
            for (var c = 1; c <= 9; c++) {
                var r020c = toDecimal(values["CAP4_R020_C" + c]);
                var r030c = toDecimal(values["CAP4_R030_C" + c]);
                if (r020c.lessThan(r030c)) {
                    errors.push({
                        fieldName: "CAP4_R020_C" + c,
                        weight: 40,
                        msg: `Cod eroare 49-056: Cap.IV Rînd.020 Col.${c} trebuie să fie ≥ Rînd.030 Col.${c}: (${r020c}) < (${r030c}).`,
                    });
                }
            }

            var cap4R020C1 = toDecimal(values["CAP4_R020_C1"]);
            var cap4R020C2 = toDecimal(values["CAP4_R020_C2"]);
            var cap4R020C4 = toDecimal(values["CAP4_R020_C4"]);
            var cap4R020C5 = toDecimal(values["CAP4_R020_C5"]);
            var cap4R020C7 = toDecimal(values["CAP4_R020_C7"]);
            var cap4R020C8 = toDecimal(values["CAP4_R020_C8"]);
            var cap4R030C1 = toDecimal(values["CAP4_R030_C1"]);
            var cap4R030C2 = toDecimal(values["CAP4_R030_C2"]);

            var cap1R50C1 = toDecimal(values["CAP1_R" + totalRow + "_C1"]);
            var cap1R50C2 = toDecimal(values["CAP1_R" + totalRow + "_C2"]);
            var cap1R10C1 = toDecimal(values["CAP1_R10_C1"]);
            var cap1R30C1 = toDecimal(values["CAP1_R30_C1"]);
            var cap1R10C2 = toDecimal(values["CAP1_R10_C2"]);
            var cap1R30C2 = toDecimal(values["CAP1_R30_C2"]);
            var cap1R20C1 = toDecimal(values["CAP1_R20_C1"]);
            var cap1R40C1 = toDecimal(values["CAP1_R40_C1"]);

            var cap2R02C5 = toDecimal(values["CAP2_R02_C5"]);
            var cap2R03C5 = toDecimal(values["CAP2_R03_C5"]);

            /*------------------49-057------------------*/
            // Cap.IV (Rînd.020)(Col.1) = Cap.I (Rînd.50)(Col.1)
            if (!cap4R020C1.equals(cap1R50C1)) {
                errors.push({
                    fieldName: "CAP4_R020_C1",
                    weight: 40,
                    msg: `Cod eroare 49-057: Cap.IV Rînd.020 Col.1 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.1: (${cap4R020C1}) ≠ (${cap1R50C1}).`,
                });
            }

            /*------------------49-058------------------*/
            // Cap.IV (Rînd.030)(Col.1) = Cap.I (Rînd.50)(Col.2)
            if (!cap4R030C1.equals(cap1R50C2)) {
                errors.push({
                    fieldName: "CAP4_R030_C1",
                    weight: 40,
                    msg: `Cod eroare 49-058: Cap.IV Rînd.030 Col.1 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.2: (${cap4R030C1}) ≠ (${cap1R50C2}).`,
                });
            }

            /*------------------49-059------------------*/
            // Cap.IV (Rînd.020)(Col.2) = Cap.I (Rînd.10+30)(Col.1)
            var sum1030C1 = cap1R10C1.plus(cap1R30C1);
            if (!cap4R020C2.equals(sum1030C1)) {
                errors.push({
                    fieldName: "CAP4_R020_C2",
                    weight: 40,
                    msg: `Cod eroare 49-059: Cap.IV Rînd.020 Col.2 trebuie să fie egal cu Cap.1 (Rînd.10+30) Col.1: (${cap4R020C2}) ≠ (${sum1030C1}).`,
                });
            }

            /*------------------49-060------------------*/
            // Cap.IV (Rînd.030)(Col.2) = Cap.I (Rînd.10+30)(Col.2)
            var sum1030C2 = cap1R10C2.plus(cap1R30C2);
            if (!cap4R030C2.equals(sum1030C2)) {
                errors.push({
                    fieldName: "CAP4_R030_C2",
                    weight: 40,
                    msg: `Cod eroare 49-060: Cap.IV Rînd.030 Col.2 trebuie să fie egal cu Cap.1 (Rînd.10+30) Col.2: (${cap4R030C2}) ≠ (${sum1030C2}).`,
                });
            }

            // 49-061 / 49-062: duplică exact regulile 49-052 / 49-053 (Col.2≥Col.3
            // și Col.2≥Col.4 pe Rînd.*), reținute ca reguli separate conform listei
            // primite.
            cap4Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP4_R" + r + "_C2"]);
                var c3 = toDecimal(values["CAP4_R" + r + "_C3"]);
                if (c2.lessThan(c3)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C2",
                        weight: 40,
                        msg: `Cod eroare 49-061: Cap.IV Col.2 trebuie să fie ≥ Col.3 la rândul ${r}: (${c2}) < (${c3}).`,
                    });
                }
            });

            cap4Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP4_R" + r + "_C2"]);
                var c4 = toDecimal(values["CAP4_R" + r + "_C4"]);
                if (c2.lessThan(c4)) {
                    errors.push({
                        fieldName: "CAP4_R" + r + "_C2",
                        weight: 40,
                        msg: `Cod eroare 49-062: Cap.IV Col.2 trebuie să fie ≥ Col.4 la rândul ${r}: (${c2}) < (${c4}).`,
                    });
                }
            });

            /*------------------49-063------------------*/
            // Cap.IV (Rînd.020)(Col.4) = Cap.II (Rînd.02+03)(Col.5)
            var sumCap2R02R03C5 = cap2R02C5.plus(cap2R03C5);
            if (!cap4R020C4.equals(sumCap2R02R03C5)) {
                errors.push({
                    fieldName: "CAP4_R020_C4",
                    weight: 40,
                    msg: `Cod eroare 49-063: Cap.IV Rînd.020 Col.4 trebuie să fie egal cu Cap.II (Rînd.02+03) Col.5: (${cap4R020C4}) ≠ (${sumCap2R02R03C5}).`,
                });
            }

            /*------------------49-064------------------*/
            // Cap.IV (Rînd.020)(Col.5+Col.7+Col.8) = Cap.I (Rînd.20+40)(Col.1)
            var sumCap4C5C7C8 = cap4R020C5.plus(cap4R020C7).plus(cap4R020C8);
            var sumCap1R20R40C1 = cap1R20C1.plus(cap1R40C1);
            if (!sumCap4C5C7C8.equals(sumCap1R20R40C1)) {
                errors.push({
                    fieldName: "CAP4_R020_C5",
                    weight: 40,
                    msg: `Cod eroare 49-064: Cap.IV Rînd.020 (Col.5+Col.7+Col.8) trebuie să fie egal cu Cap.1 (Rînd.20+40) Col.1: (${sumCap4C5C7C8}) ≠ (${sumCap1R20R40C1}).`,
                });
            }
        })();

        /*------------------Cap.V + Cap.IV: reguli 49-065 - 49-072------------------*/
        // NOTĂ / IPOTEZE DE IMPLEMENTARE (vă rog confirmați):
        // Cap.V Rînd.010 (Total) și rândurile fixe R042 (română) / R052 (rusă)
        // folosesc o numerotare "decalată" a coloanelor: câmpul _C1 este ocupat
        // de "Codul limbii" (lipsă la R010), iar coloanele din antet 1-4
        // corespund de fapt câmpurilor _C2.._C5. Rândurile dinamice (grila
        // "Adaugă rând", câmpuri _R_CA/_R_CB/_R_C1.._R_C4) NU au acest decalaj:
        // acolo coloana din antet 1-4 corespunde direct _C1.._C4. Presupun de
        // asemenea că valorile rândurilor dinamice ajung în `values["CAP5_R_C1"]`
        // etc. ca array-uri paralele (aceeași convenție ca la array-urile
        // _FILIAL din Cap.I), nefiind încă un pattern testat în acest fișier.
        (function () {
            var cap1R50C12 = toDecimal(values["CAP1_R" + totalRow + "_C12"]);
            var cap1R50C13 = toDecimal(values["CAP1_R" + totalRow + "_C13"]);
            var cap1R50C1 = toDecimal(values["CAP1_R" + totalRow + "_C1"]);
            var cap1R50C2 = toDecimal(values["CAP1_R" + totalRow + "_C2"]);

            var cap5R010C2 = toDecimal(values["CAP5_R010_C2"]);
            var cap5R010C3 = toDecimal(values["CAP5_R010_C3"]);
            var cap5R010C4 = toDecimal(values["CAP5_R010_C4"]);
            var cap5R010C5 = toDecimal(values["CAP5_R010_C5"]);

            /*------------------49-065------------------*/
            // Cap.V (Rînd.010)(Col.1) = Cap.I (Rînd.50)(Col.12)
            if (!cap5R010C2.equals(cap1R50C12)) {
                errors.push({
                    fieldName: "CAP5_R010_C2",
                    weight: 50,
                    msg: `Cod eroare 49-065: Cap.V Rînd.010 Col.1 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.12: (${cap5R010C2}) ≠ (${cap1R50C12}).`,
                });
            }

            /*------------------49-066------------------*/
            // Cap.V (Rînd.010)(Col.2) = Cap.I (Rînd.50)(Col.13)
            if (!cap5R010C3.equals(cap1R50C13)) {
                errors.push({
                    fieldName: "CAP5_R010_C3",
                    weight: 50,
                    msg: `Cod eroare 49-066: Cap.V Rînd.010 Col.2 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.13: (${cap5R010C3}) ≠ (${cap1R50C13}).`,
                });
            }

            /*------------------49-067------------------*/
            // Cap.IV (Rînd.010)(Col.*) ≥ (Rînd.020)(Col.*)
            for (var c = 1; c <= 9; c++) {
                var r010c = toDecimal(values["CAP4_R010_C" + c]);
                var r020c = toDecimal(values["CAP4_R020_C" + c]);
                if (r010c.lessThan(r020c)) {
                    errors.push({
                        fieldName: "CAP4_R010_C" + c,
                        weight: 40,
                        msg: `Cod eroare 49-067: Cap.IV Rînd.010 Col.${c} trebuie să fie ≥ Rînd.020 Col.${c}: (${r010c}) < (${r020c}).`,
                    });
                }
            }

            /*------------------49-162------------------*/
            // Cap.IV (Rînd.010)(Col.*) ≥ (Rînd.030)(Col.*)
            for (var c = 1; c <= 9; c++) {
                var r010c30 = toDecimal(values["CAP4_R010_C" + c]);
                var r030c10 = toDecimal(values["CAP4_R030_C" + c]);
                if (r010c30.lessThan(r030c10)) {
                    errors.push({
                        fieldName: "CAP4_R010_C" + c,
                        weight: 40,
                        msg: `Cod eroare 49-162: Cap.IV Rînd.010 Col.${c} trebuie să fie ≥ Rînd.030 Col.${c}: (${r010c30}) < (${r030c10}).`,
                    });
                }
            }

            /*------------------49-068------------------*/
            // Cap.V (Rînd.010)(Col.4) = Cap.I (Rînd.50)(Col.2)
            if (!cap5R010C5.equals(cap1R50C2)) {
                errors.push({
                    fieldName: "CAP5_R010_C5",
                    weight: 50,
                    msg: `Cod eroare 49-068: Cap.V Rînd.010 Col.4 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.2: (${cap5R010C5}) ≠ (${cap1R50C2}).`,
                });
            }

            /*------------------49-069------------------*/
            // Cap.V (Rînd.010)(Col.3) = Cap.I (Rînd.50)(Col.1)
            if (!cap5R010C4.equals(cap1R50C1)) {
                errors.push({
                    fieldName: "CAP5_R010_C4",
                    weight: 50,
                    msg: `Cod eroare 49-069: Cap.V Rînd.010 Col.3 trebuie să fie egal cu Cap.1 Rînd.${totalRow} Col.1: (${cap5R010C4}) ≠ (${cap1R50C1}).`,
                });
            }

            // Rândurile "cu cod de limbă" (Anexa-6): R042, R052 și rândurile
            // dinamice adăugate de utilizator.
            var cap5R042C2 = toDecimal(values["CAP5_R042_C2"]);
            var cap5R042C3 = toDecimal(values["CAP5_R042_C3"]);
            var cap5R042C4 = toDecimal(values["CAP5_R042_C4"]);
            var cap5R042C5 = toDecimal(values["CAP5_R042_C5"]);
            var cap5R052C2 = toDecimal(values["CAP5_R052_C2"]);
            var cap5R052C3 = toDecimal(values["CAP5_R052_C3"]);
            var cap5R052C4 = toDecimal(values["CAP5_R052_C4"]);
            var cap5R052C5 = toDecimal(values["CAP5_R052_C5"]);

            /*------------------49-070------------------*/
            // Cap.V (Col.1) ≥ (Col.2) (Rînd.*)
            if (cap5R042C2.lessThan(cap5R042C3)) {
                errors.push({
                    fieldName: "CAP5_R042_C2",
                    weight: 50,
                    msg: `Cod eroare 49-070: Cap.V Col.1 trebuie să fie ≥ Col.2 la rândul "română-total": (${cap5R042C2}) < (${cap5R042C3}).`,
                });
            }
            if (cap5R052C2.lessThan(cap5R052C3)) {
                errors.push({
                    fieldName: "CAP5_R052_C2",
                    weight: 50,
                    msg: `Cod eroare 49-070: Cap.V Col.1 trebuie să fie ≥ Col.2 la rândul "rusă-total": (${cap5R052C2}) < (${cap5R052C3}).`,
                });
            }
            if (cap5R010C2.lessThan(cap5R010C3)) {
                errors.push({
                    fieldName: "CAP5_R010_C2",
                    weight: 50,
                    msg: `Cod eroare 49-070: Cap.V Col.1 trebuie să fie ≥ Col.2 la rândul 010 (Total): (${cap5R010C2}) < (${cap5R010C3}).`,
                });
            }
            var dynCB70 = values["CAP5_R_CB"];
            var dynC1_70 = values["CAP5_R_C1"];
            var dynC2_70 = values["CAP5_R_C2"];
            if (dynC1_70 && dynC2_70) {
                for (var i70 = 0; i70 < dynC1_70.length; i70++) {
                    var d1 = toDecimal(dynC1_70[i70]);
                    var d2 = toDecimal(dynC2_70[i70]);
                    if (d1.lessThan(d2)) {
                        errors.push({
                            fieldName: "CAP5_R_C1",
                            weight: 50,
                            index: i70,
                            msg: `Cod eroare 49-070: Cap.V Col.1 trebuie să fie ≥ Col.2 la rândul dinamic ${i70 + 1}${dynCB70 && dynCB70[i70] ? " (cod " + dynCB70[i70] + ")" : ""}: (${d1}) < (${d2}).`,
                        });
                    }
                }
            }

            /*------------------49-071------------------*/
            // Cap.V (Col.3) ≥ (Col.4) (Rînd.*)
            if (cap5R042C4.lessThan(cap5R042C5)) {
                errors.push({
                    fieldName: "CAP5_R042_C4",
                    weight: 50,
                    msg: `Cod eroare 49-071: Cap.V Col.3 trebuie să fie ≥ Col.4 la rândul "română-total": (${cap5R042C4}) < (${cap5R042C5}).`,
                });
            }
            if (cap5R052C4.lessThan(cap5R052C5)) {
                errors.push({
                    fieldName: "CAP5_R052_C4",
                    weight: 50,
                    msg: `Cod eroare 49-071: Cap.V Col.3 trebuie să fie ≥ Col.4 la rândul "rusă-total": (${cap5R052C4}) < (${cap5R052C5}).`,
                });
            }
            if (cap5R010C4.lessThan(cap5R010C5)) {
                errors.push({
                    fieldName: "CAP5_R010_C4",
                    weight: 50,
                    msg: `Cod eroare 49-071: Cap.V Col.3 trebuie să fie ≥ Col.4 la rândul 010 (Total): (${cap5R010C4}) < (${cap5R010C5}).`,
                });
            }
            var dynCB71 = values["CAP5_R_CB"];
            var dynC3_71 = values["CAP5_R_C3"];
            var dynC4_71 = values["CAP5_R_C4"];
            if (dynC3_71 && dynC4_71) {
                for (var i71 = 0; i71 < dynC3_71.length; i71++) {
                    var d3 = toDecimal(dynC3_71[i71]);
                    var d4 = toDecimal(dynC4_71[i71]);
                    if (d3.lessThan(d4)) {
                        errors.push({
                            fieldName: "CAP5_R_C3",
                            weight: 50,
                            index: i71,
                            msg: `Cod eroare 49-071: Cap.V Col.3 trebuie să fie ≥ Col.4 la rândul dinamic ${i71 + 1}${dynCB71 && dynCB71[i71] ? " (cod " + dynCB71[i71] + ")" : ""}: (${d3}) < (${d4}).`,
                        });
                    }
                }
            }

            /*------------------49-072------------------*/
            // Cap.V (Rînd.010) = Sum (Rînd. Codul limbii - Anexa-6) (Col.*)
            [
                { col: 1, staticField: "C2", totalField: "C2" },
                { col: 2, staticField: "C3", totalField: "C3" },
                { col: 3, staticField: "C4", totalField: "C4" },
                { col: 4, staticField: "C5", totalField: "C5" },
            ].forEach(function (map) {
                var sum = toDecimal(values["CAP5_R042_" + map.staticField])
                    .plus(toDecimal(values["CAP5_R052_" + map.staticField]));

                var dynArr = values["CAP5_R_C" + map.col];
                if (dynArr) {
                    for (var i = 0; i < dynArr.length; i++) {
                        sum = sum.plus(toDecimal(dynArr[i]));
                    }
                }

                var total = toDecimal(values["CAP5_R010_" + map.totalField]);
                if (!total.equals(sum)) {
                    errors.push({
                        fieldName: "CAP5_R010_" + map.totalField,
                        weight: 50,
                        msg: `Cod eroare 49-072: Cap.V Rînd.010 Col.${map.col} trebuie să fie egal cu suma rândurilor cu cod de limbă (Anexa-6) Col.${map.col}: (${total}) ≠ (${sum}).`,
                    });
                }
            });
        })();

        /*------------------Cap.VI: reguli 49-074 - 49-085------------------*/
        // Cap.VI are rânduri statice R01-R10 (2 cifre), Col.1-8: Col.1=Total,
        // Col.2-3=componentele lui Total (ex. bărbaţi/femei sau altă pereche),
        // Col.4-8=defalcare pe limbi/alte categorii.
        (function () {
            var cap6Rows = [
                "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
            ];

            // 49-074: Cap.VI (Col.1) = Sum (Col.2+3) (Rînd.*)
            cap6Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP6_R" + r + "_C1"]);
                var c2 = toDecimal(values["CAP6_R" + r + "_C2"]);
                var c3 = toDecimal(values["CAP6_R" + r + "_C3"]);
                var sum = c2.plus(c3);

                if (!c1.equals(sum)) {
                    errors.push({
                        fieldName: "CAP6_R" + r + "_C1",
                        weight: 60,
                        msg: `Cod eroare 49-074: Cap.VI Rînd.${r} Col.1 trebuie să fie egal cu suma Col.2+3: (${c1}) ≠ (${sum}).`,
                    });
                }
            });

            // 49-075: Cap.VI (Col.1) ≥ Cap.VI (Col.*) (Rînd.*)
            cap6Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP6_R" + r + "_C1"]);
                [2, 3, 4, 5, 6, 7, 8].forEach(function (c) {
                    var cc = toDecimal(values["CAP6_R" + r + "_C" + c]);
                    if (c1.lessThan(cc)) {
                        errors.push({
                            fieldName: "CAP6_R" + r + "_C1",
                            weight: 60,
                            msg: `Cod eroare 49-075: Cap.VI Rînd.${r} Col.1 trebuie să fie ≥ Col.${c}: (${c1}) < (${cc}).`,
                        });
                    }
                });
            });

            // 49-084: Cap.VI (Rînd.01) (Col.1) ≤ Cap.V (Rînd.010) (Col.1)
            var cap6R01C1_84 = toDecimal(values["CAP6_R01_C1"]);
            var cap5R010C1_84 = toDecimal(values["CAP5_R010_C2"]);
            if (cap6R01C1_84.greaterThan(cap5R010C1_84)) {
                errors.push({
                    fieldName: "CAP6_R01_C1",
                    weight: 60,
                    msg: `Cod eroare 49-084: Cap.VI Rînd.01 Col.1 trebuie să fie ≤ Cap.V Rînd.010 Col.1: (${cap6R01C1_84}) > (${cap5R010C1_84}).`,
                });
            }

            // 49-085: Cap.VI (Rînd.01) (Col.1) ≤ Cap.I (Rînd.50) (Col.12)
            var cap6R01C1_85 = toDecimal(values["CAP6_R01_C1"]);
            var cap1R50C12_85 = toDecimal(values["CAP1_R50_C12"]);
            if (cap6R01C1_85.greaterThan(cap1R50C12_85)) {
                errors.push({
                    fieldName: "CAP6_R01_C1",
                    weight: 60,
                    msg: `Cod eroare 49-085: Cap.VI Rînd.01 Col.1 trebuie să fie ≤ Cap.I Rînd.50 Col.12: (${cap6R01C1_85}) > (${cap1R50C12_85}).`,
                });
            }
        })();

        /*------------------Cap.VII: reguli 49-076 - 49-086------------------*/
        // Cap.VII are rânduri statice R010-R090 (3 cifre), Col.1-10: Col.1=Total
        // personal de bază, Col.2-7=licenţă/master/doctorat (perechi Total/Femei),
        // Col.8-9=normă întreagă/parţială, Col.10=cumularzi externi.
        (function () {
            var cap7Rows = [
                "010", "020", "030", "040", "050", "060", "070", "080", "090",
            ];

            // 49-076: Cap.VII (Rînd.010) = Sum (Rînd.020+040) (Col.*)
            for (var c76 = 1; c76 <= 10; c76++) {
                var r010_76 = toDecimal(values["CAP7_R010_C" + c76]);
                var r020_76 = toDecimal(values["CAP7_R020_C" + c76]);
                var r040_76 = toDecimal(values["CAP7_R040_C" + c76]);
                var sum76 = r020_76.plus(r040_76);

                if (!r010_76.equals(sum76)) {
                    errors.push({
                        fieldName: "CAP7_R010_C" + c76,
                        weight: 70,
                        msg: `Cod eroare 49-076: Cap.VII Rînd.010 Col.${c76} trebuie să fie egal cu suma Rînd.020+040 Col.${c76}: (${r010_76}) ≠ (${sum76}).`,
                    });
                }
            }

            // 49-077: Cap.VII (Rînd.040) = Sum (Rînd.050+070+080) (Col.*)
            for (var c77 = 1; c77 <= 10; c77++) {
                var r040_77 = toDecimal(values["CAP7_R040_C" + c77]);
                var r050_77 = toDecimal(values["CAP7_R050_C" + c77]);
                var r070_77 = toDecimal(values["CAP7_R070_C" + c77]);
                var r080_77 = toDecimal(values["CAP7_R080_C" + c77]);
                var sum77 = r050_77.plus(r070_77).plus(r080_77);

                if (!r040_77.equals(sum77)) {
                    errors.push({
                        fieldName: "CAP7_R040_C" + c77,
                        weight: 70,
                        msg: `Cod eroare 49-077: Cap.VII Rînd.040 Col.${c77} trebuie să fie egal cu suma Rînd.050+070+080 Col.${c77}: (${r040_77}) ≠ (${sum77}).`,
                    });
                }
            }

            // 49-078: Cap.VII (Rînd.*) (Col.1) ≥ Sum (Col.2+4+6)
            cap7Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP7_R" + r + "_C1"]);
                var c2 = toDecimal(values["CAP7_R" + r + "_C2"]);
                var c4 = toDecimal(values["CAP7_R" + r + "_C4"]);
                var c6 = toDecimal(values["CAP7_R" + r + "_C6"]);
                var sum78 = c2.plus(c4).plus(c6);

                if (c1.lessThan(sum78)) {
                    errors.push({
                        fieldName: "CAP7_R" + r + "_C1",
                        weight: 70,
                        msg: `Cod eroare 49-078: Cap.VII Rînd.${r} Col.1 trebuie să fie ≥ suma Col.2+4+6: (${c1}) < (${sum78}).`,
                    });
                }
            });

            // 49-079: Cap.VII (Col.2) ≥ (Col.3) (Rînd.*)
            cap7Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP7_R" + r + "_C2"]);
                var c3 = toDecimal(values["CAP7_R" + r + "_C3"]);
                if (c2.lessThan(c3)) {
                    errors.push({
                        fieldName: "CAP7_R" + r + "_C2",
                        weight: 70,
                        msg: `Cod eroare 49-079: Cap.VII Rînd.${r} Col.2 trebuie să fie ≥ Col.3: (${c2}) < (${c3}).`,
                    });
                }
            });

            // 49-080: Cap.VII (Col.4) ≥ (Col.5) (Rînd.*)
            cap7Rows.forEach(function (r) {
                var c4 = toDecimal(values["CAP7_R" + r + "_C4"]);
                var c5 = toDecimal(values["CAP7_R" + r + "_C5"]);
                if (c4.lessThan(c5)) {
                    errors.push({
                        fieldName: "CAP7_R" + r + "_C4",
                        weight: 70,
                        msg: `Cod eroare 49-080: Cap.VII Rînd.${r} Col.4 trebuie să fie ≥ Col.5: (${c4}) < (${c5}).`,
                    });
                }
            });

            // 49-081: Cap.VII (Col.6) ≥ (Col.7) (Rînd.*)
            cap7Rows.forEach(function (r) {
                var c6 = toDecimal(values["CAP7_R" + r + "_C6"]);
                var c7 = toDecimal(values["CAP7_R" + r + "_C7"]);
                if (c6.lessThan(c7)) {
                    errors.push({
                        fieldName: "CAP7_R" + r + "_C6",
                        weight: 70,
                        msg: `Cod eroare 49-081: Cap.VII Rînd.${r} Col.6 trebuie să fie ≥ Col.7: (${c6}) < (${c7}).`,
                    });
                }
            });

            // 49-082: Cap.VII (Rînd.020) (Col.*) ≥ (Rînd.030) (Col.*)
            for (var c82 = 1; c82 <= 10; c82++) {
                var r020_82 = toDecimal(values["CAP7_R020_C" + c82]);
                var r030_82 = toDecimal(values["CAP7_R030_C" + c82]);
                if (r020_82.lessThan(r030_82)) {
                    errors.push({
                        fieldName: "CAP7_R020_C" + c82,
                        weight: 70,
                        msg: `Cod eroare 49-082: Cap.VII Rînd.020 Col.${c82} trebuie să fie ≥ Rînd.030 Col.${c82}: (${r020_82}) < (${r030_82}).`,
                    });
                }
            }

            // 49-083: Cap.VII (Rînd.050) (Col.*) ≥ (Rînd.060) (Col.*)
            for (var c83 = 1; c83 <= 10; c83++) {
                var r050_83 = toDecimal(values["CAP7_R050_C" + c83]);
                var r060_83 = toDecimal(values["CAP7_R060_C" + c83]);
                if (r050_83.lessThan(r060_83)) {
                    errors.push({
                        fieldName: "CAP7_R050_C" + c83,
                        weight: 70,
                        msg: `Cod eroare 49-083: Cap.VII Rînd.050 Col.${c83} trebuie să fie ≥ Rînd.030 Col.${c83}: (${r050_83}) < (${r060_83}).`,
                    });
                }
            }

            // 49-086: Cap.VII (Col.1) = Sum (Col.8+9) (Rînd.*)
            cap7Rows.forEach(function (r) {
                var c1_86 = toDecimal(values["CAP7_R" + r + "_C1"]);
                var c8_86 = toDecimal(values["CAP7_R" + r + "_C8"]);
                var c9_86 = toDecimal(values["CAP7_R" + r + "_C9"]);
                var sum86 = c8_86.plus(c9_86);
                if (!c1_86.equals(sum86)) {
                    errors.push({
                        fieldName: "CAP7_R" + r + "_C1",
                        weight: 70,
                        msg: `Cod eroare 49-086: Cap.VII Rînd.${r} Col.1 trebuie să fie egal cu suma Col.8+9: (${c1_86}) ≠ (${sum86}).`,
                    });
                }
            });
        })();

        /*------------------Cap.VIII: reguli 49-090 - 49-121------------------*/
        // Cap.VIII oglindeşte rândurile Cap.VII (R010-R080, aceleaşi etichete,
        // fără R090), dar defalcate pe vârstă: Col.1=Total, Col.2=femei, apoi
        // 10 perechi Total/femei pe grupe de vârstă (Col.3-4=sub 25 ani, ...,
        // Col.21-22=65 ani şi peste).
        (function () {
            var cap8Rows = ["010", "020", "030", "040", "050", "060", "070", "080"];

            // 49-090: Cap.VII (Rînd.010-080) (Col.1) = Cap.VIII (Rînd.010-080) (Col.1), respectiv
            cap8Rows.forEach(function (r) {
                var cap7C1 = toDecimal(values["CAP7_R" + r + "_C1"]);
                var cap8C1 = toDecimal(values["CAP8_R" + r + "_C1"]);
                if (!cap7C1.equals(cap8C1)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C1",
                        weight: 80,
                        msg: `Cod eroare 49-090: Cap.VIII Rînd.${r} Col.1 trebuie să fie egal cu Cap.VII Rînd.${r} Col.1: (${cap8C1}) ≠ (${cap7C1}).`,
                    });
                }
            });

            // 49-091: Cap.VIII (Rînd.010-080) (Col.2) ≥ Cap.VII (Rînd.010-080) (Col.3+5+7), respectiv
            cap8Rows.forEach(function (r) {
                var cap8C2 = toDecimal(values["CAP8_R" + r + "_C2"]);
                var cap7C3 = toDecimal(values["CAP7_R" + r + "_C3"]);
                var cap7C5 = toDecimal(values["CAP7_R" + r + "_C5"]);
                var cap7C7 = toDecimal(values["CAP7_R" + r + "_C7"]);
                var sum91 = cap7C3.plus(cap7C5).plus(cap7C7);
                if (cap8C2.lessThan(sum91)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C2",
                        weight: 80,
                        msg: `Cod eroare 49-091: Cap.VIII Rînd.${r} Col.2 trebuie să fie ≥ Cap.VII Rînd.${r} suma Col.3+5+7: (${cap8C2}) < (${sum91}).`,
                    });
                }
            });

            // 49-094: Cap.VIII (Col.1) ≥ (Col.2) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP8_R" + r + "_C1"]);
                var c2 = toDecimal(values["CAP8_R" + r + "_C2"]);
                if (c1.lessThan(c2)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C1",
                        weight: 80,
                        msg: `Cod eroare 49-094: Cap.VIII Rînd.${r} Col.1 trebuie să fie ≥ Col.2: (${c1}) < (${c2}).`,
                    });
                }
            });

            // 49-095: Cap.VIII (Col.1) = Sum (Col.3+5+7+9+11+13+15+17+19+21) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP8_R" + r + "_C1"]);
                var sum95 = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21].reduce(function (
                    acc,
                    c
                ) {
                    return acc.plus(toDecimal(values["CAP8_R" + r + "_C" + c]));
                },
                    toDecimal(0));
                if (!c1.equals(sum95)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C1",
                        weight: 80,
                        msg: `Cod eroare 49-095: Cap.VIII Rînd.${r} Col.1 trebuie să fie egal cu suma Col.3+5+7+9+11+13+15+17+19+21: (${c1}) ≠ (${sum95}).`,
                    });
                }
            });

            // 49-096: Cap.VIII (Col.2) = Sum (Col.4+6+8+10+12+14+16+18+20+22) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP8_R" + r + "_C2"]);
                var sum96 = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22].reduce(function (
                    acc,
                    c
                ) {
                    return acc.plus(toDecimal(values["CAP8_R" + r + "_C" + c]));
                },
                    toDecimal(0));
                if (!c2.equals(sum96)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C2",
                        weight: 80,
                        msg: `Cod eroare 49-096: Cap.VIII Rînd.${r} Col.2 trebuie să fie egal cu suma Col.4+6+8+10+12+14+16+18+20+22: (${c2}) ≠ (${sum96}).`,
                    });
                }
            });

            // 49-097: Cap.VIII (Rînd.020) ≥ (Rînd.030) (Col.*)
            for (var c97 = 1; c97 <= 22; c97++) {
                var r020_97 = toDecimal(values["CAP8_R020_C" + c97]);
                var r030_97 = toDecimal(values["CAP8_R030_C" + c97]);
                if (r020_97.lessThan(r030_97)) {
                    errors.push({
                        fieldName: "CAP8_R020_C" + c97,
                        weight: 80,
                        msg: `Cod eroare 49-097: Cap.VIII Rînd.020 Col.${c97} trebuie să fie ≥ Rînd.030 Col.${c97}: (${r020_97}) < (${r030_97}).`,
                    });
                }
            }

            // 49-098: Cap.VIII (Rînd.050) ≥ (Rînd.060) (Col.*)
            for (var c98 = 1; c98 <= 22; c98++) {
                var r050_98 = toDecimal(values["CAP8_R050_C" + c98]);
                var r060_98 = toDecimal(values["CAP8_R060_C" + c98]);
                if (r050_98.lessThan(r060_98)) {
                    errors.push({
                        fieldName: "CAP8_R050_C" + c98,
                        weight: 80,
                        msg: `Cod eroare49-098: Cap.VIII Rînd.050 Col.${c98} trebuie să fie ≥ Rînd.060 Col.${c98}: (${r050_98}) < (${r060_98}).`,
                    });
                }
            }

            // 49-099: Cap.VIII (Col.1) ≥ (Col. impare) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP8_R" + r + "_C1"]);
                [3, 5, 7, 9, 11, 13, 15, 17, 19, 21].forEach(function (c) {
                    var cc = toDecimal(values["CAP8_R" + r + "_C" + c]);
                    if (c1.lessThan(cc)) {
                        errors.push({
                            fieldName: "CAP8_R" + r + "_C1",
                            weight: 80,
                            msg: `Cod eroare 49-099: Cap.VIII Rînd.${r} Col.1 trebuie să fie ≥ Col.${c}: (${c1}) < (${cc}).`,
                        });
                    }
                });
            });

            // 49-100: Cap.VIII (Col.2) ≥ (Col. pare) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c2 = toDecimal(values["CAP8_R" + r + "_C2"]);
                [4, 6, 8, 10, 12, 14, 16, 18, 20, 22].forEach(function (c) {
                    var cc = toDecimal(values["CAP8_R" + r + "_C" + c]);
                    if (c2.lessThan(cc)) {
                        errors.push({
                            fieldName: "CAP8_R" + r + "_C2",
                            weight: 80,
                            msg: `Cod eroare 49-100: Cap.VIII Rînd.${r} Col.2 trebuie să fie ≥ Col.${c}: (${c2}) < (${cc}).`,
                        });
                    }
                });
            });

            // 49-112: Cap.VIII (Col.3) ≥ (Col.4) (Rînd.*)
            cap8Rows.forEach(function (r) {
                var c3 = toDecimal(values["CAP8_R" + r + "_C3"]);
                var c4 = toDecimal(values["CAP8_R" + r + "_C4"]);
                if (c3.lessThan(c4)) {
                    errors.push({
                        fieldName: "CAP8_R" + r + "_C3",
                        weight: 80,
                        msg: `Cod eroare 49-112: Cap.VIII Rînd.${r} Col.3 trebuie să fie ≥ Col.4: (${c3}) < (${c4}).`,
                    });
                }
            });

            // NOTE: Cod eroare 49-122 was requested (Cap.VIII Rînd.020 ≥ Rînd.030,
            // toate Col.) but is identical to the existing rule 49-097 above, so it
            // was not duplicated here.

            // 49-113 - 49-121: Cap.VIII (Col.Total) ≥ (Col.femei) (Rînd.*), pe
            // fiecare grupă de vârstă (Col.5-6=25-29, 7-8=30-34, 9-10=35-39,
            // 11-12=40-44, 13-14=45-49, 15-16=50-54, 17-18=55-59, 19-20=60-64,
            // 21-22=65 şi peste).
            [
                { rule: "49-113", total: 5, femei: 6 },
                { rule: "49-114", total: 7, femei: 8 },
                { rule: "49-115", total: 9, femei: 10 },
                { rule: "49-116", total: 11, femei: 12 },
                { rule: "49-117", total: 13, femei: 14 },
                { rule: "49-118", total: 15, femei: 16 },
                { rule: "49-119", total: 17, femei: 18 },
                { rule: "49-120", total: 19, femei: 20 },
                { rule: "49-121", total: 21, femei: 22 },
            ].forEach(function (pair) {
                cap8Rows.forEach(function (r) {
                    var cTotal = toDecimal(values["CAP8_R" + r + "_C" + pair.total]);
                    var cFemei = toDecimal(values["CAP8_R" + r + "_C" + pair.femei]);
                    if (cTotal.lessThan(cFemei)) {
                        errors.push({
                            fieldName: "CAP8_R" + r + "_C" + pair.total,
                            weight: 80,
                            msg: `Cod eroare ${pair.rule}: Cap.VIII Rînd.${r} Col.${pair.total} trebuie să fie ≥ Col.${pair.femei}: (${cTotal}) < (${cFemei}).`,
                        });
                    }
                });
            });
        })();

        /*------------------Cap.IX: regula 49-127------------------*/
        // Cap.IX are un singur rând static R01, Col.1=Total elevi cazaţi,
        // Col.2=inclusiv cazaţi (subset).
        (function () {
            // 49-127: Cap.IX (Rînd.01) (Col.1) ≤ Cap.I (Rînd.050) (Col.12)
            var cap9C1 = toDecimal(values["CAP9_R01_C1"]);
            var cap1C12 = toDecimal(values["CAP1_R50_C12"]);

            if (cap9C1.greaterThan(cap1C12)) {
                errors.push({
                    fieldName: "CAP9_R01_C1",
                    weight: 90,
                    msg: `Cod eroare 49-127: Cap.IX Rînd.01 Col.1 trebuie să fie ≤ Cap.I Rînd.050 Col.12: (${cap9C1}) > (${cap1C12}).`,
                });
            }
        })();

        /*------------------Cap.X: regula 49-129------------------*/
        // Cap.X are un singur rând static R01; Col.1,3,4,5,6 sînt indicatori
        // binari (1=există, 0=nu există); Col.2 este numeric (nr. locuri) şi
        // nu face parte din regulă.
        (function () {
            // 49-129: Cap.X (Rînd.01) Col.1, 3, 4, 5, 6 = 0 sau 1
            [1, 3, 4, 5, 6].forEach(function (c) {
                var val = values["CAP10_R01_C" + c];
                if (val !== "" && val !== null && typeof val !== "undefined") {
                    var num = toDecimal(val);
                    if (!num.equals(0) && !num.equals(1)) {
                        errors.push({
                            fieldName: "CAP10_R01_C" + c,
                            weight: 100,
                            msg: `Cod eroare 49-129: Cap.X Rînd.01 Col.${c} trebuie să fie 0 sau 1: (${num}).`,
                        });
                    }
                }
            });
        })();

        /*------------------Cap.XI: reguli 49-130 - 49-133------------------*/
        // Cap.XI are rânduri statice R010-R070 (3 cifre), Col.1-3: Col.1=Total,
        // Col.2=conectate la reţea, Col.3=conectate la Internet. R070 (WEB
        // site, 0/1) are doar Col.1 completat, restul fiind necompletabile.
        (function () {
            var cap11Rows = ["010", "020", "030", "040", "050", "060"];

            // 49-130: Cap.XI (Rînd.010) = Sum (Rînd.020+060) (Col.*)
            for (var c130 = 1; c130 <= 3; c130++) {
                var r010_130 = toDecimal(values["CAP11_R010_C" + c130]);
                var r020_130 = toDecimal(values["CAP11_R020_C" + c130]);
                var r060_130 = toDecimal(values["CAP11_R060_C" + c130]);
                var sum130 = r020_130.plus(r060_130);

                if (!r010_130.equals(sum130)) {
                    errors.push({
                        fieldName: "CAP11_R010_C" + c130,
                        weight: 110,
                        msg: `Cod eroare 49-130: Cap.XI Rînd.010 Col.${c130} trebuie să fie egal cu suma Rînd.020+060 Col.${c130}: (${r010_130}) ≠ (${sum130}).`,
                    });
                }
            }

            // 49-131: Cap.XI (Rînd.020) = Sum (Rînd.030+040+050) (Col.*)
            for (var c131 = 1; c131 <= 3; c131++) {
                var r020_131 = toDecimal(values["CAP11_R020_C" + c131]);
                var r030_131 = toDecimal(values["CAP11_R030_C" + c131]);
                var r040_131 = toDecimal(values["CAP11_R040_C" + c131]);
                var r050_131 = toDecimal(values["CAP11_R050_C" + c131]);
                var sum131 = r030_131.plus(r040_131).plus(r050_131);

                if (!r020_131.equals(sum131)) {
                    errors.push({
                        fieldName: "CAP11_R020_C" + c131,
                        weight: 110,
                        msg: `Cod eroare 49-131: Cap.XI Rînd.020 Col.${c131} trebuie să fie egal cu suma Rînd.030+040+050 Col.${c131}: (${r020_131}) ≠ (${sum131}).`,
                    });
                }
            }

            // 49-132: Cap.XI (Col.1) ≥ (Col.2) (Rînd.*)
            cap11Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP11_R" + r + "_C1"]);
                var c2 = toDecimal(values["CAP11_R" + r + "_C2"]);
                if (c1.lessThan(c2)) {
                    errors.push({
                        fieldName: "CAP11_R" + r + "_C1",
                        weight: 110,
                        msg: `Cod eroare 49-132: Cap.XI Rînd.${r} Col.1 trebuie să fie ≥ Col.2: (${c1}) < (${c2}).`,
                    });
                }
            });

            // 49-133: Cap.XI (Col.1) ≥ (Col.3) (Rînd.*)
            cap11Rows.forEach(function (r) {
                var c1 = toDecimal(values["CAP11_R" + r + "_C1"]);
                var c3 = toDecimal(values["CAP11_R" + r + "_C3"]);
                if (c1.lessThan(c3)) {
                    errors.push({
                        fieldName: "CAP11_R" + r + "_C1",
                        weight: 110,
                        msg: `Cod eroare 49-133: Cap.XI Rînd.${r} Col.1 trebuie să fie ≥ Col.3: (${c1}) < (${c3}).`,
                    });
                }
            });
        })();
        /*------------------Cap.IX: regula 49-128------------------*/
        (function () {
            // 49-128: Cap.IX (Rînd.01) (Col.1) ≥ (Rînd.01) (Col.2)
            var cap9C1_128 = toDecimal(values["CAP9_R01_C1"]);
            var cap9C2_128 = toDecimal(values["CAP9_R01_C2"]);
            if (cap9C1_128.lessThan(cap9C2_128)) {
                errors.push({
                    fieldName: "CAP9_R01_C1",
                    weight: 90,
                    msg: `Cod eroare 49-128: Cap.IX Rînd.01 Col.1 trebuie să fie ≥ Col.2: (${cap9C1_128}) < (${cap9C2_128}).`,
                });
            }
        })();

        /*------------------Cap.XI: regula 49-134------------------*/
        (function () {
            // 49-134: Cap.XI (Rînd.070) (Col.1) = 0 sau 1
            var val134 = values["CAP11_R070_C1"];
            if (val134 !== "" && val134 !== null && typeof val134 !== "undefined") {
                var num134 = toDecimal(val134);
                if (!num134.equals(0) && !num134.equals(1)) {
                    errors.push({
                        fieldName: "CAP11_R070_C1",
                        weight: 110,
                        msg: `Cod eroare 49-134: Cap.XI Rînd.070 Col.1 trebuie să fie 0 sau 1: (${num134}).`,
                    });
                }
            }
        })();

        /*------------------CFP: reguli 49-138, 49-141, 49-143, 49-146------------------*/
        // CFP este câmpul select "TITLU_R5_C31" (randat în pagină înăuntrul
        // <em id="cfp-value">). Fiind un <select> real, valoarea lui este
        // disponibilă direct în obiectul `values` al webform-ului, la fel ca
        // orice alt câmp CAPx_R..._C... — nu trebuie citită din DOM/textContent
        // (acolo am fi luat textul tuturor <option>-urilor concatenat, nu doar
        // pe cel selectat, ceea ce făcea regulile să nu se declanşeze niciodată).
        (function () {
            function getCFPCode() {
                var raw = values["TITLU_R5_C31"];
                if (typeof raw === "undefined" || raw === null || raw === "") {
                    // Fallback: citim direct valoarea selectată din DOM, în caz că din
                    // vreun motiv câmpul nu ajunge (încă) în `values`.
                    var el =
                        typeof document !== "undefined"
                            ? document.getElementById("TITLU_R5_C31")
                            : null;
                    raw = el ? el.value : null;
                }
                var num = parseInt(raw, 10);
                return isNaN(num) ? null : num;
            }

            var cfp = getCFPCode();
            if (cfp === 16) {
                // 49-138: Cap.I Dacă CFP=16, atunci Col.2, 13, 16 = 0
                [2, 13, 16].forEach(function (c) {
                    var v = toDecimal(values["CAP1_R50_C" + c]);
                    if (!v.equals(0)) {
                        errors.push({
                            fieldName: "CAP1_R50_C" + c,
                            weight: 10,
                            msg: `Cod eroare 49-138: Cap.I - dacă CFP=16, atunci Rînd.50 Col.${c} trebuie să fie 0: (${v}).`,
                        });
                    }
                });

                // 49-141: Cap.III Dacă CFP=16, atunci Rînd.020 (Col.*) = 0
                [1, 2, 3, 4].forEach(function (c) {
                    var v = toDecimal(values["CAP3_R020_C" + c]);
                    if (!v.equals(0)) {
                        errors.push({
                            fieldName: "CAP3_R020_C" + c,
                            weight: 30,
                            msg: `Cod eroare 49-141: Cap.III - dacă CFP=16, atunci Rînd.020 Col.${c} trebuie să fie 0: (${v}).`,
                        });
                    }
                });

                // 49-143: Cap.IV Dacă CFP=16, atunci Rînd.030 (Col.*) = 0
                for (var c143 = 1; c143 <= 9; c143++) {
                    var v143 = toDecimal(values["CAP4_R030_C" + c143]);
                    if (!v143.equals(0)) {
                        errors.push({
                            fieldName: "CAP4_R030_C" + c143,
                            weight: 40,
                            msg: `Cod eroare 49-143: Cap.IV - dacă CFP=16, atunci Rînd.030 Col.${c143} trebuie să fie 0: (${v143}).`,
                        });
                    }
                }

                // 49-146: Cap.V Dacă CFP=16, atunci Col.2, 4 (Rînd.*) = 0
                // (Cap.V foloseşte coloane deplasate: Col.2 header = _C3, Col.4 header = _C5,
                // vezi regulile 49-144/49-145 de mai jos pentru acelaşi decalaj.)
                ["042", "052", "999", "010"].forEach(function (r146) {
                    [3, 5].forEach(function (c146) {
                        var v146 = toDecimal(values["CAP5_R" + r146 + "_C" + c146]);
                        if (!v146.equals(0)) {
                            errors.push({
                                fieldName: "CAP5_R" + r146 + "_C" + c146,
                                weight: 50,
                                msg: `Cod eroare 49-146: Cap.V - dacă CFP=16, atunci Rînd.${r146} Col.${c146 - 1} trebuie să fie 0: (${v146}).`,
                            });
                        }
                    });
                });
            }
        })();

        /*------------------Cap.II vs Cap.IV: reguli 49-139, 49-140------------------*/
        (function () {
            // 49-139: Cap.II (Rînd.02+03) (Col.5) = Cap.IV (Rînd.020) (Col.4)
            var cap2R02C5_139 = toDecimal(values["CAP2_R02_C5"]);
            var cap2R03C5_139 = toDecimal(values["CAP2_R03_C5"]);
            var sum139 = cap2R02C5_139.plus(cap2R03C5_139);
            var cap4R020C4_139 = toDecimal(values["CAP4_R020_C4"]);
            if (!sum139.equals(cap4R020C4_139)) {
                errors.push({
                    fieldName: "CAP2_R02_C5",
                    weight: 20,
                    msg: `Cod eroare 49-139: Cap.II (Rînd.02+03) Col.5 trebuie să fie egal cu Cap.IV Rînd.020 Col.4: (${sum139}) ≠ (${cap4R020C4_139}).`,
                });
            }

            // 49-140: Cap.II (Rînd.01) (Col.5) = Cap.IV (Rînd.020) (Col.1)
            var cap2R01C5_140 = toDecimal(values["CAP2_R01_C5"]);
            var cap4R020C1_140 = toDecimal(values["CAP4_R020_C1"]);
            if (!cap2R01C5_140.equals(cap4R020C1_140)) {
                errors.push({
                    fieldName: "CAP2_R01_C5",
                    weight: 20,
                    msg: `Cod eroare 49-140: Cap.II Rînd.01 Col.5 trebuie să fie egal cu Cap.IV Rînd.020 Col.1: (${cap2R01C5_140}) ≠ (${cap4R020C1_140}).`,
                });
            }
        })();

        /*------------------Cap.IV vs Cap.I: regula 49-142------------------*/
        (function () {
            // 49-142: Cap.IV (Rînd.030) (Col.5+7+8) = Cap.I (Rînd.20+40) (Col.2)
            var cap4R030C5_142 = toDecimal(values["CAP4_R030_C5"]);
            var cap4R030C7_142 = toDecimal(values["CAP4_R030_C7"]);
            var cap4R030C8_142 = toDecimal(values["CAP4_R030_C8"]);
            var sum142a = cap4R030C5_142.plus(cap4R030C7_142).plus(cap4R030C8_142);

            var cap1R20C2_142 = toDecimal(values["CAP1_R20_C2"]);
            var cap1R40C2_142 = toDecimal(values["CAP1_R40_C2"]);
            var sum142b = cap1R20C2_142.plus(cap1R40C2_142);

            if (!sum142a.equals(sum142b)) {
                errors.push({
                    fieldName: "CAP4_R030_C5",
                    weight: 40,
                    msg: `Cod eroare 49-142: Cap.IV Rînd.030 (Col.5+7+8) trebuie să fie egal cu Cap.I (Rînd.20+40) Col.2: (${sum142a}) ≠ (${sum142b}).`,
                });
            }
        })();

        /*------------------Cap.V vs Cap.II: reguli 49-144, 49-145------------------*/
        (function () {
            // 49-144: Cap.V (Rînd.010) (Col.3) = Cap.II (Rînd.01) (Col.5)
            // (Cap.V Rînd.010 foloseşte coloane deplasate: Col.3 header = _C4)
            var cap5R010C3_144 = toDecimal(values["CAP5_R010_C4"]);
            var cap2R01C5_144 = toDecimal(values["CAP2_R01_C5"]);
            if (!cap5R010C3_144.equals(cap2R01C5_144)) {
                errors.push({
                    fieldName: "CAP5_R010_C4",
                    weight: 50,
                    msg: `Cod eroare 49-144: Cap.V Rînd.010 Col.3 trebuie să fie egal cu Cap.II Rînd.01 Col.5: (${cap5R010C3_144}) ≠ (${cap2R01C5_144}).`,
                });
            }

            // 49-145: Cap.V (Rînd.010) (Col.1) = Cap.II (Rînd.01) (Col.9)
            // (Cap.V Rînd.010 foloseşte coloane deplasate: Col.1 header = _C2)
            var cap5R010C1_145 = toDecimal(values["CAP5_R010_C2"]);
            var cap2R01C9_145 = toDecimal(values["CAP2_R01_C9"]);
            if (!cap5R010C1_145.equals(cap2R01C9_145)) {
                errors.push({
                    fieldName: "CAP5_R010_C2",
                    weight: 50,
                    msg: `Cod eroare 49-145: Cap.V Rînd.010 Col.1 trebuie să fie egal cu Cap.II Rînd.01 Col.9: (${cap5R010C1_145}) ≠ (${cap2R01C9_145}).`,
                });
            }
        })();
        /*------------------Cap.II: reguli 49-147, 49-148------------------*/
        // 147: Col.9-Col.13 ≥ Col.11-Col.15 pe rînd. (01-18)
        // 148: Col.10-Col.14 ≥ Col.12-Col.16 pe rînd. (01-18)
        (function () {
            cap2Rows.forEach(function (r) {
                var c9_147 = toDecimal(values["CAP2_R" + r + "_C9"]);
                var c13_147 = toDecimal(values["CAP2_R" + r + "_C13"]);
                var c11_147 = toDecimal(values["CAP2_R" + r + "_C11"]);
                var c15_147 = toDecimal(values["CAP2_R" + r + "_C15"]);
                var diff147a = c9_147.minus(c13_147);
                var diff147b = c11_147.minus(c15_147);
                if (diff147a.lessThan(diff147b)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C9",
                        weight: 20,
                        msg: `Cod eroare 49-147: Cap.II (Col.9-Col.13) trebuie să fie ≥ (Col.11-Col.15) la rândul ${r}: (${diff147a}) < (${diff147b}).`,
                    });
                }

                var c10_148 = toDecimal(values["CAP2_R" + r + "_C10"]);
                var c14_148 = toDecimal(values["CAP2_R" + r + "_C14"]);
                var c12_148 = toDecimal(values["CAP2_R" + r + "_C12"]);
                var c16_148 = toDecimal(values["CAP2_R" + r + "_C16"]);
                var diff148a = c10_148.minus(c14_148);
                var diff148b = c12_148.minus(c16_148);
                if (diff148a.lessThan(diff148b)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C10",
                        weight: 20,
                        msg: `Cod eroare 49-148: Cap.II (Col.10-Col.14) trebuie să fie ≥ (Col.12-Col.16) la rândul ${r}: (${diff148a}) < (${diff148b}).`,
                    });
                }
            });
        })();

        /*------------------Cap.II: reguli 49-149 - 49-153------------------*/
        // Comparaţii suplimentare Col.mai mare ≥ Col.mai mică (una sau mai multe
        // coloane ţintă per coloană de bază), pe toate rândurile statice 01-18.
        (function () {
            var cap2ExtraPairs = [
                { base: 1, targets: [2, 3, 4], rule: 149 },
                { base: 2, targets: [4], rule: 150 },
                { base: 5, targets: [6, 7, 8], rule: 151 },
                { base: 6, targets: [8], rule: 152 },
                { base: 9, targets: [10, 11, 12], rule: 153 },
            ];

            cap2ExtraPairs.forEach(function (pair) {
                cap2Rows.forEach(function (r) {
                    var baseVal = toDecimal(values["CAP2_R" + r + "_C" + pair.base]);
                    pair.targets.forEach(function (t) {
                        var targetVal = toDecimal(values["CAP2_R" + r + "_C" + t]);
                        if (baseVal.lessThan(targetVal)) {
                            errors.push({
                                fieldName: "CAP2_R" + r + "_C" + pair.base,
                                weight: 20,
                                msg: `Cod eroare 49-${pair.rule}: Cap.II Col.${pair.base} trebuie să fie ≥ Col.${t} la rândul ${r}: (${baseVal}) < (${targetVal}).`,
                            });
                        }
                    });
                });
            });
        })();
        /*------------------Cap.II: reguli 49-154 - 49-160------------------*/
        (function () {

            // 49-154: Cap.II (Col.10) ≥ (Col.12) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c10 = toDecimal(values["CAP2_R" + r + "_C10"]);
                var c12 = toDecimal(values["CAP2_R" + r + "_C12"]);

                if (c10.lessThan(c12)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C10",
                        weight: 20,
                        msg: `Cod eroare 49-154: Cap.II Col.10 trebuie să fie ≥ Col.12 la rândul ${r}: (${c10}) < (${c12}).`,
                    });
                }
            });

            // 49-155: Cap.II (Col.13) ≥ (Col.14, Col.15, Col.16) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c13 = toDecimal(values["CAP2_R" + r + "_C13"]);

                [14, 15, 16].forEach(function (c) {
                    var target = toDecimal(values["CAP2_R" + r + "_C" + c]);

                    if (c13.lessThan(target)) {
                        errors.push({
                            fieldName: "CAP2_R" + r + "_C13",
                            weight: 20,
                            msg: `Cod eroare 49-155: Cap.II Col.13 trebuie să fie ≥ Col.${c} la rândul ${r}: (${c13}) < (${target}).`,
                        });
                    }
                });
            });

            // 49-156: Cap.II (Col.14) ≥ (Col.16) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c14 = toDecimal(values["CAP2_R" + r + "_C14"]);
                var c16 = toDecimal(values["CAP2_R" + r + "_C16"]);

                if (c14.lessThan(c16)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C14",
                        weight: 20,
                        msg: `Cod eroare 49-156: Cap.II Col.14 trebuie să fie ≥ Col.16 la rândul ${r}: (${c14}) < (${c16}).`,
                    });
                }
            });

            // 49-157: Cap.II (Col.10) ≥ (Col.14) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c10 = toDecimal(values["CAP2_R" + r + "_C10"]);
                var c14 = toDecimal(values["CAP2_R" + r + "_C14"]);

                if (c10.lessThan(c14)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C10",
                        weight: 20,
                        msg: `Cod eroare 49-157: Cap.II Col.10 trebuie să fie ≥ Col.14 la rândul ${r}: (${c10}) < (${c14}).`,
                    });
                }
            });

            // 49-158: Cap.II (Col.12) ≥ (Col.16) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c12 = toDecimal(values["CAP2_R" + r + "_C12"]);
                var c16 = toDecimal(values["CAP2_R" + r + "_C16"]);

                if (c12.lessThan(c16)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C12",
                        weight: 20,
                        msg: `Cod eroare 49-158: Cap.II Col.12 trebuie să fie ≥ Col.16 la rândul ${r}: (${c12}) < (${c16}).`,
                    });
                }
            });

            // 49-159: Cap.II (Col.9 - Col.11) ≥ (Col.13 - Col.15) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c9 = toDecimal(values["CAP2_R" + r + "_C9"]);
                var c11 = toDecimal(values["CAP2_R" + r + "_C11"]);
                var c13 = toDecimal(values["CAP2_R" + r + "_C13"]);
                var c15 = toDecimal(values["CAP2_R" + r + "_C15"]);

                var left = c9.minus(c11);
                var right = c13.minus(c15);

                if (left.lessThan(right)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C9",
                        weight: 20,
                        msg: `Cod eroare 49-159: Cap.II (Col.9-Col.11) trebuie să fie ≥ (Col.13-Col.15) la rândul ${r}: (${left}) < (${right}).`,
                    });
                }
            });

            // 49-160: Cap.II (Col.10 - Col.12) ≥ (Col.14 - Col.16) (Rînd.*)
            cap2Rows.forEach(function (r) {
                var c10 = toDecimal(values["CAP2_R" + r + "_C10"]);
                var c12 = toDecimal(values["CAP2_R" + r + "_C12"]);
                var c14 = toDecimal(values["CAP2_R" + r + "_C14"]);
                var c16 = toDecimal(values["CAP2_R" + r + "_C16"]);

                var left = c10.minus(c12);
                var right = c14.minus(c16);

                if (left.lessThan(right)) {
                    errors.push({
                        fieldName: "CAP2_R" + r + "_C10",
                        weight: 20,
                        msg: `Cod eroare 49-160: Cap.II (Col.10-Col.12) trebuie să fie ≥ (Col.14-Col.16) la rândul ${r}: (${left}) < (${right}).`,
                    });
                }
            });

        })();
        /*==================== END ====================*/
        webform.validatorsStatus["edu49cap1"] = 1;
        validateWebform();
    };

})(jQuery);

function changeId(elem) {
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
            return /_CB$/.test(f); // Se asigură că targetează field-ul CAP4_R_CA
        })
        .first();

    // 5. Fallback (în caz că nu e găsit după "field", căutăm după "id")
    if (!$col1.length) {
        $col1 = $row
            .find("input[id]")
            .filter(function () {
                var id = (this.id || "").trim();
                return /_CB/.test(id);
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
            return /_CB$/.test(f);
        })
        .first();

    if (!$col1.length) {
        $col1 = $row
            .find("input[id]")
            .filter(function () {
                var id = (this.id || "").trim();
                return /_CB/.test(id);
            })
            .first();
    }

    // Guard 1: never act on the element that triggered us in the first place
    if (!$col1.length || $col1.get(0) === elem) {
        return;
    }

    // Guard 2: only write + trigger change when the value actually changes,
    // so a re-entrant call from $col1's own "change" handler becomes a no-op
    if ($col1.val() !== selectedCode) {
        $col1.val(selectedCode).trigger("change");
    }
}