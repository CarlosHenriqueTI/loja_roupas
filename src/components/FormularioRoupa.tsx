'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface Modelo {
  id: number;
  nome: string;
  _count?: { roupas: number };
}

interface FormularioRoupaProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  roupaParaEditar?: unknown; // Adicionado para edição
}

export function FormularioRoupa({ onSuccess, onCancel, roupaParaEditar }: FormularioRoupaProps) {
  const [loading, setLoading] = useState(false);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    ano: new Date().getFullYear(),
    preco: '',
    foto: '',
    acessorios: '',
    destaque: false,
    modeloId: ''
  });

  const criarModelosAutomaticamente = useCallback(async () => {
    try {
      console.log('🌱 Criando modelos automaticamente...');
      
      const response = await fetch('http://localhost:3001/modelos/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.sucesso && Array.isArray(data.dados)) {
          setModelos(data.dados);
          setErrorModelos(null);
          console.log('✅ Modelos criados automaticamente!');
        }
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível criar modelos automaticamente:', error);
    }
  }, []);

  const carregarModelos = useCallback(async () => {
    try {
      setLoadingModelos(true);
      setErrorModelos(null);
      console.log('🔍 Carregando modelos...');
      
      const response = await fetch('http://localhost:3001/modelos', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Dados recebidos:', data);
      
      // ✅ VALIDAÇÃO ROBUSTA
      let modelosArray: Modelo[] = [];
      
      if (data && data.sucesso && Array.isArray(data.dados)) {
        modelosArray = data.dados;
      } else if (Array.isArray(data)) {
        modelosArray = data;
      } else if (data && Array.isArray(data.modelos)) {
        modelosArray = data.modelos;
      } else {
        console.warn('⚠️ Formato inesperado, usando fallback');
        modelosArray = [];
      }
      
      // ✅ GARANTIR que é array válido
      if (!Array.isArray(modelosArray)) {
        modelosArray = [];
      }
      
      setModelos(modelosArray);
      console.log(`✅ ${modelosArray.length} modelos carregados`);
      
      // ✅ Se não há modelos, tentar criar automaticamente
      if (modelosArray.length === 0) {
        console.log('🌱 Tentando criar modelos automaticamente...');
        await criarModelosAutomaticamente();
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error);
      setErrorModelos(error instanceof Error ? error.message : 'Erro desconhecido');
      setModelos([]);
      
      // ✅ Tentar criar modelos como fallback
      await criarModelosAutomaticamente();
    } finally {
      setLoadingModelos(false);
    }
  }, [criarModelosAutomaticamente]);

  // ✅ ADICIONAR useEffect que estava faltando!
  useEffect(() => {
    carregarModelos();
  }, [carregarModelos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/roupas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          preco: parseFloat(formData.preco),
          ano: parseInt(formData.ano.toString()),
          modeloId: parseInt(formData.modeloId)
        })
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        alert(`✅ Roupa criada: ${data.dados.nome}`);
        
        setFormData({
          nome: '',
          marca: '',
          ano: new Date().getFullYear(),
          preco: '',
          foto: '',
          acessorios: '',
          destaque: false,
          modeloId: ''
        });
        
        onSuccess?.();
      } else {
        alert(`❌ Erro: ${data.erro || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('❌ Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // ✅ GARANTIR que modelos sempre é array
  const modelosSeguro = Array.isArray(modelos) ? modelos : [];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {roupaParaEditar ? "Editar Roupa" : "Adicionar Nova Roupa"}
        </h2>
      </div>

      {/* Status dos Modelos */}
      {loadingModelos && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
            <span className="text-blue-700">Carregando modelos...</span>
          </div>
        </div>
      )}

      {errorModelos && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-red-700">
            ❌ {errorModelos}
            <button 
              onClick={carregarModelos}
              className="ml-2 text-blue-600 hover:underline text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {!loadingModelos && !errorModelos && modelosSeguro.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-yellow-700">
            ⚠️ Nenhum modelo encontrado.
            <button 
              onClick={criarModelosAutomaticamente}
              className="ml-2 text-blue-600 hover:underline text-sm"
            >
              Criar modelos padrão
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome da Roupa *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Ex: Camiseta Premium"
          />
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marca *
          </label>
          <input
            type="text"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Ex: Fashion Brand"
          />
        </div>

        {/* Ano e Preço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ano *
            </label>
            <input
              type="number"
              name="ano"
              value={formData.ano}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preço (R$) *
            </label>
            <input
              type="number"
              name="preco"
              value={formData.preco}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="99.99"
            />
          </div>
        </div>

        {/* URL da Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL da Foto *
          </label>
          <input
            type="url"
            name="foto"
            value={formData.foto}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="https://exemplo.com/imagem.jpg"
          />
          {formData.foto && (
            <div className="mt-2">
              <Image 
                src={formData.foto} 
                alt="Preview" 
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Modelo - ULTRA SEGURO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modelo * 
            <span className="text-xs text-gray-500">
              ({modelosSeguro.length} disponível{modelosSeguro.length !== 1 ? 'is' : ''})
            </span>
          </label>
          
          <select
            name="modeloId"
            value={formData.modeloId}
            onChange={handleChange}
            required
            disabled={loadingModelos || modelosSeguro.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">
              {loadingModelos 
                ? 'Carregando...' 
                : modelosSeguro.length === 0
                ? 'Nenhum modelo disponível'
                : 'Selecione um modelo'
              }
            </option>
            {modelosSeguro.map(modelo => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nome}
                {modelo._count && ` (${modelo._count.roupas} produto${modelo._count.roupas !== 1 ? 's' : ''})`}
              </option>
            ))}
          </select>
        </div>

        {/* Acessórios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Acessórios
          </label>
          <textarea
            name="acessorios"
            value={formData.acessorios}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Descreva os acessórios..."
          />
        </div>

        {/* Destaque */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="destaque"
            checked={formData.destaque}
            onChange={handleChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Produto em destaque
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading || loadingModelos || modelosSeguro.length === 0}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Salvando...
              </span>
            ) : (
              'Salvar Roupa'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Info sobre o estado */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📊 Status:</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>• Modelos carregados: {modelosSeguro.length}</div>
          <div>• Status: {loadingModelos ? 'Carregando...' : errorModelos ? 'Erro' : 'Pronto'}</div>
          <div>• API: http://localhost:3001/modelos</div>
        </div>
      </div>

      {/* Debug (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">🔧 Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
            {JSON.stringify({
              modelosLength: modelosSeguro.length,
              modelosType: typeof modelos,
              isArray: Array.isArray(modelos),
              loading: loadingModelos,
              error: errorModelos,
              amostra: modelosSeguro.slice(0, 2),
              formData: {
                ...formData,
                modeloId: formData.modeloId || 'vazio'
              }
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default FormularioRoupa;