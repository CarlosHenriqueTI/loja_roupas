'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Roupa, formatarPreco, gerarAltText, validarUrlImagem, gerarPlaceholderImagem } from '../types/Roupa';

interface CardRoupaProps {
  roupa: Roupa;
}

export function CardRoupa({ roupa }: CardRoupaProps) {
  const [imageError, setImageError] = useState(false);

  // Função para lidar com erro de imagem
  const handleImageError = () => {
    console.warn(`Erro ao carregar imagem para ${roupa.nome}:`, roupa.foto);
    setImageError(true);
  };

  // Determinar qual imagem usar
  const imagemParaUsar = React.useMemo(() => {
    if (imageError || !validarUrlImagem(roupa.foto)) {
      return gerarPlaceholderImagem(roupa);
    }
    return roupa.foto;
  }, [imageError, roupa]);

  // Componente de placeholder personalizado
  const PlaceholderComponent = () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <svg 
        className="w-16 h-16 mb-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
      <span className="text-xs text-center px-2">Imagem não disponível</span>
    </div>
  );

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Badge de destaque */}
      {roupa.destaque && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
            ⭐ Destaque
          </span>
        </div>
      )}

      {/* Link para detalhes */}
      <Link href={`/detalhes/${roupa.id}`} className="block">
        {/* Imagem */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {imagemParaUsar && !imageError ? (
            <Image
              src={imagemParaUsar}
              alt={gerarAltText(roupa)}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={roupa.destaque} // Priorizar imagens de destaque
            />
          ) : (
            <PlaceholderComponent />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
              {roupa.nome}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {roupa.marca}
            </p>
          </div>

          {/* Ano (se disponível) */}
          {roupa.ano && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
              Ano: {roupa.ano}
            </p>
          )}

          {/* Modelo (se disponível) */}
          {roupa.modelo?.nome && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">
              {roupa.modelo.nome}
            </p>
          )}

          {/* Acessórios (se disponível) */}
          {roupa.acessorios && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              <span className="font-medium">Acessórios:</span> {roupa.acessorios}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatarPreco(roupa.preco)}
            </span>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                Ver Detalhes
                <svg 
                  className="ml-2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Contador de interações (se disponível) */}
          {roupa._count?.interacoes !== undefined && roupa._count.interacoes > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                {roupa._count.interacoes} interação{roupa._count.interacoes !== 1 ? 'ões' : ''}
              </p>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default CardRoupa;