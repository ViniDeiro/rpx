'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Info } from 'react-feather';
import { Match } from '@/types/match';
import Image from 'next/image';

interface SubmitResultModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: {
    matchId: string;
    winner: 'team1' | 'team2';
    screenshot: File | null;
    comment: string;
  }) => void;
}

const SubmitResultModal: React.FC<SubmitResultModalProps> = ({ match, isOpen, onClose, onSubmit }) => {
  const [winner, setWinner] = useState<'team1' | 'team2' | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validar se é uma imagem
      if (!file.type.match('image.*')) {
        setError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).');
        return;
      }

      // Validar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo é muito grande. O tamanho máximo é 5MB.');
        return;
      }

      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      // Validar se é uma imagem
      if (!file.type.match('image.*')) {
        setError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).');
        return;
      }

      // Validar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo é muito grande. O tamanho máximo é 5MB.');
        return;
      }

      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!winner) {
      setError('Por favor, selecione o time vencedor.');
      return;
    }

    // Exigir screenshot apenas quando o vencedor for o time do usuário (team1)
    if (winner === 'team1' && !screenshot) {
      setError('Por favor, anexe um print do resultado da partida.');
      return;
    }

    onSubmit({
      matchId: match.id,
      winner,
      screenshot,
      comment
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">Enviar Resultado</h2>
              <p className="text-gray-400 mt-1">
                Partida: {match.title || `Partida #${match.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Alerta informativo */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="text-blue-500 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-blue-500 font-semibold mb-1">Informação importante</p>
              <p className="text-gray-300 text-sm">
                Os resultados das partidas são analisados por nossa equipe antes do pagamento ser liberado. 
                É fundamental que você anexe um print da tela de resultado da partida quando seu time for o vencedor.
                Se o time adversário vencer, não será necessário enviar o print. Resultados fraudulentos 
                podem resultar em suspensão da conta.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Seleção do vencedor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Selecione o time vencedor:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWinner('team1')}
                  className={`p-4 rounded-lg border transition-colors ${
                    winner === 'team1'
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      winner === 'team1' ? 'border-green-500 bg-green-500' : 'border-gray-500'
                    }`}>
                      {winner === 'team1' && <Check size={14} className="text-black" />}
                    </div>
                    <span className="font-medium">Seu Time</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWinner('team2')}
                  className={`p-4 rounded-lg border transition-colors ${
                    winner === 'team2'
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      winner === 'team2' ? 'border-green-500 bg-green-500' : 'border-gray-500'
                    }`}>
                      {winner === 'team2' && <Check size={14} className="text-black" />}
                    </div>
                    <span className="font-medium">Time Adversário</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Upload de screenshot - mostrar apenas quando time1 estiver selecionado */}
            {winner !== 'team2' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Anexar print do resultado:
                  {winner === 'team1' ? ' (obrigatório)' : ''}
                </label>
                <div
                  onClick={triggerFileInput}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-purple-500 bg-purple-900/20'
                      : screenshotPreview
                      ? 'border-green-500 bg-green-900/10'
                      : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative">
                      <div className="relative h-48 w-full">
                        <Image
                          src={screenshotPreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-2 text-sm text-green-500 flex items-center justify-center gap-2">
                        <Check size={16} />
                        {screenshot?.name}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Clique para alterar a imagem
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-300">
                        Clique para selecionar ou arraste uma imagem aqui
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comentário */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
                Comentário adicional (opcional):
              </label>
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Informe detalhes adicionais sobre a partida, se necessário"
                className="w-full bg-background border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check size={18} />
              Enviar Resultado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitResultModal; 