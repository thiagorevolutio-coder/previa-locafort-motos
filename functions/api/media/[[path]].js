export async function onRequestGet({ env, params }) {
  if (!env.LOCAFORT_MEDIA) return new Response('Mídia não configurada.', { status: 404 });
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key || !/^(imagens|videos)\/[a-zA-Z0-9._-]+$/.test(key)) return new Response('Arquivo inválido.', { status: 400 });
  const object = await env.LOCAFORT_MEDIA.get(key);
  if (!object) return new Response('Arquivo não encontrado.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}
