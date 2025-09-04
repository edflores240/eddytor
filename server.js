const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the dist directory
app.use(express.static('dist'));
app.use(express.static('.'));

// Serve the demo.html file at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

app.listen(port, () => {
  console.log(`Eddytor demo running at http://localhost:${port}`);
});
