import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  {
    rules: {
      // Code Quality Rules
      "no-unused-vars": "off", // TypeScript handles this
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // Performance Rules
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      
      // Security Rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // React Best Practices
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Next.js handles this
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-unescaped-entities": "warn",
      
      // Next.js Specific
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      
      // Code Style
      "prefer-template": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      
      // Import Rules
      "import/no-duplicates": "error",
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }]
    }
  }
];

export default eslintConfig;
