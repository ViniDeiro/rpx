import React from 'react';
import Image from 'next/image';
import { Check, X } from 'react-feather';

interface FriendRequestNotificationProps {
  request: {
    _id: string;
    sender: {
      _id: string;
      username: string;
      avatarUrl?: string;
    };
    createdAt: string;
  };
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({ 
  request, 
  onAccept, 
  onReject 
}) => {
  const handleAccept = () => {
    onAccept(request._id);
  };

  const handleReject = () => {
    onReject(request._id);
  };

  return (
    <div className="p-4 border-b border-gray-800 flex items-center">
      <div className="w-12 h-12 mr-4 relative">
        <Image
          src={request.sender.avatarUrl || '/images/avatars/default.jpg'}
          alt={request.sender.username}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">
          {request.sender.username}
        </p>
        <p className="text-gray-400 text-sm">
          Enviou uma solicitação de amizade
        </p>
        <p className="text-gray-500 text-xs">
          {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={handleAccept}
          className="p-2 bg-green-600 rounded-full hover:bg-green-700 transition"
          aria-label="Aceitar solicitação"
        >
          <Check size={16} className="text-white" />
        </button>
        <button 
          onClick={handleReject}
          className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
          aria-label="Rejeitar solicitação"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default FriendRequestNotification; 