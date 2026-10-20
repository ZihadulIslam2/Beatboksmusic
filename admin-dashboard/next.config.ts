import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.beatboksmusic.com",
      },
      {
        protocol: "https",
        hostname: "larsfalck-media.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "larsfalck-media1.s3.eu-north-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
