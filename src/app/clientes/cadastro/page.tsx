"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function Cadastro() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // Etapas do formulário
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Estados brasileiros
  const estados = [
    { value: "", label: "Selecione um estado" },
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" }
  ];

  // Calcular força da senha
  useEffect(() => {
    const senha = formData.senha;
    let strength = 0;
    
    if (senha.length >= 8) strength++;
    if (/[a-z]/.test(senha)) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/[0-9]/.test(senha)) strength++;
    if (/[^A-Za-z0-9]/.test(senha)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.senha]);

  // Validação de CEP
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || "",
            cidade: data.localidade || "",
            estado: data.uf || ""
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  // Validação do formulário
  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      // Validação da primeira etapa
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

      if (!formData.senha) {
        newErrors.senha = "Senha é obrigatória";
      } else if (formData.senha.length < 8) {
        newErrors.senha = "Senha deve ter pelo menos 8 caracteres";
      }

      if (!formData.confirmarSenha) {
        newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
      } else if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "Senhas não coincidem";
      }
    }

    if (currentStep === 2) {
      // Validação da segunda etapa (opcionais, mas validar formato se preenchido)
      if (formData.telefone && !/^[\d\s\(\)\-\+]+$/.test(formData.telefone)) {
        newErrors.telefone = "Formato de telefone inválido";
      }

      if (formData.cep && !/^\d{5}-?\d{3}$/.test(formData.cep)) {
        newErrors.cep = "Formato de CEP inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipulação de mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatação automática
    let formattedValue = value;
    
    if (name === "telefone") {
      formattedValue = value.replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1");
    }
    
    if (name === "cep") {
      formattedValue = value.replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{3})\d+?$/, "$1");
      
      // Buscar CEP automaticamente
      if (formattedValue.length === 9) {
        buscarCEP(formattedValue);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Avançar etapa
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // Voltar etapa
  const prevStep = () => {
    setStep(step - 1);
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/clientes/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Cadastro realizado com sucesso!", {
          description: "Verifique seu e-mail para confirmar sua conta.",
        });
        
        setTimeout(() => {
          router.push("/clientes/login");
        }, 2000);
      } else {
        toast.error("Erro ao realizar cadastro", {
          description: data.error || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      toast.error("Erro ao realizar cadastro", {
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Componente de força da senha
  const PasswordStrength = () => {
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
    const labels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
    
    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                level <= passwordStrength ? colors[passwordStrength - 1] || "bg-gray-300" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        {formData.senha && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Força: {labels[passwordStrength - 1] || "Muito fraca"}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Criar Conta
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Junte-se à Urban Icon e descubra o melhor da moda
          </p>
          
          {/* Indicador de progresso */}
          <div className="mt-4 sm:mt-6">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 1 ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                1
              </div>
              <div className={`w-12 h-1 rounded ${
                step >= 2 ? "bg-purple-600" : "bg-gray-300"
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 2 ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Dados básicos</span>
              <span>Informações adicionais</span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {/* Etapa 1: Dados Básicos */}
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                      errors.nome ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.nome}
                    </p>
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
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                      errors.email ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="inline h-4 w-4 mr-2" />
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.senha ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                  </div>
                  {formData.senha && <PasswordStrength />}
                  {errors.senha && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.senha}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="inline h-4 w-4 mr-2" />
                    Confirmar senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmarSenha"
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.confirmarSenha ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Confirme sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.confirmarSenha}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                >
                  Continuar
                </button>
              </>
            )}

            {/* Etapa 2: Informações Adicionais */}
            {step === 2 && (
              <>
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
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.telefone ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.telefone && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.telefone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      CEP
                    </label>
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base ${
                        errors.cep ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="12345-678"
                    />
                    {errors.cep && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.cep}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    >
                      {estados.map(estado => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-500/50 transition-all text-sm sm:text-base"
                  >
                    Voltar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Criando conta...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        Criar conta
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Já tem uma conta?{" "}
            <Link 
              href="/login" 
              className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}