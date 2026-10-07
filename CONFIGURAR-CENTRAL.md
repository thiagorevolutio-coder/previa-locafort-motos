# Configurar a Central Locafort no Cloudflare Pages

O site funciona localmente com `catalogo-padrao.json`. Para que alterações feitas em `/painel/` apareçam para todos no site publicado, configure KV, R2 e os segredos abaixo no projeto do Cloudflare Pages.

## 1. Criar e vincular o KV

1. No painel Cloudflare, abra **Workers & Pages** e selecione o projeto deste site.
2. Abra **Settings > Functions > KV namespace bindings**.
3. Crie um namespace KV (por exemplo, `locafort-config`) caso ainda não exista.
4. Adicione o binding com o nome exato **`LOCAFORT_CONFIG`** e selecione esse namespace.

A Central grava todo o catálogo na chave única `catalogo`.

## 2. Criar e vincular o R2 para fotos e vídeos

1. No Cloudflare, abra **R2 Object Storage** e crie um bucket, por exemplo `locafort-media`.
2. Volte ao projeto em **Workers & Pages > Settings > Functions > R2 bucket bindings**.
3. Adicione um binding com o nome exato **`LOCAFORT_MEDIA`** e selecione o bucket criado.
4. Não é necessário tornar o bucket público. O site entrega os arquivos pela rota `/api/media/...`.

O upload administrativo aceita JPG, PNG e WebP de até 8 MB; MP4 e WebM de até 50 MB. Imagens grandes são reduzidas no navegador, preferencialmente para WebP, antes do envio. Os nomes são gerados no servidor; o painel não aceita caminho de gravação fornecido pelo usuário.

## 3. Configurar os segredos

Em **Settings > Environment variables**, adicione como valores criptografados/secret:

- `ADMIN_PASSWORD`: senha forte usada para entrar em `/painel/`.
- `SESSION_SECRET`: sequência aleatória longa, diferente da senha. Recomenda-se pelo menos 32 bytes aleatórios.

Não coloque esses valores em arquivos do site ou no repositório. Configure produção e, se usado, preview separadamente.

## 4. Publicar e conferir

1. Faça um novo deploy depois de criar o binding e os segredos.
2. Abra `https://seudominio.com.br/api/catalogo` e confirme que recebe JSON sem dados secretos.
3. Abra `https://seudominio.com.br/painel/`, entre com `ADMIN_PASSWORD`, adicione um produto e envie uma imagem pequena.
4. Recarregue a home e `https://seudominio.com.br/formulario/` para confirmar a mesma alteração nos dois locais.
5. Confirme que a imagem abre por `/api/media/...`, teste **Sair** e confirme que `/api/admin/catalogo` responde sem autorização depois do logout.

## Teste local

No PowerShell, dentro da pasta do site:

```powershell
node .preview-server.cjs
```

Abra `http://127.0.0.1:4178/`, `/formulario/` e `/painel/`. No endereço local, o painel entra em modo demonstração e salva apenas no `localStorage` do navegador. Imagens pequenas podem ser testadas como prévia local, mas não são enviadas ao R2. O aviso amarelo deixa essa limitação visível. A API pública do servidor local usa um catálogo em memória e é reiniciada ao encerrar o processo.

Para testar também login e endpoints administrativos do mock, defina `LOCAFORT_ADMIN_PASSWORD` somente na sessão atual do terminal antes de iniciar o servidor. Nenhum segredo é gravado em arquivo.

## Mídias e URLs

O painel aceita upload, caminho relativo dentro de `assets/`, caminho gerado `/api/media/...` ou URL pública HTTPS. Se o binding R2 estiver ausente, o painel mostra a instrução para configurar `LOCAFORT_MEDIA` e mantém a mídia atual, sem impedir a edição dos demais campos.
