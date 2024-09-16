import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          sectionBackground: { value: 'rgba(83, 174, 255, 0.29)' },
          success: { value: '#a1d78e' },
          danger: { value: '#ff6363' }
        }
      }
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
