const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, 'site');
const files = fs.readdirSync(siteDir).filter(f => f.endsWith('.html'));

const configScript = `
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          colors: {
            white: '#161B22',   /* Dark panel color */
            gray: {
              50: '#0D1117',    /* Darkest background */
              100: '#21262D',   /* Slightly lighter for hover elements */
              200: '#30363D',   /* Borders / secondary background */
              300: '#484F58',   /* Borders */
              400: '#8B949E',   /* Muted text */
              500: '#8B949E',   /* Form text / icons */
              600: '#C9D1D9',   /* Subheadings */
              700: '#C9D1D9',   /* Body Text */
              800: '#F0F6FC',   /* Main headings */
            },
            blue: {
              600: '#58A6FF',   /* Primary Blue Accent */
              700: '#79C0FF',   /* Primary Blue Hover */
            }
          }
        }
      }
    }
  </script>
</head>`;

files.forEach(file => {
  const filePath = path.join(siteDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Safe injection
  if (!content.includes('tailwind.config')) {
     content = content.replace('</head>', configScript);
     
     // Manual tweak for the hero section to make it look premium and match our new dark palette
     content = content.replace(
        'bg-gradient-to-r from-blue-600 to-purple-700 text-white',
        'bg-[#161B22] border-b border-gray-200 text-gray-800'
     );
     
     // Manual tweak for the Shop Now button in hero
     // Originally: class="bg-white text-blue-600 ..."
     // Let's make it the primary blue button
     content = content.replace(
        'bg-white text-blue-600 px-8 py-3',
        'bg-blue-600 text-[#0D1117] px-8 py-3'
     );

     fs.writeFileSync(filePath, content, 'utf8');
     console.log('Injected deeply mapped Tailwind config into ' + file);
  }
});
