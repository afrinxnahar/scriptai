import { defineConfig, type Options } from 'tsup';

const config: Options = {
  entry: ['index.ts'],
  format: ['cjs', 'esm'], // CJS for Nest.js, ESM for Next.js
  clean: true,            // Clean dist/
  sourcemap: true,        // Dev help
};

export default defineConfig(config);

