import { createSession, json, readJson, safeEqual, sameOrigin, sessionCookie } from '../../_lib/http.js';
export async function onRequestPost({ env, request }) {
  if (!sameOrigin(request)) return json({ erro: 'Origem não permitida.' }, 403);
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ erro: 'Central ainda não configurada.' }, 503);
  try {
    const body = await readJson(request, 2000);
    if (typeof body.senha !== 'string' || body.senha.length > 200 || !safeEqual(body.senha, env.ADMIN_PASSWORD)) return json({ erro: 'Senha incorreta.' }, 401);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, await createSession(env.SESSION_SECRET)) });
  } catch (_) { return json({ erro: 'Requisição inválida.' }, 400); }
}
