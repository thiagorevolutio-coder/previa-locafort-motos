import { getCatalog, json } from '../_lib/http.js';
export async function onRequestGet({ env, request }) {
  try {
    const value = await getCatalog(env, request);
    return json({ versao: 3, condicoes: value.condicoes, site: value.site, formulario: value.formulario, produtos: value.produtos }, 200, { 'cache-control': 'public, max-age=60' });
  } catch (_) { return json({ erro: 'Catálogo indisponível.' }, 503); }
}
