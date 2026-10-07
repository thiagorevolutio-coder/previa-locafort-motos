const encoder = new TextEncoder();

export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export async function readJson(request, maxBytes = 50000) {
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw new Error('TYPE');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) throw new Error('SIZE');
  const text = await request.text();
  if (encoder.encode(text).byteLength > maxBytes) throw new Error('SIZE');
  return JSON.parse(text);
}

export async function fallbackCatalog(env, request) {
  const url = new URL('/catalogo-padrao.json', request.url);
  const response = await env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error('Fallback indisponível');
  return response.json();
}

export async function getCatalog(env, request) {
  const defaults = await fallbackCatalog(env, request);
  const saved = await env.LOCAFORT_CONFIG?.get('catalogo', 'json');
  if (!saved) return defaults;
  return {
    ...defaults,
    ...saved,
    versao: 2,
    condicoes: { ...defaults.condicoes, ...(saved.condicoes || {}) },
    site: { ...defaults.site, ...(saved.site || {}) },
    formulario: { ...defaults.formulario, ...(saved.formulario || {}) },
    produtos: (saved.produtos || defaults.produtos).map((item, index) => ({ cilindrada: '', uso: '', ...item, ordem: item.ordem || index + 1 }))
  };
}

const clean = value => typeof value === 'string' && value.length <= 160 && !/[<>]/.test(value);
const media = value => typeof value === 'string' && value.length <= 500 && (/^assets\/[a-zA-Z0-9._/-]+$/.test(value) || /^\/api\/media\/[a-zA-Z0-9._/-]+$/.test(value) || /^https:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?$/.test(value));
export function validateCatalog(value) {
  if (!value || typeof value !== 'object' || !value.condicoes || !value.site || !value.formulario || !Array.isArray(value.produtos) || value.produtos.length > 30) return false;
  const c = value.condicoes;
  if (![c.semanalAPartirDe, c.caucao, c.mesesContratoInicial, c.intencaoCompraSemanal, c.intencaoCompraMeses].every(n => Number.isFinite(n) && n >= 0 && n <= 100000)) return false;
  if (!clean(c.pagamentoSemanalInicio) || !clean(c.textoCurto || '')) return false;
  const s = value.site;
  if (!/^\d{10,15}$/.test(s.whatsapp) || !clean(s.tituloPrincipal) || !clean(s.textoPrincipal) || !media(s.imagemPrincipal) || !media(s.imagemProcesso) || !media(s.imagemFinal) || !media(s.videoPrincipal)) return false;
  if (!Object.values(value.formulario).every(clean)) return false;
  const ids = new Set();
  return value.produtos.every(p => {
    const ok = clean(p.id) && /^[a-z0-9-]{1,50}$/.test(p.id) && !ids.has(p.id) && clean(p.nome) && clean(p.categoria) && clean(p.texto) && clean(p.cilindrada || '') && clean(p.uso || '') && media(p.imagem) && ['a-partir-de', 'sob-consulta'].includes(p.precoTipo) && (p.precoTipo === 'sob-consulta' ? p.precoSemanal === null : Number.isFinite(p.precoSemanal) && p.precoSemanal >= 0) && typeof p.ativo === 'boolean' && typeof p.disponivel === 'boolean' && Number.isInteger(p.ordem);
    ids.add(p.id); return ok;
  });
}

const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function signature(payload, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}
export async function createSession(secret) {
  const payload = b64url(encoder.encode(JSON.stringify({ exp: Date.now() + 30 * 60 * 1000, nonce: crypto.randomUUID() })));
  return `${payload}.${await signature(payload, secret)}`;
}
function equal(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
export function safeEqual(a, b) {
  const left = String(a), right = String(b), length = Math.max(left.length, right.length); let diff = left.length ^ right.length;
  for (let i = 0; i < length; i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return diff === 0;
}
export async function validSession(request, secret) {
  if (!secret) return false;
  const token = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith('locafort_session='))?.slice(17);
  if (!token) return false;
  const [payload, supplied] = token.split('.');
  if (!payload || !supplied || !equal(await signature(payload, secret), supplied)) return false;
  try { const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='); return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))).exp > Date.now(); } catch (_) { return false; }
}

export function sessionCookie(request, value, maxAge = 1800) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `locafort_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
