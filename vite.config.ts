// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Deploy no Docker/Node (não Cloudflare): usa preset node-server
  // que serve os assets estáticos corretamente.
  nitro: {
    preset: "node-server",
    output: { dir: ".output" },
    routeRules: {
      // Anti-cache para o Cloudflare: páginas sempre frescas do origin.
      // Assets já têm hash único (immutable), mas o HTML NAO pode ficar em cache.
      "/": {
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate, max-age=0",
          "cdn-cache-control": "no-cache, no-store",
        },
      },
      "/pacientes": {
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "cdn-cache-control": "no-cache, no-store",
        },
      },
      "/pacientes/**": {
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "cdn-cache-control": "no-cache, no-store",
        },
      },
      "/login/**": {
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "cdn-cache-control": "no-cache, no-store",
        },
      },
      // Proxy: /supabase/* → Supabase local (proxy Kong 5432)
      // Usa o IP do HOST (172.16.0.50) pois o container alcança o host via rede.
      // 127.0.0.1 dentro do container é o próprio container (não funciona).
      "/supabase/**": {
        proxy: "http://172.16.0.50:54321/**",
      },
      // Proxy: /waha/* → WAHA local (porta 3000)
      // Para o Disparador funcionar pela internet
      "/waha/**": {
        proxy: "http://172.16.0.50:3000/**",
      },
    },
  },
});
