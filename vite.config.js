import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/', // GANZ WICHTIG (bleibt unverändert)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'), // Bestehender Alias bleibt
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'], // Unterstütze .mjs für Module wie react-router
    },
    build: {
        target: 'esnext', // Sicherstellen, dass moderne ES-Module verwendet werden
        rollupOptions: {
            external: ['react', 'react-dom', 'react-router', 'react-router-dom'], // Verhindere, dass diese Module gebündelt werden
        },
    },
    optimizeDeps: {
        include: ['react-router', 'react-router-dom'], // Optimiere diese Abhängigkeiten vorab
    },
});