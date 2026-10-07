import { getCatalog, json } from '../_lib/http.js';
export async function onRequestGet({ env, request }) {
  try {
    const value = await getCatalog(env, request);
    return json({ versao: value.versao || 1, condicoes: value.condicoes, produtos: value.produtos }, 200, { 'cache-control': 'public, max-age=60' });
  } catch (_) { return json({ erro: 'Catálogo indisponível.' }, 503); }
}
