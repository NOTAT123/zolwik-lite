// server.js
const express = require('express');
const fetch = require('node-fetch');  // npm install node-fetch
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");  // pozwalamy każdemu
  next();
});

app.get('/api/incidents', async (req, res) => {
  const bbox = req.query.bbox;
  const url = `https://api.tomtom.com/traffic/services/3/incidents?bbox=${bbox}&key=pfjfazSzxNWPzu477bk8LCwONLNkLgdY&fields=all`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);  // zwracamy do przeglądarki
  } catch (err) {
    res.status(500).send({ error: "Błąd pobierania z TomTom" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy działa na http://localhost:${PORT}`);
});
