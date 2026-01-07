const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// POST webhook – כאן WhatsApp שולח הודעות וסטטוסי הודעה
app.post('/webhook', (req, res) => {
  console.log('Webhook reçu:');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// GET webhook – נדרש ל-Verification של WhatsApp
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'mon_token_secret'; // שנה למשהו משלך

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook vérifié !');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// מאזין לפורט (Render נותן PORT דרך environment variable)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook prêt sur le port ${PORT}`));
