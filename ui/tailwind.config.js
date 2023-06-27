/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "dm-sans": ["DM Sans"],
        poppins: ["DM Sans"],
        "source-sans-pro": ["DM Sans"],
        inter: ["DM Sans", "sans-serif"],
        larsseit: ["Larsseit", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
