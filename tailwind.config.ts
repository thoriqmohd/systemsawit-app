import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f2fbf5",
          100: "#dff6e7",
          500: "#1f9d55",
          600: "#168044",
          900: "#123b25"
        },
        soil: "#7a4f2a",
        ink: "#17201b"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(22, 32, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
