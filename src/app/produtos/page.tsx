"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, Star, Heart, ShoppingCart, Grid, List } from "lucide-react";
import Loading from "@/components/LoadingProps";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  estoque: number;
  categoria?: string;
  totalInteracoes?: number;
  disponivel?: boolean;
  precoFormatado?: string;
  createdAt: string;
  updatedAt: string;
  mediaAvaliacao?: number;
}

interface ApiResponseProdutos {
  success: boolean;
  data: Produto[];
  message?: string;
}

interface FiltrosState {
  searchTerm: string;
  categoria: string;
  sortBy: string;
}

interface AvaliacaoData {
  media: number;
  total: number;
}

type ViewMode = 'grid' | 'list';

// ============================================================================
// CONSTANTS
// ============================================================================
const SORT_OPTIONS = {
  nome: "Nome A-Z",
  preco_asc: "Menor Preço",
  preco_desc: "Maior Preço",
  estoque: "Mais em Estoque",
  recente: "Mais Recentes",
  avaliacao: "Melhor Avaliados"
} as const;

const INITIAL_FILTERS: FiltrosState = {
  searchTerm: "",
  categoria: "",
  sortBy: "nome"
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=ModaStyle';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatPrice = (preco: number): string => {
  return `R$ ${preco.toFixed(2).replace('.', ',')}`;
};

const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

// ============================================================================
// API FUNCTIONS
// ============================================================================
const fetchMediaAvaliacao = async (produtoId: number): Promise<AvaliacaoData> => {
  try {
    const response = await fetch(`/api/interacoes?produtoId=${produtoId}`);
    if (!response.ok) {
      return { media: 0, total: 0 };
    }
    
    const data = await response.json();
    if (!data.success || !data.data) {
      return { media: 0, total: 0 };
    }
    
    const avaliacoesComNota = data.data.filter(
      (i: any) => i.tipo === 'comentario' && i.nota && i.nota > 0
    );
    
    if (avaliacoesComNota.length === 0) {
      return { media: 0, total: data.data.length };
    }
    
    const soma = avaliacoesComNota.reduce((acc: number, i: any) => acc + (i.nota || 0), 0);
    const media = soma / avaliacoesComNota.length;
    
    return { 
      media: Math.round(media * 10) / 10, 
      total: data.data.length 
    };
  } catch (error) {
    console.error(`Erro ao buscar avaliações do produto ${produtoId}:`, error);
    return { media: 0, total: 0 };
  }
};

const fetchProdutos = async (filtros: FiltrosState): Promise<Produto[]> => {
  const params = new URLSearchParams();
  if (filtros.categoria) params.append('categoria', filtros.categoria);
  if (filtros.searchTerm) params.append('busca', filtros.searchTerm);
  
  const response = await fetch(`/api/produtos?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  const data: ApiResponseProdutos = await response.json();
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Formato de resposta inválido");
  }

  // Buscar avaliações para cada produto
  const produtosComAvaliacoes = await Promise.all(
    data.data.map(async (produto) => {
      const { media, total } = await fetchMediaAvaliacao(produto.id);
      return {
        ...produto,
        mediaAvaliacao: media,
        totalInteracoes: total
      };
    })
  );
  
  return produtosComAvaliacoes;
};

// ============================================================================
// COMPONENTS
// ============================================================================
const StarRating = ({ rating, totalAvaliacoes }: { rating: number; totalAvaliacoes: number }) => {
  if (totalAvaliacoes === 0 || rating === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`h-3 w-3 ${
            star <= rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300 dark:text-gray-600'
          }`} 
        />
      ))}
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        ({totalAvaliacoes})
      </span>
    </div>
  );
};

const ProductPlaceholder = ({ size = 'large' }: { size?: 'small' | 'large' }) => {
  const iconSize = size === 'large' ? 'h-12 w-12' : 'h-8 w-8';
  const textSize = size === 'large' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
      <div className="text-center">
        <ShoppingCart className={`${iconSize} text-purple-400 mx-auto mb-2`} />
        <span className={`text-purple-600 dark:text-purple-400 ${textSize} font-medium`}>
          ModaStyle
        </span>
      </div>
    </div>
  );
};

const FavoriteButton = ({ 
  isFavorito, 
  onToggle, 
  className = "" 
}: { 
  isFavorito: boolean; 
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
}) => (
  <button
    onClick={onToggle}
    className={`p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
      isFavorito 
        ? 'bg-red-500 text-white scale-110' 
        : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:scale-110'
    } ${className}`}
  >
    <Heart className={`h-4 w-4 ${isFavorito ? 'fill-current' : ''}`} />
  </button>
);

const StockBadge = ({ estoque }: { estoque: number }) => {
  if (estoque === 0) {
    return (
      <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
        Esgotado
      </span>
    );
  }
  
  if (estoque <= 5) {
    return (
      <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
        Últimas unidades
      </span>
    );
  }
  
  return null;
};

const ProductImage = ({ 
  produto, 
  className,
  priority = false 
}: { 
  produto: Produto; 
  className: string;
  priority?: boolean;
}) => (
  <Link href={`/detalhes/${produto.id}`}>
    {produto.imagemUrl ? (
      <Image
        src={produto.imagemUrl}
        alt={produto.nome}
        width={400}
        height={400}
        className={className}
        priority={priority}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = PLACEHOLDER_IMAGE;
        }}
      />
    ) : (
      <ProductPlaceholder />
    )}
  </Link>
);

const ProductCardGrid = ({ produto }: { produto: Produto }) => {
  const [isFavorito, setIsFavorito] = useState(false);

  const handleFavoritar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorito(!isFavorito);
  }, [isFavorito]);

  const priceDisplay = produto.precoFormatado || formatPrice(produto.preco);
  const isAvailable = produto.disponivel || produto.estoque > 0;

  return (
    <article className="group bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50">
      <div className="relative overflow-hidden">
        <ProductImage 
          produto={produto}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <FavoriteButton
          isFavorito={isFavorito}
          onToggle={handleFavoritar}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <StockBadge estoque={produto.estoque} />
          
          {produto.categoria && (
            <span className="bg-purple-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              {produto.categoria}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Link
            href={`/detalhes/${produto.id}`}
            className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium text-center block hover:bg-purple-600 hover:text-white transition-all duration-200 shadow-lg"
          >
            Ver Detalhes
          </Link>
        </div>
      </div>

      <div className="p-6">
        <Link href={`/detalhes/${produto.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer" title={produto.nome}>
            {produto.nome}
          </h3>
        </Link>
        
        {produto.descricao && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2" title={produto.descricao}>
            {produto.descricao}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {priceDisplay}
          </div>
          <StarRating 
            rating={produto.mediaAvaliacao || 0} 
            totalAvaliacoes={produto.totalInteracoes || 0} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            isAvailable
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isAvailable ? `${produto.estoque} disponível` : "Indisponível"}
          </span>
        </div>
      </div>
    </article>
  );
};

const ProductCardList = ({ produto }: { produto: Produto }) => {
  const [isFavorito, setIsFavorito] = useState(false);

  const handleFavoritar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorito(!isFavorito);
  }, [isFavorito]);

  const priceDisplay = produto.precoFormatado || formatPrice(produto.preco);
  const isAvailable = produto.disponivel || produto.estoque > 0;

  return (
    <article className="group bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 h-48 overflow-hidden">
          <ProductImage 
            produto={produto}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          <FavoriteButton
            isFavorito={isFavorito}
            onToggle={handleFavoritar}
            className="absolute top-2 right-2"
          />
        </div>

        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/detalhes/${produto.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                {produto.nome}
              </h3>
            </Link>
            <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {priceDisplay}
            </div>
          </div>
          
          {produto.descricao && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {produto.descricao}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <StarRating 
                rating={produto.mediaAvaliacao || 0} 
                totalAvaliacoes={produto.totalInteracoes || 0} 
              />
              
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isAvailable
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isAvailable ? `${produto.estoque} disponível` : "Indisponível"}
              </span>
            </div>
            
            <Link
              href={`/detalhes/${produto.id}`}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium transform hover:scale-105 text-sm"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const ProductCard = ({ produto, viewMode }: { produto: Produto; viewMode: ViewMode }) => {
  return viewMode === 'grid' ? (
    <ProductCardGrid produto={produto} />
  ) : (
    <ProductCardList produto={produto} />
  );
};

const SearchInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => (
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      placeholder="Buscar produtos..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all placeholder-gray-400"
    />
  </div>
);

const FilterControls = ({
  filtros,
  onFiltrosChange,
  categorias,
  viewMode,
  onViewModeChange
}: {
  filtros: FiltrosState;
  onFiltrosChange: (filtros: Partial<FiltrosState>) => void;
  categorias: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) => (
  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
      <SearchInput 
        value={filtros.searchTerm}
        onChange={(value) => onFiltrosChange({ searchTerm: value })}
      />

      <div className="flex items-center space-x-4">
        {/* Category Filter */}
        <select
          value={filtros.categoria}
          onChange={(e) => onFiltrosChange({ categoria: e.target.value })}
          className="border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filtros.sortBy}
            onChange={(e) => onFiltrosChange({ sortBy: e.target.value })}
            className="border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
            }`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
            }`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ 
  hasFilters, 
  onClearFilters 
}: { 
  hasFilters: boolean; 
  onClearFilters: () => void;
}) => (
  <div className="text-center py-20">
    <div className="text-8xl mb-8">🔍</div>
    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      Nenhum produto encontrado
    </h3>
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
      {hasFilters 
        ? "Não encontramos produtos com os filtros selecionados. Tente ajustar sua busca ou limpar os filtros."
        : "Nenhum produto disponível no momento."
      }
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl transition-all font-medium transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Limpar Filtros
      </button>
    )}
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-6">😞</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ops! Algo deu errado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-medium transform hover:scale-105"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Scroll to top on mount
  useEffect(() => {
    scrollToTop();
  }, []);

  // Fetch produtos when filters change
  useEffect(() => {
    const loadProdutos = async () => {
      try {
        setLoading(true);
        setError(null);
        const produtos = await fetchProdutos(filtros);
        setProdutos(produtos);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    loadProdutos();
  }, [filtros.categoria, filtros.searchTerm]);

  // Update filters
  const handleFiltrosChange = useCallback((novosFiltros: Partial<FiltrosState>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFiltros(INITIAL_FILTERS);
  }, []);

  // Sort products
  const produtosFiltrados = useMemo(() => {
    return [...produtos].sort((a, b) => {
      switch (filtros.sortBy) {
        case "preco_asc":
          return a.preco - b.preco;
        case "preco_desc":
          return b.preco - a.preco;
        case "estoque":
          return b.estoque - a.estoque;
        case "recente":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "avaliacao":
          return (b.mediaAvaliacao || 0) - (a.mediaAvaliacao || 0);
        case "nome":
        default:
          return a.nome.localeCompare(b.nome);
      }
    });
  }, [produtos, filtros.sortBy]);

  // Get unique categories
  const categorias = useMemo(() => {
    return Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean))) as string[];
  }, [produtos]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filtros.searchTerm !== "" || filtros.categoria !== "";
  }, [filtros]);

  if (loading) {
    return <Loading message="Carregando produtos..." size="lg" fullScreen />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Nossa <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Coleção</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Explore nossa seleção cuidadosa de produtos exclusivos, 
            escolhidos especialmente para expressar seu estilo único.
          </p>
        </header>

        {/* Filters */}
        <FilterControls
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          categorias={categorias}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Results Info */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            <span className="font-semibold text-gray-900 dark:text-white">
              {produtosFiltrados.length}
            </span> {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            {filtros.searchTerm && (
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                {' '}para &quot;{filtros.searchTerm}&quot;
              </span>
            )}
          </p>
        </div>

        {/* Products Grid/List */}
        {produtosFiltrados.length === 0 ? (
          <EmptyState 
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              : "space-y-6"
          }>
            {produtosFiltrados.map((produto) => (
              <ProductCard key={produto.id} produto={produto} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}