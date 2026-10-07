import { json, sameOrigin, sessionCookie } from '../../_lib/http.js';
export function onRequestPost({ request }) {
  if (!sameOrigin(request)) return json({ erro: 'Origem não permitida.' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, '', 0) });
}
