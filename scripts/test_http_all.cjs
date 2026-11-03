const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(url, '-> Status:', res.statusCode, 'Type:', res.headers['content-type'], 'Len:', res.headers['content-length']);
      res.destroy();
      resolve();
    }).on('error', (err) => {
      console.log(url, '-> Error:', err.message);
      resolve();
    });
  });
}

async function main() {
  await check('http://localhost:5173/video/main_intra.mp4');
  await check('http://localhost:5173/video/backward_smooth.mp4');
  await check('http://localhost:5173/video/backward-navigation.mp4');
  await check('http://localhost:5173/video/backward_intra_1080p.mp4');
}

main();

