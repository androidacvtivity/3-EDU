SELECT 
     D.*
 FROM 
  CIS2.VW_DATA_ALL D  
  
                
  
WHERE
  D.PERIOADA IN (:pPERIOADA) AND 
  D.FORM_VERS = :pFORM_VERS     AND    
  D.FORM IN (50)                 AND 
  D.CAPITOL IN (1058)  