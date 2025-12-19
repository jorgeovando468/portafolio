require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// CORS: permitir solo orígenes configurados (comma-separated) or '*' para todos
const allowed = ALLOWED_ORIGIN === '*' ? ['*'] : ALLOWED_ORIGIN.split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like curl or same-origin)
    if(!origin) return callback(null, true);
    if(allowed[0] === '*') return callback(null, true);
    // exact match OR match hostname variant (localhost vs 127.0.0.1)
    const matches = allowed.some(a=>{
      if(!a) return false;
      if(a === origin) return true;
      try{
        const ao = new URL(a).host;
        const o = new URL(origin).host;
        // allow same port/host variants (localhost vs 127.0.0.1)
        return ao === o;
      }catch(e){
        return false;
      }
    });
    if(matches) return callback(null, true);
    const msg = `CORS policy: origin ${origin} not allowed`;
    console.warn(msg);
    return callback(new Error(msg), false);
  }
}));

// Bodyparser (form-data): express will handle urlencoded and json; we accept urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rate limiter: 5 requests por 10 minutos
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { ok:false, error: 'Demasiadas solicitudes, intenta de nuevo más tarde.' } });
app.use('/api/contact', limiter);

// Validación sencilla
function validatePayload(payload){
  const nombre = (payload.nombre || '').trim();
  const email = (payload.email || '').trim();
  const telefono = (payload.telefono || '').trim();
  const mensaje = (payload.mensaje || '').trim();
  const website = (payload.website || '').trim();

  if(website) return { ok:false, error: 'Spam detectado' };
  if(!nombre || nombre.length < 2) return { ok:false, error: 'Nombre inválido' };
  if(!email || !/^\S+@\S+\.\S+$/.test(email)) return { ok:false, error: 'Email inválido' };
  if(telefono && telefono.replace(/\D/g,'').length < 6) return { ok:false, error: 'Teléfono inválido' };
  if(!mensaje || mensaje.length < 10) return { ok:false, error: 'Mensaje demasiado corto' };
  return { ok:true, data: { nombre, email, telefono, mensaje } };
}

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try{
    const validated = validatePayload(req.body || {});
    if(!validated.ok) return res.status(400).json({ ok:false, error: validated.error });

    // Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const { nombre, email, telefono, mensaje } = validated.data;
    const now = new Date().toLocaleString();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.DEST_EMAIL || process.env.SMTP_USER,
      subject: `Nuevo mensaje desde Portafolio - ${nombre}`,
      text: `Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono || '-'}\nFecha: ${now}\n\nMensaje:\n${mensaje}`,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok:true, message: 'Mensaje enviado' });
  }catch(err){
    console.error('Contact error:', err);
    return res.status(500).json({ ok:false, error: 'Error interno enviando el mensaje' });
  }
});

app.listen(PORT, ()=>{
  console.log(`Contact API running on port ${PORT}`);
});
