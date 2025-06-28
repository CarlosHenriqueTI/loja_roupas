"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

interface LoginData {
  email: string;
  senha: string;
  lembrarMe: boolean;
}

interface LoginErrors {
  email?: string;
  senha?: string;
  general?: string;
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    senha: "",
    lembrarMe: false
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Verificar se há mensagem de redirecionamento
  const message = searchParams?.get('message');
  const redirect = searchParams?.get('redirect') || '/';

  useEffect(() => {
    if (message) {
      if (message === 'unauthorized') {
        toast.error("Acesso negado", {
          description: "Você precisa fazer login para acessar esta página.",
        });
      } else if (message === 'session_expired') {
        toast.warning("Sessão expirada", {
          description: "Sua sessão expirou. Faça login novamente.",
        });
      } else if (message === 'registered') {
        toast.success("Cadastro realizado!", {
          description: "Agora você pode fazer login com suas credenciais.",
        });
      }
    }
  }, [message]);

  // Timer para desbloqueio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockTimeRemaining]);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória";
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipulação de mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro quando o usuário começar a digitar
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Limpar erro geral também
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
    }
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast.error("Muitas tentativas", {
        description: `Aguarde ${blockTimeRemaining} segundos antes de tentar novamente.`,
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
          lembrarMe: formData.lembrarMe
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Login realizado com sucesso!", {
          description: `Bem-vindo(a), ${data.user?.nome || 'usuário'}!`,
        });
        
        // Resetar tentativas de login
        setLoginAttempts(0);
        setIsBlocked(false);
        
        // Redirecionar
        setTimeout(() => {
          router.push(redirect);
        }, 1000);
      } else {
        // Incrementar tentativas de login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Bloquear após 3 tentativas
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setBlockTimeRemaining(60); // 1 minuto de bloqueio
          toast.error("Muitas tentativas de login", {
            description: "Conta temporariamente bloqueada por 1 minuto.",
          });
        } else {
          setErrors({ general: data.error || "E-mail ou senha incorretos" });
          toast.error("Erro no login", {
            description: data.error || "Verifique suas credenciais e tente novamente.",
          });
        }
      }
    } catch (error) {
      setErrors({ general: "Erro de conexão. Tente novamente." });
      toast.error("Erro de conexão", {
        description: "Verifique sua internet e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatação do tempo de bloqueio
  const formatBlockTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Header decorativo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-900/20 dark:to-pink-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Bem-vindo de volta!
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Faça login na sua conta para continuar explorando nossa coleção exclusiva
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Lado esquerdo - Informações */}
          <div className="hidden lg:block">
            <div className="space-y-6 lg:space-y-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Seguro e Confiável
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Seus dados estão protegidos com criptografia de ponta e sistemas de segurança avançados.
                </p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Experiência Personalizada
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Acesse suas preferências, histórico de compras e recomendações exclusivas.
                </p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Acesso Rápido
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Checkout mais rápido, acompanhamento de pedidos e atendimento prioritário.
                </p>
              </div>
            </div>
          </div>

          {/* Lado direito - Formulário */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            
            {/* Alerta de bloqueio */}
            {isBlocked && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                      Conta temporariamente bloqueada
                    </h3>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Aguarde {formatBlockTime(blockTimeRemaining)} para tentar novamente
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aviso de tentativas */}
            {loginAttempts > 0 && !isBlocked && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Tentativas restantes: {3 - loginAttempts}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
              
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Fazer Login
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Entre na sua conta para continuar
                </p>
              </div>

              {/* Erro geral */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isBlocked}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.email 
                        ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Senha */}
                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="inline h-4 w-4 mr-2" />
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      disabled={isBlocked}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.senha 
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Sua senha"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isBlocked}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.senha}
                    </p>
                  )}
                </div>

                {/* Opções extras */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="lembrarMe"
                      checked={formData.lembrarMe}
                      onChange={handleChange}
                      disabled={isBlocked}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Lembrar de mim
                    </span>
                  </label>
                  
                  <Link 
                    href="/esqueci-senha" 
                    className="text-xs sm:text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                {/* Botão de login */}
                <button
                  type="submit"
                  disabled={loading || isBlocked}
                  className="w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Entrando...
                    </span>
                  ) : isBlocked ? (
                    <span className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Aguarde {formatBlockTime(blockTimeRemaining)}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      Entrar
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                  )}
                </button>

              </form>

              {/* Divisor */}
              <div className="my-6 sm:my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Ainda não tem conta?
                    </span>
                  </div>
                </div>
              </div>

              {/* Link para cadastro */}
              <Link
                href="/cadastro"
                className="w-full block text-center px-4 py-2 sm:py-3 border border-purple-600 text-purple-600 rounded-lg sm:rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-4 focus:ring-purple-500/50 transition-all text-sm sm:text-base"
              >
                Criar nova conta
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}