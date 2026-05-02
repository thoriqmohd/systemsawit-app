import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canopy: {
          50: "#eefdf3",
          100: "#d7f8e3",
          200: "#b3efcc",
          500: "#20a45a",
          600: "#15844a",
          700: "#126b3f",
          900: "#0b3322"
        },
        limewash: "#d9f99d",
        earth: "#9a6b3f",
        clay: "#b7794b",
        ink: "#122018",
        mist: "#f4f7f1"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(19, 80, 48, 0.18)",
        panel: "0 18px 45px rgba(18, 32, 24, 0.08)",
        soft: "0 10px 28px rgba(18, 32, 24, 0.08)"
      },
      backgroundImage: {
        field: "radial-gradient(circle at top left, rgba(217,249,157,0.45), transparent 26rem), linear-gradient(135deg, #f7faf4 0%, #eef6ec 48%, #f8f3ea 100%)",
        darkField: "linear-gradient(135deg, #0b3322 0%, #12422c 52%, #2b4b22 100%)"
      }
    }
  },
  plugins: []
};

export default config;
