import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 14px 38px rgba(4, 10, 22, 0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config;
