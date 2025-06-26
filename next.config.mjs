/** @type {import('next').NextConfig} */
const nextConfig = {
    // Corrigido: serverComponentsExternalPackages movido para serverExternalPackages

    // Configurações para Neon PostgreSQL
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
    },

    // Configurações de build otimizadas
    experimental: {
        // Outras configurações experimentais se necessário
    },

    // Configurações para produção
    output: 'standalone',

    // Headers de segurança
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' }, // Cuidado: Permitir todas as origens pode ser um risco de segurança.
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ],
            },
        ];
    },

    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '**', // Permite qualquer hostname com http
            },
            {
                protocol: 'https',
                hostname: '**', // Permite qualquer hostname com https
            },
        ],
    },

    reactStrictMode: true,
};

export default nextConfig;
