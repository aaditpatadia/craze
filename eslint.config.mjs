import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // three.js scene code mutates scene objects, materials and camera controls every
    // frame by design (React Three Fiber's recommended pattern). The React Compiler
    // immutability rules cannot model that, so they are relaxed for the 3D files only.
    files: ["components/viewer/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/use-memo": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/draco/**", ".data/**"]),
]);
