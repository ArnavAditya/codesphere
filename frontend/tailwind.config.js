/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  


  theme: {
    extend: {
      backgroundSize: {
        'auto': 'auto',  
        'cover': 'cover',
        'contain': 'contain',
        '100': '100%',
        '50': '50%',
      },
      backgroundPosition: {
        'center': 'center',
        'top': 'top',
        'right': 'right',
        'bottom': 'bottom',
        'left': 'left',
      },
      backgroundAttachment: {
        'fixed': 'fixed', // Adding 'fixed' background attachment
      },
    },
  },


  
  plugins: [],
}



