/* Konto Odžaci v3 — gomila računa koja se sama sređuje, kviz "paušal ili
   knjige", rokovi od danas, karusel usluga (vuci ili strelice), pitanja,
   meni i pojava na skrol. */
(function () {
  const bezPokreta = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('skrol', scrollY > 10), { passive: true });
  const dugme = document.querySelector('.meni-dugme'), veze = document.querySelector('.nav-veze');
  dugme.addEventListener('click', () => dugme.setAttribute('aria-expanded', veze.classList.toggle('otvoren')));
  veze.addEventListener('click', (e) => { if (e.target.closest('a')) { veze.classList.remove('otvoren'); dugme.setAttribute('aria-expanded', false); } });

  /* ---------- pojava + brojači ---------- */
  const broji = (el) => {
    if (bezPokreta) return;
    const cilj = +el.dataset.broj, t0 = performance.now();
    const k = (t) => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(cilj * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(k); };
    requestAnimationFrame(k);
  };
  const posm = new IntersectionObserver((st) => st.forEach((s) => {
    if (!s.isIntersecting) return;
    s.target.classList.add('vidljiv');
    if (s.target.dataset.broj) broji(s.target);
    posm.unobserve(s.target);
  }), { threshold: 0.12 });
  const posmatraj = (root) => root.querySelectorAll('.pojava, [data-broj]').forEach((el) => posm.observe(el));
  posmatraj(document);

  /* ---------- gomila računa ---------- */
  const gomila = document.querySelector('.gomila');
  if (gomila) {
    const racuni = [
      { n: 'Račun 214', s: [['Roba', '48.200'], ['Prevoz', '6.000'], ['PDV', '10.840']], u: '65.040' },
      { n: 'Izvod 38', s: [['Uplata', '120.000'], ['Provizija', '−240'], ['Isplata', '−54.300']], u: '65.460' },
      { n: 'Faktura SEF', s: [['Usluga', '30.000'], ['PDV 20%', '6.000'], ['Rok', '15 dana']], u: '36.000' },
      { n: 'Platni spisak', s: [['Neto', '82.000'], ['Porez', '9.100'], ['Doprinosi', '38.600']], u: '129.700' },
    ];
    const stik = '<span class="stik"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7"/></svg></span>';
    const el = racuni.map((r) => {
      const d = document.createElement('div'); d.className = 'racun';
      d.innerHTML = '<b>' + r.n + '</b>' + r.s.map(([a, b]) => '<div class="r"><span>' + a + '</span><span>' + b + '</span></div>').join('') +
        '<div class="uk"><span>Ukupno</span><span>' + r.u + '</span></div>' + stik;
      gomila.appendChild(d); return d;
    });
    const naslov = document.querySelector('.racuni-naslov');
    let red = [...el], sredjeno = 0;
    const UGAO = [-3, 4, -6, 7];
    const postavi = (d, i) => { d.style.zIndex = 10 - i; d.style.transform = 'translate(' + i * 7 + 'px, ' + i * -9 + 'px) rotate(' + UGAO[i] + 'deg)'; d.style.opacity = 1; };
    const rasporedi = () => red.forEach(postavi);
    rasporedi();
    const korak = () => {
      const vrh = red[0];
      vrh.classList.add('gotov');
      setTimeout(() => {
        vrh.style.transform = 'translate(140%, -30px) rotate(24deg)';
        vrh.style.opacity = 0;
        red.slice(1).forEach((d, i) => postavi(d, i));
        sredjeno++;
        naslov.textContent = sredjeno + (sredjeno % 10 === 1 && sredjeno % 100 !== 11 ? ' dokument sređen' : [2, 3, 4].includes(sredjeno % 10) && ![12, 13, 14].includes(sredjeno % 100) ? ' dokumenta sređena' : ' dokumenata sređeno');
        setTimeout(() => {
          red.push(red.shift());
          vrh.classList.remove('gotov');
          vrh.style.transition = 'none';
          postavi(vrh, red.length - 1);
          vrh.offsetHeight;
          vrh.style.transition = '';
        }, 750);
      }, 700);
    };
    if (!bezPokreta) setInterval(korak, 2200);
  }

  /* ---------- rokovi ---------- */
  const MES = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  const MES_P = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
  const danas = new Date(); danas.setHours(0, 0, 0, 0);
  const radni = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; };
  const sledeci = (meseci, d) => {
    for (let g = danas.getFullYear(); g <= danas.getFullYear() + 1; g++)
      for (const m of meseci) { const x = radni(new Date(g, m, d)); if (x >= danas) return x; }
  };
  const svi = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const rokovi = [
    { d: sledeci(svi, 15), n: 'PDV — mesečni', o: 'Prijava i plaćanje PDV-a za prethodni mesec.' },
    { d: sledeci(svi, 15), n: 'Paušalni porez i doprinosi', o: 'Mesečna obaveza paušalaca.' },
    { d: sledeci([0, 3, 6, 9], 15), n: 'PDV — tromesečni', o: 'Za prethodno tromesečje.' },
    { d: sledeci([4], 15), n: 'Godišnji porez na dohodak', o: 'Za prethodnu godinu, iznad neoporezivog iznosa.' },
    { d: sledeci([5], 30), n: 'Završni račun', o: 'Finansijski izveštaji za APR i poreski bilans.' },
  ].sort((a, b) => a.d - b.d);
  const dana = (d) => Math.round((d - danas) / 864e5);
  const rec = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana');
  const rokEl = document.querySelector('.rokovi');
  rokEl.innerHTML = rokovi.map((r, i) => {
    const n = dana(r.d);
    return '<div class="plocica rok pojava k' + (i + 1) + (n <= 10 ? ' blizu' : '') + '"><div class="rok-dat"><b>' + r.d.getDate() + '</b><span>' + MES[r.d.getMonth()] + ' ' + r.d.getFullYear() + '</span></div>' +
      '<h3>' + r.n + '</h3><p>' + r.o + '</p><span class="rok-za">' + (n === 0 ? 'danas' : n === 1 ? 'sutra' : 'za ' + n + ' ' + rec(n)) + '</span></div>';
  }).join('');
  posmatraj(rokEl);
  const prvi = rokovi[0], np = dana(prvi.d);
  document.querySelector('.dana-do').textContent = np;
  document.querySelector('.dana-rec').textContent = rec(np);
  document.querySelector('.sledeci-rok').textContent = prvi.d.getDate() + '. ' + MES_P[prvi.d.getMonth()] + ' · ' + prvi.n;

  /* ---------- kviz: paušal ili knjige ---------- */
  const pitanja = [
    { q: 'Koliki godišnji promet očekujete?', o: [['Do 6 miliona dinara', { p: 1 }], ['Preko 6 miliona dinara', { preko: true }], ['Još ne znam', {}]] },
    { q: 'Planirate li da zaposlite radnike?', o: [['Ne, radim sam/sama', { p: 1 }], ['Da, jednog ili više', { k: 1 }], ['Možda kasnije', {}]] },
    { q: 'Koliki su vam troškovi (roba, materijal, zakup) u odnosu na promet?', o: [['Mali — uglavnom prodajem svoje znanje ili rad', { p: 2 }], ['Otprilike pola', {}], ['Veliki — dobar deo prometa ode na troškove', { k: 2 }]] },
    { q: 'Radite li pretežno za jednog naručioca?', o: [['Ne, imam više klijenata', { p: 1 }], ['Da, većinom za jednog', { k: 1, test: true }]] },
  ];
  const telo = document.querySelector('.kviz-telo');
  const trake = document.querySelectorAll('.napredak-kviz span');
  let korakK = 0, st = { p: 0, k: 0, preko: false, test: false };
  const crtaj = () => {
    trake.forEach((t, i) => t.classList.toggle('gotovo', i < korakK));
    if (korakK < pitanja.length) {
      const q = pitanja[korakK];
      telo.innerHTML = '<div class="kviz-pitanje"><span class="etiketa">Pitanje ' + (korakK + 1) + ' od ' + pitanja.length + '</span><h3>' + q.q + '</h3><div class="opcije">' +
        q.o.map(([t], i) => '<button data-i="' + i + '">' + t + '</button>').join('') + '</div></div>';
      telo.querySelectorAll('.opcije button').forEach((b) => b.addEventListener('click', () => {
        const u = q.o[+b.dataset.i][1];
        st.p += u.p || 0; st.k += u.k || 0; if (u.preko) st.preko = true; if (u.test) st.test = true;
        korakK++; crtaj();
      }));
      return;
    }
    let klasa, naslov, tacke;
    if (st.preko) {
      klasa = 'knjige'; naslov = 'Knjige.';
      tacke = ['Sa prometom preko 6 miliona dinara godišnje paušal nije opcija — ide se na knjige.', 'Verovatno i PDV, ako promet pređe 8 miliona u 12 meseci.', 'Dobra vest: na knjigama se priznaju stvarni troškovi.'];
    } else if (st.p >= st.k + 2) {
      klasa = 'pausal'; naslov = 'Liči na paušal.';
      tacke = ['Mali troškovi i rad bez zaposlenih obično idu na ruku paušalu.', 'Paušal znači fiksnu mesečnu obavezu i manje papira.', 'Pazite na limit od 6 miliona dinara prometa godišnje.'];
    } else if (st.k >= st.p + 2) {
      klasa = 'knjige'; naslov = 'Liči na knjige.';
      tacke = ['Veliki troškovi ili zaposleni obično idu na ruku knjigama.', 'Na knjigama se porez plaća na stvarnu dobit, ne na procenu.', 'Više papira — ali to je naš posao, ne vaš.'];
    } else {
      klasa = 'racunica'; naslov = 'Treba računica.';
      tacke = ['Vaši odgovori su na granici — odluka zavisi od konkretnih brojeva.', 'Deset minuta razgovora i računica pre registracije mogu da uštede mnogo.'];
    }
    if (st.test) tacke.push('Rad za jednog naručioca kod paušalaca podleže testu samostalnosti — to treba proveriti pre odluke.');
    telo.innerHTML = '<div class="rezultat"><span class="etiketa">Vaš smer</span><br><span class="presuda ' + klasa + '">' + naslov + '</span><ul>' +
      tacke.map((t) => '<li>' + t + '</li>').join('') + '</ul><a href="tel:+381644748049" class="dugme dugme-plavo">Proverimo zajedno <i><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg></i></a>' +
      '<button class="kviz-ponovo">Ponovo</button></div>';
    telo.querySelector('.kviz-ponovo').addEventListener('click', () => { korakK = 0; st = { p: 0, k: 0, preko: false, test: false }; crtaj(); });
  };
  crtaj();

  /* ---------- karusel: vuci mišem ili strelice ---------- */
  const kar = document.querySelector('.karusel');
  if (kar) {
    const sirina = () => kar.querySelector('.plocica').offsetWidth + 14;
    document.querySelector('.k-levo').addEventListener('click', () => kar.scrollBy({ left: -sirina(), behavior: 'smooth' }));
    document.querySelector('.k-desno').addEventListener('click', () => kar.scrollBy({ left: sirina(), behavior: 'smooth' }));
    let dole = false, x0 = 0, s0 = 0, pomeren = false;
    kar.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; dole = true; pomeren = false; x0 = e.clientX; s0 = kar.scrollLeft; kar.classList.add('vuce'); });
    addEventListener('pointermove', (e) => { if (!dole) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) pomeren = true; kar.scrollLeft = s0 - dx; });
    addEventListener('pointerup', () => { if (!dole) return; dole = false; kar.classList.remove('vuce'); });
    kar.addEventListener('click', (e) => { if (pomeren) { e.preventDefault(); e.stopPropagation(); } }, true);
    kar.querySelectorAll('.plocica').forEach((p, i) => { p.classList.add('pojava', 'k' + Math.min(6, i + 1)); posm.observe(p); });
  }

  /* ---------- pitanja ---------- */
  document.querySelectorAll('.pitanje button').forEach((b) => b.addEventListener('click', () => {
    const p = b.parentElement, bilo = p.classList.contains('otvoren');
    document.querySelectorAll('.pitanje').forEach((x) => x.classList.remove('otvoren'));
    if (!bilo) p.classList.add('otvoren');
  }));
  document.querySelector('.pitanje').classList.add('otvoren');
  document.querySelector('.godina').textContent = new Date().getFullYear();
})();
