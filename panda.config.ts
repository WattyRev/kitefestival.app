// import { loadingBarKeyframes } from "@/components/ui/LoadingBar";
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
          danger: { value: '#ff6363' },
          secondary: { value: '#cdcdcd' }
        }
      },
      keyframes: {
        loadingBarKeyframes: {
          '0%': {
            backgroundPosition: "0% 0%",
          },
          '100%': {
            backgroundPosition: "200% 0%",
          }
        }
      }
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
