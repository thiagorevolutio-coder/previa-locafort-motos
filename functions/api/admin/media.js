import { json, sameOrigin, validSession } from '../../_lib/http.js';

const types = {
  'image/jpeg': ['jpg', 8 * 1024 * 1024],
  'image/png': ['png', 8 * 1024 * 1024],
  'image/webp': ['webp', 8 * 1024 * 1024],
  'video/mp4': ['mp4', 50 * 1024 * 1024],
  'video/webm': ['webm', 50 * 1024 * 1024]
};

export async function onRequestPost({ env, request }) {
  if (!sameOrigin(request)) return json({ erro: 'Origem não permitida.' }, 403);
  if (!(await validSession(request, env.SESSION_SECRET))) return json({ erro: 'Acesso não autorizado.' }, 401);
  if (!env.LOCAFORT_MEDIA) return json({ erro: 'Armazenamento de mídia não configurado. Crie o binding LOCAFORT_MEDIA.' }, 503);
  if (!(request.headers.get('content-type') || '').startsWith('multipart/form-data')) return json({ erro: 'Envie um arquivo válido.' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 52 * 1024 * 1024) return json({ erro: 'Arquivo muito grande.' }, 413);
  try {
    const form = await request.formData();
    const file = form.get('arquivo');
    if (!(file instanceof File) || !types[file.type]) return json({ erro: 'Use JPG, PNG, WebP, MP4 ou WebM.' }, 422);
    const [extension, limit] = types[file.type];
    if (!file.size || file.size > limit) return json({ erro: `Arquivo maior que ${limit / 1024 / 1024} MB.` }, 413);
    const kind = file.type.startsWith('video/') ? 'videos' : 'imagens';
    const key = `${kind}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await env.LOCAFORT_MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } });
    return json({ ok: true, caminho: `/api/media/${key}`, tipo: file.type, tamanho: file.size });
  } catch (_) { return json({ erro: 'Não foi possível enviar o arquivo.' }, 400); }
}
