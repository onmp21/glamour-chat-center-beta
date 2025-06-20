import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,      
    allowedHosts: ["*", "8080-ii1acwqe5a43e4xqlz34m-36667fcd.manusvm.computer", "8080-ixv53bfx3uog80rbbkfex-c661bd33.manusvm.computer"],  
  },
  preview: {
    host: "::",
    port: 4173,
    allowedHosts: ["*"]
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

