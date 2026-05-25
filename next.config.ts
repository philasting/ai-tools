import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/my-toolbox",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
