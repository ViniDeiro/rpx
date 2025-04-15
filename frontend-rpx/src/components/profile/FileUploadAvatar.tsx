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
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Função para redimensionar a imagem antes de fazer o upload
  const resizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular as dimensões para redimensionar
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        // Definir as dimensões do canvas
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar a imagem redimensionada
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto 2D do canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade reduzida (para JPG)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Falha ao converter canvas para blob'));
            return;
          }
          
          // Criar um novo arquivo com o blob redimensionado
          const resizedFile = new File(
            [blob], 
            file.name, 
            { type: file.type, lastModified: Date.now() }
          );
          
          // Liberar a URL criada
          URL.revokeObjectURL(img.src);
          
          // Exibir tamanho da imagem otimizada
          const fileSizeKB = Math.round(resizedFile.size / 1024);
          setImageSize(`${fileSizeKB} KB`);
          
          resolve(resizedFile);
        }, file.type, 0.8); // Comprimir com 80% de qualidade para JPG
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem'));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const processFile = async (file: File) => {
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
      setError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).');
      return;
    }

    // Verificar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem é muito grande. O tamanho máximo é 2MB. Tente uma imagem menor.');
      return;
    }

    try {
      // Criar preview da imagem original
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Redimensionar a imagem para otimizar o tamanho
      const resizedFile = await resizeImage(file);
      console.log('Imagem otimizada:', Math.round(resizedFile.size / 1024), 'KB');

      // Armazenar o arquivo redimensionado
      setSelectedFile(resizedFile);
      setError(null);
    } catch (error) {
      console.error('Erro ao processar a imagem:', error);
      setError('Erro ao processar a imagem. Tente novamente com outra imagem.');
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoading(true);
      // Enviar arquivo para o componente pai
      await onFileSelected(selectedFile);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError('Ocorreu um erro ao fazer upload da imagem. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setSelectedFile(null);
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Foto de Perfil</label>
      <div
        onClick={!preview ? openFileDialog : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors
          ${isDragging 
            ? 'border-purple-500 bg-purple-900/20' 
            : preview 
              ? 'border-green-500 bg-green-900/10' 
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
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
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm">
              Arraste uma imagem ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG ou GIF (máx. 2MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Botão de confirmação que só aparece quando uma imagem for selecionada */}
      {selectedFile && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleConfirmUpload}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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