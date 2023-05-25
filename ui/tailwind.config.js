/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "dm-sans": ["DM Sans"],
        poppins: ["Poppins"],
        "source-sans-pro": ["Source Sans Pro"],
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
