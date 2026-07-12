import nextEslintPluginNext from "@next/eslint-plugin-next";
import nx from "@nx/eslint-plugin";
import baseConfig from "../eslint.config.mjs";

export default [
  { plugins: { "@next/next": nextEslintPluginNext } },
  ...nx.configs["flat/react-typescript"],
  ...baseConfig,
  {
    ignores: [".next/**/*", "**/out-tsc"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
