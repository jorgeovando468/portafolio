// main.js — envía el formulario al backend /api/contact usando fetch (sin recargar)
(function(){
  'use strict'

  const API_URL = (typeof window !== 'undefined' && typeof window.API_URL !== 'undefined') ? window.API_URL : 'http://localhost:3000/api/contact';
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('contactSubmit');

  function showStatus(type, message){
    statusEl.hidden = false;
    statusEl.className = 'form-status';
    statusEl.classList.add(type === 'ok' ? 'success' : 'error');
    statusEl.textContent = message;
  }

  function clearStatus(){
    statusEl.hidden = true;
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  function validateForm(data){
    // support both FormData-like objects (with .get) and plain objects
    const getter = (key)=>{
      try{
        if(data && typeof data.get === 'function') return (data.get(key) || '').trim();
        return (data && data[key]) ? String(data[key]).trim() : '';
      }catch(e){ return '' }
    };

    const nombre = getter('nombre');
    const email = getter('email');
    const telefono = getter('telefono');
    const mensaje = getter('mensaje');
    const website = getter('website');

    if(website) return { ok:false, error: 'Spam detectado' };
    if(!nombre || nombre.length < 2) {
      console.debug('validateForm: nombre invalid ->', JSON.stringify(nombre));
      return { ok:false, error: 'Nombre debe tener al menos 2 caracteres' };
    }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok:false, error: 'Email inválido' };
    if(telefono && telefono.replace(/\D/g,'').length < 6) return { ok:false, error: 'Teléfono inválido' };
    if(!mensaje || mensaje.length < 10) return { ok:false, error: 'Mensaje debe tener al menos 10 caracteres' };
    return { ok:true };
  }

  if(!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    clearStatus();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    console.debug('main.js submit: formData entries ->', Array.from(formData.entries()));
    console.debug('main.js submit: payload ->', payload);
    // If nombre missing in payload, try to read directly from input (robust against race/reset)
    if(!payload.nombre){
      const inputNombre = document.getElementById('nombre');
      if(inputNombre) payload.nombre = inputNombre.value ? String(inputNombre.value).trim() : '';
      console.debug('main.js submit: recovered nombre from input ->', payload.nombre);
    }
    const valid = validateForm(payload);
    if(!valid.ok){ showStatus('error', valid.error); return; }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';

    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if(res.ok && json && json.ok){
        showStatus('ok', '✅ Mensaje enviado. Gracias por contactarme.');
        form.reset();
      }else{
        showStatus('error', json && json.error ? json.error : 'Error enviando el mensaje');
      }
    }catch(err){
      console.error(err);
      showStatus('error', 'Error de red. Intenta nuevamente.');
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

})();
