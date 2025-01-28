/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env:{
    NEXT_PUBLIC_ZEGO_APP_ID:1518343080,
    NEXT_PUBLIC_ZEGO_SERVER_ID:"3a2159121e323714a4d7978c62d9b07a",
  },
  images:{
    domains:["localhost"],
  },
};

module.exports = nextConfig;
