import React, { useState, useRef } from 'react';
import { Upload, X, Check } from 'react-feather';
import Image from 'next/image';

interface FileUploadAvatarProps {
  onFileSelected: (file: File) => void;
  currentImageUrl?: string;
}

const FileUploadAvatar: React.FC<FileUploadAvatarProps> = ({ onFileSelected, currentImageUrl }) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const processFile = (file: File) => {
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
      setError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).');
      return;
    }

    // Verificar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem é muito grande. O tamanho máximo é 2MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Enviar arquivo para o componente pai
    setError(null);
    onFileSelected(file);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
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
        onClick={openFileDialog}
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
    </div>
  );
};

export default FileUploadAvatar; 