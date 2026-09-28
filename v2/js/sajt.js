/* Konto Odžaci (ozbiljna verzija) — bilans koji se sam usaglašava, poreski
   kalendar sa vremenskom osom od danas, izbor klijenta, pitanja, meni i
   pojava na skrol. */
(function () {
  const bezPokreta = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cekaj = (ms) => new Promise((r) => setTimeout(r, bezPokreta ? 0 : ms));
  const mil = (n) => (n / 1000).toLocaleString('sr-RS', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mil';

  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ucitano')));

  /* ---------- nav ---------- */
  const nav = document.querySelector('.nav'), napredak = document.querySelector('.napredak');
  const naSkrol = () => {
    nav.classList.toggle('skrol', scrollY > 30);
    const h = document.documentElement.scrollHeight - innerHeight;
    napredak.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  };
  addEventListener('scroll', naSkrol, { passive: true }); naSkrol();
  const dugme = document.querySelector('.meni-dugme'), veze = document.querySelector('.nav-veze');
  dugme.addEventListener('click', () => dugme.setAttribute('aria-expanded', veze.classList.toggle('otvoren')));
  veze.addEventListener('click', (e) => { if (e.target.closest('a')) { veze.classList.remove('otvoren'); dugme.setAttribute('aria-expanded', false); } });

  /* ---------- pojava + brojači ---------- */
  const broji = (el) => {
    if (bezPokreta) return;
    const cilj = +el.dataset.broj, t0 = performance.now();
    const k = (t) => { const p = Math.min(1, (t - t0) / 1500); el.textContent = Math.round(cilj * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(k); };
    requestAnimationFrame(k);
  };
  const posm = new IntersectionObserver((st) => st.forEach((s) => {
    if (!s.isIntersecting) return;
    s.target.classList.add('vidljiv');
    if (s.target.dataset.broj) broji(s.target);
    posm.unobserve(s.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  const posmatraj = (root) => root.querySelectorAll('.pojava, [data-broj]').forEach((el) => posm.observe(el));
  posmatraj(document);

  /* ---------- bilans: aktiva = pasiva ---------- */
  const bilans = document.querySelector('.bilans');
  if (bilans) {
    const skupovi = [
      { dan: '31.12.2024.', a: [8200, 5300, 1500], p: [9100, 2400, 3500] },
      { dan: '31.12.2025.', a: [6400, 4800, 2300], p: [7900, 1800, 3800] },
      { dan: '30.06.2026.', a: [7100, 6200, 1900], p: [8600, 2900, 3700] },
    ];
    const MAKS = 16000;
    const stubA = bilans.querySelector('[data-strana=a]'), stubP = bilans.querySelector('[data-strana=p]');
    const segA = stubA.querySelectorAll('.seg'), segP = stubP.querySelectorAll('.seg');
    const zA = bilans.querySelector('.z-a'), zP = bilans.querySelector('.z-p');
    const ravn = bilans.querySelector('.ravnoteza'), telo = bilans.querySelector('.bilans-telo');
    const potvrda = bilans.querySelector('.potvrda'), ptekst = bilans.querySelector('.potvrda-tekst');
    const dan = bilans.querySelector('.bilans-dan');
    let i = 0;
    const krug = async () => {
      const s = skupovi[i++ % skupovi.length];
      dan.textContent = 'na dan ' + s.dan;
      [...segA, ...segP].forEach((g) => { g.style.height = '0'; g.classList.remove('puno'); });
      ravn.classList.remove('vidi'); potvrda.classList.remove('ok'); ptekst.textContent = 'Usaglašavanje u toku…';
      let sa = 0, sp = 0; zA.textContent = '0'; zP.textContent = '0';
      await cekaj(700);
      const visina = stubA.clientHeight;
      for (let k = 0; k < 3; k++) {
        for (const [seg, v, strana] of [[segA[k], s.a[k], 'a'], [segP[k], s.p[k], 'p']]) {
          seg.style.height = (v / MAKS) * visina + 'px';
          seg.querySelector('.v').textContent = mil(v);
          seg.classList.add('puno');
          if (strana === 'a') { sa += v; zA.textContent = mil(sa); } else { sp += v; zP.textContent = mil(sp); }
          await cekaj(520);
        }
      }
      await cekaj(700);
      const r = stubA.getBoundingClientRect(), t = telo.getBoundingClientRect();
      ravn.style.top = (r.bottom - t.top - (sa / MAKS) * visina - 3 * 3) + 'px';
      ravn.classList.add('vidi');
      potvrda.classList.add('ok');
      ptekst.textContent = 'Aktiva = Pasiva · ' + mil(sa) + ' RSD · usaglašeno';
      await cekaj(4200);
      if (!bezPokreta) krug();
    };
    krug();
  }

  /* ---------- poreski kalendar ---------- */
  const MES = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  const danas = new Date(); danas.setHours(0, 0, 0, 0);
  const radni = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; };
  const sledeci = (meseci, d) => {
    for (let g = danas.getFullYear(); g <= danas.getFullYear() + 1; g++)
      for (const m of meseci) { const x = radni(new Date(g, m, d)); if (x >= danas) return x; }
  };
  const svi = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const rokovi = [
    { d: sledeci(svi, 15), n: 'PDV — mesečni obveznici', o: 'Poreska prijava i plaćanje PDV-a za prethodni mesec.' },
    { d: sledeci(svi, 15), n: 'Paušalni porez i doprinosi', o: 'Mesečna obaveza paušalno oporezovanih preduzetnika.' },
    { d: sledeci([0, 3, 6, 9], 15), n: 'PDV — tromesečni obveznici', o: 'Prijava za prethodno poresko tromesečje.' },
    { d: sledeci([4], 15), n: 'Godišnji porez na dohodak', o: 'Prijava za prethodnu godinu, iznad neoporezivog iznosa.' },
    { d: sledeci([5], 30), n: 'Završni račun', o: 'Finansijski izveštaji za APR i poreski bilans.' },
  ].sort((a, b) => a.d - b.d);
  const dana = (d) => Math.round((d - danas) / 864e5);
  const rec = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana');
  const kad = (n) => (n === 0 ? 'danas' : n === 1 ? 'sutra' : 'za <b>' + n + '</b> ' + rec(n));

  const rokEl = document.querySelector('.rokovi');
  if (rokEl) {
    rokEl.innerHTML = rokovi.map((r, i) => {
      const n = dana(r.d);
      return '<div class="rok pojava k' + (i + 1) + (n <= 7 ? ' blizu' : '') + '">' +
        '<div class="rok-dat">' + r.d.getDate() + '<small>' + MES[r.d.getMonth()] + ' ' + r.d.getFullYear() + '</small></div>' +
        '<h3>' + r.n + '</h3><p>' + r.o + '</p><div class="rok-za">' + kad(n) + '</div></div>';
    }).join('');
    posmatraj(rokEl);

    // vremenska osa: narednih 12 meseci
    const kraj = new Date(danas); kraj.setFullYear(kraj.getFullYear() + 1);
    const raspon = kraj - danas;
    const x = (d) => Math.max(0, Math.min(100, ((d - danas) / raspon) * 100));
    const jedinstveni = [...new Map(rokovi.map((r) => [+r.d, r])).values()];
    document.querySelector('.osa-tacke').innerHTML = jedinstveni.map((r, i) =>
      '<span class="osa-tacka' + (dana(r.d) <= 30 ? ' blizu' : '') + '" style="left:' + x(r.d) + '%;transition-delay:' + (0.3 + i * 0.12) + 's" title="' + r.d.getDate() + '. ' + MES[r.d.getMonth()] + ' — ' + r.n + '"></span>').join('');
    const m = []; for (let k = 0; k < 12; k++) m.push('<span>' + MES[(danas.getMonth() + k) % 12] + '</span>');
    document.querySelector('.osa-meseci').innerHTML = m.join('');

    // ticker
    const stavke = rokovi.map((r) => '<span><b>' + r.d.getDate() + '. ' + MES[r.d.getMonth()] + '</b>' + r.n + '</span>').join('') +
      '<span><b>od 2009.</b>Konto Odžaci</span><span><b>025 744 797</b>064 474 8049</span>';
    document.querySelector('.ticker-niz').innerHTML = stavke + stavke;
  }

  /* ---------- za koga ---------- */
  const kome = [
    { n: 'Paušalni preduzetnik', s: ['Procena da li je paušal pravi izbor', 'Rešenje o paušalnom oporezivanju', 'Praćenje limita prometa tokom godine', 'Knjiga prometa i izdavanje računa', 'Prelazak na knjige kada se isplati'] },
    { n: 'Preduzetnik na knjigama', s: ['Vođenje poslovnih knjiga', 'Lična zarada ili isplata dobiti', 'PDV evidencija i prijave', 'Obračun zarada zaposlenih', 'Godišnji poreski bilans'] },
    { n: 'Privredno društvo', s: ['Dvojno knjigovodstvo i glavna knjiga', 'Obračun zarada i prijave zaposlenih', 'PDV, POPDV i elektronske fakture', 'Finansijski izveštaji za APR', 'Usaglašavanje sa kupcima i dobavljačima'] },
    { n: 'Osnivanje firme', s: ['Izbor: preduzetnik ili d.o.o.', 'Izbor načina oporezivanja', 'Registracija u APR-u', 'Otvaranje računa i prvi koraci', 'Prvi račun izdat u skladu sa propisima'] },
    { n: 'Udruženja', s: ['Knjigovodstvo neprofitnih organizacija', 'Evidencija donacija i projekata', 'Izveštaji prema donatorima', 'Finansijski izveštaji za APR', 'Obračun honorara i ugovora'] },
  ];
  const komeEl = document.querySelector('.kome-sadrzaj');
  const pokazi = (i) => { komeEl.innerHTML = '<h3>' + kome[i].n + '</h3><ol>' + kome[i].s.map((x) => '<li>' + x + '</li>').join('') + '</ol>'; };
  document.querySelectorAll('.kome-lista button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.kome-lista button').forEach((x) => x.classList.toggle('izabran', x === b));
    pokazi(+b.dataset.kome);
  }));
  pokazi(0);

  /* ---------- pitanja ---------- */
  document.querySelectorAll('.pitanje button').forEach((b) => b.addEventListener('click', () => {
    const p = b.parentElement, bilo = p.classList.contains('otvoren');
    document.querySelectorAll('.pitanje').forEach((x) => x.classList.remove('otvoren'));
    if (!bilo) p.classList.add('otvoren');
  }));
  document.querySelector('.pitanje').classList.add('otvoren');

  document.querySelector('.godina').textContent = new Date().getFullYear();
})();
