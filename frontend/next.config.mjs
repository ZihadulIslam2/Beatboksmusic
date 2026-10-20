/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "larsfalck-media.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "larsfalck-media1.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.beatboksmusic.com",
      },
    ],
  },
};

export default nextConfig;
