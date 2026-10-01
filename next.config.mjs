/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/configure",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://fineline.co https://www.fineline.co https://fineligne.co https://www.fineligne.co",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
