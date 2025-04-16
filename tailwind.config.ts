import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#F7F6CF',
                'light-blue': '#B6D8F2',
                'blue': '#5784BA',
                'pink': '#F4CFDF',
                'sky-blue': '#9AC8EB',
            },
        },
    },
    plugins: [],
};
export default config; 