-- Adicionar campos de versionamento à tabela processed_documents
ALTER TABLE processed_documents
ADD COLUMN document_group_id uuid,
ADD COLUMN version_number integer DEFAULT 1,
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_processed_documents_group_id ON processed_documents(document_group_id);
CREATE INDEX idx_processed_documents_user_id ON processed_documents(user_id);

-- Atualizar documentos existentes para criar grupos baseados no nome do arquivo
UPDATE processed_documents
SET document_group_id = gen_random_uuid(),
    user_id = (SELECT id FROM auth.users LIMIT 1);

-- Criar uma função para auto-incrementar o número da versão
CREATE OR REPLACE FUNCTION increment_version_number()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-incrementar versão
CREATE TRIGGER set_version_number
BEFORE INSERT ON processed_documents
FOR EACH ROW
EXECUTE FUNCTION increment_version_number();

-- Habilitar RLS para processed_documents
ALTER TABLE processed_documents ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own processed documents"
ON processed_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed documents"
ON processed_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processed documents"
ON processed_documents FOR DELETE
USING (auth.uid() = user_id);