import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        hmr: {
            overlay: true,
            watch: {
                ignored: ['**/src/client.js'], // Deaktiviere HMR für client.js
            },
        },
    },
});