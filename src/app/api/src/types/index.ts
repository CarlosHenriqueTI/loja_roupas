// src/types/index.ts
export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  createdAt: Date;
  updatedAt: Date;
  totalInteracoes?: number;
}

export interface Admin {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
  ultimoLogin?: Date;
  ultimoLogout?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  tamanhos: string[];
  cores: string[];
  imagemUrl?: string;
  disponivel: boolean;
  destaque: boolean;
  estoque: number;
  createdAt: Date;
  updatedAt: Date;
  totalInteracoes?: number;
}

export interface Interacao {
  id: number;
  tipo: 'CURTIDA' | 'COMENTARIO' | 'COMPARTILHAMENTO' | 'COMPRA' | 'VISUALIZACAO' | 'AVALIACAO';
  conteudo?: string;
  avaliacao?: number;
  clienteId: number;
  produtoId: number;
  createdAt: Date;
  cliente?: Pick<Cliente, 'id' | 'nome' | 'email'>;
  produto?: Pick<Produto, 'id' | 'nome' | 'imagemUrl' | 'preco'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}