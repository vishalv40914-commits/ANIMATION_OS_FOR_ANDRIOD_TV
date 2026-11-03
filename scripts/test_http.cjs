const http = require('http');

http.get('http://localhost:5173/video/backward_smooth.mp4', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
  res.destroy();
}).on('error', (err) => {
  console.error('HTTP Error:', err.message);
});

