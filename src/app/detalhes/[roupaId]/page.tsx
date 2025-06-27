"use client";

import { useState, useEffect, useMemo, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  MessageSquare, 
  User, 
  ArrowLeft,
  Package,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  LogIn
} from "lucide-react";
import Loading from "@/components/LoadingProps";
import { useAuth } from "@/context/AuthContext";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  imagens?: string[];
  estoque: number;
  categoria?: string;
  disponivel?: boolean;
  tamanhos?: string[] | string;
  cores?: string[] | string;
  createdAt: string;
  updatedAt: string;
}

interface Interacao {
  id: number;
  tipo: string;
  conteudo: string;
  nota?: number;
  clienteId: number;
  produtoId: number;
  createdAt: string;
  cliente: {
    id: number;
    nome: string;
    email: string;
  };
}

interface ProdutoPageProps {
  params: Promise<{ roupaId: string }>;
}

interface CarrinhoItem {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  tamanho: string;
  cor: string;
  imagemUrl: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const PLACEHOLDER_IMAGE = '/placeholder-product.jpg';
const TOAST_DEBOUNCE_TIME = 1000;
const TOAST_DURATIONS = {
  loading: 0, // ✅ Sem timeout para loading
  success: 4000,
  error: 6000,
  warning: 4000,
  info: 3000
} as const;

const BENEFITS = [
  { icon: Truck, text: "Frete grátis acima de R$ 150" },
  { icon: RotateCcw, text: "30 dias para troca" },
  { icon: Shield, text: "Compra 100% segura" },
  { icon: Package, text: "Entrega em 2-5 dias úteis" }
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatPrice = (preco: number | string): string => {
  const numeroPreco = typeof preco === 'string' ? parseFloat(preco) : preco;
  return numeroPreco.toFixed(2);
};

const processArray = (valor: string[] | string | null | undefined): string[] => {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [valor];
    }
  }
  return [];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================================================
// CUSTOM HOOKS - ✅ CORRIGIDO
// ============================================================================
const useToastManager = () => {
  const toastRefs = useRef<{ [key: string]: string | number }>({});
  const lastActionTime = useRef<{ [key: string]: number }>({});

  const dismissToast = useCallback((key: string) => {
    if (toastRefs.current[key]) {
      toast.dismiss(toastRefs.current[key]);
      delete toastRefs.current[key];
    }
  }, []);

  const showToast = useCallback((
    type: keyof typeof TOAST_DURATIONS, 
    key: string, 
    title: string, 
    description?: string, 
    action?: any
  ) => {
    const now = Date.now();
    if (lastActionTime.current[key] && (now - lastActionTime.current[key]) < TOAST_DEBOUNCE_TIME) {
      return toastRefs.current[key];
    }
    lastActionTime.current[key] = now;

    // ✅ SEMPRE limpar toast anterior primeiro
    dismissToast(key);

    let toastId: string | number;
    const duration = TOAST_DURATIONS[type];
    
    switch (type) {
      case 'loading':
        toastId = toast.loading(title, { description, duration: undefined });
        break;
      case 'success':
        toastId = toast.success(title, { description, duration, action });
        break;
      case 'error':
        toastId = toast.error(title, { description, duration, action });
        break;
      case 'info':
        toastId = toast.info(title, { description, duration });
        break;
      case 'warning':
        toastId = toast.warning(title, { description, duration });
        break;
      default:
        return;
    }
    
    toastRefs.current[key] = toastId;
    
    // ✅ Auto-cleanup apenas para toasts não-loading
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        if (toastRefs.current[key] === toastId) {
          delete toastRefs.current[key];
        }
      }, duration + 500);
    }
    
    return toastId;
  }, [dismissToast]);

  const clearAllToasts = useCallback(() => {
    Object.values(toastRefs.current).forEach(toastId => {
      toast.dismiss(toastId);
    });
    toastRefs.current = {};
    lastActionTime.current = {};
  }, []);

  return { showToast, dismissToast, clearAllToasts };
};

const useProductImages = (produto: Produto | null) => {
  return useMemo(() => {
    if (!produto) return [];
    
    const imagens: string[] = [];
    
    if (produto.imagemUrl) {
      imagens.push(produto.imagemUrl);
    }
    
    if (produto.imagens && Array.isArray(produto.imagens)) {
      imagens.push(...produto.imagens.filter(img => img !== produto.imagemUrl));
    }
    
    return imagens.length > 0 ? imagens : [PLACEHOLDER_IMAGE];
  }, [produto]);
};

const useAvaliacoes = (interacoes: Interacao[]) => {
  return useMemo(() => {
    const avaliacoesComNota = interacoes.filter(i => i.nota && i.nota > 0);
    if (avaliacoesComNota.length === 0) return { media: 0, total: 0 };
    
    const soma = avaliacoesComNota.reduce((acc, i) => acc + (i.nota || 0), 0);
    return { 
      media: soma / avaliacoesComNota.length,
      total: avaliacoesComNota.length
    };
  }, [interacoes]);
};

// ============================================================================
// API FUNCTIONS
// ============================================================================
const fetchProduto = async (roupaId: string): Promise<Produto> => {
  const response = await fetch(`/api/produtos/${roupaId}`);
  if (!response.ok) {
    throw new Error(`Produto não encontrado (${response.status})`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error('Produto não encontrado');
  }
  
  return data.data;
};

const fetchInteracoes = async (produtoId: string): Promise<Interacao[]> => {
  const response = await fetch(`/api/interacoes?produtoId=${produtoId}`);
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    return [];
  }
  
  return data.data
    .filter((i: Interacao) => i.tipo.toLowerCase() === 'comentario')
    .sort((a: Interacao, b: Interacao) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

const createInteracao = async (interacao: {
  tipo: string;
  conteudo: string;
  clienteId: number;
  produtoId: number;
  nota?: number;
}): Promise<Interacao> => {
  const response = await fetch('/api/interacoes/criar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interacao)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao enviar comentário');
  }

  const data = await response.json();
  return data.data;
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = "md"
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            if (!readonly && onRatingChange) {
              onRatingChange(star);
            }
          }}
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'hover:scale-110'} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          <Star className={`${sizeClasses[size]} fill-current`} />
        </button>
      ))}
    </div>
  );
};

const QuantitySelector = ({ 
  quantity, 
  maxQuantity, 
  onChange 
}: { 
  quantity: number; 
  maxQuantity: number; 
  onChange: (delta: number) => void;
}) => (
  <div className="flex items-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-1 w-fit">
    <button
      onClick={() => onChange(-1)}
      disabled={quantity <= 1}
      className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Minus className="h-4 w-4" />
    </button>
    <span className="px-4 py-2 text-lg font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
      {quantity}
    </span>
    <button
      onClick={() => onChange(1)}
      disabled={quantity >= maxQuantity}
      className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

const OptionSelector = ({ 
  label, 
  options, 
  value, 
  onChange, 
  type = "text" 
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "color";
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      {label}
    </label>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={
            type === "color" 
              ? `w-10 h-10 rounded-full border-2 ${value === option ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2' : 'border-gray-300'}`
              : `px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                  value === option 
                    ? 'border-purple-600 bg-purple-600 text-white' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-600'
                }`
          }
          style={type === "color" ? { backgroundColor: option.toLowerCase() } : undefined}
          aria-label={type === "color" ? `Cor ${option}` : option}
        >
          {type !== "color" && option}
        </button>
      ))}
    </div>
  </div>
);

const ProductBenefits = () => (
  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    {BENEFITS.map(({ icon: Icon, text }, index) => (
      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon className="h-4 w-4 text-purple-600" />
        <span>{text}</span>
      </div>
    ))}
  </div>
);

// ============================================================================
// MAJOR COMPONENTS
// ============================================================================
const Header = ({ onBack, user, isAuthenticated }: {
  onBack: () => void;
  user: any;
  isAuthenticated: boolean;
}) => {
  const router = useRouter();

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>
      </div>
    </header>
  );
};

const Breadcrumb = ({ produto, onNavigate }: {
  produto: Produto;
  onNavigate: (path: string) => void;
}) => (
  <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
    <button onClick={() => onNavigate('/')} className="hover:text-purple-600">
      Início
    </button>
    <span>/</span>
    {produto.categoria && (
      <>
        <span>{produto.categoria}</span>
        <span>/</span>
      </>
    )}
    <span className="text-gray-900 dark:text-white">{produto.nome}</span>
  </nav>
);

const ImageGallery = ({ images, currentIndex, onIndexChange }: {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) => {
  const nextImage = useCallback(() => {
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const prevImage = useCallback(() => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  return (
    <div className="mb-8 lg:mb-0">
      <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 relative mb-4">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentIndex]}
              alt={`Produto - Imagem ${currentIndex + 1}`}
              width={600}
              height={600}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              priority
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => onIndexChange(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Imagem não disponível
              </p>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((imagem, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2' 
                  : 'border-gray-200 hover:border-purple-400'
              }`}
            >
              <Image
                src={imagem}
                alt={`Miniatura ${index + 1}`}
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductInfo = ({ 
  produto, 
  avaliacoes,
  tamanhos,
  cores,
  selectedSize,
  selectedColor,
  quantity,
  isFavorite,
  onSizeChange,
  onColorChange,
  onQuantityChange,
  onAddToCart,
  onToggleFavorite
}: {
  produto: Produto;
  avaliacoes: { media: number; total: number };
  tamanhos: string[];
  cores: string[];
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  isFavorite: boolean;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onQuantityChange: (delta: number) => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
        {produto.nome}
      </h1>
      
      {avaliacoes.total > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <StarRating rating={avaliacoes.media} readonly />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({avaliacoes.total} {avaliacoes.total === 1 ? 'avaliação' : 'avaliações'})
          </span>
        </div>
      )}

      {produto.descricao && (
        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {produto.descricao}
        </p>
      )}
    </div>

    <div className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
      <span className="text-2xl font-bold">
        R$ {formatPrice(produto.preco)}
      </span>
    </div>

    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Disponibilidade:
      </span>
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full ${
        produto.estoque > 0 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          produto.estoque > 0 ? 'bg-green-500' : 'bg-red-500'
        }`} />
        {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Esgotado'}
      </span>
    </div>

    {tamanhos.length > 0 && (
      <OptionSelector
        label="Tamanho"
        options={tamanhos}
        value={selectedSize}
        onChange={onSizeChange}
      />
    )}

    {cores.length > 0 && (
      <OptionSelector
        label="Cor"
        options={cores}
        value={selectedColor}
        onChange={onColorChange}
        type="color"
      />
    )}

    {produto.estoque > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quantidade
        </label>
        <QuantitySelector
          quantity={quantity}
          maxQuantity={produto.estoque}
          onChange={onQuantityChange}
        />
      </div>
    )}

    <div className="space-y-3">
      <button 
        onClick={onAddToCart}
        disabled={produto.estoque === 0}
        className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-base transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
          produto.estoque > 0
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        <ShoppingCart className="h-5 w-5" />
        {produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
      </button>
      
      <button 
        onClick={onToggleFavorite}
        className={`w-full flex items-center justify-center gap-3 py-3 px-6 border-2 rounded-xl font-semibold text-base transition-all transform hover:scale-105 ${
          isFavorite 
            ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
            : 'border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
        }`}
      >
        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
      </button>
    </div>

    <ProductBenefits />
  </div>
);

const CommentForm = ({ 
  onSubmit, 
  isLoading,
  comment,
  rating,
  onCommentChange,
  onRatingChange
}: {
  onSubmit: () => void;
  isLoading: boolean;
  comment: string;
  rating: number;
  onCommentChange: (comment: string) => void;
  onRatingChange: (rating: number) => void;
}) => (
  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
      Deixe sua avaliação
    </h3>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Sua avaliação
        </label>
        <div className="flex items-center gap-4">
          <StarRating rating={rating} onRatingChange={onRatingChange} size="lg" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rating > 0 ? `${rating}/5 estrelas` : 'Clique para avaliar'}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Seu comentário
        </label>
        <textarea
          id="comentario"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Conte-nos o que achou do produto..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-700 dark:text-white transition-all resize-none"
        />
      </div>
      
      <button
        onClick={onSubmit}
        disabled={!comment.trim() || isLoading}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4" />
            Enviar Comentário
          </>
        )}
      </button>
    </div>
  </div>
);

const CommentsList = ({ interacoes }: { interacoes: Interacao[] }) => (
  <div className="space-y-6">
    {interacoes.length === 0 ? (
      <div className="text-center py-16 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum comentário ainda
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seja o primeiro a compartilhar sua opinião sobre este produto!
        </p>
      </div>
    ) : (
      interacoes.map((interacao) => (
        <article 
          key={interacao.id} 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                    {interacao.cliente.nome}
                  </h4>
                  <div className="flex items-center gap-3">
                    {interacao.nota && interacao.nota > 0 && (
                      <StarRating rating={interacao.nota} readonly size="sm" />
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(interacao.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {interacao.conteudo}
              </p>
            </div>
          </div>
        </article>
      ))
    )}
  </div>
);

const ErrorPage = ({ error, onBack, onHome }: {
  error: string;
  onBack: () => void;
  onHome: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="text-8xl mb-6">😞</div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Produto não encontrado
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        {error || 'O produto que você está procurando não existe ou foi removido.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
        >
          <Package className="h-4 w-4" />
          Ver Produtos
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DetalhesProduto({ params }: ProdutoPageProps) {
  const resolvedParams = use(params);
  const roupaId = resolvedParams.roupaId;
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast, dismissToast, clearAllToasts } = useToastManager();
  
  // Estados principais
  const [produto, setProduto] = useState<Produto | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Estados de UI
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [corSelecionada, setCorSelecionada] = useState("");
  const [isFavorito, setIsFavorito] = useState(false);

  // Estados de comentários
  const [novoComentario, setNovoComentario] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentarioLoading, setComentarioLoading] = useState(false);

  // Computed values
  const imagensProduto = useProductImages(produto);
  const avaliacoes = useAvaliacoes(interacoes);
  const tamanhosSeguros = useMemo(() => processArray(produto?.tamanhos), [produto?.tamanhos]);
  const coresSeguros = useMemo(() => processArray(produto?.cores), [produto?.cores]);

  // Fix for hydration - ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FETCH DADOS CORRIGIDO
  const fetchDados = useCallback(async () => {
    const loadingKey = 'loadingProduct';
    
    try {
      setPageLoading(true);
      setError(null);

      // ✅ Mostrar loading apenas uma vez
      showToast('loading', loadingKey, "Carregando produto...", "Buscando informações do produto");

      const [produtoData, interacoesData] = await Promise.all([
        fetchProduto(roupaId),
        fetchInteracoes(roupaId)
      ]);

      // ✅ SEMPRE dismiss loading ANTES de success
      dismissToast(loadingKey);

      setProduto(produtoData);
      setInteracoes(interacoesData);

      // Set default selections
      const tamanhos = processArray(produtoData.tamanhos);
      const cores = processArray(produtoData.cores);
      
      if (tamanhos.length > 0) setTamanhoSelecionado(tamanhos[0]);
      if (cores.length > 0) setCorSelecionada(cores[0]);

      // ✅ Success com chave diferente
      showToast('success', 'productLoaded', "Produto carregado!", `${produtoData.nome} carregado com sucesso`);
      
    } catch (err) {
      // ✅ SEMPRE dismiss loading ANTES de error
      dismissToast(loadingKey);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produto';
      setError(errorMessage);
      
      showToast('error', 'productError', "Erro ao carregar produto", errorMessage, {
        label: "Tentar novamente",
        onClick: () => fetchDados()
      });
    } finally {
      setPageLoading(false);
    }
  }, [roupaId, showToast, dismissToast]);

  // ✅ EVENT HANDLERS CORRIGIDOS
  const handleQuantidadeChange = useCallback((delta: number) => {
    setQuantidade(prev => {
      const nova = prev + delta;
      const quantidadeFinal = Math.max(1, Math.min(produto?.estoque || 1, nova));
      
      if (quantidadeFinal !== prev) {
        if (nova > (produto?.estoque || 1)) {
          showToast('warning', 'quantityWarning', "Estoque limitado", `Apenas ${produto?.estoque} unidades disponíveis`);
        } else if (nova < 1) {
          showToast('info', 'quantityInfo', "Quantidade mínima", "A quantidade mínima é 1 unidade");
        }
      }
      
      return quantidadeFinal;
    });
  }, [produto?.estoque, showToast]);

  const handleAdicionarCarrinho = useCallback(() => {
    if (!produto) return;
    
    if (tamanhosSeguros.length > 0 && !tamanhoSelecionado) {
      showToast('error', 'sizeRequired', "Selecione um tamanho", "É necessário escolher um tamanho antes de adicionar ao carrinho");
      return;
    }
    
    if (coresSeguros.length > 0 && !corSelecionada) {
      showToast('error', 'colorRequired', "Selecione uma cor", "É necessário escolher uma cor antes de adicionar ao carrinho");
      return;
    }
    
    const item: CarrinhoItem = {
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade,
      tamanho: tamanhoSelecionado,
      cor: corSelecionada,
      imagemUrl: imagensProduto[0]
    };
    
    showToast('success', 'cartAdded', "Produto adicionado ao carrinho! 🛒", 
      `${quantidade} unidade(s) de "${produto.nome}" ${tamanhoSelecionado ? `(${tamanhoSelecionado})` : ''} ${corSelecionada ? `- ${corSelecionada}` : ''}`,
      {
        label: "Ver carrinho",
        onClick: () => router.push('/carrinho')
      }
    );
  }, [produto, quantidade, tamanhoSelecionado, corSelecionada, imagensProduto, tamanhosSeguros, coresSeguros, router, showToast]);

  const handleFavoritar = useCallback(() => {
    const novoStatus = !isFavorito;
    setIsFavorito(novoStatus);
    
    if (novoStatus) {
      showToast('success', 'favoriteAdded', "Adicionado aos favoritos! ❤️", 
        `${produto?.nome} foi salvo na sua lista de favoritos`,
        {
          label: "Ver favoritos",
          onClick: () => router.push('/favoritos')
        }
      );
    } else {
      showToast('info', 'favoriteRemoved', "Removido dos favoritos", `${produto?.nome} foi removido da sua lista de favoritos`);
    }
  }, [isFavorito, produto?.nome, router, showToast]);

  // ✅ COMENTÁRIO CORRIGIDO
  const handleEnviarComentario = useCallback(async () => {
    if (!novoComentario.trim() || !produto) {
      showToast('error', 'commentEmpty', "Comentário vazio", "Por favor, escreva um comentário antes de enviar");
      return;
    }
    
    if (!isAuthenticated || !user) {
      showToast('error', 'commentAuth', "Login necessário", "Você precisa estar logado para enviar um comentário",
        {
          label: "Fazer login",
          onClick: () => router.push('/clientes/login')
        }
      );
      return;
    }
    
    const loadingKey = 'commentSubmit';
    setComentarioLoading(true);
    
    // ✅ Loading com chave específica
    showToast('loading', loadingKey, "Enviando comentário...", "Aguarde enquanto processamos sua avaliação");

    try {
      const novaInteracaoData = await createInteracao({
        tipo: 'comentario',
        conteudo: novoComentario,
        clienteId: parseInt(user.id.toString()),
        produtoId: produto.id,
        nota: avaliacao > 0 ? avaliacao : undefined
      });
      
      const novaInteracao: Interacao = {
        ...novaInteracaoData,
        cliente: {
          id: parseInt(user.id.toString()),
          nome: user.nome,
          email: user.email
        }
      };
      
      // ✅ SEMPRE dismiss loading ANTES de success
      dismissToast(loadingKey);
      
      setInteracoes(prev => [novaInteracao, ...prev]);
      setNovoComentario("");
      setAvaliacao(0);
      
      showToast('success', 'commentSuccess', "Comentário enviado com sucesso! 🎉", 
        `Obrigado pela sua ${avaliacao > 0 ? `avaliação de ${avaliacao} estrelas e ` : ''}opinião sobre ${produto.nome}`
      );
      
    } catch (error) {
      // ✅ SEMPRE dismiss loading ANTES de error
      dismissToast(loadingKey);
      
      showToast('error', 'commentError', "Erro ao enviar comentário", 
        error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        {
          label: "Tentar novamente",
          onClick: () => handleEnviarComentario()
        }
      );
    } finally {
      setComentarioLoading(false);
    }
  }, [novoComentario, produto, avaliacao, isAuthenticated, user, router, showToast, dismissToast]);

  // Effects
  useEffect(() => {
    if (mounted) {
      fetchDados();
    }
  }, [mounted, fetchDados]);

  // ✅ CLEANUP MELHORADO
  useEffect(() => {
    return () => {
      clearAllToasts();
    };
  }, [clearAllToasts]);

  // Show loading while mounting to prevent hydration issues
  if (!mounted) {
    return <Loading message="Carregando produto..." size="lg" fullScreen />;
  }

  if (pageLoading) {
    return <Loading message="Carregando produto..." size="lg" fullScreen />;
  }

  if (error || !produto) {
    return (
      <ErrorPage 
        error={error || 'Produto não encontrado'}
        onBack={() => router.back()}
        onHome={() => router.push('/')}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header 
        onBack={() => router.back()}
        user={user}
        isAuthenticated={isAuthenticated}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          produto={produto}
          onNavigate={(path) => router.push(path)}
        />

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 mb-16">
          <ImageGallery
            images={imagensProduto}
            currentIndex={imagemAtiva}
            onIndexChange={setImagemAtiva}
          />

          <ProductInfo
            produto={produto}
            avaliacoes={avaliacoes}
            tamanhos={tamanhosSeguros}
            cores={coresSeguros}
            selectedSize={tamanhoSelecionado}
            selectedColor={corSelecionada}
            quantity={quantidade}
            isFavorite={isFavorito}
            onSizeChange={setTamanhoSelecionado}
            onColorChange={setCorSelecionada}
            onQuantityChange={handleQuantidadeChange}
            onAddToCart={handleAdicionarCarrinho}
            onToggleFavorite={handleFavoritar}
          />
        </div>

        <section className="border-t border-gray-200 dark:border-gray-700 pt-16">
          <header className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              Avaliações e Comentários
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                ({interacoes.length})
              </span>
            </h2>
          </header>

          {isAuthenticated && user ? (
            <CommentForm
              onSubmit={handleEnviarComentario}
              isLoading={comentarioLoading}
              comment={novoComentario}
              rating={avaliacao}
              onCommentChange={setNovoComentario}
              onRatingChange={setAvaliacao}
            />
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-4">
                <LogIn className="h-12 w-12 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Faça login para comentar
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    Para enviar um comentário ou avaliação, você precisa estar logado em sua conta.
                  </p>
                  <button
                    onClick={() => router.push('/clientes/login')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                  >
                    <LogIn className="h-4 w-4" />
                    Fazer Login
                  </button>
                </div>
              </div>
            </div>
          )}

          <CommentsList interacoes={interacoes} />
        </section>
      </div>
    </main>
  );
}