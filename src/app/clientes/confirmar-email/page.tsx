"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function ConfirmarEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de confirmação não encontrado na URL.');
      return;
    }

    const confirmarEmail = async () => {
      try {
        const response = await fetch('/api/clientes/confirmar-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          // Redirecionar para login após 5 segundos
          setTimeout(() => {
            router.push('/clientes/login');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      } catch (error) {
        console.error('Erro ao confirmar email:', error);
        setStatus('error');
        setMessage('Erro ao conectar com o servidor. Tente novamente.');
      }
    };

    confirmarEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
          
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Confirmando seu email...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aguarde enquanto verificamos sua confirmação.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ✅ Email Confirmado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <p className="text-green-700 dark:text-green-300 text-sm">
                  <strong>🎉 Parabéns!</strong> Agora você pode fazer login e aproveitar todas as funcionalidades da Urban Icon.
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Redirecionando para o login em 5 segundos...
              </p>
              <Link
                href="/clientes/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                <Mail className="h-4 w-4" />
                Fazer Login Agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ❌ Erro na Confirmação
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  <strong>Possíveis motivos:</strong><br/>
                  • Token expirado (mais de 24 horas)<br/>
                  • Link já foi usado<br/>
                  • Email já confirmado anteriormente
                </p>
              </div>
              <div className="space-y-4">
                <Link
                  href="/clientes/cadastro"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Fazer Novo Cadastro
                </Link>
                <Link
                  href="/clientes/login"
                  className="block w-full text-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  Tentar Fazer Login
                </Link>
              </div>
            </>
          )}
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