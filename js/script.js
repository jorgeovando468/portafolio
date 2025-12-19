// JS mínimo: menú hamburguesa, manejo de formulario y enlace activo por scroll
(function(){
  'use strict'

  /* ====== EmailJS CONFIG ======
   * Replace the placeholders below with your EmailJS values.
   * - EMAILJS_SERVICE_ID: service id (e.g. 'service_xxx')
   * - EMAILJS_TEMPLATE_ID: template id (e.g. 'template_xxx')
   * - EMAILJS_PUBLIC_KEY: your public (user) key
   * To obtain these, create an account at https://www.emailjs.com/ and create a service + template.
   */
  const EMAILJS_SERVICE_ID = (typeof window.EMAILJS_SERVICE_ID !== 'undefined') ? window.EMAILJS_SERVICE_ID : 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = (typeof window.EMAILJS_TEMPLATE_ID !== 'undefined') ? window.EMAILJS_TEMPLATE_ID : 'YOUR_TEMPLATE_ID';
  const EMAILJS_PUBLIC_KEY = (typeof window.EMAILJS_PUBLIC_KEY !== 'undefined') ? window.EMAILJS_PUBLIC_KEY : 'YOUR_PUBLIC_KEY';

  // Initialize EmailJS if SDK loaded and key provided
  if(window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'){
    try{ emailjs.init(EMAILJS_PUBLIC_KEY); }catch(e){console.warn('emailjs.init failed',e)}
  }

  const btnMenu = document.getElementById('btn-menu');
  const menu = document.getElementById('menu');

  function openMenu(){
    menu.setAttribute('data-visible','true');
    btnMenu.setAttribute('aria-expanded','true');
    document.body.classList.add('no-scroll');
    // focus al primer link
    const first = menu.querySelector('a');
    if(first) first.focus();
  }
  function closeMenu(){
    menu.setAttribute('data-visible','false');
    btnMenu.setAttribute('aria-expanded','false');
    document.body.classList.remove('no-scroll');
    btnMenu.focus();
  }

  if(btnMenu && menu){
    btnMenu.addEventListener('click', ()=>{
      const visible = menu.getAttribute('data-visible') === 'true';
      if(visible) closeMenu(); else openMenu();
    });

    // Cerrar menú al seleccionar link en mobile
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      if(window.innerWidth < 768) closeMenu();
    }));

    // Cerrar con ESC
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && menu.getAttribute('data-visible') === 'true'){
        closeMenu();
      }
    });

    // Cerrar al redimensionar si pasa a desktop
    window.addEventListener('resize', ()=>{
      if(window.innerWidth >= 768 && menu.getAttribute('data-visible') === 'true'){
        closeMenu();
      }
    });
  }

  // Formulario: EmailJS handler is optional. To enable client-side EmailJS handling,
  // set `window.ENABLE_EMAILJS = true` in index.html (default: false).
  const form = document.getElementById('contactForm');
  const success = document.getElementById('form-status');
  if(window.ENABLE_EMAILJS && form && success){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();

      if(window.emailjs && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' && EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'){
        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
          .then(() => {
            success.textContent = 'Gracias — tu mensaje ha sido enviado.';
            success.hidden = false;
            success.focus();
            form.reset();
            setTimeout(()=>{ success.hidden = true }, 6000);
          })
          .catch((err)=>{
            console.error('EmailJS error', err);
            success.textContent = 'Ocurrió un error enviando el mensaje. Intenta por WhatsApp.';
            success.hidden = false;
            setTimeout(()=>{ success.hidden = true }, 6000);
          });
      }else{
        // If EmailJS is enabled but not configured, show message
        success.textContent = 'Configura EmailJS para envío real.';
        success.hidden = false;
        success.focus();
        setTimeout(()=>{ success.hidden = true }, 6000);
      }
    });
  }

  // Resaltar enlace activo según intersección de secciones
  const navLinks = document.querySelectorAll('.nav .menu a');
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if('IntersectionObserver' in window && navLinks.length && sections.length){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const id = entry.target.id;
        const link = document.querySelector('.nav .menu a[href="#'+id+'"]');
        if(link){
          if(entry.isIntersecting){
            navLinks.forEach(l=>l.classList.remove('active'));
            link.classList.add('active');
          }
        }
      });
    },{root:null,threshold:0.55});
    sections.forEach(s=>io.observe(s));
  }

})();
