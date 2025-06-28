"use client";

import { useState, useMemo } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  User,
  FileText
} from "lucide-react";

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
}

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Contato() {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: ""
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");

  // Opções de assunto
  const assuntoOptions = useMemo(() => [
    { value: "", label: "Selecione um assunto" },
    { value: "duvida", label: "Dúvida sobre produto" },
    { value: "pedido", label: "Acompanhar pedido" },
    { value: "troca", label: "Troca/Devolução" },
    { value: "reclamacao", label: "Reclamação" },
    { value: "sugestao", label: "Sugestão" },
    { value: "parceria", label: "Parceria comercial" },
    { value: "outro", label: "Outro assunto" }
  ], []);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (formData.telefone && !/^[\d\s\(\)\-\+]+$/.test(formData.telefone)) {
      newErrors.telefone = "Formato de telefone inválido";
    }

    if (!formData.assunto) {
      newErrors.assunto = "Selecione um assunto";
    }

    if (!formData.mensagem.trim()) {
      newErrors.mensagem = "Mensagem é obrigatória";
    } else if (formData.mensagem.trim().length < 10) {
      newErrors.mensagem = "Mensagem deve ter pelo menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      // Simular envio (aqui você integraria com sua API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus("success");
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        assunto: "",
        mensagem: ""
      });
      setErrors({});
    } catch (error) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Manipulação de mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro quando o usuário começar a digitar
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setStatus("idle");
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      assunto: "",
      mensagem: ""
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Entre em Contato
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Estamos aqui para ajudar! Entre em contato conosco através do formulário abaixo ou pelos nossos canais de atendimento.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          
          {/* Informações de Contato */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 h-fit">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
                Informações de Contato
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">E-mail</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">contato@urbanicon.com.br</p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">vendas@urbanicon.com.br</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Telefone</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">(11) 99999-9999</p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">(11) 3333-3333</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Endereço</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Rua da Moda, 123<br />
                      Centro, São Paulo - SP<br />
                      CEP: 01234-567
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Horário de Atendimento</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Segunda a Sexta: 08h às 18h<br />
                      Sábado: 08h às 14h<br />
                      Domingo: Fechado
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Contato */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
              
              {/* Status Messages */}
              {status === "success" && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-200">
                        Mensagem enviada com sucesso!
                      </h3>
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                        Retornaremos o contato em até 24 horas.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="mt-3 text-xs sm:text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium"
                  >
                    Enviar nova mensagem
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-red-800 dark:text-red-200">
                        Erro ao enviar mensagem
                      </h3>
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">
                        Tente novamente ou entre em contato pelos nossos outros canais.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
                Envie sua Mensagem
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                {/* Nome e Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 sm:px-4 sm:py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.nome 
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Seu nome completo"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.nome}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 sm:px-4 sm:py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.email 
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Telefone e Assunto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 sm:px-4 sm:py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.telefone 
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.telefone && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.telefone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="inline h-4 w-4 mr-2" />
                      Assunto *
                    </label>
                    <select
                      id="assunto"
                      name="assunto"
                      value={formData.assunto}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 sm:px-4 sm:py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.assunto 
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {assuntoOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.assunto && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.assunto}</p>
                    )}
                  </div>
                </div>

                {/* Mensagem */}
                <div>
                  <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageCircle className="inline h-4 w-4 mr-2" />
                    Mensagem *
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    rows={6}
                    value={formData.mensagem}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 sm:px-4 sm:py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none text-sm sm:text-base ${
                      errors.mensagem 
                        ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Digite sua mensagem aqui... (mínimo 10 caracteres)"
                  />
                  {errors.mensagem && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.mensagem}</p>
                  )}
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {formData.mensagem.length}/500 caracteres
                  </p>
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                        Enviar Mensagem
                      </span>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}