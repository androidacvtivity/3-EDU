 -- Corected SQL 

--INSERT INTO CIS2.MD_RIND (
--    ID_MD,
--    FORM,
--    FORM_VERS,
--    CAPITOL,
--    CAPITOL_VERS,
--    RIND,
--    RIND_VERS,
--    DENUMIRE,
--    DECIMAL_POS,
--    COL_ACTIV,
--    ORDINE,
--    DATA_REG,
--    STATUT,
--    DINAMIC
--)

SELECT
    ID_MD,
    50 FORM,
    2000 FORM_VERS,
    1058 CAPITOL,
    2015 CAPITOL_VERS,
    RIND,
    2015 RIND_VERS,
    DENUMIRE,
    '00000000000000000' DECIMAL_POS,
    '11111111111111111' COL_ACTIV,
    7000 + ROWNUM ORDINE,
    SYSDATE DATA_REG,
    '1' STATUT,
    '1' DINAMIC
FROM MD_RIND;
                        
                          