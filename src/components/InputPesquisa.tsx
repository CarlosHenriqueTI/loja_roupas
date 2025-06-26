"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Roupa } from "@/types/Roupa";

interface InputPesquisaProps {
  setRoupas: (roupas: Roupa[]) => void;
}

export default function InputPesquisa({ setRoupas }: InputPesquisaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const buscarProdutos = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const response = await api.getRoupas({ search: term });
        if (response.success && response.data) {
          setRoupas(response.data as Roupa[]);
        } else {
          setRoupas([]);
        }
      } catch {
        setRoupas([]);
      } finally {
        setLoading(false);
      }
    },
    [setRoupas]
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await buscarProdutos(searchTerm);
  };

  const handleClear = async () => {
    setSearchTerm("");
    await buscarProdutos("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busque por nome ou marca..."
            className="w-full pl-12 pr-24 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-full focus:border-purple-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />

          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-2">
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={loading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-full transition-colors font-medium"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-3 flex justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Digite o nome ou marca da roupa que você está procurando
        </p>
      </div>
    </div>
  );
}