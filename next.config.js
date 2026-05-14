/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép domain ngrok truy cập dev resources (HMR, font…)
  allowedDevOrigins: ['pegboard-moneyless-scooter.ngrok-free.dev'],

  // Truyền biến môi trường ra client
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // Ẩn build indicator (tuỳ chọn)
  devIndicators: {
    buildActivity: false,
  },

  // (Không bắt buộc) header cho static dev assets
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;