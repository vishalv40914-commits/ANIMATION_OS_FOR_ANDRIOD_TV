const fs = require('fs');
const { execSync } = require('child_process');

// We can crop and inspect slices or use ffmpeg to get coordinates
// Let's create an edge detection image to clearly visualize the borders of the 7 cards
const imgPath = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793209310270_d294542d.jpg';
const outEdge = 'C:\\ui for tv\\scratch\\cards_edge.png';

execSync(`ffmpeg -y -i "${imgPath}" -vf "edgedetect=low=0.1:high=0.4" "${outEdge}"`, { stdio: 'pipe' });
console.log('Edge detection generated at', outEdge);

