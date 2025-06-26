"use client";

import { useState, useMemo } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle, 
  MessageCircle,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";

// Interfaces para tipagem
interface FormData {
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
}

interface ContactInfo {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string[];
  color: string;
}

interface SocialMedia {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  color: string;
}

export default function Contato() {
  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Dados das informações de contato
  const contactInfo = useMemo<ContactInfo[]>(() => [
    {
      icon: MapPin,
      title: "Endereço",
      content: ["Rua da Moda, 123", "Centro, São Paulo - SP", "CEP: 01000-000"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Phone,
      title: "Telefone",
      content: ["(11) 99999-9999", "WhatsApp disponível", "Segunda a Sexta: 9h às 18h"],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Mail,
      title: "E-mail",
      content: ["contato@urbanicon.com", "vendas@urbanicon.com", "Resposta em até 24h"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Clock,
      title: "Horário de Funcionamento",
      content: ["Segunda a Sexta: 9h às 18h", "Sábados: 9h às 14h", "Domingos: Fechado"],
      color: "from-orange-500 to-red-500"
    }
  ], []);

  // Redes sociais
  const socialMedia = useMemo<SocialMedia[]>(() => [
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/urbanicon",
      color: "from-pink-500 to-purple-500"
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://facebook.com/urbanicon",
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/urbanicon",
      color: "from-blue-400 to-blue-500"
    }
  ], []);

  // Opções de assunto
  const assuntoOptions = useMemo(() => [
    { value: "", label: "Selecione um assunto" },
    { value: "duvida", label: "Dúvida sobre produto" },
    { value: "pedido", label: "Acompanhar meu pedido" },
    { value: "troca", label: "Troca/Devolução" },
    { value: "elogio", label: "Elogio" },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    setErrors({});
  };

  // Componente Hero Section
  const HeroSection = () => (
    <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <div 
        className="absolute inset-0 opacity-30" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
        aria-hidden="true" 
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6">
            Entre em <span className="text-yellow-300">Contato</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 font-light max-w-3xl mx-auto opacity-90">
            Estamos aqui para ajudar você. Fale conosco!
          </p>
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <p className="text-lg font-medium flex items-center gap-2">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Resposta garantida em até 24h
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Componente Card de Informação
  const ContactInfoCard = ({ info }: { info: ContactInfo }) => {
    const IconComponent = info.icon;
    
    return (
      <article className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${info.color} rounded-xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
          <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {info.title}
        </h3>
        <div className="space-y-1">
          {info.content.map((item, itemIndex) => (
            <p key={itemIndex} className="text-gray-600 dark:text-gray-300 text-sm">
              {item}
            </p>
          ))}
        </div>
      </article>
    );
  };

  // Componente Campo do Formulário
  const FormField = ({ 
    label, 
    name, 
    type = "text", 
    placeholder, 
    required = false,
    as = "input",
    rows,
    options 
  }: {
    label: string;
    name: keyof FormData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    as?: "input" | "textarea" | "select";
    rows?: number;
    options?: { value: string; label: string }[];
  }) => {
    const hasError = !!errors[name];
    
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {as === "input" && (
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border-2 ${
              hasError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
            } rounded-xl focus:ring-4 dark:bg-gray-700 dark:text-white transition-all duration-300`}
          />
        )}
        
        {as === "textarea" && (
          <textarea
            id={name}
            name={name}
            rows={rows}
            value={formData[name]}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border-2 ${
              hasError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
            } rounded-xl focus:ring-4 dark:bg-gray-700 dark:text-white transition-all duration-300 resize-none`}
          />
        )}
        
        {as === "select" && (
          <select
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            required={required}
            className={`w-full px-4 py-3 border-2 ${
              hasError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
            } rounded-xl focus:ring-4 dark:bg-gray-700 dark:text-white transition-all duration-300`}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        
        {hasError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Informações de Contato */}
        <section className="mb-16">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Como nos Encontrar
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mb-6" aria-hidden="true" />
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Múltiplas formas de entrar em contato conosco
            </p>
          </header>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <ContactInfoCard key={index} info={info} />
            ))}
          </div>
        </section>

        {/* Formulário e Redes Sociais */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Formulário de Contato */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Envie uma Mensagem
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Preencha o formulário abaixo e responderemos o mais breve possível
                </p>
              </header>

              {status === "success" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Mensagem Enviada com Sucesso!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Obrigado pelo contato! Nossa equipe responderá em até 24 horas.
                  </p>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <Send className="h-4 w-4" />
                    Enviar Nova Mensagem
                  </button>
                </div>
              ) : status === "error" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Erro ao Enviar Mensagem
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Ocorreu um erro. Tente novamente ou entre em contato por telefone.
                  </p>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      label="Nome Completo"
                      name="nome"
                      placeholder="Seu nome completo"
                      required
                    />
                    
                    <FormField
                      label="E-mail"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      label="Telefone"
                      name="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                    />
                    
                    <FormField
                      label="Assunto"
                      name="assunto"
                      as="select"
                      options={assuntoOptions}
                      required
                    />
                  </div>

                  <FormField
                    label="Mensagem"
                    name="mensagem"
                    as="textarea"
                    rows={6}
                    placeholder="Digite sua mensagem aqui..."
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Send className="h-5 w-5" />
                        Enviar Mensagem
                      </div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar - Redes Sociais e Informações Extras */}
          <div className="space-y-8">
            {/* Redes Sociais */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Siga-nos nas Redes Sociais
              </h3>
              <div className="space-y-3">
                {socialMedia.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${social.color} text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* FAQ Rápido */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Perguntas Frequentes
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Qual o prazo de entrega?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    De 2 a 5 dias úteis para todo o Brasil.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Como funciona a troca?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    30 dias para trocas, sem complicação.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Têm loja física?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Sim! Visite nossa loja no centro de SP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}