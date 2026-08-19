/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "bcryptjs"],
};

export default nextConfig;
