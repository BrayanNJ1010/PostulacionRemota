// Búsqueda pública de LinkedIn (sin iniciar sesión, tu cuenta no se toca).
// Filtros fijos: Colombia, 100% remoto (f_WT=2) y Solicitud sencilla (f_AL=true).

import * as cheerio from 'cheerio';
import config from '../config.js';
import db from './db.js';
import { traerHtml, pausa, limpiar } from './http.js';

const BASE = 'https://www.linkedin.com/jobs-guest/jobs/api';

export async function buscarLinkedin({ primeraVez }) {
  const { busquedas, paginas, ubicacion } = config.linkedin;
  const rango = primeraVez ? 'r604800' : 'r86400'; // primera vez: última semana; luego: últimas 24 h
  const ids = new Map();

  const vacantes = [];
  try {
    for (const q of busquedas) {
      for (let p = 0; p < paginas; p++) {
        const url = `${BASE}/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(ubicacion)}&f_WT=2&f_AL=true&f_TPR=${rango}&start=${p * 10}`;
        const $ = cheerio.load(await traerHtml(url));
        const tarjetas = $('[data-entity-urn^="urn:li:jobPosting:"]');
        tarjetas.each((_, el) => {
          const id = $(el).attr('data-entity-urn').split(':').pop();
          ids.set(id, {
            titulo: limpiar($(el).find('.base-search-card__title').text()),
            empresa: limpiar($(el).find('.base-search-card__subtitle').text()),
            ubicacion: limpiar($(el).find('.job-search-card__location').text()),
          });
        });
        await pausa(3000);
        if (tarjetas.length < 10) break;
      }
    }

    for (const [num, tarjeta] of ids) {
      const id = `li${num}`;
      if (db.existe(id)) continue;
      const $ = cheerio.load(await traerHtml(`${BASE}/jobPosting/${num}`));
      vacantes.push({
        id,
        fuente: 'LinkedIn',
        titulo: limpiar($('.top-card-layout__title').first().text()) || tarjeta.titulo,
        empresa: limpiar($('.topcard__org-name-link').first().text()) || tarjeta.empresa,
        ubicacion: tarjeta.ubicacion,
        modalidad: 'Remoto',
        salarioTexto: limpiar($('.compensation__salary').first().text()),
        descripcion: limpiar($('.show-more-less-html__markup').text()),
        nivel: limpiar($('.description__job-criteria-text').first().text()),
        url: `https://www.linkedin.com/jobs/view/${num}/`,
      });
      await pausa(3000);
    }
  } catch (e) {
    if (e.limite) console.warn('LinkedIn limitó las peticiones; se sigue en la próxima ronda.');
    else console.error('Error en LinkedIn:', e.message);
  }
  return vacantes;
}
