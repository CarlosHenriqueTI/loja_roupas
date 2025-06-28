"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, Star, Heart, ShoppingCart, Sparkles, TrendingUp, Gift } from "lucide-react";
import Loading from "@/components/LoadingProps";

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
  totalAvaliacoes?: number;
}

interface ApiResponseProdutos {
  success: boolean;
  data: Produto[];
  message?: string;
}

// ✅ COMPONENTE DE ESTRELAS REDUZIDO
function StarRating({ rating, totalAvaliacoes }: { rating: number; totalAvaliacoes: number }) {
  const ratingNumber = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  const totalNumber = typeof totalAvaliacoes === 'number' && !isNaN(totalAvaliacoes) ? totalAvaliacoes : 0;
  
  // Só renderiza se houver avaliações
  if (totalNumber === 0 || ratingNumber === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.floor(ratingNumber);
        const isHalfFilled = star === Math.ceil(ratingNumber) && ratingNumber % 1 !== 0;
        
        return (
          <div key={star} className="relative">
            <Star 
              className={`h-3 w-3 ${
                isFilled
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 dark:text-gray-600'
              }`} 
            />
            {isHalfFilled && (
              <Star 
                className="h-3 w-3 text-yellow-400 fill-current absolute top-0 left-0"
                style={{
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              />
            )}
          </div>
        );
      })}
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        {ratingNumber.toFixed(1)} ({totalNumber})
      </span>
    </div>
  );
}

// ✅ CARD DE PRODUTO COM TAMANHOS REDUZIDOS
function CardProduto({ produto }: { produto: Produto }) {
  const [isFavorito, setIsFavorito] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleFavoritar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorito(!isFavorito);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50">
      <div className="relative overflow-hidden">
        <Link href={`/detalhes/${produto.id}`}>
          {produto.imagemUrl && !imageError ? (
            <Image
              src={produto.imagemUrl}
              alt={produto.nome}
              width={400}
              height={400}
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              onError={handleImageError}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                  Urban Icon
                </span>
                <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                  {produto.nome.substring(0, 20)}...
                </div>
              </div>
            </div>
          )}
        </Link>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Botão de favoritar */}
        <button
          onClick={handleFavoritar}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 transform ${
            isFavorito 
              ? 'bg-red-500 text-white scale-110' 
              : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:scale-110'
          } ${
            'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorito ? 'fill-current' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {produto.estoque <= 5 && produto.estoque > 0 && (
            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              Últimas unidades
            </span>
          )}
          
          {produto.estoque === 0 && (
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              Esgotado
            </span>
          )}

          {produto.categoria && (
            <span className="bg-purple-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              {produto.categoria}
            </span>
          )}
        </div>

        {/* Botão de ação rápida */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Link
            href={`/detalhes/${produto.id}`}
            className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium text-center block hover:bg-purple-600 hover:text-white transition-all duration-200 shadow-lg"
          >
            Ver Detalhes
          </Link>
        </div>
      </div>

      {/* ✅ CONTEÚDO DO CARD COM TAMANHOS REDUZIDOS */}
      <div className="p-6">
        <Link href={`/detalhes/${produto.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer" title={produto.nome}>
            {produto.nome}
          </h3>
        </Link>
        
        {/* ✅ DESCRIÇÃO OPCIONAL E MAIS COMPACTA */}
        {produto.descricao && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2" title={produto.descricao}>
            {produto.descricao}
          </p>
        )}
        
        {/* ✅ PREÇO E AVALIAÇÃO COM TAMANHOS REDUZIDOS */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {produto.precoFormatado || `R$ ${produto.preco.toFixed(2).replace('.', ',')}`}
          </div>
          <StarRating 
            rating={produto.mediaAvaliacao || 0} 
            totalAvaliacoes={produto.totalAvaliacoes || 0} 
          />
        </div>
        
        {/* ✅ STATUS DO ESTOQUE */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            produto.disponivel || produto.estoque > 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {produto.disponivel || produto.estoque > 0 
              ? `${produto.estoque} disponível` 
              : "Indisponível"
            }
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-6">
            <span className="block">Descubra Seu</span>
            <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Estilo Único
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Peças cuidadosamente selecionadas para expressar sua personalidade. 
            Qualidade premium, design exclusivo e conforto em cada detalhe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/produtos"
              className="bg-white text-purple-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Explorar Coleção
            </Link>
            <Link
              href="/sobre"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              Sobre Nós
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Produtos Únicos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">50k+</div>
              <div className="text-purple-100">Clientes Satisfeitos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">4.9★</div>
              <div className="text-purple-100">Avaliação Média</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Tendências Atuais",
      description: "Sempre atualizados com as últimas tendências da moda mundial"
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Qualidade Premium",
      description: "Materiais selecionados e acabamento impecável em cada peça"
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Experiência Única",
      description: "Atendimento personalizado e experiência de compra excepcional"
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Por que escolher a <span className="text-purple-600">Urban Icon</span>?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Mais do que roupas, oferecemos uma experiência completa de moda e estilo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ✅ FUNÇÃO CORRIGIDA PARA BUSCAR AVALIAÇÕES
async function fetchMediaAvaliacao(produtoId: number): Promise<{ media: number; totalAvaliacoes: number; totalInteracoes: number }> {
  try {
    console.log(`🔍 Buscando avaliações para produto ${produtoId}`);
    
    const response = await fetch(`/api/interacoes?produtoId=${produtoId}`);
    if (!response.ok) {
      console.log(`❌ Erro na API para produto ${produtoId}: ${response.status}`);
      return { media: 0, totalAvaliacoes: 0, totalInteracoes: 0 };
    }
    
    const data = await response.json();
    console.log(`📊 Dados recebidos para produto ${produtoId}:`, data);
    
    if (data.success && Array.isArray(data.data)) {
      const todasInteracoes = data.data;
      
      // ✅ FILTRAR INTERAÇÕES COM NOTA VÁLIDA (campo 'nota')
      const avaliacoesComNota = todasInteracoes.filter((interacao: any) => {
        const temNota = interacao.nota !== null && 
                       interacao.nota !== undefined && 
                       typeof interacao.nota === 'number' && 
                       interacao.nota >= 1 && 
                       interacao.nota <= 5;
        
        if (temNota) {
          console.log(`✅ Avaliação válida: ID ${interacao.id}, Nota: ${interacao.nota}, Tipo: ${interacao.tipo}`);
        }
        
        return temNota;
      });
      
      const totalInteracoes = todasInteracoes.length;
      const totalAvaliacoes = avaliacoesComNota.length;
      
      console.log(`📈 Produto ${produtoId}: ${totalAvaliacoes} avaliações de ${totalInteracoes} interações`);
      
      if (totalAvaliacoes === 0) {
        return { media: 0, totalAvaliacoes: 0, totalInteracoes };
      }
      
      // ✅ CALCULAR MÉDIA DAS NOTAS
      const soma = avaliacoesComNota.reduce((acc: number, interacao: any) => {
        const nota = Number(interacao.nota);
        console.log(`➕ Adicionando nota: ${nota}`);
        return acc + nota;
      }, 0);
      
      const media = soma / totalAvaliacoes;
      const mediaArredondada = Math.round(media * 10) / 10;
      
      console.log(`✅ Produto ${produtoId}: Média = ${mediaArredondada} (${soma}/${totalAvaliacoes})`);
      
      return { 
        media: mediaArredondada, 
        totalAvaliacoes: totalAvaliacoes,
        totalInteracoes: totalInteracoes
      };
    }
    
    return { media: 0, totalAvaliacoes: 0, totalInteracoes: 0 };
    
  } catch (error) {
    console.error(`❌ Erro ao buscar avaliações do produto ${produtoId}:`, error);
    return { media: 0, totalAvaliacoes: 0, totalInteracoes: 0 };
  }
}

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nome");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🛍️ Carregando produtos da homepage...');
        
        const response = await fetch("/api/produtos");
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data: ApiResponseProdutos = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`📦 ${data.data.length} produtos carregados, processando avaliações...`);
          
          const produtosComAvaliacoes: Produto[] = [];
          
          for (let i = 0; i < data.data.length; i++) {
            const produto = data.data[i];
            console.log(`🔄 Processando produto ${i + 1}/${data.data.length}: ${produto.nome}`);
            
            const { media, totalAvaliacoes, totalInteracoes } = await fetchMediaAvaliacao(produto.id);
            
            const produtoComAvaliacao = {
              ...produto,
              mediaAvaliacao: media,
              totalAvaliacoes: totalAvaliacoes,
              totalInteracoes: totalInteracoes
            };
            
            produtosComAvaliacoes.push(produtoComAvaliacao);
            
            console.log(`✅ Produto processado: ${produto.nome} - Média: ${media}, Avaliações: ${totalAvaliacoes}`);
          }
          
          console.log('🎉 Todos os produtos processados com avaliações');
          setProdutos(produtosComAvaliacoes);
          
        } else {
          throw new Error(data.message || "Formato de resposta inválido");
        }
      } catch (err) {
        console.error("❌ Erro ao carregar produtos:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  // Filtrar e ordenar produtos
  const produtosFiltrados = produtos
    .filter(produto => 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (produto.categoria && produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
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

  // ✅ Substitua o LoadingComponent existente por:
  if (loading) {
    return <Loading message="Carregando produtos..." size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <HeroSection />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
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
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <HeroSection />
      
      {/* Seção de Produtos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Nossa <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Coleção</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Descubra peças únicas que combinam com seu estilo. 
              Cada produto é cuidadosamente selecionado para garantir qualidade e exclusividade.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-12">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all placeholder-gray-400"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all bg-white"
                >
                  <option value="nome">Nome A-Z</option>
                  <option value="preco_asc">Menor Preço</option>
                  <option value="preco_desc">Maior Preço</option>
                  <option value="estoque">Mais em Estoque</option>
                  <option value="recente">Mais Recentes</option>
                  <option value="avaliacao">Melhor Avaliados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-8">🔍</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {searchTerm ? "Nenhum produto encontrado" : "Aguarde nossa coleção"}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                {searchTerm 
                  ? `Não encontramos produtos para "${searchTerm}". Tente buscar por outro termo ou explore nossa coleção completa.`
                  : "Estamos preparando uma coleção incrível para você. Em breve, você poderá descobrir peças únicas e exclusivas!"
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl transition-all font-medium transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Limpar Busca
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {produtosFiltrados.length}
                    </span> {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    {searchTerm && (
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {' '}para &quot;{searchTerm}&quot;
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* ✅ GRID RESPONSIVO VOLTADO AO TAMANHO ORIGINAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {produtosFiltrados.map((produto) => (
                  <CardProduto key={produto.id} produto={produto} />
                ))}
              </div>

              {/* Load More Button */}
              {produtosFiltrados.length >= 12 && (
                <div className="text-center mt-16">
                  <Link
                    href="/produtos"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="h-5 w-5" />
                    Ver Todos os Produtos
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <FeatureSection />
    </div>
  );
}
