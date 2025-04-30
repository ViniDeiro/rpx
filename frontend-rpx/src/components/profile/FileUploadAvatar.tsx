import React, { useState, useRef } from 'react';
import { Upload, X, Check, Save } from 'react-feather';
import Image from 'next/image';

interface FileUploadAvatarProps {
  onFileSelected: (file: File) => void;
  currentImageUrl?: string;
}

const FileUploadAvatar: React.FC<FileUploadAvatarProps> = ({ onFileSelected, currentImageUrl }) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange chamado", e.target.files?.length);
    
    const file = e.target.files?.[0];
    if (file) {
      console.log("Arquivo selecionado:", file.name, file.type, file.size);
      processFile(file);
    } else {
      console.log("Nenhum arquivo selecionado");
      setError("Nenhum arquivo selecionado. Por favor, tente novamente.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    console.log("Drag over");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    console.log("Drag leave");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    console.log("Drop - arquivos:", e.dataTransfer.files?.length);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      console.log("Arquivo dropado:", file.name, file.type, file.size);
      processFile(file);
    } else {
      console.log("Nenhum arquivo válido no drop");
      setError("Nenhum arquivo válido detectado. Por favor, tente novamente.");
    }
  };

  const processFile = async (file: File) => {
    console.log("Processando arquivo:", file.name, file.type, file.size);
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
      console.error("Tipo de arquivo inválido:", file.type);
      setError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).');
      return;
    }

    // Verificar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error("Arquivo muito grande:", file.size);
      setError('A imagem é muito grande. O tamanho máximo é 2MB. Tente uma imagem menor.');
      return;
    }

    try {
      // Criar preview da imagem original
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("Preview gerado");
        setPreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error("Erro ao ler arquivo:", reader.error);
        setError(`Erro ao processar imagem: ${reader.error?.message || 'erro desconhecido'}`);
      };
      reader.readAsDataURL(file);
      
      // Armazenar o arquivo original sem redimensionar
      setSelectedFile(file);
      const fileSizeKB = Math.round(file.size / 1024);
      setImageSize(`${fileSizeKB} KB`);
      setError(null);
      console.log("Arquivo processado com sucesso");
    } catch (error) {
      console.error('Erro ao processar a imagem:', error);
      setError(`Erro ao processar a imagem: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      console.error("Tentativa de confirmar upload sem arquivo");
      setError("Nenhum arquivo selecionado.");
      return;
    }
    
    try {
      console.log("Iniciando upload de arquivo:", selectedFile.name);
      setIsLoading(true);
      // Enviar arquivo para o componente pai
      await onFileSelected(selectedFile);
      setIsLoading(false);
      console.log("Upload concluído com sucesso");
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError(`Erro ao fazer upload da imagem: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      setIsLoading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Limpando arquivo");
    setPreview(null);
    setSelectedFile(null);
    setImageSize(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    console.log("Tentando abrir diálogo de arquivo");
    if (fileInputRef.current) {
      try {
        fileInputRef.current.click();
        console.log("Diálogo de arquivo aberto");
      } catch (error) {
        console.error("Erro ao abrir diálogo de arquivo:", error);
        setError(`Não foi possível abrir o seletor de arquivos: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      }
    } else {
      console.error("Referência para input file é null");
      setError("Erro interno: não foi possível acessar o seletor de arquivos.");
    }
  };

  return (
    <div className="mb-4">
      <div
        onClick={() => !preview && openFileDialog()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${isDragging 
            ? 'border-purple-500 bg-purple-900/20' 
            : preview 
              ? 'border-green-500 bg-green-900/10' 
              : 'border-purple-400 hover:border-purple-500 hover:bg-purple-900/10'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          aria-label="Selecionar imagem"
        />

        {preview ? (
          <div className="relative p-4 flex flex-col items-center">
            <div className="relative h-32 w-32 mx-auto rounded-full overflow-hidden">
              <Image
                src={preview}
                alt="Preview da imagem"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={clearFile}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Remover imagem"
              >
                <X size={20} />
              </button>
              <span className="text-sm text-green-400 flex items-center gap-1">
                <Check size={16} /> Imagem selecionada
                {imageSize && <span className="text-xs text-gray-400 ml-1">({imageSize})</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-purple-400" />
            <p className="mt-2 text-sm font-medium">
              Clique aqui para selecionar uma foto
            </p>
            <p className="text-sm mt-1">
              ou arraste e solte uma imagem aqui
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG ou GIF (máx. 2MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Botão de confirmação que aparece sempre que uma imagem é selecionada */}
      {selectedFile && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleConfirmUpload}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#A44BE1] to-[#5271FF] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-glow"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar foto de perfil
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadAvatar; 