"use client";

import Link from "next/link";
import { Users, Heart, Award, Sparkles, Target, Shield } from "lucide-react";
import { useMemo } from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface BaseCard {
  title: string;
  description: string;
}

interface IconCard extends BaseCard {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface MembroEquipe extends BaseCard {
  name: string;
  role: string;
  gradient: string;
}

interface Diferencial extends BaseCard {
  emoji: string;
}

interface Estatistica {
  valor: string;
  label: string;
  color: string;
}

// ============================================================================
// DATA CONSTANTS
// ============================================================================
const VALORES_DATA: IconCard[] = [
  {
    icon: Shield,
    title: "Sustentabilidade",
    description: "Comprometidos com práticas sustentáveis em toda nossa cadeia produtiva.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Award,
    title: "Qualidade",
    description: "Selecionamos cuidadosamente cada peça para garantir durabilidade e conforto.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Heart,
    title: "Estilo",
    description: "Criamos looks únicos que expressam personalidade e autenticidade.",
    color: "from-pink-500 to-rose-500"
  }
];

const EQUIPE_DATA: MembroEquipe[] = [
  {
    name: "Ana Silva",
    role: "CEO & Fundadora",
    title: "Ana Silva",
    description: "Visionária da moda com 10+ anos de experiência no mercado fashion.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Carlos Santos",
    role: "Diretor de Design",
    title: "Carlos Santos",
    description: "Especialista em tendências urbanas e criação de coleções exclusivas.",
    gradient: "from-blue-500 to-purple-500"
  },
  {
    name: "Maria Oliveira",
    role: "Gerente de Sustentabilidade",
    title: "Maria Oliveira",
    description: "Responsável por implementar práticas eco-friendly em nossos processos.",
    gradient: "from-green-500 to-blue-500"
  }
];

const PRINCIPIOS_DATA: IconCard[] = [
  {
    icon: Target,
    title: "Missão",
    description: "Democratizar a moda de qualidade, oferecendo peças elegantes e acessíveis que expressam a personalidade única de cada cliente.",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: Sparkles,
    title: "Visão",
    description: "Ser a marca de referência em moda urbana, reconhecida pela inovação, sustentabilidade e comprometimento com a satisfação do cliente.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Users,
    title: "Objetivos",
    description: "Expandir nossa presença globalmente, mantendo a excelência em qualidade e atendimento, enquanto promovemos valores de inclusão e diversidade.",
    color: "from-blue-500 to-teal-500"
  }
];

const DIFERENCIAIS_DATA: Diferencial[] = [
  {
    title: "Entrega Rápida",
    description: "Entregamos em todo Brasil com agilidade",
    emoji: "🚚"
  },
  {
    title: "Troca Fácil",
    description: "30 dias para trocar sem complicação",
    emoji: "🔄"
  },
  {
    title: "Atendimento 24/7",
    description: "Suporte sempre disponível para você",
    emoji: "💬"
  },
  {
    title: "Segurança",
    description: "Compra 100% segura e protegida",
    emoji: "🔒"
  }
];

const ESTATISTICAS_DATA: Estatistica[] = [
  {
    valor: "4+",
    label: "Anos de experiência",
    color: "from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30"
  },
  {
    valor: "10k+",
    label: "Clientes satisfeitos",
    color: "from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30"
  },
  {
    valor: "500+",
    label: "Produtos únicos",
    color: "from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30"
  },
  {
    valor: "98%",
    label: "Satisfação",
    color: "from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30"
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('');
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => (
  <header className="text-center mb-12">
    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
      {title}
    </h2>
    <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mb-6" aria-hidden="true" />
    {subtitle && (
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        {subtitle}
      </p>
    )}
  </header>
);

const BaseCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <article className={`group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${className}`}>
    {children}
  </article>
);

// ============================================================================
// CARD COMPONENTS
// ============================================================================
const IconCardContent = ({ item }: { item: IconCard }) => {
  const IconComponent = item.icon;
  
  return (
    <>
      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
        <IconComponent className="h-8 w-8 text-white" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {item.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {item.description}
      </p>
    </>
  );
};

const MembroCard = ({ membro }: { membro: MembroEquipe }) => (
  <BaseCard className="hover:-translate-y-1">
    <div className={`w-24 h-24 bg-gradient-to-r ${membro.gradient} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
      <span 
        className="text-white text-2xl font-bold" 
        aria-label={`Iniciais de ${membro.name}`}
      >
        {getInitials(membro.name)}
      </span>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      {membro.name}
    </h3>
    <p className="text-purple-600 dark:text-purple-400 font-semibold mb-4">
      {membro.role}
    </p>
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
      {membro.description}
    </p>
  </BaseCard>
);

const DiferencialCard = ({ diferencial }: { diferencial: Diferencial }) => (
  <BaseCard className="p-6 hover:-translate-y-1">
    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
      {diferencial.emoji}
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
      {diferencial.title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm">
      {diferencial.description}
    </p>
  </BaseCard>
);

const EstatisticaCard = ({ stat }: { stat: Estatistica }) => (
  <div 
    className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300 cursor-pointer`}
  >
    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
      {stat.valor}
    </div>
    <div className="text-gray-600 dark:text-gray-300 font-medium text-sm">
      {stat.label}
    </div>
  </div>
);

// ============================================================================
// SECTION COMPONENTS
// ============================================================================
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
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 animate-fadeIn">
          Sobre a <span className="text-yellow-300">ModaStyle</span>
        </h1>
        <p className="text-xl sm:text-2xl mb-8 font-light max-w-3xl mx-auto opacity-90">
          Uma história de paixão pela moda e inovação
        </p>
        <div className="flex justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
            <p className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Desde 2025 transformando looks
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const EstatisticasGrid = () => (
  <div className="grid grid-cols-2 gap-6">
    {ESTATISTICAS_DATA.map((stat, index) => (
      <EstatisticaCard key={index} stat={stat} />
    ))}
  </div>
);

const HistoriaSection = () => (
  <section className="mb-20">
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 lg:p-12">
      <SectionHeader title="Nossa História" />
      
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Fundada em 2020, a <strong className="text-purple-600 dark:text-purple-400">ModaStyle</strong> nasceu da paixão por democratizar a moda de qualidade. 
            Nossa jornada começou com uma simples missão: oferecer roupas elegantes e acessíveis 
            para pessoas que valorizam estilo e autenticidade.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Desde então, crescemos para nos tornar uma referência em moda urbana, sempre 
            mantendo nosso compromisso com a qualidade, sustentabilidade e inovação.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Hoje, atendemos milhares de clientes em todo o Brasil, oferecendo uma experiência 
            de compra única e produtos que fazem a diferença no dia a dia de cada pessoa.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ver Coleção
            </Link>
          </div>
        </div>
        
        <EstatisticasGrid />
      </div>
    </div>
  </section>
);

const CallToActionSection = () => (
  <section className="text-center">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white shadow-2xl">
      <h2 className="text-3xl font-bold mb-4">Junte-se à Nossa Comunidade</h2>
      <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
        Faça parte da revolução da moda urbana e descubra um mundo de estilo e autenticidade
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 bg-white rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
        >
          <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" />
          Explorar Coleção
        </Link>
        <Link
          href="/clientes/cadastro"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
        >
          <Users className="h-5 w-5 mr-2" aria-hidden="true" />
          Criar Conta
        </Link>
      </div>
    </div>
  </section>
);

// ============================================================================
// GRID SECTIONS
// ============================================================================
const GridSection = ({ 
  title, 
  subtitle, 
  data, 
  renderItem, 
  gridCols = "md:grid-cols-3" 
}: {
  title: string;
  subtitle: string;
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  gridCols?: string;
}) => (
  <section className="mb-20">
    <SectionHeader title={title} subtitle={subtitle} />
    <div className={`grid ${gridCols} gap-8`}>
      {data.map(renderItem)}
    </div>
  </section>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Sobre() {
  // Memoize render functions para otimizar performance
  const renderValor = useMemo(() => 
    (valor: IconCard, index: number) => (
      <BaseCard key={index}>
        <IconCardContent item={valor} />
      </BaseCard>
    ), []
  );

  const renderMembro = useMemo(() => 
    (membro: MembroEquipe, index: number) => (
      <MembroCard key={index} membro={membro} />
    ), []
  );

  const renderPrincipio = useMemo(() => 
    (principio: IconCard, index: number) => (
      <BaseCard key={index}>
        <IconCardContent item={principio} />
      </BaseCard>
    ), []
  );

  const renderDiferencial = useMemo(() => 
    (diferencial: Diferencial, index: number) => (
      <DiferencialCard key={index} diferencial={diferencial} />
    ), []
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <HistoriaSection />

        <GridSection
          title="Nossos Valores"
          subtitle="Valores que guiam cada decisão e moldam nossa cultura"
          data={VALORES_DATA}
          renderItem={renderValor}
        />

        <GridSection
          title="Nossa Equipe"
          subtitle="Conheça as mentes criativas por trás da ModaStyle"
          data={EQUIPE_DATA}
          renderItem={renderMembro}
        />

        <GridSection
          title="Nossos Princípios"
          subtitle="Os pilares que sustentam nossa jornada"
          data={PRINCIPIOS_DATA}
          renderItem={renderPrincipio}
          gridCols="lg:grid-cols-3"
        />

        <GridSection
          title="Nossos Diferenciais"
          subtitle="O que nos torna únicos no mercado"
          data={DIFERENCIAIS_DATA}
          renderItem={renderDiferencial}
          gridCols="md:grid-cols-2 lg:grid-cols-4"
        />

        <CallToActionSection />
      </div>
    </main>
  );
}