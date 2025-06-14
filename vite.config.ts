
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,      
    allowedHosts: ["*", "8080-i441ei3btftqyelp9i0cb-33eec26f.manusvm.computer", "8080-id28melubwheqr7k5q8eg-54688680.manusvm.computer", "8080-i2b6daii969adxqou7awt-a09691d2.manusvm.computer", "8081-i71k18id0kzw7v04fapyz-fe238dfd.manusvm.computer", "8080-i71k18id0kzw7v04fapyz-fe238dfd.manusvm.computer", "8080-im914jdjsmmcc9holwkeu-4ce3b20d.manus.computer", "8080-i55ic1yyqcyiokqgz847c-236f8b2a.manusvm.computer", "8081-i1mpnvlaomojj2foz881w-c492ae99.manusvm.computer", "8080-iyzuk608s4sxzb37almbw-21becea3.manusvm.computer", "8080-iog4cv41rbeogdefiaova-9126358d.manus.computer", "8080-ij9q687f980ofi1ox27wm-fc096a06.manusvm.computer"],  
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
