// Decide si una vacante encaja con el CV: primero filtros duros (inglés, modalidad, salario,
// experiencia, stack .NET) y luego el % de ajuste según las tecnologías que pide.

import config from '../config.js';

const PIDE_INGLES = [
  /ingl[eé]s\s*(:|-)?\s*(avanzado|intermedio|fluido|conversacional|alto|b1|b2|c1|c2)/i,
  /\b(b1|b2|c1|c2)\b[^.\n]{0,25}ingl[eé]s/i,
  /nivel\s*(de\s*)?ingl[eé]s[^.\n]{0,30}(b1|b2|c1|c2|intermedio|avanzado|alto)/i,
  /ingl[eé]s[^.\n]{0,40}(indispensable|obligatorio|excluyente|requerido|imprescindible)/i,
  /biling[uü]e|bilingual/i,
  /english\s*(level|proficiency|required|fluent|advanced|b1|b2|c1|c2|intermediate)/i,
  /(fluent|advanced|upper[-\s]?intermediate|intermediate|conversational|proficient)[^.\n]{0,15}english/i,
];

const PALABRAS_EN = /\b(the|and|with|you|will|our|for|experience|we|are|team|skills|years|work)\b/gi;
const PALABRAS_ES = /\b(el|la|los|las|con|para|que|experiencia|de|del|en|equipo|años|trabajo|y)\b/gi;

const POCAS_VECES_MES = /\b(1|una|2|dos)\s*(vez|veces|d[ií]as?)\s*(al|por|cada|x|en\s*el)\s*mes\b|mensualmente|ocasional(es|mente)?/i;
const VARIAS_VECES_SEMANA = /\b(1|2|3|4|una|dos|tres|cuatro)\s*(vez|veces|d[ií]as?)\s*(a\s*la|por|x|cada|en\s*la)\s*semana/i;
const TOTALMENTE_REMOTO = /100\s*%\s*remot|totalmente\s*remot|full\s*remote|100\s*%\s*(home|teletrabajo)|remoto\s*100/i;

export function evaluar(v) {
  const texto = `${v.titulo}\n${v.descripcion}`;
  const descartar = motivo => ({ ok: false, motivo, puntaje: 0 });

  // 1. Tiene que ser una vacante .NET / C#.
  if (!/\.net|c#|dotnet|blazor|asp\.?\s*net/i.test(texto)) return descartar('No es .NET/C#');

  // 2. Sin inglés obligatorio ni vacantes escritas en inglés.
  const en = (v.descripcion.match(PALABRAS_EN) || []).length;
  const es = (v.descripcion.match(PALABRAS_ES) || []).length;
  if (en > es) return descartar('Vacante en inglés');
  const ingles = PIDE_INGLES.find(r => r.test(texto));
  if (ingles) return descartar(`Pide inglés (${texto.match(ingles)[0].slice(0, 40)})`);

  // 3. Remoto, o híbrido solo 1 o 2 veces al mes.
  const mencionaPresencial = /h[ií]brid|presencial|en\s*sitio|on[-\s]?site/i.test(texto) || /presencial/i.test(v.modalidad);
  if (VARIAS_VECES_SEMANA.test(texto) && !POCAS_VECES_MES.test(texto)) return descartar('Híbrido semanal');
  if (mencionaPresencial && !TOTALMENTE_REMOTO.test(texto) && !POCAS_VECES_MES.test(texto)) {
    // En Computrabajo "Presencial y remoto" sin decir frecuencia = no sabemos cuántas veces; se descarta.
    if (/presencial/i.test(v.modalidad) || /h[ií]brid/i.test(texto)) return descartar('Híbrido/presencial sin frecuencia mensual');
  }

  // 4. Salario (si lo publican).
  const salarios = extraerSalarios(`${v.salarioTexto || ''}\n${v.descripcion}`);
  if (salarios.length) {
    const max = Math.max(...salarios), min = Math.min(...salarios);
    if (max < config.salarioMinimo) return descartar(`Salario bajo (${formatoCOP(max)})`);
    if (config.salarioMaximo && min > config.salarioMaximo) return descartar(`Salario fuera de rango (${formatoCOP(min)})`);
  }

  // 5. Experiencia requerida.
  const anios = aniosRequeridos(texto);
  if (anios > config.maxAniosExperiencia) return descartar(`Pide ${anios} años de experiencia`);

  // 6. Ajuste con el CV.
  const coincide = [], parcial = [], faltan = [];
  for (const [nombre, [peso, re]] of Object.entries(config.tecnologiasCV)) {
    if (re.test(texto)) (peso === 1 ? coincide : parcial).push(nombre);
  }
  for (const [nombre, re] of Object.entries(config.tecnologiasNoCV)) {
    if (re.test(texto)) faltan.push(nombre);
  }
  const total = coincide.length + parcial.length + faltan.length;
  const cobertura = total ? (coincide.length + parcial.length * 0.5) / total : 0.6;

  const tituloCore = /\.net|c#|dotnet|blazor|asp/i.test(v.titulo);
  const tituloDev = /desarroll|developer|programador|ingenier|full\s*stack|back\s*-?end|software/i.test(v.titulo);
  const relevanciaTitulo = tituloCore ? 1 : tituloDev ? 0.7 : 0.3;

  // Si el título pide algo que no está en el CV (ej. "Full Stack .NET, AWS"), es parte central del cargo: resta 10 por cada una.
  const faltanEnTitulo = Object.values(config.tecnologiasNoCV).filter(re => re.test(v.titulo)).length;

  const puntaje = Math.max(0, Math.round(100 * (0.75 * cobertura + 0.25 * relevanciaTitulo)) - 10 * faltanEnTitulo);
  const salario = salarios.length ? rangoTexto(salarios) : null;

  if (puntaje < config.puntajeMinimo) return { ok: false, motivo: `Ajuste ${puntaje}%`, puntaje, coincide, parcial, faltan, salario };
  return { ok: true, puntaje, coincide, parcial, faltan, salario };
}

export function extraerSalarios(texto) {
  const valores = [];
  const num = s => Number(s.replace(/[.,\s]/g, ''));

  // $ 4.500.000 / 4,500,000
  for (const m of texto.matchAll(/(\d{1,2})[.,\s](\d{3})[.,\s](\d{3})(?![\d])/g)) valores.push(num(m[0]));
  // 4,5 millones / 5 MM
  for (const m of texto.matchAll(/(\d{1,2}(?:[.,]\d{1,2})?)\s*(millones|mill\b|mm\b|m\s*cop)/gi)) valores.push(Number(m[1].replace(',', '.')) * 1e6);
  // USD 1.500 / 2000 dólares
  for (const m of texto.matchAll(/(?:usd|us\$|u\$s)\s*\$?\s*(\d{1,2}[.,]?\d{3})|(\d{1,2}[.,]?\d{3})\s*(?:usd|d[oó]lares)/gi)) {
    valores.push(num(m[1] || m[2]) * config.tasaUSD);
  }
  return valores.filter(n => n >= 1_000_000 && n <= 40_000_000);
}

function aniosRequeridos(texto) {
  let max = 0;
  for (const m of texto.matchAll(/(\d{1,2})\s*\+?\s*(?:a[nñ]os|years)/gi)) {
    const contexto = texto.slice(Math.max(0, m.index - 60), m.index + 60);
    if (/experiencia|experience/i.test(contexto)) max = Math.max(max, Number(m[1]));
  }
  return max <= 20 ? max : 0;
}

export const formatoCOP = n => `$${(n / 1e6).toFixed(1).replace('.', ',')} M`;
const rangoTexto = s => {
  const min = Math.min(...s), max = Math.max(...s);
  return min === max ? formatoCOP(min) : `${formatoCOP(min)} – ${formatoCOP(max)}`;
};
