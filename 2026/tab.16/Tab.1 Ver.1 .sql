-- https://github.com/androidacvtivity/ASA_26/tree/main
-- trebuie da adaugat o conditia - gruparile raman cum sunt 

---- vezi in repozitoriu - dupa caem2 actualizat - aici trebuie da adaugat sa partcipe 
---- cuiio care au caem 2 actualizat 
---- din aceasta lista 
----WHERE 
--                
--                
--(
--                CODUL LIKE 'C%'
--                OR CODUL LIKE 'B%'
--                OR CODUL LIKE 'D%'
--                OR CODUL LIKE 'E%'
--                OR CODUL LIKE 'F%'
--                OR CODUL LIKE 'G%'
--                OR CODUL LIKE 'H%'
--                OR CODUL LIKE 'I%'
--               -- OR CODUL LIKE 'K%'
--                OR CODUL LIKE 'J%'
--                OR CODUL LIKE 'L%'
--                OR CODUL LIKE 'M%'
--             --   OR CODUL LIKE 'Q%'
--              --  OR CODUL LIKE 'P%'
--                OR CODUL LIKE 'N%'
--               -- OR CODUL LIKE 'R%'
--                OR CODUL LIKE 'S%'
--                )
--                
--                AND 
--                
--                SUBSTR(CODUL,1,3) NOT IN ('S94','K65')
--               -- AND 
--              --  CODUL NOT IN ('K6419','K6411')
--                
                
                
--    ) C ON SUBSTR(C.CODUL,2,4)  = DD.CAEM_FINAL

INSERT INTO CIS2.TABLE_OUT
(
    PERIOADA, FORM, FORM_VERS, ID_MDTABLE, COD_CUATM,
    NR_SECTIE, NUME_SECTIE, NR_SECTIE1, NUME_SECTIE1,
    NR_SECTIE2, NUME_SECTIE2, NR_ROW, ORDINE, DECIMAL_POS, NUME_ROW,
    COL1, COL2, COL3, COL4, COL5, COL6
)
WITH SALARIATI AS (
    SELECT DD.CUIIO, DD.FORM, DD.PERIOADA,
           MAX(CIS2.NVAL(DD.COL4)) AS PERS
    FROM CIS2.DATA_ALL DD
    WHERE DD.ID_MD = 69986
      AND DD.FORM = :pFORM
      AND DD.PERIOADA = :pPERIOADA
    GROUP BY DD.CUIIO, DD.FORM, DD.PERIOADA
),
PRIM AS (
    
    SELECT
        D.CUIIO,
        TRIM(TO_CHAR(D.CFP)) AS CFP,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '100' THEN CIS2.NVAL(D.COL1) END) AS R100_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '110' THEN CIS2.NVAL(D.COL1) END) AS R110_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '111' THEN CIS2.NVAL(D.COL1) END) AS R111_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '112' THEN CIS2.NVAL(D.COL1) END) AS R112_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '120' THEN CIS2.NVAL(D.COL1) END) AS R120_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '121' THEN CIS2.NVAL(D.COL1) END) AS R121_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '122' THEN CIS2.NVAL(D.COL1) END) AS R122_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '130' THEN CIS2.NVAL(D.COL1) END) AS R130_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '140' THEN CIS2.NVAL(D.COL1) END) AS R140_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '150' THEN CIS2.NVAL(D.COL1) END) AS R150_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '151' THEN CIS2.NVAL(D.COL1) END) AS R151_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '160' THEN CIS2.NVAL(D.COL1) END) AS R160_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '170' THEN CIS2.NVAL(D.COL1) END) AS R170_C1,
        SUM(CASE WHEN D.CAPITOL = 1124 AND D.RIND = '180' THEN CIS2.NVAL(D.COL1) END) AS R180_C1,
        SUM(CASE WHEN D.CAPITOL = 1125 AND D.RIND = '200' THEN CIS2.NVAL(D.COL1) END) AS R200_C1,
        SUM(CASE WHEN D.CAPITOL = 1125 AND D.RIND = '220' THEN CIS2.NVAL(D.COL1) END) AS R220_C1,
        SUM(CASE WHEN D.CAPITOL = 1125 AND D.RIND = '240' THEN CIS2.NVAL(D.COL1) END) AS R240_C1,
        SUM(CASE WHEN D.CAPITOL = 1125 AND D.RIND = '290' THEN CIS2.NVAL(D.COL1) END) AS R290_C1,
        SUM(CASE WHEN D.CAPITOL = 1125 AND D.RIND = '294' THEN CIS2.NVAL(D.COL1) END) AS R294_C1,
        SUM(CASE WHEN D.CAPITOL = 1126 AND D.RIND = '330' THEN CIS2.NVAL(D.COL1) END) AS R330_C1,
        SUM(CASE WHEN D.CAPITOL = 1126 AND D.RIND = '330' THEN CIS2.NVAL(D.COL2) END) AS R330_C2,
        SUM(CASE WHEN D.CAPITOL = 1126 AND D.RIND = '340' THEN CIS2.NVAL(D.COL1) END) AS R340_C1,
        SUM(CASE WHEN D.CAPITOL = 1126 AND D.RIND = '340' THEN CIS2.NVAL(D.COL2) END) AS R340_C2,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '500' THEN CIS2.NVAL(D.COL8) END) AS R500_C1,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '500' THEN CIS2.NVAL(D.COL9) END) AS R500_C2,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '500' THEN CIS2.NVAL(D.COL10) END) AS R500_C3,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '510' THEN CIS2.NVAL(D.COL8) END) AS R510_C1,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '510' THEN CIS2.NVAL(D.COL9) END) AS R510_C2,
        SUM(CASE WHEN D.CAPITOL = 1128 AND D.RIND = '510' THEN CIS2.NVAL(D.COL10) END) AS R510_C3
    FROM CIS2.VW_DATA_ALL D
    INNER JOIN CIS2.RENIM R
        ON R.CUIIO = D.CUIIO
       AND R.CUIIO_VERS = D.CUIIO_VERS
    WHERE D.FORM IN (:pFORM)
      AND D.FORM_VERS = :pFORM_VERS
      AND D.PERIOADA = :pPERIOADA
      AND D.CAPITOL IN (100, 1123, 1124, 1125, 1126, 1127, 1128, 1129)
      -- Acestea sunt singurele randuri care contribuie la HAVING sau valori.
      AND (
           D.ID_MD IN (62382, 114171, 62413)
        OR (D.CAPITOL = 1124 AND D.RIND IN ('100','110','111','112','120','121','122','130','140','150','151','160','170','180'))
        OR (D.CAPITOL = 1125 AND D.RIND IN ('200','220','240','290','294'))
        OR (D.CAPITOL = 1126 AND D.RIND IN ('330','340'))
        OR (D.CAPITOL = 1128 AND D.RIND IN ('500','510'))
      )
    GROUP BY D.CUIIO, D.CFP, D.CFOJ
    HAVING (
           SUM(CASE WHEN D.ID_MD = 62382 AND D.COL1 IS NOT NULL
                    THEN D.COL1 ELSE 0 END) = 1
        OR SUM(CASE WHEN D.ID_MD IN (114171, 62413) AND D.COL1 IS NOT NULL
                    THEN D.COL1 ELSE 0 END) > 0
    )
    
    
    
    
),
CALC_VP AS (
    SELECT P.*,
           ROUND(NVL(S.PERS, 0), 0) AS PERS, -- numar de salaria?i rotunjit; lipsa / NULL = 0
           NVL(P.R150_C1, 0) + NVL(P.R160_C1, 0) + NVL(P.R170_C1, 0)
           - NVL(P.R200_C1, 0)
           + NVL(P.R330_C2, 0) - NVL(P.R330_C1, 0)
           + NVL(P.R340_C2, 0) - NVL(P.R340_C1, 0) AS R600
    FROM PRIM P
    LEFT JOIN SALARIATI S
        ON S.CUIIO = P.CUIIO
       AND S.FORM = :pFORM
       AND S.PERIOADA = :pPERIOADA
),
CALC AS (
    SELECT P.*,
           P.R600 - NVL(P.R220_C1, 0) - NVL(P.R240_C1, 0)
           - NVL(P.R290_C1, 0) + NVL(P.R294_C1, 0)
           + NVL(P.R180_C1, 0) AS R700
    FROM CALC_VP P
),
SECTII AS (
    SELECT '01' AS NR_SECTIE, 'Întreprinderile cu numarul de salariati 0-9 persoane' AS NUME_SECTIE, 0 AS PERS_FROM, 9 AS PERS_TO FROM DUAL
    UNION ALL SELECT '02', 'Întreprinderile cu numarul de salariati 0-49 persoane', 0, 49 FROM DUAL
    UNION ALL SELECT '03', 'Întreprinderile cu numarul de salariati 0-249 persoane', 0, 249 FROM DUAL
    UNION ALL SELECT '04', 'Întreprinderile cu numarul de salariati 250 si mai mult persoane', 250, 99999999 FROM DUAL
    UNION ALL SELECT '05', 'Total republica Moldova', 0, 99999999 FROM DUAL
),
INDICATORI AS (
    SELECT 1 AS ORD, '600' AS COD, '1' AS NR_COL, 'Valoarea productiei: VP' AS NUME_ROW FROM DUAL
    UNION ALL SELECT 2, '700', '1', 'Valoarea adaugata bruta la costul factorilor: VAFC' FROM DUAL
    UNION ALL SELECT 3, '100', '1', 'Venituri din vânzarea produselor' FROM DUAL
    UNION ALL SELECT 4, '110', '1', 'Venituri din vânzarea marfurilor' FROM DUAL
    UNION ALL SELECT 5, '111', '1', 'inclusiv: cu amanuntul' FROM DUAL
    UNION ALL SELECT 6, '112', '1', 'cu ridicata' FROM DUAL
    UNION ALL SELECT 7, '121', '1', 'inclusiv: prestate întreprinderilor' FROM DUAL
    UNION ALL SELECT 8, '122', '1', 'prestate populatiei' FROM DUAL
    UNION ALL SELECT 9, '130', '1', 'Venituri din contracte de constructii' FROM DUAL
    UNION ALL SELECT 10, '140', '1', 'Venituri din contracte de leasing operational si financiar (arenda, locatiune)' FROM DUAL
    UNION ALL SELECT 11, '150', '1', 'Cifra de afaceri (venitul din vânzari), fara TVA si accize – total (rd.100+110+120+130+140)' FROM DUAL
    UNION ALL SELECT 12, '151', '1', 'din rd. 150: Venituri din vânzarea apartamentelor noi si caselor particulare noi populatiei' FROM DUAL
    UNION ALL SELECT 13, '160', '1', 'Alte venituri din activitatea operationala' FROM DUAL
    UNION ALL SELECT 14, '180', '1', 'Subventii - total' FROM DUAL
    UNION ALL SELECT 15, '500', '1', 'TOTAL' FROM DUAL
    UNION ALL SELECT 16, '500', '2', 'TOTAL' FROM DUAL
    UNION ALL SELECT 17, '500', '3', 'TOTAL' FROM DUAL
    UNION ALL SELECT 18, '510', '1', 'Sediul Central' FROM DUAL
    UNION ALL SELECT 19, '510', '2', 'Sediul Central' FROM DUAL
    UNION ALL SELECT 20, '510', '3', 'Sediul Central' FROM DUAL
),
PE_SECTII_CFP AS (
    SELECT S.NR_SECTIE, S.NUME_SECTIE, D.CFP,
        SUM(D.R600) AS R600,
        SUM(D.R700) AS R700,
        SUM(D.R100_C1) AS R100_C1,
        SUM(D.R110_C1) AS R110_C1,
        SUM(D.R111_C1) AS R111_C1,
        SUM(D.R112_C1) AS R112_C1,
        SUM(D.R121_C1) AS R121_C1,
        SUM(D.R122_C1) AS R122_C1,
        SUM(D.R130_C1) AS R130_C1,
        SUM(D.R140_C1) AS R140_C1,
        SUM(D.R150_C1) AS R150_C1,
        SUM(D.R151_C1) AS R151_C1,
        SUM(D.R160_C1) AS R160_C1,
        SUM(D.R180_C1) AS R180_C1,
        SUM(D.R500_C1) AS R500_C1,
        SUM(D.R500_C2) AS R500_C2,
        SUM(D.R500_C3) AS R500_C3,
        SUM(D.R510_C1) AS R510_C1,
        SUM(D.R510_C2) AS R510_C2,
        SUM(D.R510_C3) AS R510_C3
    FROM CALC D
    CROSS JOIN SECTII S
    WHERE S.NR_SECTIE = '05'
       OR D.PERS BETWEEN S.PERS_FROM AND S.PERS_TO
    GROUP BY S.NR_SECTIE, S.NUME_SECTIE, D.CFP
),
DATE_PE_RANDURI AS (
    SELECT S.NR_SECTIE, S.NUME_SECTIE, I.ORD, I.COD, I.NR_COL,
           I.NUME_ROW, G.CFP,
           CASE I.COD || '.' || I.NR_COL
            WHEN '600.1' THEN G.R600
            WHEN '700.1' THEN G.R700
            WHEN '100.1' THEN G.R100_C1
            WHEN '110.1' THEN G.R110_C1
            WHEN '111.1' THEN G.R111_C1
            WHEN '112.1' THEN G.R112_C1
            WHEN '121.1' THEN G.R121_C1
            WHEN '122.1' THEN G.R122_C1
            WHEN '130.1' THEN G.R130_C1
            WHEN '140.1' THEN G.R140_C1
            WHEN '150.1' THEN G.R150_C1
            WHEN '151.1' THEN G.R151_C1
            WHEN '160.1' THEN G.R160_C1
            WHEN '180.1' THEN G.R180_C1
            WHEN '500.1' THEN G.R500_C1
            WHEN '500.2' THEN G.R500_C2
            WHEN '500.3' THEN G.R500_C3
            WHEN '510.1' THEN G.R510_C1
            WHEN '510.2' THEN G.R510_C2
            WHEN '510.3' THEN G.R510_C3
           END AS VALOARE
    FROM SECTII S
    CROSS JOIN INDICATORI I
    LEFT JOIN PE_SECTII_CFP G ON G.NR_SECTIE = S.NR_SECTIE
)
SELECT
    :pPERIOADA AS PERIOADA,
    :pFORM AS FORM,
    :pFORM_VERS AS FORM_VERS,
    :pID_MDTABLE AS ID_MDTABLE,
    :pCOD_CUATM AS COD_CUATM,
    X.NR_SECTIE AS NR_SECTIE,
    X.NUME_SECTIE AS NUME_SECTIE,
    '0' AS NR_SECTIE1,
    '0' AS NUME_SECTIE1,
    '0' AS NR_SECTIE2,
    '0' AS NUME_SECTIE2,
    CASE WHEN X.COD IN ('600','700')
         THEN X.COD || '.' || X.NR_SECTIE
         ELSE X.COD || ', Col.' || X.NR_COL || '~' || X.NR_SECTIE || '.' || X.NR_COL END AS NR_ROW,
    TO_NUMBER(X.NR_SECTIE) * 1000 + X.ORD AS ORDINE,
    '100000' AS DECIMAL_POS,
    X.NUME_ROW AS NUME_ROW,
    ROUND(SUM(X.VALOARE), 1) AS COL1,
    ROUND(SUM(CASE WHEN X.CFP IN ('11','12','13') THEN X.VALOARE END), 0) AS COL2,
    ROUND(SUM(CASE WHEN X.CFP IN ('14','15','16','17','18','19') THEN X.VALOARE END), 0) AS COL3,
    ROUND(SUM(CASE WHEN X.CFP IN ('20','21') THEN X.VALOARE END), 0) AS COL4,
    ROUND(SUM(CASE WHEN X.CFP IN ('22','23','24','25','26','27') THEN X.VALOARE END), 0) AS COL5,
    ROUND(SUM(CASE WHEN X.CFP = '28' THEN X.VALOARE END), 0) AS COL6
FROM DATE_PE_RANDURI X
GROUP BY X.NR_SECTIE, X.NUME_SECTIE, X.ORD, X.COD, X.NR_COL, X.NUME_ROW
ORDER BY ORDINE

