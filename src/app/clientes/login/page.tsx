"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState<{show: boolean, email: string}>({
    show: false,
    email: ""
  });
  const [resendingEmail, setResendingEmail] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar mensagens ao digitar
    if (error) setError("");
    if (success) setSuccess("");
    if (needsEmailVerification.show) setNeedsEmailVerification({show: false, email: ""});
  };

  const handleResendConfirmation = async () => {
    if (!needsEmailVerification.email) return;
    
    setResendingEmail(true);
    setError("");

    try {
      const response = await fetch('/api/clientes/reenviar-confirmacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: needsEmailVerification.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Email de confirmação reenviado! Verifique sua caixa de entrada.");
        setNeedsEmailVerification({show: false, email: ""});
      } else {
        setError(data.error || 'Erro ao reenviar email.');
      }
    } catch (error) {
      console.error('Erro ao reenviar confirmação:', error);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setNeedsEmailVerification({show: false, email: ""});

    try {
      console.log("Tentando fazer login com:", { email: formData.email });

      const response = await fetch("/api/clientes/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          senha: formData.senha,
        }),
      });

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.success && data.data) {
        setSuccess("Login realizado com sucesso! Redirecionando...");
        
        // Usar o login do AuthContext
        login(formData.email.trim(), formData.senha);
        
        // Pequeno delay para mostrar a mensagem de sucesso
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        // Verificar se é erro de email não confirmado
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setNeedsEmailVerification({
            show: true,
            email: formData.email.trim()
          });
          setError(data.error);
        } else {
          setError(data.error || "Erro ao fazer login. Tente novamente.");
        }
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Entre em sua conta ModaStyle
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                    {error}
                  </p>
                  
                  {needsEmailVerification.show && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-red-600 dark:text-red-400 text-xs mb-3">
                        Não recebeu o email? Verifique sua pasta de spam ou solicite um novo.
                      </p>
                      <button
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {resendingEmail ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Reenviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Reenviar Email
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all placeholder-gray-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Senha
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
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all placeholder-gray-400"
                  placeholder="Sua senha"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Não tem uma conta?{" "}
              <Link
                href="/clientes/cadastro"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <Link
              href="/clientes/recuperar-senha"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 font-medium transition-colors"
          >
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}