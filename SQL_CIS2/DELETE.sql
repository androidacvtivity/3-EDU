--DELETE
SELECT *

    FROM CIS2.MD_RIND 
    
    WHERE

capitol=1058 and  capitol_vers=2015
  AND STATUT = '3'

---- 
 -- RIND LIKE '4%'
 AND LENGTH(RIND) > 3
 
-- AND RIND IN (
--      '1112.1.1',
--'1112.1.2',
--'1113.1.1',
--'1114.1.2',
--'1912.1.2',
--'1912.1.3',
--'1913.2.1',
--'1914.1.4'
--      )
-- 
 AND ORDINE >= 5000
 
 AND ROWNUM <= 15