import { getCatalog, json, readJson, sameOrigin, validSession, validateCatalog } from '../../_lib/http.js';
async function authorized(request, env) { return validSession(request, env.SESSION_SECRET); }
export async function onRequestGet({ env, request }) {
  if (!(await authorized(request, env))) return json({ erro: 'Acesso não autorizado.' }, 401);
  try { return json(await getCatalog(env, request)); } catch (_) { return json({ erro: 'Catálogo indisponível.' }, 503); }
}
export async function onRequestPost({ env, request }) {
  if (!sameOrigin(request)) return json({ erro: 'Origem não permitida.' }, 403);
  if (!(await authorized(request, env))) return json({ erro: 'Acesso não autorizado.' }, 401);
  if (!env.LOCAFORT_CONFIG) return json({ erro: 'Binding LOCAFORT_CONFIG ausente.' }, 503);
  try {
    const value = await readJson(request);
    if (!validateCatalog(value)) return json({ erro: 'Revise os campos do catálogo.' }, 422);
    value.versao = 3;
    value.atualizadoEm = new Date().toISOString();
    await env.LOCAFORT_CONFIG.put('catalogo', JSON.stringify(value));
    return json({ ok: true, catalogo: value });
  } catch (error) { return json({ erro: error.message === 'SIZE' ? 'Arquivo muito grande.' : 'Requisição inválida.' }, 400); }
}
