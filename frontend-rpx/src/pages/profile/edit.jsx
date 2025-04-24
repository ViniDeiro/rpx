import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, ArrowLeft, Save } from 'react-feather';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import FileUploadAvatar from '@/components/profile/FileUploadAvatar';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUserProfile } = useAuth();
  
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
  const [errors, setErrors] = useState({});
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
  const handleChange = (e) => {
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);
    
    try {
      // Validações básicas
      const newErrors = {};
      
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
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setErrors({ submit: 'Ocorreu um erro ao salvar as alterações. Por favor, tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com upload de avatar
  const handleAvatarUpload = async (file) => {
    try {
      // Converter a imagem para base64
      const base64 = await convertToBase64(file);
      
      // Enviar o arquivo para a API
      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ image: base64 })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }
      
      // Recarregar a página para mostrar a nova imagem
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      alert('Erro ao fazer upload da imagem. Por favor, tente novamente.');
    }
  };
  
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  if (isLoading) {
    return (
      <Layout title="Carregando...">
        <div className="container py-16">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Editar Perfil">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="btn-icon"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Editar Perfil</h1>
          </div>
          
          {/* Formulário */}
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Avatar */}
                <div className="mb-8 flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 bg-card-hover">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={64} className="text-muted" />
                      </div>
                    )}
                  </div>
                  
                  <FileUploadAvatar
                    onFileSelected={handleAvatarUpload}
                    currentImageUrl={user?.avatarUrl}
                  />
                </div>
                
                {/* Campo de username */}
                <div className="mb-4">
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>
                
                {/* Campo de email */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    disabled
                    value={formData.email}
                    className="w-full px-4 py-2 rounded-md bg-gray-700 border border-border opacity-70 cursor-not-allowed"
                  />
                  <p className="text-muted text-xs mt-1">O email não pode ser alterado</p>
                </div>
                
                {/* Campo de telefone */}
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                {/* Campo de biografia */}
                <div className="mb-4">
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">
                    Biografia
                    <span className="text-muted text-xs ml-2">
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
                    className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  ></textarea>
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                  )}
                </div>
                
                {/* Redes sociais */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Redes Sociais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Instagram */}
                    <div>
                      <label htmlFor="social_instagram" className="block text-sm font-medium mb-2">
                        Instagram
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-gray-700">
                          @
                        </span>
                        <input
                          type="text"
                          id="social_instagram"
                          name="social_instagram"
                          value={formData.socialLinks.instagram}
                          onChange={handleChange}
                          placeholder="seu_instagram"
                          className="flex-1 min-w-0 w-full px-4 py-2 rounded-r-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    
                    {/* Twitter */}
                    <div>
                      <label htmlFor="social_twitter" className="block text-sm font-medium mb-2">
                        Twitter
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-gray-700">
                          @
                        </span>
                        <input
                          type="text"
                          id="social_twitter"
                          name="social_twitter"
                          value={formData.socialLinks.twitter}
                          onChange={handleChange}
                          placeholder="seu_twitter"
                          className="flex-1 min-w-0 w-full px-4 py-2 rounded-r-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    
                    {/* Facebook */}
                    <div>
                      <label htmlFor="social_facebook" className="block text-sm font-medium mb-2">
                        Facebook
                      </label>
                      <input
                        type="url"
                        id="social_facebook"
                        name="social_facebook"
                        value={formData.socialLinks.facebook}
                        onChange={handleChange}
                        placeholder="https://facebook.com/seu_perfil"
                        className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    {/* YouTube */}
                    <div>
                      <label htmlFor="social_youtube" className="block text-sm font-medium mb-2">
                        YouTube
                      </label>
                      <input
                        type="url"
                        id="social_youtube"
                        name="social_youtube"
                        value={formData.socialLinks.youtube}
                        onChange={handleChange}
                        placeholder="https://youtube.com/c/seu_canal"
                        className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    {/* Twitch */}
                    <div>
                      <label htmlFor="social_twitch" className="block text-sm font-medium mb-2">
                        Twitch
                      </label>
                      <input
                        type="text"
                        id="social_twitch"
                        name="social_twitch"
                        value={formData.socialLinks.twitch}
                        onChange={handleChange}
                        placeholder="seu_canal"
                        className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    {/* Discord */}
                    <div>
                      <label htmlFor="social_discord" className="block text-sm font-medium mb-2">
                        Discord
                      </label>
                      <input
                        type="text"
                        id="social_discord"
                        name="social_discord"
                        value={formData.socialLinks.discord}
                        onChange={handleChange}
                        placeholder="seu_nome#0000 ou link do servidor"
                        className="w-full px-4 py-2 rounded-md bg-card-hover border border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Mensagens de erro/sucesso */}
                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}
                
                {saveSuccess && (
                  <div className="mb-4 p-3 bg-green-900/50 border border-green-800 rounded-md">
                    <p className="text-green-400 text-sm">Perfil atualizado com sucesso!</p>
                  </div>
                )}
                
                {/* Botões de ação */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn-secondary mr-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 