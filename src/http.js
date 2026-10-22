const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export const esperar = ms => new Promise(r => setTimeout(r, ms));

// Pausa aleatoria entre peticiones para no saturar los portales.
export const pausa = (base = 1500) => esperar(base + Math.random() * base);

// Si el portal responde 429 (demasiadas peticiones) espera 30 s, 60 s y 90 s antes de rendirse.
export async function traerHtml(url) {
  for (let intento = 1; ; intento++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-CO,es;q=0.9' } });
    if (res.ok) return res.text();
    if (res.status !== 429) throw new Error(`HTTP ${res.status} en ${url}`);
    if (intento > 3) throw Object.assign(new Error('Demasiadas peticiones (429)'), { limite: true });
    await esperar(30_000 * intento);
  }
}

export const limpiar = s => (s || '').replace(/\s+/g, ' ').trim();
