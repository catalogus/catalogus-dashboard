import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    var inGroup = function (packages) {
                        return packages.some(function (pkg) { return id.includes(pkg); });
                    };
                    if (inGroup(['pdfjs-dist']))
                        return 'vendor-pdfjs';
                    if (inGroup(['@supabase']))
                        return 'vendor-supabase';
                    if (inGroup(['@tiptap', 'prosemirror', 'linkifyjs']))
                        return 'vendor-editor';
                    return undefined;
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
