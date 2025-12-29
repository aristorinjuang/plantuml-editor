import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: 'index.html',
        app: path.resolve(__dirname, 'src/js/app.js'),
        appCss: path.resolve(__dirname, 'src/css/app.css'),
      },

      output: {
        entryFileNames: 'js/[name].min.[hash].js',
        chunkFileNames: 'js/[name].min.[hash].js',

        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith('.css')) {
            return 'css/[name].min.[hash][extname]'
          }
          return '[name].[hash][extname]'
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
  ],
})
