import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "100mb",
        },
    },
    images: {
        remotePatterns: [new URL("https://picsum.photos/**")],
    },
};

const withMDX = createMDX({
    // customise the config file path
    // configPath: "source.config.ts"
});

export default withMDX(nextConfig);
