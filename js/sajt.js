/* Konto Odžaci — ponašanje sajta: reči naslova, T-konto koji sam knjiži,
   poreski kalendar od današnjeg dana, izbor "za koga", pitanja, meni,
   pojava na skrol, brojači, paralaks predmeta i nagib kartica. */
(function () {
  const bezPokreta = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- naslov: reč po reč ---------- */
  document.querySelectorAll('.razbij').forEach((h) => {
    let i = 0;
    const obradi = (cvor) => {
      [...cvor.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((deo) => {
            if (!deo) return;
            if (/^\s+$/.test(deo)) { frag.appendChild(document.createTextNode(deo)); return; }
            const o = document.createElement('span'); o.className = 'rec';
            const u = document.createElement('span'); u.textContent = deo;
            u.style.transitionDelay = (0.08 * i++ + 0.15) + 's';
            o.appendChild(u); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) obradi(n);
      });
    };
    obradi(h);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ucitano')));

  /* ---------- nav + traka napretka ---------- */
  const nav = document.querySelector('.nav');
  const napredak = document.querySelector('.napredak');
  const naSkrol = () => {
    nav.classList.toggle('skrol', scrollY > 20);
    const h = document.documentElement.scrollHeight - innerHeight;
    napredak.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  };
  addEventListener('scroll', naSkrol, { passive: true }); naSkrol();

  const dugme = document.querySelector('.meni-dugme');
  const veze = document.querySelector('.nav-veze');
  dugme.addEventListener('click', () => {
    const otv = veze.classList.toggle('otvoren');
    dugme.setAttribute('aria-expanded', otv);
  });
  veze.addEventListener('click', (e) => {
    if (e.target.closest('a')) { veze.classList.remove('otvoren'); dugme.setAttribute('aria-expanded', false); }
  });

  /* ---------- pojava na skrol + brojači ---------- */
  const broji = (el) => {
    const cilj = +el.dataset.broj, t0 = performance.now();
    if (bezPokreta) return;
    const k = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      el.textContent = Math.round(cilj * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(k);
    };
    requestAnimationFrame(k);
  };
  const posm = new IntersectionObserver((st) => st.forEach((s) => {
    if (!s.isIntersecting) return;
    s.target.classList.add('vidljiv');
    if (s.target.dataset.broj) broji(s.target);
    posm.unobserve(s.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.pojava, [data-broj], .marker').forEach((el) => posm.observe(el));

  /* ---------- T-konto: stavke se knjiže, saldo se zatvara ---------- */
  const tk = document.querySelector('.tkonto');
  if (tk) {
    const knjizenja = [
      { mesec: 'jun', d: [['PS', 'početno stanje', 184500], ['izv', 'uplata kupca', 96000], ['izv', 'uplata kupca', 42300]],
        p: [['izv', 'dobavljač', 118800], ['izv', 'zarade', 146000], ['izv', 'PDV', 58000]] },
      { mesec: 'jul', d: [['PS', 'početno stanje', 212000], ['izv', 'avans kupca', 60000], ['izv', 'uplata kupca', 31500]],
        p: [['izv', 'dobavljač', 97500], ['izv', 'zarade', 146000], ['izv', 'porez', 60000]] },
      { mesec: 'avgust', d: [['PS', 'početno stanje', 150400], ['izv', 'uplata kupca', 88600], ['izv', 'kredit', 50000]],
        p: [['izv', 'dobavljač', 71000], ['izv', 'zarade', 150000], ['izv', 'PDV', 68000]] },
    ];
    const listaD = tk.querySelector('[data-strana=d]'), listaP = tk.querySelector('[data-strana=p]');
    const zd = tk.querySelector('.tk-zd'), zp = tk.querySelector('.tk-zp'), s = tk.querySelector('.tk-s');
    const saldo = tk.querySelector('.tk-saldo'), pecat = tk.querySelector('.pecat'), mesec = tk.querySelector('.tk-mesec');
    const ekran = document.querySelector('.kalk-ekran');
    const cekaj = (ms) => new Promise((r) => setTimeout(r, bezPokreta ? 0 : ms));
    const stavka = ([oz, opis, iznos]) => {
      const d = document.createElement('div'); d.className = 'tk-stavka';
      d.innerHTML = '<i>' + opis + '</i><span>' + fmt(iznos) + '</span>';
      d.title = oz; return d;
    };
    let krug = 0;
    const ciklus = async () => {
      const k = knjizenja[krug++ % knjizenja.length];
      listaD.innerHTML = ''; listaP.innerHTML = '';
      pecat.classList.remove('udaren'); saldo.classList.remove('nula');
      mesec.textContent = k.mesec;
      let sd = 0, sp = 0;
      const osvezi = () => {
        zd.textContent = fmt(sd); zp.textContent = fmt(sp); s.textContent = fmt(sd - sp);
        if (ekran) ekran.textContent = fmt(Math.abs(sd - sp)).replace(/,00$/, '');
      };
      osvezi();
      for (let i = 0; i < 3; i++) {
        for (const [lista, niz, strana] of [[listaD, k.d, 'd'], [listaP, k.p, 'p']]) {
          const el = stavka(niz[i]); lista.appendChild(el);
          await cekaj(60); el.classList.add('upisana');
          if (strana === 'd') sd += niz[i][2]; else sp += niz[i][2];
          osvezi();
          await cekaj(620);
        }
      }
      await cekaj(300);
      saldo.classList.add('nula');
      pecat.classList.add('udaren');
      setTimeout(() => { tk.classList.add('tresi'); setTimeout(() => tk.classList.remove('tresi'), 320); }, 240);
      await cekaj(3600);
      if (!bezPokreta) ciklus();
    };
    ciklus();
  }

  /* ---------- poreski kalendar od danas ---------- */
  const rokoviEl = document.querySelector('.rokovi');
  if (rokoviEl) {
    const MES = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
    const MES_PUNO = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
    const danas = new Date(); danas.setHours(0, 0, 0, 0);
    const radni = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; };
    // sledeći datum iz liste (mesec, dan) koji nije prošao, sa pomeranjem vikenda
    const sledeci = (meseci, dan) => {
      for (let g = danas.getFullYear(); g <= danas.getFullYear() + 1; g++)
        for (const m of meseci) { const d = radni(new Date(g, m, dan)); if (d >= danas) return d; }
    };
    const svi = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const rokovi = [
      { d: sledeci(svi, 15), n: 'PDV prijava — mesečni obveznici', o: 'Poreska prijava i plaćanje PDV-a za prethodni mesec.' },
      { d: sledeci(svi, 15), n: 'Paušalni porez i doprinosi', o: 'Mesečna rata za paušalno oporezovane preduzetnike.' },
      { d: sledeci([0, 3, 6, 9], 15), n: 'PDV prijava — tromesečni obveznici', o: 'Za prethodno poresko tromesečje.' },
      { d: sledeci([4], 15), n: 'Godišnji porez na dohodak građana', o: 'Prijava za prethodnu godinu, za one koji su prešli neoporezivi iznos.' },
      { d: sledeci([5], 30), n: 'Završni račun', o: 'Finansijski izveštaji za APR i poreski bilans za prethodnu godinu.' },
    ].sort((a, b) => a.d - b.d);
    const razlika = (d) => Math.round((d - danas) / 864e5);
    const reciDana = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana');
    rokoviEl.innerHTML = rokovi.map((r, i) => {
      const n = razlika(r.d);
      const kad = n === 0 ? 'danas' : n === 1 ? 'sutra' : 'za ' + n + ' ' + reciDana(n);
      return '<div class="rok pojava k' + (i + 1) + (n <= 7 ? ' hitno' : '') + '">' +
        '<div class="list"><small>' + MES[r.d.getMonth()] + '</small><b>' + r.d.getDate() + '</b></div>' +
        '<div><h3>' + r.n + '</h3><p>' + r.o + '</p></div>' +
        '<div class="odbrojavanje">' + kad + '<small>' + r.d.getFullYear() + '.</small></div></div>';
    }).join('');
    rokoviEl.querySelectorAll('.pojava').forEach((el) => posm.observe(el));
    const prvi = rokovi[0], n = razlika(prvi.d);
    document.querySelector('.dana-do').textContent = n;
    document.querySelector('.dana-rec').textContent = reciDana(n);
    document.querySelector('.sledeci-rok').textContent = prvi.d.getDate() + '. ' + MES_PUNO[prvi.d.getMonth()] + ' — ' + prvi.n.toLowerCase();
  }

  /* ---------- za koga ---------- */
  const kome = [
    { n: 'Paušalac', s: ['Rešenje o paušalu i provera da li je paušal pravi izbor', 'Praćenje limita prometa tokom godine', 'Knjiga prometa i izdavanje računa', 'Podsetnik za mesečne obaveze', 'Prelazak na knjige kad se isplati'] },
    { n: 'Preduzetnik na knjigama', s: ['Vođenje poslovnih knjiga', 'Obračun lične zarade ili isplate dobiti', 'PDV ako ste u sistemu', 'Obračun zarada zaposlenih', 'Godišnji poreski bilans'] },
    { n: 'D.O.O.', s: ['Dvojno knjigovodstvo i glavna knjiga', 'Obračun zarada i prijave radnika', 'PDV, POPDV i e-fakture', 'Završni račun i finansijski izveštaji za APR', 'Usaglašavanje sa kupcima i dobavljačima'] },
    { n: 'Tek osnivam firmu', s: ['Izbor: preduzetnik ili d.o.o.', 'Izbor: paušal ili knjige', 'Registracija u APR-u', 'Otvaranje računa i prvi koraci', 'Prvi račun izdat kako treba'] },
    { n: 'Udruženje', s: ['Knjigovodstvo neprofitnih organizacija', 'Evidencija donacija i projekata', 'Izveštaji prema donatorima', 'Završni račun za APR', 'Obračun honorara i ugovora'] },
  ];
  const komeEl = document.querySelector('.kome-odgovor .menja');
  const pokazi = (i) => {
    komeEl.innerHTML = '<h3>' + kome[i].n + '</h3><ul>' + kome[i].s.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
    komeEl.style.animation = 'none'; komeEl.offsetHeight; komeEl.style.animation = '';
  };
  document.querySelectorAll('.kome button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.kome button').forEach((x) => x.classList.toggle('izabran', x === b));
    pokazi(+b.dataset.kome);
  }));
  pokazi(0);

  /* ---------- pitanja ---------- */
  document.querySelectorAll('.pitanje button').forEach((b) => b.addEventListener('click', () => {
    const p = b.parentElement;
    const bilo = p.classList.contains('otvoren');
    document.querySelectorAll('.pitanje').forEach((x) => x.classList.remove('otvoren'));
    if (!bilo) p.classList.add('otvoren');
  }));
  document.querySelector('.pitanje').classList.add('otvoren');

  const god = document.querySelector('.godina');
  if (god) god.textContent = new Date().getFullYear();

  /* ---------- miš: paralaks predmeta i nagib kartica ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !bezPokreta) {
    const predmeti = document.querySelectorAll('[data-dubina]');
    addEventListener('mousemove', (e) => {
      const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
      predmeti.forEach((p) => { const d = +p.dataset.dubina; p.style.transform = `translate(${dx * d}px, ${dy * d}px)`; });
    });
    document.querySelectorAll('.usluga').forEach((c) => {
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        c.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-6px)`;
      });
      c.addEventListener('mouseleave', () => (c.style.transform = ''));
    });
  }
})();
