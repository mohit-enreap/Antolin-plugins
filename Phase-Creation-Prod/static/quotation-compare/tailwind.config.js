/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false, // ← let Atlaskit own the reset; Tailwind adds utilities only
  },
  theme: { extend: {} },
  plugins: [],
};
