import { useToast as useToastOriginal } from "./toast"

// Re-export useToast para manter a compatibilidade
export const useToast = useToastOriginal

// Interface simplificada para toast
export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Função simplificada para toast
export const toast = ({ title, description, variant }: ToastProps) => {
  const { toast } = useToastOriginal()
  return toast({
    title,
    description,
    variant,
  })
} 