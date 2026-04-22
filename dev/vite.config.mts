import { defineConfig } from "vite";
import simpleHtmlPlugin from "vite-plugin-simple-html";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
    base: "./",
    root: "dev",
    plugins: [
        simpleHtmlPlugin({
            minify: {
                minifyJs: true,
                sortSpaceSeparatedAttributeValues: true,
                sortAttributes: true,
                tagOmission: false
            }
        }),
        legacy({
            targets: "Edge >= 18",
            polyfills: true,
            renderModernChunks: false
        })
    ],
    build: {
        outDir: "dist",
        sourcemap: true,
        rolldownOptions: {
            checks: {
                pluginTimings: false
            }
        },
        chunkSizeWarningLimit: 1024
    }
});