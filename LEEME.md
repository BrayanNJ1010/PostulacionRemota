# Buscador de empleo — Brayan

Busca cada 3 horas vacantes **.NET remotas** en **LinkedIn (solo Solicitud sencilla)** y **Computrabajo**,
las compara con el CV y envía por **Telegram** las que tengan **90%+ de ajuste**.
Tú te postulas y tocas **✅ Me postulé** o **❌ Descartar**; esa vacante no se vuelve a enviar.

## Filtros

- 100% remoto, o híbrido solo 1 o 2 veces al mes
- Sin inglés obligatorio (se descartan vacantes en inglés o que pidan B1/B2/C1, conversacional, bilingüe…)
- Salario: si lo publican, mínimo $4.600.000 (sin tope). Si no lo publican, pasa y dice "no publicado"
- Máximo 6 años de experiencia requerida
- Tiene que ser .NET / C#

Todo se cambia en `config.js`.

## Comandos en Telegram

| Comando | Qué hace |
|---|---|
| `/buscar` | Busca ahora mismo |
| `/pendientes` | Vacantes enviadas que no has marcado |
| `/postuladas` | A cuáles te postulaste, con fecha |
| `/resumen` | Conteo general |

## Instalar en otro PC

1. Instalar Node.js 22 o superior
2. `git clone https://github.com/BrayanNJ1010/PostulacionRemota.git` y `npm install`
3. Crear `.env` (copiando `.env.example`) con `TELEGRAM_TOKEN=...` — el token no se sube a GitHub
4. `npm run prueba` para verificar, luego `iniciar-bot.vbs`

Pendiente: en la red ETB de la casa `api.telegram.org` está bloqueado (el resto de Telegram abre). Probar en otra red.

## Uso

- Probar sin Telegram: `npm run prueba`
- Arrancar en segundo plano: doble clic en `iniciar-bot.vbs` (registro en `data\bot.log`)
- Detener: `powershell -File detener-bot.ps1`
- Historial de vacantes: `data\vacantes.json`
