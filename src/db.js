// Guarda en un JSON todas las vacantes vistas, para no enviar nunca la misma dos veces.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = path.join(DIR, 'vacantes.json');

let data = { chatId: null, vacantes: {} };

if (fs.existsSync(FILE)) data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function guardar() {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(data, null, 1));
  fs.renameSync(FILE + '.tmp', FILE);
}

// Mismo cargo + misma empresa = misma vacante, aunque venga de otro portal.
export function claveDuplicado(titulo, empresa) {
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9#]+/g, ' ').trim();
  return `${norm(titulo)}|${norm(empresa)}`;
}

export default {
  get chatId() { return data.chatId; },
  set chatId(v) { data.chatId = v; guardar(); },

  get vacia() { return Object.keys(data.vacantes).length === 0; },
  existe: id => id in data.vacantes,
  obtener: id => data.vacantes[id],

  esDuplicada(titulo, empresa) {
    const clave = claveDuplicado(titulo, empresa);
    return Object.values(data.vacantes).some(v => v.estado !== 'filtrada' && v.clave === clave);
  },

  registrar(vacante) {
    data.vacantes[vacante.id] = { ...vacante, clave: claveDuplicado(vacante.titulo, vacante.empresa), vistaEn: new Date().toISOString() };
    guardar();
  },

  cambiarEstado(id, estado) {
    const v = data.vacantes[id];
    if (!v) return null;
    v.estado = estado;
    v.marcadaEn = new Date().toISOString();
    guardar();
    return v;
  },

  listar: estado => Object.values(data.vacantes).filter(v => v.estado === estado),
};
