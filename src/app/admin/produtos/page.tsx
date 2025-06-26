"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Package, Upload, X, Plus, Trash2, Edit3, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  imagens: string[];
  estoque: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    interacoes: number;
  };
}

interface FormData {
  nome: string;
  descricao: string;
  preco: string;
  imagemUrl: string; // Para a imagem principal
  estoque: string;
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    descricao: "",
    preco: "",
    imagemUrl: "",
    estoque: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData & { novasImagens?: string }>>({});
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);

  // Estados para múltiplas imagens
  const [imagensAtuaisUrls, setImagensAtuaisUrls] = useState<string[]>([]);
  const [novasImagensFiles, setNovasImagensFiles] = useState<File[]>([]);
  const [novasImagensPreviews, setNovasImagensPreviews] = useState<string[]>([]); // Estado para URLs de preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Estados de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Refs para controlar toasts e evitar duplicidade
  const mountedRef = useRef(false);
  const toastRefs = useRef<{ [key: string]: string | number }>({});
  const initialLoadRef = useRef(false);
  const fetchingRef = useRef(false);

  // ✅ Effect para controlar montagem
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      initialLoadRef.current = false;
      // ✅ Limpar todos os toasts ao desmontar
      Object.values(toastRefs.current).forEach(toastId => {
        toast.dismiss(toastId);
      });
      toastRefs.current = {};
    };
  }, []);

  // ✅ Função para gerenciar toasts sem duplicidade
  const showToast = useCallback((type: 'loading' | 'success' | 'error' | 'info' | 'warning', key: string, title: string, description?: string, showToastUI = true) => {
    // ✅ Se showToastUI for false, não mostrar toast (para carregamento inicial silencioso)
    if (!showToastUI) {
      return null;
    }

    // ✅ Dismiss toast anterior com a mesma chave
    if (toastRefs.current[key]) {
      toast.dismiss(toastRefs.current[key]);
      delete toastRefs.current[key];
    }

    let toastId: string | number;
    
    switch (type) {
      case 'loading':
        toastId = toast.loading(title, { description });
        break;
      case 'success':
        toastId = toast.success(title, { description, duration: 3000 });
        break;
      case 'error':
        toastId = toast.error(title, { description, duration: 5000 });
        break;
      case 'info':
        toastId = toast.info(title, { description, duration: 2000 });
        break;
      case 'warning':
        toastId = toast.warning(title, { description, duration: 4000 });
        break;
      default:
        return null;
    }
    
    toastRefs.current[key] = toastId;
    
    // ✅ Auto-limpar referência após o toast expirar
    const duration = type === 'error' ? 5000 : type === 'success' ? 3000 : type === 'warning' ? 4000 : type === 'loading' ? 10000 : 2000;
    setTimeout(() => {
      if (toastRefs.current[key] === toastId) {
        delete toastRefs.current[key];
      }
    }, duration);
    
    return toastId;
  }, []);

  // ✅ Carregar produtos otimizado
  const carregarProdutos = useCallback(async (isInitialLoad = false) => {
    // ✅ Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) {
      console.log('🔄 [Frontend] Fetch já em andamento, ignorando...');
      return;
    }

    if (!mountedRef.current) {
      console.log('🚫 [Frontend] Componente não montado, ignorando fetch');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('📡 [Frontend] Carregando produtos...', { isInitialLoad });
      
      // ✅ Toast de loading apenas se não for carregamento inicial OU se for um refresh manual
      const shouldShowToast = !isInitialLoad || initialLoadRef.current;
      
      if (shouldShowToast) {
        showToast('loading', 'loadProducts', 'Carregando produtos...', 'Buscando produtos do catálogo');
      }

      const response = await fetch("/api/produtos");
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        if (mountedRef.current) {
          setProdutos(data.data);
          
          // ✅ Marcar que o carregamento inicial foi feito
          if (isInitialLoad) {
            initialLoadRef.current = true;
          }
          
          // ✅ Toast de sucesso apenas se mostrou loading
          if (shouldShowToast) {
            showToast('success', 'loadProducts', 'Produtos carregados!', 
              `${data.data.length} produto(s) encontrado(s)`);
          }
          
          console.log(`✅ [Frontend] ${data.data.length} produtos carregados`);
        }
      } else {
        if (mountedRef.current) {
          setProdutos([]);
          
          if (shouldShowToast) {
            showToast('info', 'loadProducts', 'Nenhum produto encontrado', 
              'O catálogo está vazio');
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error);
      
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        setError(errorMessage);
        setProdutos([]);
        
        // ✅ Toast de erro sempre mostrar (importante para o usuário saber)
        showToast('error', 'loadProducts', 'Erro ao carregar produtos', 
          'Não foi possível conectar ao servidor');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [showToast]);

  // ✅ Effect para carregamento inicial (SEM TOAST)
  useEffect(() => {
    console.log('🔄 [Frontend] useEffect inicial - InitialLoad:', initialLoadRef.current);
    
    if (mountedRef.current && !initialLoadRef.current) {
      console.log('🚀 [Frontend] Executando carregamento inicial silencioso');
      carregarProdutos(true); // ✅ isInitialLoad = true (sem toast)
    }
  }, [carregarProdutos]);

  // Efeito para criar e limpar ObjectURLs para previews de novas imagens
  useEffect(() => {
    if (novasImagensFiles.length === 0) {
      setNovasImagensPreviews([]);
      return;
    }

    const objectUrls = novasImagensFiles.map(file => URL.createObjectURL(file));
    setNovasImagensPreviews(objectUrls);

    // Cleanup function
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [novasImagensFiles]);

  // ✅ Validar URL
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  // ✅ Validar formulário sem verificar URLs externas
  const validarFormulario = (): boolean => {
    const errors: Partial<FormData & { novasImagens?: string }> = {};
    
    if (!formData.nome.trim()) {
      errors.nome = "Nome é obrigatório";
    }
    
    if (!formData.preco.trim()) {
      errors.preco = "Preço é obrigatório";
    } else {
      const precoNum = parseFloat(formData.preco);
      if (isNaN(precoNum) || precoNum <= 0) {
        errors.preco = "Preço deve ser um número positivo";
      }
    }
    
    if (!formData.estoque.trim()) {
      errors.estoque = "Estoque é obrigatório";
    } else {
      const estoqueNum = parseInt(formData.estoque);
      if (isNaN(estoqueNum) || estoqueNum < 0) {
        errors.estoque = "Estoque deve ser um número válido";
      }
    }
    
    // ✅ Validação simples de URL (opcional) - SEM tentar acessar
    if (formData.imagemUrl.trim()) {
      const url = formData.imagemUrl.trim();
      // Apenas verificar se parece com uma URL válida OU um caminho local
      if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('./')) {
        errors.imagemUrl = "URL da imagem deve começar com http, / ou ./";
      }
      // ✅ Bloquear via.placeholder.com especificamente
      if (url.includes('via.placeholder.com')) {
        errors.imagemUrl = "Use uma imagem local ou de outro serviço (via.placeholder.com está indisponível)";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Lidar com submissão do formulário (Adicionar ou Editar)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setFormLoading(true);
    
    // ✅ Toast de loading único
    const operationType = produtoEmEdicao ? 'update' : 'create';
    const loadingMessage = produtoEmEdicao ? "Atualizando produto..." : "Adicionando produto...";
    showToast('loading', `${operationType}Product`, loadingMessage);

    const submissionData = new FormData();
    submissionData.append("nome", formData.nome.trim());
    submissionData.append("descricao", formData.descricao.trim());
    submissionData.append("preco", formData.preco);
    submissionData.append("estoque", formData.estoque);
    submissionData.append("imagemUrl", formData.imagemUrl.trim()); // Imagem principal

    submissionData.append("imagensExistentes", JSON.stringify(imagensAtuaisUrls));

    novasImagensFiles.forEach((file) => {
      submissionData.append("novasImagens", file);
    });

    try {
      let response;
      let successMessage: string;
      const method = produtoEmEdicao ? "PUT" : "POST";
      const endpoint = produtoEmEdicao ? `/api/produtos/${produtoEmEdicao.id}` : "/api/produtos";

      response = await fetch(endpoint, {
        method: method,
        body: submissionData, 
      });
      successMessage = produtoEmEdicao ? "Produto atualizado com sucesso!" : "Produto adicionado com sucesso!";
      
      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Toast de sucesso único
        showToast('success', `${operationType}Product`, successMessage, 
          `O produto "${formData.nome}" foi ${produtoEmEdicao ? 'atualizado' : 'adicionado'} ao catálogo`);
        
        resetFormAndHide();
        carregarProdutos(false); // ✅ Com toast
      } else {
        // ✅ Toast de erro único
        showToast('error', `${operationType}Product`, 'Erro ao salvar produto', 
          data.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("❌ Erro ao salvar produto:", error);
      // ✅ Toast de erro único
      showToast('error', `${operationType}Product`, 'Erro de conexão', 
        'Não foi possível conectar ao servidor');
    } finally {
      setFormLoading(false);
    }
  };

  const resetFormAndHide = () => {
    setFormData({ nome: "", descricao: "", preco: "", imagemUrl: "", estoque: "" });
    setFormErrors({});
    setProdutoEmEdicao(null);
    setImagensAtuaisUrls([]);
    setNovasImagensFiles([]); // Isso irá disparar o useEffect para limpar novasImagensPreviews
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    setShowForm(false);
  };

  // ✅ Função para confirmar exclusão
  const confirmarExclusao = useCallback((produto: Produto) => {
    setProdutoParaExcluir(produto);
    setShowDeleteModal(true);
    showToast('warning', 'confirmDelete', 'Confirme a exclusão', 
      `Você está prestes a excluir "${produto.nome}"`);
  }, [showToast]);

  // ✅ Deletar produto corrigido - AGORA FUNCIONA COM INTERAÇÕES
  const deletarProduto = useCallback(async (produto: Produto) => {
    if (!produto) {
      showToast('error', 'deleteError', 'Produto inválido');
      return;
    }

    setDeletingId(produto.id);
    
    try {
      console.log(`🗑️ [Frontend] Iniciando exclusão do produto: ${produto.nome} (ID: ${produto.id})`);
      
      // ✅ Toast de loading único
      showToast('loading', `deleteProduct`, 'Excluindo produto...', 
        `Removendo "${produto.nome}" do catálogo${produto._count?.interacoes ? ` e ${produto._count.interacoes} interação(ões)` : ''}`);
      
      const response = await fetch(`/api/produtos/${produto.id}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 [Frontend] Status da resposta de exclusão:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Frontend] Produto excluído com sucesso:', data);
        
        // ✅ Atualizar lista local
        if (mountedRef.current) {
          setProdutos(prev => prev.filter(p => p.id !== produto.id));
          
          // ✅ Toast de sucesso com informações sobre interações removidas
          const interacoesMsg = data.meta?.interacoesRemovidas > 0 
            ? ` e ${data.meta.interacoesRemovidas} interação(ões)` 
            : '';
          
          showToast('success', `deleteProduct`, 'Produto excluído!', 
            `"${produto.nome}" foi removido do catálogo${interacoesMsg}`);
        }
        
        setShowDeleteModal(false);
        setProdutoParaExcluir(null);
        
      } else {
        let errorMessage = 'Erro ao excluir produto';
        
        try {
          const data = await response.json();
          console.error('❌ [Frontend] Erro da API:', data);
          
          if (response.status === 409) {
            // Conflito - mas agora deveria funcionar
            if (data.code === 'FOREIGN_KEY_CONSTRAINT') {
              errorMessage = `Não é possível excluir "${produto.nome}" pois ele está referenciado em pedidos ou outros registros importantes.`;
            } else {
              errorMessage = data.error || 'Produto não pode ser excluído devido a dependências.';
            }
          } else if (response.status === 404) {
            errorMessage = 'Produto não encontrado. Talvez já tenha sido excluído.';
          } else {
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.error('❌ [Frontend] Erro ao parsear resposta:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao excluir produto:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir produto';
      
      // ✅ Toast de erro único
      showToast('error', `deleteProduct`, 'Erro ao excluir produto', errorMessage);
    } finally {
      setDeletingId(null);
    }
  }, [showToast]);

  const handleFormCancel = useCallback(() => {
    resetFormAndHide();
    showToast('info', 'cancelForm', 'Operação cancelada');
  }, [showToast]);

  // ✅ Editar produto otimizado
  const editarProduto = useCallback((produto: Produto) => {
    setProdutoEmEdicao(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || "",
      preco: produto.preco.toString(),
      imagemUrl: produto.imagemUrl || "",
      estoque: produto.estoque.toString(),
    });
    setImagensAtuaisUrls(produto.imagens || []);
    setNovasImagensFiles([]);
    setFormErrors({});
    setShowForm(true);
    
    showToast('info', 'editProduct', 'Editando produto', `Carregado: "${produto.nome}"`);
  }, [showToast]);

  // ✅ Lidar com múltiplas imagens otimizado
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const maxFiles = 5;
      
      if (filesArray.length > maxFiles) {
        showToast('warning', 'imageLimit', 'Muitas imagens selecionadas', 
          `Máximo de ${maxFiles} imagens permitidas`);
        return;
      }

      // Validar tamanho dos arquivos
      const maxSize = 5 * 1024 * 1024; // 5MB
      const invalidFiles = filesArray.filter(file => file.size > maxSize);
      
      if (invalidFiles.length > 0) {
        showToast('error', 'imageSize', 'Arquivos muito grandes', 
          'Cada imagem deve ter no máximo 5MB');
        return;
      }

      setNovasImagensFiles(filesArray);
      showToast('success', 'imageSelect', 'Imagens selecionadas', 
        `${filesArray.length} imagem(ns) adicionada(s)`);
    }
  };

  // ✅ Remover imagem atual otimizado
  const removerImagemAtual = useCallback((index: number) => {
    const novasImagens = imagensAtuaisUrls.filter((_, i) => i !== index);
    setImagensAtuaisUrls(novasImagens);
    showToast('info', 'removeCurrentImage', 'Imagem removida', 
      'A alteração será salva quando você atualizar o produto');
  }, [imagensAtuaisUrls, showToast]);

  // ✅ Remover nova imagem otimizado
  const removerNovaImagem = useCallback((index: number) => {
    const novosFiles = novasImagensFiles.filter((_, i) => i !== index);
    setNovasImagensFiles(novosFiles);
    showToast('info', 'removeNewImage', 'Imagem removida da seleção');
  }, [novasImagensFiles, showToast]);

  // ✅ Função para refresh manual
  const handleRefresh = useCallback(() => {
    if (!fetchingRef.current && mountedRef.current) {
      showToast('info', 'refresh', 'Atualizando catálogo...', 'Recarregando produtos');
      carregarProdutos(false); // ✅ Com toast
    }
  }, [carregarProdutos, showToast]);

  // ✅ Loading silencioso na primeira carga
  if (loading && !initialLoadRef.current) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Carregando Produtos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Buscando produtos do catálogo...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erro ao carregar produtos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={fetchingRef.current}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {fetchingRef.current ? 'Carregando...' : 'Tentar Novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Produtos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {produtos.length} produto(s) no catálogo
          </p>
        </div>
        <button
          onClick={() => {
            setProdutoEmEdicao(null);
            setFormData({
              nome: "",
              descricao: "",
              preco: "",
              imagemUrl: "",
              estoque: "",
            });
            setImagensAtuaisUrls([]);
            setNovasImagensFiles([]);
            setFormErrors({});
            setShowForm(true);
            showToast('info', 'newProduct', 'Adicionando novo produto', 'Formulário aberto');
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium transform hover:scale-105 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Novo Produto
        </button>
      </div>

      {/* Formulário (Modal) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {produtoEmEdicao ? "Editar Produto" : "Novo Produto"}
              </h2>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Camiseta Básica"
                />
                {formErrors.nome && <p className="text-red-500 text-sm mt-1">{formErrors.nome}</p>}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              {/* Preço e Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                  {formErrors.preco && <p className="text-red-500 text-sm mt-1">{formErrors.preco}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                  {formErrors.estoque && <p className="text-red-500 text-sm mt-1">{formErrors.estoque}</p>}
                </div>
              </div>

              {/* Imagem Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL da Imagem Principal
                </label>
                <input
                  type="text"
                  value={formData.imagemUrl}
                  onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="/images/produtos/minha-imagem.jpg (deixe vazio para usar padrão)"
                />
                {formErrors.imagemUrl && <p className="text-red-500 text-sm mt-1">{formErrors.imagemUrl}</p>}
                <p className="text-gray-500 text-xs mt-1">
                  Use URLs completas (https://...) ou caminhos locais (/images/...).
                  <br />
                  <strong>Evite via.placeholder.com</strong> - serviço instável.
                </p>
              </div>

              {/* Múltiplas Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagens Adicionais
                </label>
                
                {/* Imagens Atuais */}
                {imagensAtuaisUrls.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Imagens Atuais:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {imagensAtuaisUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Imagem atual ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removerImagemAtual(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload de novas imagens */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                {/* Preview das novas imagens */}
                {novasImagensPreviews.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Novas Imagens:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {novasImagensPreviews.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Nova imagem ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removerNovaImagem(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {formLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {produtoEmEdicao ? "Atualizando..." : "Salvando..."}
                    </div>
                  ) : (
                    produtoEmEdicao ? "Atualizar Produto" : "Adicionar Produto"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modal de Confirmação de Exclusão ATUALIZADO */}
      {showDeleteModal && produtoParaExcluir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Você está prestes a excluir o produto:
                </p>
                <div className="font-medium text-gray-900 dark:text-white">
                  {produtoParaExcluir.nome}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Preço: R$ {Number(produtoParaExcluir.preco).toFixed(2)} • Estoque: {produtoParaExcluir.estoque}
                </div>
                {produtoParaExcluir._count && produtoParaExcluir._count.interacoes > 0 && (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <strong>⚠️ Atenção:</strong> Este produto possui {produtoParaExcluir._count.interacoes} avaliação(ões)/comentário(s) que também serão removidas automaticamente.
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ✅ A exclusão agora remove automaticamente todas as dependências
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProdutoParaExcluir(null);
                    showToast('info', 'deleteCancel', 'Exclusão cancelada');
                  }}
                  disabled={deletingId === produtoParaExcluir.id}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deletarProduto(produtoParaExcluir)}
                  disabled={deletingId === produtoParaExcluir.id}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingId === produtoParaExcluir.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir Produto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Produtos Cadastrados
              </h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={fetchingRef.current}
              className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors disabled:opacity-50 flex items-center gap-1"
              title="Atualizar lista"
            >
              <div className={`${fetchingRef.current ? 'animate-spin' : ''}`}>🔄</div>
              {fetchingRef.current ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum produto cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece adicionando seu primeiro produto ao catálogo
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Adicionar Primeiro Produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {produto.imagemUrl && (
                    <div className="aspect-w-1 aspect-h-1">
                      <Image
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {produto.nome}
                    </h3>
                    
                    {produto.descricao && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {produto.descricao}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-green-600">
                        R$ {Number(produto.preco).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Estoque: {produto.estoque}
                      </span>
                    </div>
                    
                    {produto.imagens && produto.imagens.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        +{produto.imagens.length} imagem(ns) adicional(is)
                      </p>
                    )}
                    
                    {produto._count && produto._count.interacoes > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        {produto._count.interacoes} avaliação(ões) • ✅ Exclusão automática
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarProduto(produto)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => confirmarExclusao(produto)}
                        disabled={deletingId === produto.id}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === produto.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deletingId === produto.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}