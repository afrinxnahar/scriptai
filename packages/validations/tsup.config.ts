import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // CJS for Nest.js, ESM for Next.js
  clean: true,            // Clean dist/
  dts: true,              // Generate .d.ts files
  sourcemap: true,        // Dev help
  external: ['zod'],      // External dependency (should not be bundled)
});

