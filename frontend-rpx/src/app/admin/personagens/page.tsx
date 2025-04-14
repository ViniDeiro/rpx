'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, ChevronDown, ChevronUp, Check, X, ArrowUp, ArrowDown } from 'react-feather';
import Character2D from '@/components/2d/Character2D';
import '@/components/2d/Character2D.css';
import Image from 'next/image';

// Adicionar interface para o Character
interface Character {
  id: number;
  name: string;
  type: string;
  color: string;
  isDefault: boolean;
  isFree: boolean;
  price: number;
  status: string;
  previewUrl?: string;
  [key: string]: string | number | boolean | undefined; // Para permitir acesso dinâmico às propriedades
}

// Dados simulados de personagens
const initialCharacters: Character[] = [
  { id: 1, name: 'Padrão', type: 'default', color: '#3498db', isDefault: true, isFree: true, price: 0, status: 'ativo', previewUrl: '/assets/characters/default.png' },
  { id: 2, name: 'Ninja', type: 'ninja', color: '#e74c3c', isDefault: false, isFree: true, price: 0, status: 'ativo', previewUrl: '/assets/characters/ninja.png' },
  { id: 3, name: 'Guerreiro', type: 'warrior', color: '#2ecc71', isDefault: false, isFree: true, price: 0, status: 'ativo', previewUrl: '/assets/characters/warrior.png' },
  { id: 4, name: 'Mago', type: 'mage', color: '#9b59b6', isDefault: false, isFree: false, price: 1200, status: 'ativo', previewUrl: '/assets/characters/mage.png' },
  { id: 5, name: 'Arqueiro', type: 'archer', color: '#f1c40f', isDefault: false, isFree: false, price: 800, status: 'ativo', previewUrl: '/assets/characters/archer.png' },
  { id: 6, name: 'Ninja Raro', type: 'ninja', color: '#fd79a8', isDefault: false, isFree: false, price: 2500, status: 'ativo', previewUrl: '/assets/characters/ninja_rare.png' },
  { id: 7, name: 'Guerreiro Épico', type: 'warrior', color: '#6c5ce7', isDefault: false, isFree: false, price: 3500, status: 'inativo', previewUrl: '/assets/characters/warrior_epic.png' },
];

export default function AdminPersonagens() {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [filteredStatus, setFilteredStatus] = useState<string>('all');

  // Ordenar personagens
  const sortedCharacters = [...characters].sort((a, b) => {
    const aValue = a[sortField] as string | number | boolean | undefined;
    const bValue = b[sortField] as string | number | boolean | undefined;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc'
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    return 0;
  });

  // Filtrar personagens
  const filteredCharacters = sortedCharacters.filter(
    char => char.name.toLowerCase().includes(filter.toLowerCase()) ||
           char.type.toLowerCase().includes(filter.toLowerCase()) ||
           char.status.toLowerCase().includes(filter.toLowerCase())
  );

  // Aplicar ordenação e filtros
  useEffect(() => {
    let sorted = [...filteredCharacters].sort((a, b) => {
      // Verificação segura para valores que podem ser undefined
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valueB === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (filteredStatus !== 'all') {
      const isActive = filteredStatus === 'ativo';
      sorted = sorted.filter(char => char.status === (isActive ? 'ativo' : 'inativo'));
    }

    setCharacters(sorted);
  }, [sortField, sortDirection, filteredStatus, filteredCharacters]);

  // Lidar com a ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Remover um personagem
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este personagem?')) {
      setCharacters(characters.filter(char => char.id !== id));
    }
  };

  // Editar um personagem
  const handleEdit = (character: Character) => {
    setCurrentCharacter(character);
    setIsModalOpen(true);
  };

  // Adicionar um novo personagem
  const handleAddNew = () => {
    setCurrentCharacter({
      id: characters.length + 1,
      name: '',
      type: 'default',
      color: '#3498db',
      isDefault: false,
      isFree: false,
      price: 0,
      status: 'ativo',
      previewUrl: '/assets/characters/default.png'
    });
    setIsModalOpen(true);
  };

  // Alternar status de um personagem (ativo/inativo)
  const toggleStatus = (id: number) => {
    setCharacters(characters.map(char => {
      if (char.id === id) {
        return {
          ...char,
          status: char.status === 'ativo' ? 'inativo' : 'ativo'
        };
      }
      return char;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Personagens</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Novo Personagem
        </button>
      </div>

      {/* Filtros e controles */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar personagens
            </label>
            <input
              type="text"
              id="filter"
              placeholder="Digite para buscar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="w-64">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Status
            </label>
            <select
              id="status-filter"
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de personagens */}
      <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {sortField === 'id' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visualização
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nome
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Tipo
                    {sortField === 'type' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Preço
                    {sortField === 'price' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {characters.map((character) => (
                <tr key={character.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {character.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-16 w-16 flex items-center justify-center">
                      {character.previewUrl && (
                        <Image
                          src={character.previewUrl}
                          alt={character.name}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium">
                      {character.name}
                      {character.isDefault && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                          Padrão
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {character.type.charAt(0).toUpperCase() + character.type.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {character.isFree ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Grátis
                      </span>
                    ) : (
                      formatPrice(character.price)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      character.status === 'ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {character.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEdit(character)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(character.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Excluir"
                        disabled={character.isDefault}
                      >
                        <Trash2 size={18} className={character.isDefault ? 'opacity-50 cursor-not-allowed' : ''} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(character.id)}
                        className={`${character.status === 'ativo' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                        title={character.status === 'ativo' ? 'Inativar' : 'Ativar'}
                      >
                        {character.status === 'ativo' ? <X size={18} /> : <Check size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {characters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhum personagem encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edição/criação de personagem (placeholder) */}
      {isModalOpen && currentCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {currentCharacter.id > characters.length ? 'Novo Personagem' : 'Editar Personagem'}
            </h2>
            
            <p className="text-gray-600 mb-4">
              Nesta interface você poderia editar as propriedades do personagem, 
              como nome, tipo, cor, preço, etc. Também poderia visualizar uma prévia
              das animações em tempo real.
            </p>
            
            <div className="flex justify-center mb-6">
              <div className="h-40 w-40">
                <Character2D 
                  type={currentCharacter.type} 
                  color={currentCharacter.color} 
                  animation="idle" 
                  size="large"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentCharacter.name}
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentCharacter.type}
                  disabled
                >
                  <option value="default">Padrão</option>
                  <option value="ninja">Ninja</option>
                  <option value="warrior">Guerreiro</option>
                  <option value="mage">Mago</option>
                  <option value="archer">Arqueiro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço
                </label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentCharacter.price}
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentCharacter.status}
                  disabled
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 