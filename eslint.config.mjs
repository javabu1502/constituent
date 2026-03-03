import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      // External rep photos from Congress API and Google Civic API use
      // unpredictable domains and onError fallbacks incompatible with next/image
      "@next/next/no-img-element": "off",
    },
  },
];
