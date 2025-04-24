'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, User, 
  Instagram, Twitter, Facebook, Youtube, Twitch, MessageSquare 
} from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import FileUploadAvatar from '@/components/profile/FileUploadAvatar';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUserProfile, updateUserAvatar } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    bio: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      youtube: '',
      twitch: '',
      discord: ''
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile/edit');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Carregar dados iniciais do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        socialLinks: {
          instagram: user.socialLinks?.instagram || '',
          twitter: user.socialLinks?.twitter || '',
          facebook: user.socialLinks?.facebook || '',
          youtube: user.socialLinks?.youtube || '',
          twitch: user.socialLinks?.twitch || '',
          discord: user.socialLinks?.discord || ''
        }
      });
    }
  }, [user]);
  
  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social_')) {
      const socialNetwork = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialNetwork]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Função para processar o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);
    
    try {
      // Validações básicas
      const newErrors: any = {};
      
      if (formData.username.length < 3) {
        newErrors.username = 'O nome de usuário deve ter pelo menos 3 caracteres';
      }
      
      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = 'A biografia deve ter no máximo 500 caracteres';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Enviar dados para a API através do contexto de autenticação
      await updateUserProfile({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        socialLinks: formData.socialLinks
      });
      
      setSaveSuccess(true);
      
      // Limpar erros
      setErrors({});
      
      // Mostrar mensagem de sucesso por 2 segundos e redirecionar para o perfil
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setErrors({ submit: 'Ocorreu um erro ao salvar as alterações. Por favor, tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com upload de avatar
  const handleAvatarUpload = async (file: File) => {
    try {
      // Enviar o arquivo para atualização
      await updateUserAvatar(file);
      
      // Mostrar mensagem de sucesso
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      setErrors({ avatar: 'Erro ao fazer upload da imagem. Por favor, tente novamente.' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0D0A2A] py-10 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-[#171335] hover:bg-[#232048] transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
        </div>
        
        {/* Formulário */}
        <div className="bg-[#171335] rounded-xl overflow-hidden shadow-xl border border-[#3D2A85]/20">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Avatar */}
              <div className="mb-8 flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 bg-[#1A1730]">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={64} className="text-[#A89ECC]" />
                    </div>
                  )}
                </div>
                
                <FileUploadAvatar
                  onFileSelected={handleAvatarUpload}
                  currentImageUrl={user?.avatarUrl}
                />
                
                {errors.avatar && (
                  <p className="text-red-400 text-sm mt-2">{errors.avatar}</p>
                )}
              </div>
              
              {/* Campo de username */}
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium mb-2 text-white">
                  Nome de usuário
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                />
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>
              
              {/* Campo de email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-2 rounded-md bg-[#1A1730]/50 border border-[#3D2A85]/20 text-white/70 opacity-70 cursor-not-allowed"
                />
                <p className="text-[#A89ECC] text-xs mt-1">O email não pode ser alterado</p>
              </div>
              
              {/* Campo de telefone */}
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium mb-2 text-white">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                />
              </div>
              
              {/* Campo de biografia */}
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium mb-2 text-white">
                  Biografia
                  <span className="text-[#A89ECC] text-xs ml-2">
                    ({formData.bio?.length || 0}/500)
                  </span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                ></textarea>
                {errors.bio && (
                  <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
                )}
              </div>
              
              {/* Redes sociais */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-white">Redes Sociais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instagram */}
                  <div>
                    <label htmlFor="social_instagram" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <Instagram size={14} className="text-pink-500" />
                      Instagram
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#3D2A85]/30 bg-[#1A1730] text-[#A89ECC]">
                        @
                      </span>
                      <input
                        type="text"
                        id="social_instagram"
                        name="social_instagram"
                        value={formData.socialLinks.instagram}
                        onChange={handleChange}
                        placeholder="seu_instagram"
                        className="flex-1 min-w-0 w-full px-4 py-2 rounded-r-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                      />
                    </div>
                  </div>
                  
                  {/* Twitter */}
                  <div>
                    <label htmlFor="social_twitter" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <Twitter size={14} className="text-blue-400" />
                      Twitter
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#3D2A85]/30 bg-[#1A1730] text-[#A89ECC]">
                        @
                      </span>
                      <input
                        type="text"
                        id="social_twitter"
                        name="social_twitter"
                        value={formData.socialLinks.twitter}
                        onChange={handleChange}
                        placeholder="seu_twitter"
                        className="flex-1 min-w-0 w-full px-4 py-2 rounded-r-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                      />
                    </div>
                  </div>
                  
                  {/* Facebook */}
                  <div>
                    <label htmlFor="social_facebook" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <Facebook size={14} className="text-blue-600" />
                      Facebook
                    </label>
                    <input
                      type="url"
                      id="social_facebook"
                      name="social_facebook"
                      value={formData.socialLinks.facebook}
                      onChange={handleChange}
                      placeholder="https://facebook.com/seu_perfil"
                      className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                    />
                  </div>
                  
                  {/* YouTube */}
                  <div>
                    <label htmlFor="social_youtube" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <Youtube size={14} className="text-red-600" />
                      YouTube
                    </label>
                    <input
                      type="url"
                      id="social_youtube"
                      name="social_youtube"
                      value={formData.socialLinks.youtube}
                      onChange={handleChange}
                      placeholder="https://youtube.com/c/seu_canal"
                      className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                    />
                  </div>
                  
                  {/* Twitch */}
                  <div>
                    <label htmlFor="social_twitch" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <Twitch size={14} className="text-purple-500" />
                      Twitch
                    </label>
                    <input
                      type="text"
                      id="social_twitch"
                      name="social_twitch"
                      value={formData.socialLinks.twitch}
                      onChange={handleChange}
                      placeholder="seu_canal"
                      className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                    />
                  </div>
                  
                  {/* Discord */}
                  <div>
                    <label htmlFor="social_discord" className="block text-sm font-medium mb-2 text-white flex items-center gap-1">
                      <MessageSquare size={14} className="text-indigo-400" />
                      Discord
                    </label>
                    <input
                      type="text"
                      id="social_discord"
                      name="social_discord"
                      value={formData.socialLinks.discord}
                      onChange={handleChange}
                      placeholder="seu_nome#0000 ou link do servidor"
                      className="w-full px-4 py-2 rounded-md bg-[#1A1730] border border-[#3D2A85]/30 text-white focus:border-[#8860FF] focus:ring-1 focus:ring-[#8860FF]"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mensagens de erro/sucesso */}
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-800/50 rounded-md">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}
              
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-800/50 rounded-md">
                  <p className="text-green-400 text-sm">Perfil atualizado com sucesso!</p>
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="flex justify-end mt-6">
                <Link
                  href="/profile"
                  className="px-6 py-2 bg-[#1A1730] hover:bg-[#232048] border border-[#3D2A85]/30 text-white rounded-md mr-2 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#8860FF] hover:bg-[#7550F0] text-white rounded-md flex items-center gap-2 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 