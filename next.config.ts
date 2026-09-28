import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O indicador de desenvolvimento cobre a navegação inferior no celular.
  devIndicators: false,
  experimental: {
    serverActions: {
      // A importação envia o CSV (até 1 MB) para o servidor; sobra folga para o envelope.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
