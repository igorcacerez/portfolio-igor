// Servidor do portfólio + área restrita /materiais + slides em /slide/:slug
// Sem dependências: Node 24 (http + node:sqlite). Dados persistentes em DATA_DIR (volume /data no EasyPanel).
import http from 'node:http'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(process.env.DIST_DIR || path.join(ROOT, '..', 'dist'))
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, '..', 'data'))
const FILES = path.join(DATA, 'slides')
const PORT = Number(process.env.PORT || 80)
const ADMIN_USER = process.env.ADMIN_USER || 'igor'
// hash scrypt da senha padrão; troque definindo ADMIN_PASSWORD no EasyPanel
const ADMIN_HASH = 'scrypt$38af73285e34b857ea772b3a23348a3a$4a6a9effcf249ff0ad3a76084b2fc0c37cc2be023fd1e81bd154c0ba2bedebc63182aa2605eef2a087f07a7df7369fe55e8b02b6fd6e52e3bdab27b65004812a'
const MAX_BODY = 200 * 1024 * 1024

fs.mkdirSync(FILES, { recursive: true })
const secretFile = path.join(DATA, '.secret')
const SECRET = process.env.SESSION_SECRET || (fs.existsSync(secretFile)
  ? fs.readFileSync(secretFile, 'utf8')
  : (() => { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(secretFile, s); return s })())

const db = new DatabaseSync(path.join(DATA, 'materiais.db'))
db.exec(`PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`)

/* ---------------- utilidades ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
}
const mime = p => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'
const SEC = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
const PRIVATE = { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Cache-Control': 'no-store' }

function send(req, res, status, body, headers = {}) {
  const h = { ...SEC, ...headers }
  let buf = Buffer.isBuffer(body) ? body : Buffer.from(body ?? '')
  const type = h['Content-Type'] || ''
  if (buf.length > 1024 && /text|javascript|json|svg|xml/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    buf = zlib.gzipSync(buf); h['Content-Encoding'] = 'gzip'; h['Vary'] = 'Accept-Encoding'
  }
  h['Content-Length'] = buf.length
  res.writeHead(status, h); res.end(req.method === 'HEAD' ? undefined : buf)
}
const json = (req, res, status, data, extra = {}) => send(req, res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', ...PRIVATE, ...extra })

async function readBody(req) {
  const chunks = []; let size = 0
  for await (const c of req) { size += c.length; if (size > MAX_BODY) throw Object.assign(new Error('Arquivo grande demais'), { status: 413 }); chunks.push(c) }
  const raw = Buffer.concat(chunks).toString('utf8')
  try { return raw ? JSON.parse(raw) : {} } catch { throw Object.assign(new Error('JSON inválido'), { status: 400 }) }
}

// caminho seguro dentro de uma pasta base
function safeJoin(base, rel) {
  const clean = String(rel).replace(/\\/g, '/').split('/').filter(s => s && s !== '.' && s !== '..').join('/')
  if (!clean) return null
  const full = path.resolve(base, clean)
  return full.startsWith(path.resolve(base) + path.sep) ? full : null
}
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

/* ---------------- autenticação ---------------- */
function checkPassword(pass) {
  if (process.env.ADMIN_PASSWORD) {
    const a = Buffer.from(String(pass)), b = Buffer.from(process.env.ADMIN_PASSWORD)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }
  const [, salt, hash] = ADMIN_HASH.split('$')
  const got = crypto.scryptSync(String(pass), salt, 64)
  return crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'))
}
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('base64url')
function makeToken() { const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; const v = `${ADMIN_USER}.${exp}`; return `${v}.${sign(v)}` }
function authed(req) {
  const m = /(?:^|;\s*)mat_sess=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return false
  const [u, exp, sig] = decodeURIComponent(m[1]).split('.'); if (!u || !exp || !sig) return false
  const exp2 = sign(`${u}.${exp}`)
  return sig.length === exp2.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp2)) && Number(exp) > Date.now()
}
const secureFlag = req => (req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '')
const attempts = new Map()
function tooMany(ip) {
  const now = Date.now(), list = (attempts.get(ip) || []).filter(t => now - t < 15 * 60 * 1000)
  attempts.set(ip, list); return list.length >= 10
}

/* ---------------- slides: arquivos ---------------- */
const dirOf = id => path.join(FILES, String(id))
async function listFiles(id) {
  const base = dirOf(id), out = []
  async function walk(d) {
    let ents = []; try { ents = await fsp.readdir(d, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) await walk(full)
      else { const st = await fsp.stat(full); out.push({ path: path.relative(base, full).replace(/\\/g, '/'), size: st.size }) }
    }
  }
  await walk(base); return out.sort((a, b) => a.path.localeCompare(b.path))
}
async function saveFiles(id, files = []) {
  for (const f of files) {
    const full = safeJoin(dirOf(id), f.path); if (!full || typeof f.data !== 'string') continue
    await fsp.mkdir(path.dirname(full), { recursive: true })
    await fsp.writeFile(full, Buffer.from(f.data.replace(/^data:[^,]*,/, ''), 'base64'))
  }
}
async function removeFiles(id, list = []) {
  for (const p of list) { const full = safeJoin(dirOf(id), p); if (full) await fsp.rm(full, { force: true }) }
}

function validate(body, currentId = null) {
  const title = String(body.title || '').trim()
  const slug = slugify(body.slug || title)
  if (!title) return 'Informe um título.'
  if (!slug) return 'Slug inválido.'
  const other = db.prepare('SELECT id FROM slides WHERE slug = ?').get(slug)
  if (other && other.id !== currentId) return `Já existe um slide com o link "${slug}".`
  return null
}
const pub = r => r && ({ id: r.id, slug: r.slug, title: r.title, description: r.description, published: !!r.published, views: r.views, created_at: r.created_at, updated_at: r.updated_at, size: r.size })

/* ---------------- API ---------------- */
async function api(req, res, url) {
  const p = url.pathname, m = req.method
  if (p === '/api/login' && m === 'POST') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress
    if (tooMany(ip)) return json(req, res, 429, { error: 'Muitas tentativas. Aguarde alguns minutos.' })
    const { user, pass } = await readBody(req)
    if (String(user).trim().toLowerCase() !== ADMIN_USER || !checkPassword(pass || '')) {
      attempts.get(ip).push(Date.now())
      return json(req, res, 401, { error: 'Usuário ou senha incorretos.' })
    }
    attempts.delete(ip)
    return json(req, res, 200, { ok: true }, { 'Set-Cookie': `mat_sess=${encodeURIComponent(makeToken())}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1209600${secureFlag(req)}` })
  }
  if (p === '/api/logout' && m === 'POST') return json(req, res, 200, { ok: true }, { 'Set-Cookie': 'mat_sess=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' })
  if (!authed(req)) return json(req, res, 401, { error: 'Faça login.' })
  if (p === '/api/me') return json(req, res, 200, { user: ADMIN_USER })

  if (p === '/api/slides' && m === 'GET') {
    const rows = db.prepare('SELECT id, slug, title, description, published, views, created_at, updated_at, length(html) AS size FROM slides ORDER BY updated_at DESC').all()
    return json(req, res, 200, rows.map(pub))
  }
  if (p === '/api/slides' && m === 'POST') {
    const b = await readBody(req); const err = validate(b); if (err) return json(req, res, 400, { error: err })
    if (!String(b.html || '').trim()) return json(req, res, 400, { error: 'Envie o HTML da apresentação.' })
    const r = db.prepare('INSERT INTO slides (slug, title, description, html, published) VALUES (?, ?, ?, ?, ?)')
      .run(slugify(b.slug || b.title), String(b.title).trim(), String(b.description || ''), String(b.html), b.published === false ? 0 : 1)
    const id = Number(r.lastInsertRowid); await saveFiles(id, b.files)
    return json(req, res, 201, pub(db.prepare('SELECT * FROM slides WHERE id = ?').get(id)))
  }
  const mm = /^\/api\/slides\/(\d+)$/.exec(p)
  if (mm) {
    const id = Number(mm[1]), row = db.prepare('SELECT * FROM slides WHERE id = ?').get(id)
    if (!row) return json(req, res, 404, { error: 'Slide não encontrado.' })
    if (m === 'GET') return json(req, res, 200, { ...pub(row), html: row.html, files: await listFiles(id) })
    if (m === 'PUT') {
      const b = await readBody(req); const merged = { title: b.title ?? row.title, slug: b.slug ?? row.slug }
      const err = validate(merged, id); if (err) return json(req, res, 400, { error: err })
      db.prepare(`UPDATE slides SET slug = ?, title = ?, description = ?, html = ?, published = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(slugify(merged.slug), String(merged.title).trim(), String(b.description ?? row.description),
          b.html != null && String(b.html).trim() ? String(b.html) : row.html, b.published == null ? row.published : (b.published ? 1 : 0), id)
      if (b.replaceFiles) await fsp.rm(dirOf(id), { recursive: true, force: true })
      await removeFiles(id, b.removeFiles); await saveFiles(id, b.files)
      return json(req, res, 200, { ...pub(db.prepare('SELECT * FROM slides WHERE id = ?').get(id)), files: await listFiles(id) })
    }
    if (m === 'DELETE') {
      db.prepare('DELETE FROM slides WHERE id = ?').run(id)
      await fsp.rm(dirOf(id), { recursive: true, force: true })
      return json(req, res, 200, { ok: true })
    }
  }
  return json(req, res, 404, { error: 'Rota não encontrada.' })
}

/* ---------------- arquivos estáticos ---------------- */
async function serveFile(req, res, full, headers = {}) {
  try {
    const st = await fsp.stat(full); if (!st.isFile()) return false
    const etag = `W/"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ...SEC, ETag: etag, ...headers }); res.end(); return true }
    send(req, res, 200, await fsp.readFile(full), { 'Content-Type': mime(full), ETag: etag, ...headers }); return true
  } catch { return false }
}

const ADMIN_HTML = path.join(ROOT, 'admin.html')

async function handle(req, res) {
  const url = new URL(req.url, 'http://x'); let p
  try { p = decodeURIComponent(url.pathname) } catch { return send(req, res, 400, 'Bad request') }

  if (p.startsWith('/api/')) return api(req, res, url)
  if (p === '/health') return send(req, res, 200, 'ok', { 'Content-Type': 'text/plain' })

  if (p === '/materiais' || p.startsWith('/materiais/')) {
    return serveFile(req, res, ADMIN_HTML, { ...PRIVATE, 'X-Frame-Options': 'DENY' })
  }

  const sm = /^\/slide\/([a-z0-9-]+)(\/.*)?$/.exec(p)
  if (sm) {
    const row = db.prepare('SELECT id, html, published FROM slides WHERE slug = ?').get(sm[1])
    if (!row || (!row.published && !authed(req))) return send(req, res, 404, notFound(), { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE })
    if (!sm[2]) { res.writeHead(301, { Location: `/slide/${sm[1]}/${url.search}`, ...PRIVATE }); return res.end() }
    if (sm[2] === '/' || sm[2] === '/index.html') {
      if (!authed(req)) db.prepare('UPDATE slides SET views = views + 1 WHERE id = ?').run(row.id)
      return send(req, res, 200, row.html, { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE, 'X-Frame-Options': 'SAMEORIGIN' })
    }
    const full = safeJoin(dirOf(row.id), sm[2])
    if (full && await serveFile(req, res, full, { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, max-age=3600' })) return
    return send(req, res, 404, 'Arquivo não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' })
  }

  // site (SPA do Vite)
  const full = safeJoin(DIST, p)
  if (full) {
    const isAsset = /\.(?:css|js|mjs|woff2?|png|jpe?g|gif|svg|webp|avif|ico)$/i.test(full) && !p.startsWith('/deck/')
    const headers = p.startsWith('/deck/') ? { 'Cache-Control': 'public, max-age=300' } : isAsset ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {}
    if (await serveFile(req, res, full, headers)) return
    if (path.extname(p)) return send(req, res, 404, 'Not found', { 'Content-Type': 'text/plain' })
  }
  return serveFile(req, res, path.join(DIST, 'index.html'), { 'Cache-Control': 'no-store', 'X-Frame-Options': 'SAMEORIGIN' })
}

const notFound = () => `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Não encontrado</title>
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#070909;color:#f3f4ed;font:16px/1.5 system-ui;text-align:center}b{display:block;font-size:72px;color:#d7ff45}</style>
<div><b>404</b>Esse material não existe ou foi removido.</div>`

http.createServer((req, res) => {
  handle(req, res).catch(err => {
    if (!res.headersSent) json(req, res, err.status || 500, { error: err.status ? err.message : 'Erro interno.' })
    if (!err.status) console.error(err)
  })
}).listen(PORT, () => console.log(`servidor em :${PORT} · dados em ${DATA}`))
