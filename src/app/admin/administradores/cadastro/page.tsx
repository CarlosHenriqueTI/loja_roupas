"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Shield, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Send
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "sonner";

export default function CadastroAdmin() {
  const router = useRouter();
  const { admin } = useAdminAuth();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    nivelAcesso: "EDITOR"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminCriado, setAdminCriado] = useState<any>(null);

  // Verificar se usuário tem permissão (apenas SUPERADMIN)
  if (admin?.nivelAcesso !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Apenas SUPERADMINs podem cadastrar novos administradores.
          </p>
          <Link
            href="/admin/administradores"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome obrigatório', {
        description: 'Por favor, informe o nome completo do administrador',
        duration: 4000,
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email obrigatório', {
        description: 'Por favor, informe um email válido',
        duration: 4000,
      });
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Email inválido', {
        description: 'Por favor, informe um email válido',
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    
    const submitToast = toast.loading('Criando administrador...', {
      description: 'Enviando convite por email'
    });

    try {
      const response = await fetch("/api/admin/administradores/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.toLowerCase().trim(),
          nivelAcesso: formData.nivelAcesso
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }

      if (data.success) {
        toast.dismiss(submitToast);
        toast.success('Convite enviado com sucesso!', {
          description: `Email de confirmação enviado para ${formData.email}`,
          duration: 5000,
        });
        
        setAdminCriado(data.data);
        setSuccess(true);
        
      } else {
        throw new Error(data.error || "Erro desconhecido ao criar administrador");
      }
    } catch (error) {
      console.error("Erro ao cadastrar admin:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setError(errorMessage);
      
      toast.dismiss(submitToast);
      toast.error('Erro ao enviar convite', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Convite Enviado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Um email de confirmação foi enviado para <strong>{adminCriado?.email}</strong>
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Próximos Passos:
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-2">
              <p>1. O administrador deve verificar o email</p>
              <p>2. Clicar no link de confirmação</p>
              <p>3. Definir uma senha</p>
              <p>4. Fazer login no sistema</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Importante:</strong> O link é válido por 24 horas
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/admin/administradores"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors w-full justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Ver Administradores
            </Link>
            
            <button
              onClick={() => {
                setSuccess(false);
                setAdminCriado(null);
                setFormData({
                  nome: "",
                  email: "",
                  nivelAcesso: "EDITOR"
                });
                toast.info('Pronto para novo cadastro', {
                  description: 'Formulário limpo para adicionar outro administrador',
                  duration: 2000,
                });
              }}
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar Outro Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Convidar Administrador
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Envie um convite por email para um novo administrador
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Nome do administrador"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Um email de confirmação será enviado para este endereço
              </p>
            </div>

            {/* Nível de Acesso */}
            <div>
              <label htmlFor="nivelAcesso" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nível de Acesso
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="nivelAcesso"
                  name="nivelAcesso"
                  value={formData.nivelAcesso}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option value="EDITOR">Editor - Gerenciar produtos e clientes</option>
                  <option value="ADMIN">Admin - Acesso completo exceto gerenciar admins</option>
                  <option value="SUPERADMIN">Super Admin - Acesso total ao sistema</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Como funciona:
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Email de convite será enviado</p>
                <p>• Link válido por 24 horas</p>
                <p>• Admin define senha ao confirmar</p>
                <p>• Acesso liberado após confirmação</p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/admin/administradores"
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Convite
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}