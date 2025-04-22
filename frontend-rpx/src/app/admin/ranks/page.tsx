'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Plus, Star, Search, ChevronUp, ChevronDown, Check, X } from 'react-feather';

// Interfaces
interface Rank {
  id: string;
  name: string;
  description: string;
  level: number;
  requiredXP: number;
  imageUrl: string;
  benefits: string[];
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminRanksPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [filteredRanks, setFilteredRanks] = useState<Rank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estado para rank atual em edição
  const [currentRank, setCurrentRank] = useState<Rank>({
    id: '',
    name: '',
    description: '',
    level: 1,
    requiredXP: 0,
    imageUrl: '',
    benefits: [''],
    color: '#6B46C1', // Cor roxa padrão
    createdAt: new Date().toISOString()
  });

  // Estado para benefício temporário durante edição
  const [benefitInput, setBenefitInput] = useState('');

  // Simula o carregamento dos dados
  useEffect(() => {
    const loadRanks = async () => {
      setIsLoading(true);
      try {
        // Substitua por uma chamada real à API quando estiver pronta
        const mockRanks: Rank[] = [
          {
            id: '1',
            name: 'Novato',
            description: 'Jogador iniciante no RPX',
            level: 1,
            requiredXP: 0,
            imageUrl: '/ranks/novato.png',
            benefits: ['Acesso a missões básicas'],
            color: '#4B5563', // Cinza
            createdAt: '2023-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Aprendiz',
            description: 'Jogador com alguma experiência',
            level: 2,
            requiredXP: 100,
            imageUrl: '/ranks/aprendiz.png',
            benefits: ['Acesso a missões intermediárias', '+5% de recompensa em partidas'],
            color: '#10B981', // Verde
            createdAt: '2023-01-02T00:00:00Z'
          },
          {
            id: '3',
            name: 'Especialista',
            description: 'Jogador com bom conhecimento do jogo',
            level: 3,
            requiredXP: 300,
            imageUrl: '/ranks/especialista.png',
            benefits: ['Acesso a todas as missões', '+10% de recompensa em partidas', 'Emblema exclusivo'],
            color: '#3B82F6', // Azul
            createdAt: '2023-01-03T00:00:00Z'
          },
          {
            id: '4',
            name: 'Mestre',
            description: 'Jogador de elite no RPX',
            level: 4,
            requiredXP: 700,
            imageUrl: '/ranks/mestre.png',
            benefits: ['Acesso a todas as missões', '+15% de recompensa em partidas', 'Emblema exclusivo', 'Customização avançada'],
            color: '#EC4899', // Rosa
            createdAt: '2023-01-04T00:00:00Z'
          },
          {
            id: '5',
            name: 'Lendário',
            description: 'Entre os melhores jogadores do RPX',
            level: 5,
            requiredXP: 1500,
            imageUrl: '/ranks/lendario.png',
            benefits: ['Acesso a todas as missões', '+20% de recompensa em partidas', 'Emblema exclusivo', 'Customização avançada', 'Convites para eventos especiais'],
            color: '#F59E0B', // Âmbar
            createdAt: '2023-01-05T00:00:00Z'
          }
        ];
        
        // Ordenar ranks pelo nível
        const sortedRanks = [...mockRanks].sort((a, b) => a.level - b.level);
        
        // Simula um atraso da API
        setTimeout(() => {
          setRanks(sortedRanks);
          setFilteredRanks(sortedRanks);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar ranks:', error);
        setIsLoading(false);
      }
    };

    loadRanks();
  }, []);

  // Atualiza a lista filtrada quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRanks(ranks);
    } else {
      const filtered = ranks.filter(rank => 
        rank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rank.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRanks(filtered);
    }
  }, [ranks, searchTerm]);

  // Funções para gerenciar ranks
  const handleAddRank = () => {
    setCurrentRank({
      id: '',
      name: '',
      description: '',
      level: ranks.length > 0 ? Math.max(...ranks.map(r => r.level)) + 1 : 1,
      requiredXP: 0,
      imageUrl: '',
      benefits: [''],
      color: '#6B46C1',
      createdAt: new Date().toISOString()
    });
    setBenefitInput('');
    setShowAddDialog(true);
  };

  const handleEditRank = (rank: Rank) => {
    setCurrentRank(rank);
    setBenefitInput('');
    setShowEditDialog(true);
  };

  const handleDeleteRank = (rank: Rank) => {
    setCurrentRank(rank);
    setShowDeleteConfirm(true);
  };

  const moveRankUp = (index: number) => {
    if (index <= 0) return;
    
    const newRanks = [...ranks];
    [newRanks[index - 1], newRanks[index]] = [newRanks[index], newRanks[index - 1]];
    
    // Atualizar níveis
    newRanks.forEach((rank, idx) => {
      rank.level = idx + 1;
    });
    
    setRanks(newRanks);
    setFilteredRanks(newRanks);
  };

  const moveRankDown = (index: number) => {
    if (index >= ranks.length - 1) return;
    
    const newRanks = [...ranks];
    [newRanks[index], newRanks[index + 1]] = [newRanks[index + 1], newRanks[index]];
    
    // Atualizar níveis
    newRanks.forEach((rank, idx) => {
      rank.level = idx + 1;
    });
    
    setRanks(newRanks);
    setFilteredRanks(newRanks);
  };

  const addBenefit = () => {
    if (benefitInput.trim() === '') return;
    
    setCurrentRank({
      ...currentRank,
      benefits: [...currentRank.benefits, benefitInput.trim()]
    });
    
    setBenefitInput('');
  };

  const removeBenefit = (index: number) => {
    const newBenefits = [...currentRank.benefits];
    newBenefits.splice(index, 1);
    
    setCurrentRank({
      ...currentRank,
      benefits: newBenefits
    });
  };

  const saveRank = (isNew: boolean) => {
    // Aqui você enviaria os dados para a API
    if (isNew) {
      // Simula adição à lista local
      const newRank = {
        ...currentRank,
        id: Math.random().toString(36).substr(2, 9),
      };
      
      const newRanks = [...ranks, newRank].sort((a, b) => a.level - b.level);
      setRanks(newRanks);
      setShowAddDialog(false);
    } else {
      // Simula atualização na lista local
      const updatedRanks = ranks.map(rank => 
        rank.id === currentRank.id ? currentRank : rank
      ).sort((a, b) => a.level - b.level);
      
      setRanks(updatedRanks);
      setShowEditDialog(false);
    }
  };

  const confirmDelete = () => {
    // Aqui você enviaria a requisição de exclusão para a API
    const newRanks = ranks.filter(rank => rank.id !== currentRank.id);
    
    // Reajustar níveis após exclusão
    newRanks.sort((a, b) => a.level - b.level).forEach((rank, idx) => {
      rank.level = idx + 1;
    });
    
    setRanks(newRanks);
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
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Ranks</h1>
        <p className="text-gray-500">Configure os níveis de progressão dos jogadores no sistema</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10" 
            placeholder="Buscar ranks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="ml-4"
          onClick={handleAddRank}
        >
          <Plus size={16} className="mr-2" />
          Novo Rank
        </Button>
      </div>

      {/* Tabela de ranks */}
      <Card>
        <CardHeader>
          <CardTitle>Hierarquia de Ranks</CardTitle>
          <CardDescription>Organize os ranks em ordem crescente de nível</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nível</TableHead>
                <TableHead className="w-16">Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>XP Necessário</TableHead>
                <TableHead>Benefícios</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRanks.length > 0 ? (
                filteredRanks.map((rank, index) => (
                  <TableRow key={rank.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="font-bold">{rank.level}</div>
                        <div className="flex flex-col">
                          <button 
                            onClick={() => moveRankUp(index)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            onClick={() => moveRankDown(index)}
                            disabled={index === filteredRanks.length - 1}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-200" 
                        style={{ backgroundColor: rank.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{rank.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{rank.description}</div>
                    </TableCell>
                    <TableCell>{rank.requiredXP} XP</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-sm">
                        {rank.benefits.slice(0, 2).map((benefit, idx) => (
                          <li key={idx} className="line-clamp-1">{benefit}</li>
                        ))}
                        {rank.benefits.length > 2 && (
                          <li className="text-gray-500">+{rank.benefits.length - 2} mais</li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRank(rank)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDeleteRank(rank)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="text-center">
                      <Star size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Nenhum rank encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para adicionar rank */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Rank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={currentRank.name}
                  onChange={(e) => setCurrentRank({...currentRank, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Input 
                  id="level" 
                  type="number"
                  min="1"
                  value={currentRank.level}
                  onChange={(e) => setCurrentRank({...currentRank, level: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={currentRank.description}
                onChange={(e) => setCurrentRank({...currentRank, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredXP">XP Necessário</Label>
                <Input 
                  id="requiredXP" 
                  type="number"
                  min="0"
                  value={currentRank.requiredXP}
                  onChange={(e) => setCurrentRank({...currentRank, requiredXP: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor do Rank</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="color" 
                    type="color"
                    value={currentRank.color}
                    onChange={(e) => setCurrentRank({...currentRank, color: e.target.value})}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={currentRank.color}
                    onChange={(e) => setCurrentRank({...currentRank, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input 
                id="imageUrl" 
                value={currentRank.imageUrl}
                onChange={(e) => setCurrentRank({...currentRank, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Benefícios</Label>
              <div className="flex gap-2">
                <Input 
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Adicionar novo benefício"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                />
                <Button type="button" onClick={addBenefit}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {currentRank.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{benefit}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeBenefit(index)}
                      className="h-7 w-7 p-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                {currentRank.benefits.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Nenhum benefício adicionado.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveRank(true)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar rank */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Rank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input 
                  id="edit-name" 
                  value={currentRank.name}
                  onChange={(e) => setCurrentRank({...currentRank, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-level">Nível</Label>
                <Input 
                  id="edit-level" 
                  type="number"
                  min="1"
                  value={currentRank.level}
                  onChange={(e) => setCurrentRank({...currentRank, level: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                value={currentRank.description}
                onChange={(e) => setCurrentRank({...currentRank, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-requiredXP">XP Necessário</Label>
                <Input 
                  id="edit-requiredXP" 
                  type="number"
                  min="0"
                  value={currentRank.requiredXP}
                  onChange={(e) => setCurrentRank({...currentRank, requiredXP: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Cor do Rank</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="edit-color" 
                    type="color"
                    value={currentRank.color}
                    onChange={(e) => setCurrentRank({...currentRank, color: e.target.value})}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={currentRank.color}
                    onChange={(e) => setCurrentRank({...currentRank, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
              <Input 
                id="edit-imageUrl" 
                value={currentRank.imageUrl}
                onChange={(e) => setCurrentRank({...currentRank, imageUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Benefícios</Label>
              <div className="flex gap-2">
                <Input 
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Adicionar novo benefício"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                />
                <Button type="button" onClick={addBenefit}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {currentRank.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{benefit}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeBenefit(index)}
                      className="h-7 w-7 p-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                {currentRank.benefits.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Nenhum benefício adicionado.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveRank(false)}>Atualizar</Button>
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
            <p className="mb-2">Tem certeza que deseja excluir o rank <strong>{currentRank.name}</strong>?</p>
            <p className="text-sm text-gray-500">Esta ação não pode ser desfeita e afetará a hierarquia dos ranks.</p>
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