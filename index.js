// Buscador de empleo: cada N horas busca en LinkedIn y Computrabajo, filtra según el CV
// y envía por Telegram las vacantes con 90%+ de ajuste. Tú marcas "Me postulé" o "Descartar"
// y esa vacante no se vuelve a enviar.
//
//   node index.js            -> bot en marcha (necesita TELEGRAM_TOKEN en .env)
//   node index.js --prueba   -> busca una vez y muestra en consola, sin Telegram ni guardar nada

import fs from 'node:fs';
import config from './config.js';
import db from './src/db.js';
import { buscarLinkedin } from './src/linkedin.js';
import { buscarComputrabajo } from './src/computrabajo.js';
import { evaluar } from './src/evaluar.js';
import { crearBot, escapar } from './src/telegram.js';
import { esperar } from './src/http.js';

const PRUEBA = process.argv.includes('--prueba');
if (fs.existsSync(new URL('./.env', import.meta.url))) process.loadEnvFile(new URL('./.env', import.meta.url));

const log = (...a) => console.log(new Date().toLocaleString('es-CO'), ...a);

// ---------- Búsqueda ----------

let buscando = false;

async function buscar() {
  if (buscando) return { nuevas: [], revisadas: 0 };
  buscando = true;
  try {
    const primeraVez = db.vacia;
    log('Buscando vacantes...');
    const encontradas = [...await buscarLinkedin({ primeraVez }), ...await buscarComputrabajo()];

    const nuevas = [];
    for (const v of encontradas) {
      const r = evaluar(v);
      const duplicada = r.ok && db.esDuplicada(v.titulo, v.empresa);
      const registro = { ...v, descripcion: v.descripcion.slice(0, 3000), ...r, estado: r.ok && !duplicada ? 'enviada' : 'filtrada' };
      if (duplicada) registro.motivo = 'Duplicada (ya enviada desde otro portal)';
      if (PRUEBA) console.log(`${r.ok && !duplicada ? '✅' : '  '} ${String(r.puntaje).padStart(3)}% ${v.fuente.padEnd(12)} ${v.titulo} — ${v.empresa}${registro.motivo ? `  [${registro.motivo}]` : ''}`);
      else db.registrar(registro);
      if (registro.estado === 'enviada') nuevas.push(registro);
    }
    nuevas.sort((a, b) => b.puntaje - a.puntaje);
    log(`Revisadas ${encontradas.length} vacantes nuevas, ${nuevas.length} con ${config.puntajeMinimo}%+ de ajuste.`);
    return { nuevas, revisadas: encontradas.length };
  } finally {
    buscando = false;
  }
}

// ---------- Telegram ----------

function mensajeVacante(v) {
  const icono = v.puntaje >= 95 ? '🟢' : '🟡';
  const tipo = v.fuente === 'LinkedIn' ? 'LinkedIn · Solicitud sencilla' : 'Computrabajo';
  return [
    `${icono} <b>${v.puntaje}% de ajuste</b> · ${tipo}`,
    '',
    `<b>${escapar(v.titulo)}</b>`,
    `🏢 ${escapar(v.empresa || 'Empresa confidencial')}${v.ubicacion ? ` · 📍 ${escapar(v.ubicacion)}` : ''}`,
    `💰 ${v.salario ? escapar(v.salario) : 'Salario no publicado'}`,
    `🏠 ${escapar(v.modalidad)}`,
    v.coincide?.length ? `✔️ Coincide: ${escapar(v.coincide.join(', '))}` : '',
    v.parcial?.length ? `➖ Parcial: ${escapar(v.parcial.join(', '))}` : '',
    v.faltan?.length ? `⚠️ No está en tu CV: ${escapar(v.faltan.join(', '))}` : '',
  ].filter(l => l !== '').join('\n');
}

const botonesVacante = v => [
  [{ text: `🔗 Abrir en ${v.fuente}`, url: v.url }],
  [{ text: '✅ Me postulé', callback_data: `p|${v.id}` }, { text: '❌ Descartar', callback_data: `d|${v.id}` }],
];

async function enviarVacantes(bot, vacantes) {
  for (const v of vacantes) {
    await bot.enviar(db.chatId, mensajeVacante(v), botonesVacante(v));
    await esperar(1200);
  }
}

async function rondaBusqueda(bot, avisarSiVacio = false) {
  try {
    const { nuevas, revisadas } = await buscar();
    if (nuevas.length) {
      await bot.enviar(db.chatId, `🔎 Encontré <b>${nuevas.length}</b> vacante(s) nueva(s) para ti (de ${revisadas} revisadas).`);
      await enviarVacantes(bot, nuevas);
    } else if (avisarSiVacio) {
      await bot.enviar(db.chatId, `🔎 Revisé ${revisadas} vacantes nuevas y ninguna llegó al ${config.puntajeMinimo}%. Te aviso cuando salga algo.`);
    }
  } catch (e) {
    log('Error en la ronda:', e.message);
  }
}

const listaCorta = vs => vs.slice(-20).map(v => `• <a href="${v.url}">${escapar(v.titulo)}</a> — ${escapar(v.empresa)} (${v.fuente})`).join('\n');

async function atenderMensaje(bot, msg) {
  const texto = (msg.text || '').trim().split(/\s|@/)[0];
  const chatId = msg.chat.id;

  if (texto === '/start') {
    if (db.chatId && db.chatId !== chatId) return; // el bot solo te atiende a ti
    db.chatId = chatId;
    await bot.enviar(chatId, [
      '👋 ¡Listo Brayan! Te enviaré aquí las vacantes remotas .NET con 90%+ de ajuste a tu CV.',
      '',
      `Busco cada ${config.intervaloHoras} horas en LinkedIn (Solicitud sencilla) y Computrabajo.`,
      'Cuando te postules toca <b>✅ Me postulé</b>; si no te interesa, <b>❌ Descartar</b>. No te la vuelvo a enviar.',
      '',
      '/buscar — buscar ahora',
      '/pendientes — enviadas que aún no marcas',
      '/postuladas — a dónde te postulaste',
      '/resumen — conteo general',
    ].join('\n'));
    rondaBusqueda(bot, true);
    return;
  }
  if (chatId !== db.chatId) return;

  if (texto === '/buscar') {
    await bot.enviar(chatId, '🔎 Buscando, dame unos minutos...');
    rondaBusqueda(bot, true);
  } else if (texto === '/pendientes') {
    const vs = db.listar('enviada');
    await bot.enviar(chatId, vs.length ? `📌 <b>${vs.length} pendiente(s)</b> por marcar:\n\n${listaCorta(vs)}` : 'No tienes vacantes pendientes 👌');
  } else if (texto === '/postuladas') {
    const vs = db.listar('postulada').sort((a, b) => a.marcadaEn.localeCompare(b.marcadaEn));
    const lineas = vs.slice(-20).map(v => `• ${new Date(v.marcadaEn).toLocaleDateString('es-CO')} — <a href="${v.url}">${escapar(v.titulo)}</a> — ${escapar(v.empresa)} (${v.fuente})`);
    await bot.enviar(chatId, vs.length ? `✅ <b>Te has postulado a ${vs.length}</b>:\n\n${lineas.join('\n')}` : 'Aún no has marcado postulaciones.');
  } else if (texto === '/resumen') {
    const n = e => db.listar(e).length;
    await bot.enviar(chatId, [
      '📊 <b>Resumen</b>',
      `✅ Postuladas: ${n('postulada')}`,
      `📌 Pendientes: ${n('enviada')}`,
      `❌ Descartadas: ${n('descartada')}`,
      `🔍 Revisadas y filtradas: ${n('filtrada')}`,
    ].join('\n'));
  }
}

async function atenderBoton(bot, q) {
  if (q.message?.chat.id !== db.chatId) return;
  const [accion, id] = q.data.split('|');
  if (accion === 'x') return bot.responderBoton(q.id, 'Ya está marcada');

  const v = db.cambiarEstado(id, accion === 'p' ? 'postulada' : 'descartada');
  if (!v) return bot.responderBoton(q.id, 'No encontré esa vacante');
  const etiqueta = accion === 'p' ? `✅ Postulada el ${new Date().toLocaleDateString('es-CO')}` : '❌ Descartada';
  await bot.cambiarBotones(q.message.chat.id, q.message.message_id, [
    [{ text: `🔗 Abrir en ${v.fuente}`, url: v.url }],
    [{ text: etiqueta, callback_data: `x|${id}` }],
  ]);
  await bot.responderBoton(q.id, accion === 'p' ? '¡Éxitos! Quedó registrada' : 'Descartada, no te la vuelvo a enviar');
}

async function escucharTelegram(bot) {
  let offset;
  for (;;) {
    try {
      const updates = await bot.actualizaciones(offset);
      for (const u of updates) {
        offset = u.update_id + 1;
        if (u.message) await atenderMensaje(bot, u.message);
        if (u.callback_query) await atenderBoton(bot, u.callback_query);
      }
    } catch (e) {
      log('Error con Telegram:', e.message);
      await esperar(10_000);
    }
  }
}

// ---------- Inicio ----------

if (PRUEBA) {
  await buscar();
} else {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error('Falta TELEGRAM_TOKEN en el archivo .env (mira LEEME.md).');
    process.exit(1);
  }
  const bot = crearBot(token);
  await bot.comandos([
    { command: 'buscar', description: 'Buscar vacantes ahora' },
    { command: 'pendientes', description: 'Enviadas sin marcar' },
    { command: 'postuladas', description: 'A dónde me postulé' },
    { command: 'resumen', description: 'Conteo general' },
  ]);
  log('Bot iniciado.', db.chatId ? 'Esperando próxima búsqueda.' : 'Escríbele /start al bot en Telegram.');

  escucharTelegram(bot);
  if (db.chatId) rondaBusqueda(bot);
  setInterval(() => db.chatId && rondaBusqueda(bot), config.intervaloHoras * 3600 * 1000);
}
