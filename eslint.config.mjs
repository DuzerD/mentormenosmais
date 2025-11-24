import nextPlugin from "@next/eslint-plugin-next"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import reactPlugin from "eslint-plugin-react"
import tseslint from "typescript-eslint"
import globals from "globals"

export default tseslint.config(
  {
    ignores: ["node_modules", ".next", "dist"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  ...tseslint.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
      react: reactPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "prefer-const": "off",
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "error",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
)
