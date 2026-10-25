# YgSites

Site institucional + painel de catálogo da **YgSites** (azul, preto e branco).

- **Site:** https://ygsites.vercel.app
- **Painel (com senha):** https://ygsites.vercel.app/admin.html
- **WhatsApp:** (19) 99247-5445 — https://wa.me/5519992475445
- **Dados do catálogo (privado):** https://github.com/00UserBr/yg-sites-data

## Identidade visual

A marca é um monograma **Y dentro de um G**, desenhado em um único traço
contínuo: o anel azul é o G (aberto, com a barra à direita) e o Y branco ocupa o
centro. Fundo em degradê azul-escuro → preto.

| Arquivo | Uso |
|---|---|
| `assets/logo-mark.svg` | símbolo (cabeçalho, rodapé, painel, login) |
| `assets/favicon.svg` | favicon otimizado para 16/32 px |
| `assets/apple-touch-icon.png` | ícone 180×180 para iOS |
| `assets/logo-ygsites.png` | lockup horizontal (símbolo + nome), fundo transparente |
| `assets/logo-ygsites-quadrado.png` | 1080×1080 para Instagram/WhatsApp |
| `assets/og-image.png` | 1200×630 para compartilhamento em redes sociais |

Cores: azul `#3b82f6` → `#1e40af`, branco `#f8fafc`, fundo `#05070f`.

O nome é escrito em **Sora**: "Yg" em 800 e "Sites" em 500, com "Web Studio"
espaçado embaixo (caixa alta, `letter-spacing` 0.3em).

## Estrutura

```
index.html        página principal (hero, portfólio, processo, contato)
admin.html        painel protegido por senha para editar o catálogo
assets/           logo, favicon, ícone iOS e imagem de compartilhamento
css/base.css      tokens de cor, tipografia e reset
css/home.css      estilos da página principal
css/admin.css     estilos do painel e da tela de senha
js/app.js         carrega o catálogo da API e renderiza o portfólio
js/admin.js       login, CRUD do catálogo, upload de imagens, importar/exportar JSON
api/login.js      valida a senha no servidor e devolve um token assinado
api/catalog.js    GET público do catálogo / PUT autenticado
api/upload.js     recebe a imagem do painel (autenticado) e grava no repositório
api/image.js      entrega as imagens com cache longo
lib/auth.js       hash da senha, assinatura e verificação do token
lib/store.js      leitura e escrita no repositório privado de dados
```

## Como funciona agora

- O catálogo **não fica mais no navegador**: ele vive no repositório privado
  `00UserBr/yg-sites-data` (`catalog.json`) e é servido por `/api/catalog`.
- Quem edita precisa da **senha**, validada em `/api/login` no servidor.
  Um login correto devolve um token assinado (HMAC) válido por 12 horas.
- O site mostra o mesmo catálogo em **qualquer dispositivo** assim que a
  alteração é publicada.
- `localStorage` é usado apenas como **cache** para a página abrir rápido
  (e continuar legível se a API estiver fora do ar).

## Imagens do catálogo

- O upload é feito no painel (`/admin.html`), no campo **Imagem do projeto**.
- A imagem é reduzida no navegador para no máximo **1600px** e recomprimida em
  JPEG antes de subir (o arquivo original pode ter até 12 MB).
- `POST /api/upload` exige o token do painel, aceita JPG/PNG/WebP até 3 MB e
  grava o arquivo em `images/` no repositório privado `yg-sites-data`.
- O nome do arquivo é o **hash do conteúdo**, então a mesma imagem nunca é
  gravada duas vezes e pode ficar em cache para sempre.
- Quem serve a imagem é `GET /api/image?name=<hash>.<ext>`, com
  `Cache-Control: immutable` (o Vercel guarda na borda).
- O campo `cover` do `catalog.json` guarda apenas a URL (`/api/image?name=...`).
- Trocar/remover a imagem no painel não apaga o arquivo antigo do repositório
  (sem risco de quebrar projetos que ainda usam a mesma imagem).

## Variáveis de ambiente (Vercel → Production)

| Nome | Para que serve |
|---|---|
| `GITHUB_TOKEN` | token com permissão de escrita no repositório `yg-sites-data` |
| `ADMIN_PASSWORD_HASH` | SHA-256 de `ygsites::` + senha (a senha não fica em texto puro) |

Variável opcional: `DATA_REPO` (padrão `00UserBr/yg-sites-data`).

Para trocar a senha, gere um novo hash e atualize `ADMIN_PASSWORD_HASH`:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('ygsites::NOVA_SENHA').digest('hex'))"
```

## Rodar localmente

O site precisa das funções em `api/`, então use a CLI do Vercel:

```bash
vercel dev
```

## Deploy

Hospedado no Vercel com deploy automático a cada push na branch `main`.
