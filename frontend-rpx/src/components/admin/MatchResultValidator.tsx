'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'react-feather';
import Image from 'next/image';

interface Team {
  lobbyId: string;
  members: string[];
  captain: string;
  teamName?: string;
}

interface ResultSubmission {
  submittedBy: string;
  submittedAt: string;
  imageUrl: string;
  comment: string;
  validated: boolean;
  validatedBy: string | null;
  validatedAt: string | null;
  validationComment: string | null;
}

interface MatchResultValidatorProps {
  matchId: string;
  teams: Team[];
  resultSubmission: ResultSubmission;
  onValidated?: () => void;
}

const MatchResultValidator: React.FC<MatchResultValidatorProps> = ({
  matchId,
  teams,
  resultSubmission,
  onValidated
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [winnerTeamId, setWinnerTeamId] = useState<string>('');
  const [distributeRewards, setDistributeRewards] = useState(true);
  
  // Não exibir se já foi validado
  if (resultSubmission.validated !== undefined && resultSubmission.validated !== false) {
    return (
      <div className="bg-card-bg border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={24} className="text-green-500" />
          <h2 className="text-xl font-semibold">Resultado já validado</h2>
        </div>
        <p className="text-muted">
          Este resultado já foi validado por um administrador em {new Date(resultSubmission.validatedAt || '').toLocaleString()}.
        </p>
      </div>
    );
  }
  
  const handleValidate = async () => {
    if (isValid === null) {
      toast.error('Por favor, selecione se o resultado é válido ou não');
      return;
    }
    
    if (isValid && distributeRewards && !winnerTeamId) {
      toast.error('Por favor, selecione o time vencedor para distribuir recompensas');
      return;
    }
    
    try {
      setIsValidating(true);
      
      const response = await axios.post('/api/admin/matches/validate-result', {
        matchId,
        isValid,
        validationComment,
        winnerTeamId: isValid ? winnerTeamId : null,
        distributeRewards: isValid ? distributeRewards : false
      });
      
      if (response.data.status === 'success') {
        toast.success(isValid ? 'Resultado validado com sucesso!' : 'Resultado rejeitado');
        if (onValidated) {
          onValidated();
        }
      } else {
        toast.error(response.data.error || 'Erro ao processar validação');
      }
    } catch (error: any) {
      console.error('Erro ao validar resultado:', error);
      toast.error(error.response?.data?.error || 'Falha ao validar resultado');
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="bg-card-bg border border-primary/20 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Validar Resultado da Partida</h2>
      
      {/* Exibir a imagem enviada */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Print do Resultado</h3>
        <div className="relative rounded-lg overflow-hidden bg-slate-900">
          <Image 
            src={resultSubmission.imageUrl} 
            alt="Resultado da partida" 
            width={800} 
            height={450} 
            className="w-full object-contain max-h-[500px]" 
          />
        </div>
        
        {resultSubmission.comment && (
          <div className="mt-2 p-3 bg-slate-800 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Comentário do jogador:</span> {resultSubmission.comment}
            </p>
          </div>
        )}
      </div>
      
      {/* Selecionar validação */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Validação</h3>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setIsValid(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium ${
              isValid === true
                ? 'bg-green-600 text-white'
                : 'bg-card-hover text-muted hover:bg-green-900/40'
            }`}
          >
            <CheckCircle size={20} />
            Válido
          </button>
          <button
            onClick={() => setIsValid(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium ${
              isValid === false
                ? 'bg-red-600 text-white'
                : 'bg-card-hover text-muted hover:bg-red-900/40'
            }`}
          >
            <XCircle size={20} />
            Inválido
          </button>
        </div>
      </div>
      
      {/* Time vencedor (se válido) */}
      {isValid === true && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Time Vencedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teams.map((team, index) => (
              <button
                key={team.lobbyId}
                onClick={() => setWinnerTeamId(team.lobbyId)}
                className={`p-3 rounded-lg font-medium ${
                  winnerTeamId === team.lobbyId
                    ? 'bg-blue-600 text-white'
                    : 'bg-card-hover text-muted hover:bg-blue-900/40'
                }`}
              >
                {team.teamName || `Time ${index + 1}`} ({team.members.length} jogadores)
              </button>
            ))}
          </div>
          
          <div className="mt-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={distributeRewards}
                onChange={(e) => setDistributeRewards(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500 text-blue-600 focus:ring-blue-500"
              />
              <span>Distribuir recompensas automaticamente para os vencedores</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Comentário de validação */}
      <div className="mb-6">
        <label htmlFor="validationComment" className="block text-sm font-medium mb-1">
          Comentário (opcional)
        </label>
        <textarea
          id="validationComment"
          value={validationComment}
          onChange={(e) => setValidationComment(e.target.value)}
          placeholder="Adicione um comentário sobre a validação..."
          className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>
      
      {/* Botões de ação */}
      <div className="flex justify-end">
        <button
          onClick={handleValidate}
          disabled={isValidating || isValid === null}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white ${
            isValidating
              ? 'bg-blue-700 cursor-wait'
              : isValid === null
                ? 'bg-gray-600 cursor-not-allowed'
                : isValid
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isValidating ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : isValid ? (
            <CheckCircle size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {isValidating
            ? 'Processando...'
            : isValid === null
              ? 'Selecione a validação'
              : isValid
                ? 'Validar Resultado'
                : 'Rejeitar Resultado'}
        </button>
      </div>
    </div>
  );
};

export default MatchResultValidator; 