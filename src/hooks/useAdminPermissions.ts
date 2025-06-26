"use client";

import { useAdminAuth } from "@/context/AdminAuthContext";

export function useAdminPermissions() {
  const { admin } = useAdminAuth();
  
  const permissions = {
    // SUPERADMIN - Acesso total
    canManageAdmins: admin?.nivelAcesso === 'SUPERADMIN',
    canDeleteClients: admin?.nivelAcesso === 'SUPERADMIN',
    canViewSystemLogs: admin?.nivelAcesso === 'SUPERADMIN',
    canManageSystemSettings: admin?.nivelAcesso === 'SUPERADMIN',
    
    // ADMIN - Gerenciamento completo (exceto outros admins)
    canManageProducts: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canManageClients: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewReports: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canDeleteProducts: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    
    // ✅ Permissões específicas para clientes
    canCreateClients: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canEditClients: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canViewClientDetails: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    
    // EDITOR - Apenas edição de conteúdo
    canEditProducts: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canViewProducts: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canViewClients: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    
    // ✅ Permissões adicionais
    canCreateProducts: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewDashboard: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canViewStatistics: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canExportData: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canManageCategories: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canManageOrders: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewOrders: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canManageInventory: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewInventory: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canManagePromotions: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewPromotions: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
    canManageSettings: ['SUPERADMIN', 'ADMIN'].includes(admin?.nivelAcesso || ''),
    canViewSettings: ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(admin?.nivelAcesso || ''),
  };

  const getAccessLevel = () => {
    switch (admin?.nivelAcesso) {
      case 'SUPERADMIN':
        return {
          level: 'Super Administrador',
          color: 'red',
          description: 'Acesso total ao sistema',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
      case 'ADMIN':
        return {
          level: 'Administrador',
          color: 'blue',
          description: 'Gerenciamento de produtos e clientes',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        };
      case 'EDITOR':
        return {
          level: 'Editor',
          color: 'green',
          description: 'Edição de produtos e conteúdo',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        };
      default:
        return {
          level: 'Usuário',
          color: 'gray',
          description: 'Acesso limitado',
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400'
        };
    }
  };

  // ✅ Função para verificar se pode executar uma ação específica
  const canExecute = (action: string): boolean => {
    return (permissions as any)[action] || false;
  };

  // ✅ Função para obter todas as permissões do usuário atual
  const getAllPermissions = () => {
    const userPermissions: string[] = [];
    
    Object.entries(permissions).forEach(([key, value]) => {
      if (value) {
        userPermissions.push(key);
      }
    });
    
    return userPermissions;
  };

  // ✅ Função para verificar nível hierárquico
  const hasMinimumLevel = (requiredLevel: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'): boolean => {
    const levels = ['EDITOR', 'ADMIN', 'SUPERADMIN'];
    const currentLevelIndex = levels.indexOf(admin?.nivelAcesso || '');
    const requiredLevelIndex = levels.indexOf(requiredLevel);
    
    return currentLevelIndex >= requiredLevelIndex;
  };

  return {
    ...permissions,
    getAccessLevel,
    canExecute,
    getAllPermissions,
    hasMinimumLevel,
    currentLevel: admin?.nivelAcesso || 'NONE',
    isLoggedIn: !!admin,
    adminInfo: admin
  };
}