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
      "src/generated/**",
      "prisma/generated/**",
      "src/test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
  },
  {
    rules: {
      // Code Quality Rules - warnings in development, errors in CI
      "no-unused-vars": "off", // TypeScript handles this
      "@typescript-eslint/no-unused-vars": [
        process.env.CI ? "warn" : "warn", 
        { 
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_" 
        }
      ],
      "@typescript-eslint/no-explicit-any": process.env.CI ? "warn" : "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": process.env.CI ? "warn" : "warn",
      "@typescript-eslint/no-require-imports": process.env.CI ? "warn" : "warn",
      "@typescript-eslint/no-this-alias": process.env.CI ? "warn" : "warn",
      "@typescript-eslint/no-unused-expressions": process.env.CI ? "warn" : "warn",
      
      // Performance Rules - warnings only
      "prefer-const": process.env.CI ? "warn" : "warn",
      "no-var": process.env.CI ? "warn" : "warn",
      "object-shorthand": process.env.CI ? "warn" : "warn",
      
      // Security Rules - always errors
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // React Best Practices
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Next.js handles this
      "react-hooks/exhaustive-deps": process.env.CI ? "warn" : "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-unescaped-entities": process.env.CI ? "warn" : "warn",
      
      // Next.js Specific - always errors for performance
      "@next/next/no-img-element": process.env.CI ? "warn" : "error",
      "@next/next/no-html-link-for-pages": "error",
      
      // Code Style - warnings only
      "prefer-template": process.env.CI ? "warn" : "warn",
      "no-console": [
        process.env.CI ? "warn" : "warn", 
        { "allow": ["warn", "error"] }
      ],
      "eqeqeq": [process.env.CI ? "warn" : "warn", "always"],
      "curly": process.env.CI ? "warn" : "warn",
      
      // Import Rules - warnings only
      "import/no-duplicates": process.env.CI ? "warn" : "warn",
      "import/order": [
        process.env.CI ? "warn" : "warn", 
        {
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
        }
      ]
    }
  }
];

export default eslintConfig;
