# Configurar a Central Locafort no Cloudflare Pages

O site funciona localmente com `catalogo-padrao.json`. Para que alterações feitas em `/painel/` apareçam para todos no site publicado, configure o KV e os segredos abaixo no projeto do Cloudflare Pages.

## 1. Criar e vincular o KV

1. No painel Cloudflare, abra **Workers & Pages** e selecione o projeto deste site.
2. Abra **Settings > Functions > KV namespace bindings**.
3. Crie um namespace KV (por exemplo, `locafort-config`) caso ainda não exista.
4. Adicione o binding com o nome exato **`LOCAFORT_CONFIG`** e selecione esse namespace.

A Central grava todo o catálogo na chave única `catalogo`.

## 2. Configurar os segredos

Em **Settings > Environment variables**, adicione como valores criptografados/secret:

- `ADMIN_PASSWORD`: senha forte usada para entrar em `/painel/`.
- `SESSION_SECRET`: sequência aleatória longa, diferente da senha. Recomenda-se pelo menos 32 bytes aleatórios.

Não coloque esses valores em arquivos do site ou no repositório. Configure produção e, se usado, preview separadamente.

## 3. Publicar e conferir

1. Faça um novo deploy depois de criar o binding e os segredos.
2. Abra `https://seudominio.com.br/api/catalogo` e confirme que recebe JSON sem dados secretos.
3. Abra `https://seudominio.com.br/painel/`, entre com `ADMIN_PASSWORD`, altere um item e salve.
4. Recarregue a home e `https://seudominio.com.br/formulario/` para confirmar a mesma alteração nos dois locais.
5. Teste **Sair** e confirme que `/api/admin/catalogo` responde sem autorização depois do logout.

## Teste local

No PowerShell, dentro da pasta do site:

```powershell
node .preview-server.cjs
```

Abra `http://127.0.0.1:4178/`, `/formulario/` e `/painel/`. No endereço local, o painel entra em modo demonstração e salva apenas no `localStorage` do navegador. O aviso amarelo deixa essa limitação visível. A API pública do servidor local usa um catálogo em memória e é reiniciada ao encerrar o processo.

Para testar também login e endpoints administrativos do mock, defina `LOCAFORT_ADMIN_PASSWORD` somente na sessão atual do terminal antes de iniciar o servidor. Nenhum segredo é gravado em arquivo.

## Imagens

O painel aceita caminho relativo dentro de `assets/` ou URL pública HTTPS. Ainda não há upload de imagem. Para um arquivo próprio, inclua a imagem em `assets/` no deploy e informe, por exemplo, `assets/minha-moto.jpeg`.
