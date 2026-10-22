// Búsqueda pública de Computrabajo Colombia. Solo pasan ofertas marcadas "Remoto" o "Presencial y remoto"
// (estas últimas se revisan luego para aceptar solo 1 o 2 veces al mes).

import * as cheerio from 'cheerio';
import config from '../config.js';
import db from './db.js';
import { traerHtml, pausa, limpiar } from './http.js';

const BASE = 'https://co.computrabajo.com';

export async function buscarComputrabajo() {
  const tarjetas = new Map();

  const vacantes = [];
  try {
    for (const q of config.computrabajo.busquedas) {
      for (let p = 1; p <= config.computrabajo.paginas; p++) {
        const $ = cheerio.load(await traerHtml(`${BASE}/trabajo-de-${q}${p > 1 ? `?p=${p}` : ''}`));
        const articulos = $('article.box_offer');
        articulos.each((_, el) => {
          const a = $(el);
          const modalidad = limpiar(a.find('.i_home').parent().text());
          if (!/remoto/i.test(modalidad)) return;
          tarjetas.set(a.attr('data-id'), {
            titulo: limpiar(a.find('h2 a').first().text()),
            empresa: limpiar(a.find('p.dFlex').first().text()).replace(/^\d,\d\s+/, ''), // quita la calificación "4,5"
            ubicacion: limpiar(a.find('p.fs16 span.mr10').first().text()),
            salarioTexto: limpiar(a.find('.i_salary').parent().text()),
            modalidad,
            url: BASE + (a.find('h2 a').attr('href') || '').split('#')[0],
          });
        });
        await pausa();
        if (articulos.length < 20) break;
      }
    }

    for (const [num, t] of tarjetas) {
      const id = `ct${num}`;
      if (db.existe(id)) continue;
      const $ = cheerio.load(await traerHtml(t.url));
      const descripcion = limpiar($('[description-offer]').text()) || limpiar($('main').text());
      vacantes.push({ id, fuente: 'Computrabajo', ...t, descripcion });
      await pausa();
    }
  } catch (e) {
    console.error('Error en Computrabajo:', e.message);
  }
  return vacantes;
}
