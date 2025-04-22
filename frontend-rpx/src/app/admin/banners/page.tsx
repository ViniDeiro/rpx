'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Image as ImageIcon, Search, Eye, Calendar, Info, Check, X, Link as LinkIcon } from 'react-feather';

// Interfaces
interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  placement: string;
  priority: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Estado para banner atual em edição
  const [currentBanner, setCurrentBanner] = useState<Banner>({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    placement: 'home',
    priority: 0,
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    clicks: 0,
    impressions: 0,
    createdAt: new Date().toISOString()
  });

  // Opções para posicionamento do banner
  const placementOptions = [
    { value: 'home', label: 'Página Inicial' },
    { value: 'lobby', label: 'Lobby de Jogos' },
    { value: 'store', label: 'Loja Virtual' },
    { value: 'profile', label: 'Perfil do Usuário' },
    { value: 'sidebar', label: 'Barra Lateral' }
  ];

  // Simula o carregamento dos dados
  useEffect(() => {
    const loadBanners = async () => {
      setIsLoading(true);
      try {
        // Substitua por uma chamada real à API quando estiver pronta
        const mockBanners: Banner[] = [
          {
            id: '1',
            title: 'Torneio de Primavera',
            description: 'Participe do maior torneio da temporada e ganhe prêmios exclusivos!',
            imageUrl: '/banners/torneio-primavera.jpg',
            link: '/torneios/primavera',
            placement: 'home',
            priority: 10,
            active: true,
            startDate: '2023-05-01',
            endDate: '2023-05-15',
            clicks: 248,
            impressions: 1250,
            createdAt: '2023-04-20T00:00:00Z'
          },
          {
            id: '2',
            title: 'Nova Coleção de Itens',
            description: 'Confira os novos itens disponíveis na loja com 20% de desconto!',
            imageUrl: '/banners/nova-colecao.jpg',
            link: '/loja/colecao',
            placement: 'store',
            priority: 5,
            active: true,
            startDate: '2023-04-15',
            endDate: null,
            clicks: 187,
            impressions: 945,
            createdAt: '2023-04-10T00:00:00Z'
          },
          {
            id: '3',
            title: 'Promoção de Verão',
            description: 'Aproveite o verão com descontos especiais em todos os produtos!',
            imageUrl: '/banners/promocao-verao.jpg',
            link: '/promocoes/verao',
            placement: 'sidebar',
            priority: 3,
            active: false,
            startDate: '2023-06-01',
            endDate: '2023-07-15',
            clicks: 0,
            impressions: 0,
            createdAt: '2023-04-25T00:00:00Z'
          },
          {
            id: '4',
            title: 'Evento Especial',
            description: 'Não perca o evento especial com prêmios exclusivos e muita diversão!',
            imageUrl: '/banners/evento-especial.jpg',
            link: '/eventos/especial',
            placement: 'lobby',
            priority: 8,
            active: true,
            startDate: '2023-04-10',
            endDate: '2023-05-10',
            clicks: 312,
            impressions: 1580,
            createdAt: '2023-04-05T00:00:00Z'
          },
          {
            id: '5',
            title: 'Atualize seu Perfil',
            description: 'Adicione mais informações ao seu perfil e ganhe recompensas!',
            imageUrl: '/banners/atualize-perfil.jpg',
            link: '/perfil/atualizar',
            placement: 'profile',
            priority: 2,
            active: true,
            startDate: '2023-03-01',
            endDate: null,
            clicks: 420,
            impressions: 2150,
            createdAt: '2023-02-25T00:00:00Z'
          }
        ];
        
        // Ordenar banners por prioridade
        const sortedBanners = [...mockBanners].sort((a, b) => b.priority - a.priority);
        
        // Simula um atraso da API
        setTimeout(() => {
          setBanners(sortedBanners);
          setFilteredBanners(sortedBanners);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Atualiza a lista filtrada quando o termo de busca muda
  useEffect(() => {
    const filtered = banners.filter(banner => {
      const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           banner.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'active') return matchesSearch && banner.active;
      if (activeTab === 'inactive') return matchesSearch && !banner.active;
      if (activeTab === 'scheduled') {
        const now = new Date();
        const startDate = new Date(banner.startDate);
        return matchesSearch && startDate > now;
      }
      
      return false;
    });
    
    setFilteredBanners(filtered);
  }, [banners, searchTerm, activeTab]);

  // Funções para gerenciar banners
  const handleAddBanner = () => {
    setCurrentBanner({
      id: '',
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      placement: 'home',
      priority: 0,
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    });
    setShowAddDialog(true);
  };

  const handleEditBanner = (banner: Banner) => {
    setCurrentBanner(banner);
    setShowEditDialog(true);
  };

  const handleDeleteBanner = (banner: Banner) => {
    setCurrentBanner(banner);
    setShowDeleteConfirm(true);
  };

  const saveBanner = (isNew: boolean) => {
    // Aqui você enviaria os dados para a API
    if (isNew) {
      // Simula adição à lista local
      const newBanner = {
        ...currentBanner,
        id: Math.random().toString(36).substr(2, 9),
      };
      setBanners([...banners, newBanner]);
      setShowAddDialog(false);
    } else {
      // Simula atualização na lista local
      setBanners(banners.map(banner => 
        banner.id === currentBanner.id ? currentBanner : banner
      ));
      setShowEditDialog(false);
    }
  };

  const confirmDelete = () => {
    // Aqui você enviaria a requisição de exclusão para a API
    setBanners(banners.filter(banner => banner.id !== currentBanner.id));
    setShowDeleteConfirm(false);
  };

  // Formata a taxa de cliques
  const formatCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  // Renderiza o componente de loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 border-4 border-t-purple-600 border-gray-200 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Banners</h1>
        <p className="text-gray-500">Crie e gerencie banners promocionais para diferentes áreas do site</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10" 
            placeholder="Buscar banners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="ml-4"
          onClick={handleAddBanner}
        >
          <Plus size={16} className="mr-2" />
          Novo Banner
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos ({banners.length})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({banners.filter(b => b.active).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({banners.filter(b => !b.active).length})</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados ({banners.filter(b => new Date(b.startDate) > new Date()).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.length > 0 ? (
          filteredBanners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden flex flex-col">
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-banner.png'
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon size={40} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!banner.active && (
                    <span className="px-2 py-1 bg-gray-800 bg-opacity-70 text-white rounded text-xs">
                      Inativo
                    </span>
                  )}
                  <span className="px-2 py-1 bg-purple-800 bg-opacity-70 text-white rounded text-xs">
                    {placementOptions.find(p => p.value === banner.placement)?.label || banner.placement}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate">{banner.title}</CardTitle>
                  <div className="text-sm text-gray-500 font-medium">P{banner.priority}</div>
                </div>
                <CardDescription className="line-clamp-2">{banner.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <LinkIcon size={14} className="mr-2" />
                    <span className="truncate">{banner.link}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar size={14} className="mr-2" />
                    <span>
                      {new Date(banner.startDate).toLocaleDateString('pt-BR')}
                      {banner.endDate ? ` - ${new Date(banner.endDate).toLocaleDateString('pt-BR')}` : ' (sem data fim)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-medium">{banner.impressions}</span> impressões
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">{banner.clicks}</span> cliques
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">{formatCTR(banner.clicks, banner.impressions)}</span> CTR
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditBanner(banner)}
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => handleDeleteBanner(banner)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Info size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Nenhum banner encontrado.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para adicionar banner */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={currentBanner.title}
                onChange={(e) => setCurrentBanner({...currentBanner, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={currentBanner.description}
                onChange={(e) => setCurrentBanner({...currentBanner, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input 
                id="imageUrl" 
                value={currentBanner.imageUrl}
                onChange={(e) => setCurrentBanner({...currentBanner, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link de Destino</Label>
              <Input 
                id="link" 
                value={currentBanner.link}
                onChange={(e) => setCurrentBanner({...currentBanner, link: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placement">Posicionamento</Label>
                <Select 
                  value={currentBanner.placement}
                  onValueChange={(value) => setCurrentBanner({...currentBanner, placement: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    {placementOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input 
                  id="priority" 
                  type="number"
                  min="0"
                  max="10"
                  value={currentBanner.priority}
                  onChange={(e) => setCurrentBanner({...currentBanner, priority: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={currentBanner.startDate}
                  onChange={(e) => setCurrentBanner({...currentBanner, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={currentBanner.endDate || ''}
                  onChange={(e) => setCurrentBanner({...currentBanner, endDate: e.target.value || null})}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Banner Ativo</Label>
                <p className="text-xs text-gray-500">Banners inativos não são exibidos</p>
              </div>
              <Switch 
                id="active" 
                checked={currentBanner.active}
                onCheckedChange={(checked) => setCurrentBanner({...currentBanner, active: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveBanner(true)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar banner */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input 
                id="edit-title" 
                value={currentBanner.title}
                onChange={(e) => setCurrentBanner({...currentBanner, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                value={currentBanner.description}
                onChange={(e) => setCurrentBanner({...currentBanner, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
              <Input 
                id="edit-imageUrl" 
                value={currentBanner.imageUrl}
                onChange={(e) => setCurrentBanner({...currentBanner, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link de Destino</Label>
              <Input 
                id="edit-link" 
                value={currentBanner.link}
                onChange={(e) => setCurrentBanner({...currentBanner, link: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-placement">Posicionamento</Label>
                <Select 
                  value={currentBanner.placement}
                  onValueChange={(value) => setCurrentBanner({...currentBanner, placement: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    {placementOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Input 
                  id="edit-priority" 
                  type="number"
                  min="0"
                  max="10"
                  value={currentBanner.priority}
                  onChange={(e) => setCurrentBanner({...currentBanner, priority: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Data de Início</Label>
                <Input 
                  id="edit-startDate" 
                  type="date"
                  value={currentBanner.startDate}
                  onChange={(e) => setCurrentBanner({...currentBanner, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Data de Fim (opcional)</Label>
                <Input 
                  id="edit-endDate" 
                  type="date"
                  value={currentBanner.endDate || ''}
                  onChange={(e) => setCurrentBanner({...currentBanner, endDate: e.target.value || null})}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-active">Banner Ativo</Label>
                <p className="text-xs text-gray-500">Banners inativos não são exibidos</p>
              </div>
              <Switch 
                id="edit-active" 
                checked={currentBanner.active}
                onCheckedChange={(checked) => setCurrentBanner({...currentBanner, active: checked})}
              />
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Estatísticas do Banner</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Impressões</p>
                  <p className="font-medium">{currentBanner.impressions}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cliques</p>
                  <p className="font-medium">{currentBanner.clicks}</p>
                </div>
                <div>
                  <p className="text-gray-500">CTR</p>
                  <p className="font-medium">{formatCTR(currentBanner.clicks, currentBanner.impressions)}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveBanner(false)}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">Tem certeza que deseja excluir o banner <strong>{currentBanner.title}</strong>?</p>
            <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Check size={16} className="mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 