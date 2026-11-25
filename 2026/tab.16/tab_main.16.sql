SELECT 
    D.CUIIO,
    D.CUIIO_VERS,
    D.RIND  RIND,
    
(

CASE 
  WHEN 
  
  MR.ORDINE NOT BETWEEN 5000 AND 5999 
  AND TO_CHAR(SUBSTR(D.RIND, 2)) LIKE '0%' 
  
  THEN 
  REPLACE(LTRIM(TO_CHAR(SUBSTR(D.RIND, 2)), '0'), '.', '')
  
WHEN MR.ORDINE BETWEEN 5000 AND 5999
THEN REPLACE(D.RIND, '.', '')
  
  ELSE REPLACE(TO_CHAR(SUBSTR(D.RIND, 2)), '.', '')
  
  
END) AS RIND_MOD,


    D.ID_MD,
    D.RIND_VERS,
    MR.ORDINE
 FROM 
  CIS2.VW_DATA_ALL D  
  
                INNER JOIN CIS2.MD_RIND MR ON MR.ID_MD = D.ID_MD 
  
WHERE
  D.PERIOADA IN (:pPERIOADA) AND 
  D.FORM_VERS = :pFORM_VERS     AND    
--  (:pID_MDTABLE=:pID_MDTABLE) AND
--  D.CUATM_FULL LIKE '%'||:pCOD_CUATM||';%' AND
  D.FORM IN (50)                 AND 
  D.CAPITOL IN (1058) AND     
    
  MR.ID_MD NOT IN (
              SELECT 
                ID_MD
              
                    FROM CIS2.MD_RIND
                    WHERE
                     FORM IN (50)  
                    AND 
                    CAPITOL  IN  (1058)
                    AND CAPITOL_VERS = 2015
                    AND  STATUT = '1'
                    AND 
                    (
                    RIND  IN ('10','20','30','40','50','51','60','70','90','100','110','120')
                    OR 
                    ORDINE > 7000) 
--                    OR 
--                    ORDINE BETWEEN 5000 AND 5999)
--                    
                    
                    )
                    
        ORDER BY 
        MR.ORDINE            
                    