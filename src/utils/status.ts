// utils/status.ts
export const STATUS_CONTA = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO', 
  SUSPENSO: 'SUSPENSO',
  BLOQUEADO: 'BLOQUEADO',
  PENDENTE: 'PENDENTE',
  EXCLUIDO: 'EXCLUIDO'
} as const;

export const STATUS_PRODUTO = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  DESCONTINUADO: 'DESCONTINUADO', 
  RASCUNHO: 'RASCUNHO',
  ESGOTADO: 'ESGOTADO'
} as const;

// Funções utilitárias para status
export const getStatusContaLabel = (status: string) => {
  switch (status) {
    case 'ATIVO': return 'Ativo';
    case 'INATIVO': return 'Inativo';
    case 'SUSPENSO': return 'Suspenso';
    case 'BLOQUEADO': return 'Bloqueado';
    case 'PENDENTE': return 'Pendente';
    case 'EXCLUIDO': return 'Excluído';
    default: return 'Desconhecido';
  }
};

export const getStatusContaColor = (status: string) => {
  switch (status) {
    case 'ATIVO': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'INATIVO': return 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 dark:text-gray-400';
    case 'SUSPENSO': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    case 'BLOQUEADO': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    case 'PENDENTE': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'EXCLUIDO': return 'text-red-800 bg-red-200 dark:bg-red-900/50 dark:text-red-300';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusProdutoLabel = (status: string) => {
  switch (status) {
    case 'ATIVO': return 'Ativo';
    case 'INATIVO': return 'Inativo';
    case 'DESCONTINUADO': return 'Descontinuado';
    case 'RASCUNHO': return 'Rascunho';
    case 'ESGOTADO': return 'Esgotado';
    default: return 'Desconhecido';
  }
};

export const canUserLogin = (status: string) => {
  return status === 'ATIVO';
};

export const isAccountActive = (status: string) => {
  return status === 'ATIVO';
};

export const isAccountPending = (status: string) => {
  return status === 'PENDENTE';
};

export const isProductAvailable = (status: string) => {
  return status === 'ATIVO';
};