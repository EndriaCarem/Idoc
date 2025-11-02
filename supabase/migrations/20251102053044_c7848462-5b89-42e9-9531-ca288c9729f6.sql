-- Corrigir a função increment_version_number adicionando search_path
CREATE OR REPLACE FUNCTION increment_version_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se document_group_id for fornecido, calcular o próximo número de versão
  IF NEW.document_group_id IS NOT NULL THEN
    NEW.version_number := COALESCE(
      (SELECT MAX(version_number) + 1 
       FROM processed_documents 
       WHERE document_group_id = NEW.document_group_id),
      1
    );
  ELSE
    -- Se não houver group_id, criar um novo grupo
    NEW.document_group_id := gen_random_uuid();
    NEW.version_number := 1;
  END IF;
  
  RETURN NEW;
END;
$$;