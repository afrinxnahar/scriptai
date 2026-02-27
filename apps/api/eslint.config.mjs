import nestjsPlugin from "@darraghor/eslint-plugin-nestjs-typed";

const [base, ...recommendedRest] = nestjsPlugin.configs.flatRecommended;
export default [
  base,
  ...nestjsPlugin.configs.flatNoSwagger,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: { project: "./tsconfig.json" },
    },
  },
  { ignores: ["dist/", "node_modules/", "**/*.spec.ts"] },
];
