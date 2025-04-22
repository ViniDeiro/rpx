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
import { Trash2, Edit, Plus, Award, Search, Info, Check, X } from 'react-feather';

// Interfaces
interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  isHidden: boolean;
  isSystem: boolean;
  requiredPoints: number;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Estado para insígnia atual em edição
  const [currentBadge, setCurrentBadge] = useState<Badge>({
    id: '',
    name: '',
    description: '',
    imageUrl: '',
    criteria: '',
    isHidden: false,
    isSystem: false,
    requiredPoints: 0,
    createdAt: new Date().toISOString()
  });

  // Simula o carregamento dos dados
  useEffect(() => {
    const loadBadges = async () => {
      setIsLoading(true);
      try {
        // Substitua por uma chamada real à API quando estiver pronta
        const mockBadges: Badge[] = [
          {
            id: '1',
            name: 'Iniciante',
            description: 'Concluiu o tutorial do jogo',
            imageUrl: '/badges/iniciante.png',
            criteria: 'Completar o tutorial básico',
            isHidden: false,
            isSystem: true,
            requiredPoints: 0,
            createdAt: '2023-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Mestre do RPX',
            description: 'Alcançou 1000 pontos de experiência',
            imageUrl: '/badges/mestre.png',
            criteria: 'Obter 1000 pontos de experiência',
            isHidden: false,
            isSystem: true,
            requiredPoints: 1000,
            createdAt: '2023-01-02T00:00:00Z'
          },
          {
            id: '3',
            name: 'Campeão do Torneio',
            description: 'Venceu um torneio oficial',
            imageUrl: '/badges/campeao.png',
            criteria: 'Vencer qualquer torneio oficial',
            isHidden: false,
            isSystem: false,
            requiredPoints: 0,
            createdAt: '2023-01-03T00:00:00Z'
          },
          {
            id: '4',
            name: 'Colecionador',
            description: 'Coletou 10 itens raros',
            imageUrl: '/badges/colecionador.png',
            criteria: 'Colecionar 10 itens com raridade "raro" ou superior',
            isHidden: true,
            isSystem: false,
            requiredPoints: 100,
            createdAt: '2023-01-04T00:00:00Z'
          },
          {
            id: '5',
            name: 'Estrategista',
            description: 'Ganhou 5 partidas consecutivas',
            imageUrl: '/badges/estrategista.png',
            criteria: 'Vencer 5 partidas em sequência',
            isHidden: false,
            isSystem: true,
            requiredPoints: 50,
            createdAt: '2023-01-05T00:00:00Z'
          }
        ];
        
        // Simula um atraso da API
        setTimeout(() => {
          setBadges(mockBadges);
          setFilteredBadges(mockBadges);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar insígnias:', error);
        setIsLoading(false);
      }
    };

    loadBadges();
  }, []);

  // Atualiza a lista filtrada quando o termo de busca muda
  useEffect(() => {
    const filtered = badges.filter(badge => {
      const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           badge.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'system') return matchesSearch && badge.isSystem;
      if (activeTab === 'custom') return matchesSearch && !badge.isSystem;
      if (activeTab === 'hidden') return matchesSearch && badge.isHidden;
      
      return false;
    });
    
    setFilteredBadges(filtered);
  }, [badges, searchTerm, activeTab]);

  // Funções para gerenciar insígnias
  const handleAddBadge = () => {
    setCurrentBadge({
      id: '',
      name: '',
      description: '',
      imageUrl: '',
      criteria: '',
      isHidden: false,
      isSystem: false,
      requiredPoints: 0,
      createdAt: new Date().toISOString()
    });
    setShowAddDialog(true);
  };

  const handleEditBadge = (badge: Badge) => {
    setCurrentBadge(badge);
    setShowEditDialog(true);
  };

  const handleDeleteBadge = (badge: Badge) => {
    setCurrentBadge(badge);
    setShowDeleteConfirm(true);
  };

  const saveBadge = (isNew: boolean) => {
    // Aqui você enviaria os dados para a API
    if (isNew) {
      // Simula adição à lista local
      const newBadge = {
        ...currentBadge,
        id: Math.random().toString(36).substr(2, 9),
      };
      setBadges([...badges, newBadge]);
      setShowAddDialog(false);
    } else {
      // Simula atualização na lista local
      setBadges(badges.map(badge => 
        badge.id === currentBadge.id ? currentBadge : badge
      ));
      setShowEditDialog(false);
    }
  };

  const confirmDelete = () => {
    // Aqui você enviaria a requisição de exclusão para a API
    setBadges(badges.filter(badge => badge.id !== currentBadge.id));
    setShowDeleteConfirm(false);
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
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Insígnias</h1>
        <p className="text-gray-500">Crie e gerencie as insígnias que os usuários podem conquistar</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10" 
            placeholder="Buscar insígnias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="ml-4"
          onClick={handleAddBadge}
        >
          <Plus size={16} className="mr-2" />
          Nova Insígnia
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({badges.length})</TabsTrigger>
          <TabsTrigger value="system">Sistema ({badges.filter(b => b.isSystem).length})</TabsTrigger>
          <TabsTrigger value="custom">Personalizadas ({badges.filter(b => !b.isSystem).length})</TabsTrigger>
          <TabsTrigger value="hidden">Ocultas ({badges.filter(b => b.isHidden).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de insígnias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.length > 0 ? (
          filteredBadges.map((badge) => (
            <Card key={badge.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate">{badge.name}</CardTitle>
                  {badge.isSystem && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Sistema</span>
                  )}
                  {badge.isHidden && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Oculta</span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">{badge.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-3">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {badge.imageUrl ? (
                      <img 
                        src={badge.imageUrl} 
                        alt={badge.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-badge.png'
                        }}
                      />
                    ) : (
                      <Award size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm mb-1">
                      <span className="font-medium">Critério:</span> {badge.criteria}
                    </div>
                    {badge.requiredPoints > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Pontos:</span> {badge.requiredPoints}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditBadge(badge)}
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => handleDeleteBadge(badge)}
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
              <p className="text-gray-500">Nenhuma insígnia encontrada.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para adicionar insígnia */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Insígnia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name" 
                value={currentBadge.name}
                onChange={(e) => setCurrentBadge({...currentBadge, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={currentBadge.description}
                onChange={(e) => setCurrentBadge({...currentBadge, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input 
                id="imageUrl" 
                value={currentBadge.imageUrl}
                onChange={(e) => setCurrentBadge({...currentBadge, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Critério para Conquista</Label>
              <Input 
                id="criteria" 
                value={currentBadge.criteria}
                onChange={(e) => setCurrentBadge({...currentBadge, criteria: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredPoints">Pontos Necessários</Label>
              <Input 
                id="requiredPoints" 
                type="number"
                min="0"
                value={currentBadge.requiredPoints}
                onChange={(e) => setCurrentBadge({...currentBadge, requiredPoints: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isHidden">Ocultar Insígnia</Label>
                <p className="text-xs text-gray-500">Insígnias ocultas são surpresa para os usuários</p>
              </div>
              <Switch 
                id="isHidden" 
                checked={currentBadge.isHidden}
                onCheckedChange={(checked) => setCurrentBadge({...currentBadge, isHidden: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isSystem">Insígnia do Sistema</Label>
                <p className="text-xs text-gray-500">Insígnias do sistema são concedidas automaticamente</p>
              </div>
              <Switch 
                id="isSystem" 
                checked={currentBadge.isSystem}
                onCheckedChange={(checked) => setCurrentBadge({...currentBadge, isSystem: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveBadge(true)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar insígnia */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Insígnia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input 
                id="edit-name" 
                value={currentBadge.name}
                onChange={(e) => setCurrentBadge({...currentBadge, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                value={currentBadge.description}
                onChange={(e) => setCurrentBadge({...currentBadge, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
              <Input 
                id="edit-imageUrl" 
                value={currentBadge.imageUrl}
                onChange={(e) => setCurrentBadge({...currentBadge, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-criteria">Critério para Conquista</Label>
              <Input 
                id="edit-criteria" 
                value={currentBadge.criteria}
                onChange={(e) => setCurrentBadge({...currentBadge, criteria: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-requiredPoints">Pontos Necessários</Label>
              <Input 
                id="edit-requiredPoints" 
                type="number"
                min="0"
                value={currentBadge.requiredPoints}
                onChange={(e) => setCurrentBadge({...currentBadge, requiredPoints: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isHidden">Ocultar Insígnia</Label>
                <p className="text-xs text-gray-500">Insígnias ocultas são surpresa para os usuários</p>
              </div>
              <Switch 
                id="edit-isHidden" 
                checked={currentBadge.isHidden}
                onCheckedChange={(checked) => setCurrentBadge({...currentBadge, isHidden: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isSystem">Insígnia do Sistema</Label>
                <p className="text-xs text-gray-500">Insígnias do sistema são concedidas automaticamente</p>
              </div>
              <Switch 
                id="edit-isSystem" 
                checked={currentBadge.isSystem}
                onCheckedChange={(checked) => setCurrentBadge({...currentBadge, isSystem: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveBadge(false)}>Atualizar</Button>
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
            <p className="mb-2">Tem certeza que deseja excluir a insígnia <strong>{currentBadge.name}</strong>?</p>
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