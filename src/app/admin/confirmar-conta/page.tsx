"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Shield,
  ArrowLeft,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface AdminData {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: string;
  tokenExpiracao: string;
}

export default function ConfirmarConta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    senha: "",
    confirmarSenha: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de confirmação não fornecido");
      setLoading(false);
      return;
    }

    verificarToken();
  }, [token]);

  const verificarToken = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/confirmar-conta?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setAdminData(data.admin);
        toast.success('Token válido!', {
          description: `Bem-vindo, ${data.admin.nome}! Defina sua senha para continuar.`,
          duration: 4000,
        });
      } else {
        setError(data.error || 'Token inválido');
        toast.error('Token inválido', {
          description: data.error || 'O link pode ter expirado ou já foi usado.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      setError('Erro ao verificar token');
      toast.error('Erro de conexão', {
        description: 'Não foi possível verificar o token.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.senha) {
      toast.error('Senha obrigatória', {
        description: 'Por favor, defina uma senha para sua conta.',
        duration: 4000,
      });
      return false;
    }

    if (formData.senha.length < 6) {
      toast.error('Senha muito curta', {
        description: 'A senha deve ter pelo menos 6 caracteres.',
        duration: 4000,
      });
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('Senhas não conferem', {
        description: 'A confirmação de senha deve ser igual à senha.',
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setVerifying(true);
    const submitToast = toast.loading('Ativando conta...', {
      description: 'Configurando sua senha e ativando o acesso'
    });

    try {
      const response = await fetch('/api/admin/confirmar-conta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          senha: formData.senha
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.dismiss(submitToast);
        toast.success('Conta ativada com sucesso!', {
          description: 'Você já pode fazer login no sistema.',
          duration: 5000,
        });
        
        setSuccess(true);
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      } else {
        throw new Error(data.error || 'Erro ao ativar conta');
      }
    } catch (error) {
      console.error('Erro ao confirmar conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.dismiss(submitToast);
      toast.error('Erro ao ativar conta', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setVerifying(false);
    }
  };

  const getTimeRemaining = () => {
    if (!adminData?.tokenExpiracao) return '';
    
    const now = new Date();
    const expiry = new Date(adminData.tokenExpiracao);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m restantes`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Verificando token...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto validamos seu link de confirmação
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Link Inválido ou Expirado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Possíveis causas:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 text-left space-y-1">
              <li>• O link expirou (válido por 24 horas)</li>
              <li>• O link já foi usado</li>
              <li>• URL incorreta ou corrompida</li>
            </ul>
          </div>
          <div className="mt-8">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Conta Ativada com Sucesso!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sua conta de administrador foi ativada. Você já pode fazer login no sistema.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Informações da Conta:
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p><strong>Nome:</strong> {adminData?.nome}</p>
              <p><strong>Email:</strong> {adminData?.email}</p>
              <p><strong>Nível:</strong> {adminData?.nivelAcesso}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Redirecionando para o login em 3 segundos...
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Fazer Login Agora
          </Link>
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
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ativar Conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Defina sua senha para ativar sua conta de administrador
          </p>
        </div>

        {/* Info da Conta */}
        {adminData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Dados da Conta:
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Nome:</strong> {adminData.nome}</p>
              <p><strong>Email:</strong> {adminData.email}</p>
              <p><strong>Nível:</strong> {adminData.nivelAcesso}</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{getTimeRemaining()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/admin/login"
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={verifying}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {verifying ? "Ativando..." : "Ativar Conta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}