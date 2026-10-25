# YG Sites

Site institucional + painel de catálogo da **YG Sites** (azul, preto e branco).

- **Site:** https://ygsites.vercel.app
- **Painel administrativo:** https://ygsites.vercel.app/admin.html

## Estrutura

```
index.html        página principal (hero, portfólio, processo, contato)
admin.html        painel para cadastrar/editar os sites do catálogo
css/base.css      tokens de cor, tipografia e reset
css/home.css      estilos da página principal
css/admin.css     estilos do painel
js/app.js         renderiza o catálogo salvo no navegador
js/admin.js       CRUD do catálogo, importar/exportar JSON
```

## Como funciona o painel

O catálogo é salvo no `localStorage` do navegador, na chave `ygsites-catalog-v1`.
Isso significa que as alterações aparecem na hora para quem edita, mas ficam
salvas por navegador/dispositivo. Use **Exportar JSON** no painel para guardar
uma cópia e **Importar JSON** para restaurar em outro navegador.

## Rodar localmente

Não precisa de build. Basta abrir `index.html` no navegador ou servir a pasta:

```bash
npx serve .
```

## Deploy

Hospedado no Vercel com deploy automático a cada push na branch `main`.
