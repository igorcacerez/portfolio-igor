# Portfólio — Igor Cacerez

Landing page estática (Vite) com cena 3D em Three.js (partículas que se formam + vidro físico), SEO técnico, conteúdo semântico e foco em conversão para WhatsApp.

## Rodar localmente

```bash
pnpm install
pnpm dev
```

## Verificar e gerar produção

```bash
pnpm typecheck
pnpm build
pnpm preview
```

Antes de publicar, configure o domínio definitivo na hospedagem e acrescente a URL canônica e a URL absoluta da imagem Open Graph em `index.html`.

## Deploy no EasyPanel

O `Dockerfile` multi-stage gera os arquivos estáticos com Vite e os publica com Nginx, incluindo fallback de SPA, compressão, cache de assets e health check.

O app `portfolio-igor`, dentro do projeto `apps`, acompanha a branch `main` do GitHub. Cada novo commit nessa branch dispara uma nova implantação no EasyPanel.

## Materiais (área restrita) e slides

- `/materiais` — painel protegido por login para cadastrar, editar e excluir apresentações (não aparece no site nem no sitemap; `robots.txt` e `X-Robots-Tag` bloqueiam indexação).
- `/slide/<slug>` — apresentação publicada. Arquivos enviados junto (imagens etc.) ficam acessíveis por caminho relativo.
- Motor padrão dos slides: `public/deck/deck.js` + `public/deck/deck.css` (servidos em `/deck/`). Modelo em `deck-template/index.html`.
- Servidor: `server/index.mjs` (Node 24, sem dependências, SQLite nativo). Rodar local: `pnpm build && PORT=8787 DATA_DIR=./data pnpm start`.

### Persistência no EasyPanel

O banco (`materiais.db`) e os arquivos dos slides ficam em `/data`. No app do EasyPanel, em **Mounts**, crie um **Volume** com *mount path* `/data` — sem isso tudo se perde a cada deploy.

Variáveis opcionais: `ADMIN_USER`, `ADMIN_PASSWORD` (substitui a senha padrão), `SESSION_SECRET`.
