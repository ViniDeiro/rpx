import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, Book, DollarSign, Users, AlertCircle } from 'react-feather';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-rpx-blue/90 rounded-lg max-w-2xl w-full p-6 relative border border-rpx-orange/50"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-rpx-orange">Bem-vindo ao Lobby RPX!</h2>
          <p className="text-white/80 mt-2">
            Este é um breve tutorial para te ajudar a começar.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-rpx-orange p-2 rounded-lg">
              <Book size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Regras do Jogo</h3>
              <p className="text-white/80 mt-1">
                Para ver as regras completas, clique no botão "Regras" no canto superior direito. As regras mudam dependendo do modo de jogo selecionado!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-rpx-orange p-2 rounded-lg">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Modos de Jogo</h3>
              <p className="text-white/80 mt-1">
                <strong>Solo (1x1):</strong> Escolha entre "Gelo Infinito" e "Gelo Finito".<br />
                <strong>Duo (2x2) ou Squad (4x4):</strong> Escolha entre "Normal" e "Tático".
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-rpx-orange p-2 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Apostas</h3>
              <p className="text-white/80 mt-1">
                Defina o valor da aposta antes de iniciar a partida. Você só poderá jogar se tiver saldo suficiente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-rpx-orange p-2 rounded-lg">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Dica Importante</h3>
              <p className="text-white/80 mt-1">
                Convide amigos para jogar em equipe nos modos Duo e Squad. Quanto maior o nível dos jogadores na sua equipe, maiores são suas chances de vitória!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="bg-rpx-orange hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Entendi! Vamos jogar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TutorialModal; 