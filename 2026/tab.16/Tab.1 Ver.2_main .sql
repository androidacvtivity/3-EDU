SELECT 
                RIND,
                ID_MD,
                ORDINE
              
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
                    ORDINE > 7000 
                    OR 
                    ORDINE BETWEEN 5000 AND 5999)
                    
                    
                    ORDER BY 
                    ORDINE