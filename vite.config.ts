
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,      
    allowedHosts: ["*", "8084-i3z1dledn6ncemu7c1v69-a15a7417.manusvm.computer"],  
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
