"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Eye, EyeOff, Shield, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { login, admin } = useAdminAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  useEffect(() => {
    if (admin) {
      toast.info("Você já está logado", {
        description: "Redirecionando para o dashboard...",
      });
      router.push("/admin/dashboard");
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.senha.trim()) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha email e senha",
      });
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Fazendo login...");

    try {
      const response = await fetch("/api/admin/login", {
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
      console.log("📡 Resposta da API admin:", data);

      if (data.success && data.admin && data.token) {
        toast.dismiss(loadingToast);
        toast.success("Login realizado com sucesso!", {
          description: `Bem-vindo, ${data.admin.nome}!`,
        });

        console.log("🔑 Chamando login do context com:", {
          admin: data.admin,
          token: data.token
        });

        // Usar o login do AdminAuthContext
        login(data.admin, data.token);

        console.log("⏳ Aguardando atualização do estado...");

        setTimeout(() => {
          console.log("🔄 Redirecionando para dashboard...");
          router.push("/admin/dashboard");
        }, 500);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erro no login", {
          description: data.error || "Verifique suas credenciais",
        });
      }
    } catch (error) {
      console.error("❌ Erro no login:", error);
      toast.dismiss(loadingToast);
      toast.error("Erro de conexão", {
        description: "Não foi possível conectar ao servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Área Administrativa
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Faça login para acessar o painel
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="admin@urbanicon.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sistema exclusivo para administradores
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}