import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/', // GANZ WICHTIG
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'], // Unterstütze .mjs-Dateien
        dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'], // Verhindert doppelte Module
    },
    build: {
        target: 'esnext',
        minify: true, // Minifizierung für Produktionsbuild
        sourcemap: false, // Deaktiviere Sourcemaps für Produktion
        rollupOptions: {
            // Entfernt externe Abhängigkeiten, um React Router korrekt zu bündeln
            external: [],
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom'],
                    'router': ['react-router', 'react-router-dom']
                }
            }
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router', 'react-router-dom'], // Alle wichtigen Abhängigkeiten
        force: true, // Erzwinge Neuerstellung der Deps-Cache
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'), // Erzwinge Produktionsmodus
    },
});