import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface Toast extends ToastProps {
  id: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
    const id = Date.now();
    
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant, duration }]);
    
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
    }, duration);
    
    return id;
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const ToastContainer = () => {
    if (toasts.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-lg min-w-[280px] max-w-[420px] flex items-start justify-between
              ${toast.variant === 'destructive' ? 'bg-red-900 text-white' : 
                toast.variant === 'success' ? 'bg-green-900 text-white' : 
                'bg-card-active text-white'}`}
          >
            <div>
              <h4 className="font-medium">{toast.title}</h4>
              {toast.description && <p className="text-sm opacity-80">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-white/80 hover:text-white"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  };

  return { toast, dismiss, ToastContainer };
} 