const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // אם אין לך עדיין, תתקין: npm install node-fetch@2

const app = express();
app.use(bodyParser.json());

// משתנה לשמירת מצב שיחה לפי מספר
const sessions = {};

// Token שלך ל-WhatsApp Cloud
const WHATSAPP_TOKEN = 'EAAWCKkyjMb8BQez8jd66VPNNLjvWL5EXPK2dcq6sBpwuKLZBC2RxCiJ9HEsAOjOZCAYD05xMqwj8ZBD9YmTXg75iQdvkfq2pmnYUZCSSjGEB85T6Lzq9AZB7WQqPJ3wDoYrzbdgGH1ZAN45bVwBUNqAdH0zV5eJe064MmkwcdFonnLZCEZCQwHNChGKRSZCOH2ZBvBjfY0bD7NByZBqAzAXf00oARI6PDlPESsjeZCXZCaZAUsGYLrT4xX1xbyZCuDfs9dmkg1hZB7UnDzYhZCefLoiNcW56ZA';
const PHONE_NUMBER_ID = '930921963441947'; // מספר WhatsApp Cloud שלך

// פונקציה לשלוח הודעה חזרה
async function sendMessage(to, text) {
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('Réponse API WhatsApp:', data);
  } catch (err) {
    console.error('Erreur envoi message:', err);
  }
}

// POST webhook – WhatsApp שולח לכאן הודעות
app.post('/webhook', async (req, res) => {
  // בדיקה קצרה אם יש הודעה
  const entry = req.body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body || '';

  if (!sessions[from]) sessions[from] = 'start';

  let reply;

  switch(sessions[from]) {
    case 'start':
      reply = 'שלום! תרצה להזמין עוגה?';
      sessions[from] = 'asked_order';
      break;
    case 'asked_order':
      if (text.toLowerCase() === 'כן') {
        reply = 'כמה עוגות תרצה להזמין?';
        sessions[from] = 'asked_quantity';
      } else {
        reply = 'בסדר, תודה!';
        delete sessions[from];
      }
      break;
    case 'asked_quantity':
      reply = `קיבלתי, אז ${text} עוגות! תודה על ההזמנה!`;
      delete sessions[from];
      break;
    default:
      reply = 'היי! תרצה להתחיל להזמין עוגות?';
      sessions[from] = 'asked_order';
  }

  await sendMessage(from, reply);
  res.sendStatus(200);
});

// GET webhook – Verification
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
