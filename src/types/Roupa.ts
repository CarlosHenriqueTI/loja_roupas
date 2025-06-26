// ✅ Interface principal da Roupa
export interface Roupa {
  id: number;
  nome: string;
  marca: string;
  ano: number;
  preco: number;
  foto: string;
  acessorios?: string;
  destaque: boolean;
  modeloId: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Relacionamentos
  modelo?: Modelo;
  fotos?: Foto[];
  interacoes?: Interacao[];
  _count?: {
    interacoes: number;
  };
}

// ✅ Interface para Modelo
export interface Modelo {
  id: number;
  nome: string;
}

// ✅ Interface para Foto
export interface Foto {
  id: number;
  url: string;
  descricao?: string;
  roupaId: number;
}

// ✅ Interface para Interação
export interface Interacao {
  id: number;
  tipo: 'COMENTARIO' | 'AVALIACAO' | 'RESERVA';
  texto?: string;
  nota?: number;
  clienteId: number;
  roupaId: number;
  createdAt: string;
  cliente?: {
    id: number;
    nome: string;
  };
}

// ✅ Interface para resposta da API
export interface ApiResponse<T> {
  sucesso: boolean;
  dados?: T;
  mensagem?: string;
  erro?: string;
  total?: number;
  detalhes?: Record<string, unknown>;
}

// ✅ Função para formatar preço
export function formatarPreco(preco: number | null | undefined): string {
  if (preco === null || preco === undefined || isNaN(preco)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco);
}

// ✅ Função para gerar texto alternativo para imagens
export function gerarAltText(roupa: Roupa): string {
  const elementos = [roupa.nome, roupa.marca];
  
  if (roupa.ano) {
    elementos.push(`${roupa.ano}`);
  }
  
  if (roupa.modelo?.nome) {
    elementos.push(roupa.modelo.nome);
  }
  
  return elementos.join(' - ');
}

// ✅ Função para validar dados da API
export function validarRoupaAPI(dados: unknown): Roupa[] {
  if (!Array.isArray(dados)) {
    console.warn('Dados recebidos não são um array:', typeof dados);
    return [];
  }

  return dados.filter((item): item is Roupa => {
    if (!item || typeof item !== 'object') {
      console.warn('Item inválido encontrado:', item);
      return false;
    }

    const isValid = (
      typeof item.id === 'number' &&
      typeof item.nome === 'string' &&
      typeof item.marca === 'string' &&
      typeof item.ano === 'number' &&
      (typeof item.preco === 'number' || item.preco === null) &&
      typeof item.foto === 'string' &&
      typeof item.destaque === 'boolean' &&
      typeof item.modeloId === 'number'
    );

    if (!isValid) {
      console.warn('Item com estrutura inválida:', item);
    }

    return isValid;
  });
}

// ✅ Função para criar roupa de fallback
export function criarRoupaFallback(id: number = 1): Roupa {
  return {
    id,
    nome: 'Produto não encontrado',
    marca: 'Marca não disponível',
    ano: new Date().getFullYear(),
    preco: 0,
    foto: '',
    destaque: false,
    modeloId: 1,
    modelo: { id: 1, nome: 'Casual' },
    _count: { interacoes: 0 }
  };
}

// ✅ Função para validar URL de imagem
export function validarUrlImagem(url: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ✅ Função para gerar placeholder de imagem
export function gerarPlaceholderImagem(roupa: Roupa): string {
  const cores = [
    '4F46E5', // indigo
    '7C3AED', // violet
    'EC4899', // pink
    '059669', // emerald
    'DC2626', // red
    'F59E0B'  // amber
  ];
  
  const cor = cores[roupa.id % cores.length];
  const texto = encodeURIComponent(roupa.nome.substring(0, 20));
  
  return `https://via.placeholder.com/400x500/${cor}/FFFFFF?text=${texto}`;
}

export default Roupa;