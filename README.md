# YG Sites

Site institucional + painel de catálogo da **YG Sites** (azul, preto e branco).

- **Site:** https://ygsites.vercel.app
- **Painel (com senha):** https://ygsites.vercel.app/admin.html
- **Dados do catálogo (privado):** https://github.com/00UserBr/yg-sites-data

## Estrutura

```
index.html        página principal (hero, portfólio, processo, contato)
admin.html        painel protegido por senha para editar o catálogo
css/base.css      tokens de cor, tipografia e reset
css/home.css      estilos da página principal
css/admin.css     estilos do painel e da tela de senha
js/app.js         carrega o catálogo da API e renderiza o portfólio
js/admin.js       login, CRUD do catálogo, importar/exportar JSON
api/login.js      valida a senha no servidor e devolve um token assinado
api/catalog.js    GET público do catálogo / PUT autenticado
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
