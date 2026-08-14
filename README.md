# Portfólio — Igor Cacerez

Landing page em React + Vite com uma experiência Three.js, SEO técnico, conteúdo semântico e foco em conversão para WhatsApp.

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
