'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, X, Check, Image as ImageIcon } from 'react-feather';
import Image from 'next/image';

interface MatchResultUploaderProps {
  matchId: string;
  disabled?: boolean;
  onUploadSuccess?: () => void;
}

const MatchResultUploader: React.FC<MatchResultUploaderProps> = ({
  matchId,
  disabled = false,
  onUploadSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resultComment, setResultComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem não pode ter mais de 5MB');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFileSelection = () => {
    setPreviewImage(null);
    setResultComment('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!previewImage) {
      toast.error('Por favor, selecione uma imagem do resultado');
      return;
    }

    try {
      setIsUploading(true);

      // Criar FormData para upload
      const formData = new FormData();
      
      // Converter base64 para blob
      const base64Response = await fetch(previewImage);
      const blob = await base64Response.blob();
      
      formData.append('matchId', matchId);
      formData.append('resultImage', blob);
      formData.append('comment', resultComment);

      const response = await axios.post('/api/matches/submit-result', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Resultado enviado com sucesso! Aguardando validação.');
        clearFileSelection();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        toast.error(response.data.error || 'Erro ao enviar resultado');
      }
    } catch (error: any) {
      console.error('Erro ao enviar resultado:', error);
      toast.error(error.response?.data?.error || 'Falha ao enviar resultado');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card-bg border border-primary/20 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Enviar Resultado da Partida</h2>
      
      {/* Área de seleção/preview de imagem */}
      <div className="mb-4">
        {previewImage ? (
          <div className="relative rounded-lg overflow-hidden">
            <Image 
              src={previewImage} 
              alt="Preview do resultado" 
              width={600} 
              height={338} 
              className="w-full object-cover" 
            />
            <button
              onClick={clearFileSelection}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
              disabled={isUploading}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <ImageIcon size={48} className="mx-auto mb-3 text-muted" />
            <p className="text-muted mb-2">Clique para selecionar uma imagem do resultado</p>
            <p className="text-xs text-muted">PNG, JPG ou GIF (máx. 5MB)</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || disabled}
        />
      </div>
      
      {/* Comentário */}
      <div className="mb-4">
        <label htmlFor="resultComment" className="block text-sm font-medium mb-1">
          Comentário (opcional)
        </label>
        <textarea
          id="resultComment"
          value={resultComment}
          onChange={(e) => setResultComment(e.target.value)}
          placeholder="Descreva brevemente o resultado da partida..."
          className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          disabled={isUploading || disabled}
        />
      </div>
      
      {/* Botões */}
      <div className="flex justify-end space-x-2">
        {previewImage && (
          <button
            onClick={clearFileSelection}
            className="px-4 py-2 rounded-lg font-medium text-muted bg-card-hover hover:bg-background"
            disabled={isUploading || disabled}
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!previewImage || isUploading || disabled}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white ${
            !previewImage || disabled
              ? 'bg-gray-600 cursor-not-allowed'
              : isUploading
                ? 'bg-blue-700 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : previewImage ? (
            <Check size={18} />
          ) : (
            <Upload size={18} />
          )}
          {isUploading ? 'Enviando...' : 'Enviar Resultado'}
        </button>
      </div>
      
      {/* Mensagem de informação */}
      <div className="mt-4 p-3 bg-blue-950/30 border border-blue-500/30 rounded-md">
        <p className="text-sm text-blue-200">
          Envie um print da tela final da partida mostrando claramente o resultado. 
          Um administrador irá validar o resultado e atualizar seu saldo se necessário.
        </p>
      </div>
    </div>
  );
};

export default MatchResultUploader; 