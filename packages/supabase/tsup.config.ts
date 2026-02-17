import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'], // CJS for Nest.js, ESM for Next.js
  dts: true,              // Generate .d.ts files
  clean: true,            // Clean dist/
  sourcemap: true,        // Dev help
    splitting: false,
    treeshake: true,
});