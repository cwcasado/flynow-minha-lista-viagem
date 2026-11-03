# FlyNow — Minha Lista de Viagem

[![CI](https://github.com/cwcasado/flynow-minha-lista-viagem/actions/workflows/ci.yml/badge.svg)](https://github.com/cwcasado/flynow-minha-lista-viagem/actions/workflows/ci.yml)

Aplicação React + TypeScript (Vite) que lista destinos brasileiros, cada um com **6 fotos em carrossel**
e classificação em **8 categorias**. A pessoa pode salvar destinos numa lista pessoal, filtrar por
categoria, buscar por nome/descrição e alternar tema claro/noturno.

## Stack

- **React 19** + **Vite 8** + **TypeScript** (`strict`)
- **react-router-dom 7** — rotas `/`, `/login`, `/desejos`, `*`
- **axios** — login e CRUD na API DummyJSON
- **Vitest + Testing Library** — testes de comportamento
- **oxlint** — lint
- CSS puro com design system em variáveis (`src/styles/tokens.css`)

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # vitest run
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # serve o build
```

Login de teste (DummyJSON): usuário `emilys`, senha `emilyspass`.

## Funcionalidades

| Recurso | Onde |
|---|---|
| Catálogo de 26 destinos × 6 fotos (156 fotos), com categoria em cada foto | `src/data/destinos.ts` (gerado) |
| Carrossel no card: setas, bolinhas, contador `1/6`, teclado ←/→ | `src/components/DestinoCard.tsx` |
| Chips das 8 categorias com contagem real + busca sem acento | `src/components/Header.tsx` |
| Estado global (destinos, filtro, lista, tema, contadores) | `src/contexts/DestinosContext.tsx` |
| Minha lista persistida em `localStorage` (`flynow-minha-lista`) | `DestinosContext` |
| Tema claro/noturno persistido (`flynow-tema`, `data-tema` no `<html>`) | `DestinosContext` + CSS |
| Textos vindos da Wikipedia (consulta em lotes de 20 títulos), fotos e categorias locais | merge em `DestinosContext` |
| Foto de fundo na seção de contato, uma por tema | `public/fundo-contato*.jpg` + `.form-section` |
| Login em split: formulário sólido à esquerda, painel de foto com números reais do catálogo à direita (foto troca por tema) | `src/pages/Login.tsx`, `src/styles/login.css`, `public/login-hero*.jpg` |
| Senha com mostrar/ocultar, botão de credenciais de teste e erro acessível | `src/pages/Login.tsx` |
| Login, rota protegida e CRUD de desejos | `AuthContext`, `ProtectedRoute`, `pages/Desejos.tsx` |

## Categorias

`Natureza` · `Praias` · `Histórico` · `Monumentos` · `Gastronomia` · `Cultura` · `Aventura` · `Ponto turístico`

Definidas em `src/data/categorias.ts`. Um destino pode ter várias categorias (filtro do topo);
cada foto tem exatamente uma (etiqueta no carrossel).

## Curadoria das fotos

As fotos são fixas (sem busca no Commons em runtime) e todas as URLs foram validadas com HTTP 200.
A fonte é `scripts/curadoria.json`; o catálogo é gerado por script — **não edite `src/data/destinos.ts` à mão**.

```bash
python scripts/gerar-destinos.py    # regera src/data/destinos.ts
python scripts/validar-fotos.py     # valida as 156 URLs
python scripts/checar-catalogo.py    # estrutura + títulos da Wikipedia
```

A lista de categorias de cada destino é **derivada das fotos** no momento da geração, então o
filtro do topo e as etiquetas do carrossel nunca divergem.

Detalhes e armadilhas conhecidas: `scripts/README.md`.

## Estrutura

```
src/
  components/   Header, DestinoCard (carrossel), DestinoLista, DestinoForm, DesejoItem, ErrorBoundary
  contexts/     AuthContext, DestinosContext
  data/         destinos.ts (gerado), categorias.ts
  pages/        Destinos, Login (+ Login.test), Desejos, NaoEncontrada
  routes/       ProtectedRoute (+ teste)
  services/     desejos.ts
  styles/       tokens.css (fonte única), fontes.css, login.css
  test/         setup do Vitest
  utils/        erros.ts
public/         logos otimizados, fotos de fundo do contato e do login (claro e noturno)
scripts/        curadoria das fotos + verificadores de tokens, contraste e assets
Exercícios/     material das aulas (fora do controle de versão)
```

## Design system

- **Tokens** em `src/styles/tokens.css` — cores, espaço, tipografia, raio, elevação e movimento.
  Tema claro/noturno resolvido por `color-scheme` + `light-dark()`, com o `data-tema` do
  `<html>` vencendo a preferência do sistema.
- **Tipografia**: Fraunces (display) e Inter (texto), self-hosted via Fontsource — só o eixo
  de peso e o subset latino são baixados (~83 KB).
- **Logo**: lockup horizontal (176×65). É um `background` para trocar de arte com o tema: no
  noturno a versão `flynow-logo-escuro` deixa os pixels frios em creme e mantém o âmbar, porque
  o azul-marinho original fica a 1,3:1 sobre o card escuro.
- **Verificação** (rodar antes de commit):

  ```bash
  node scripts/verificar-tokens.mjs     # integridade dos tokens + uso sem definição
  node scripts/verificar-contraste.mjs  # pares de cor WCAG AA (4,5:1 texto, 3:1 borda/foco)
  node scripts/verificar-assets.mjs     # logos, fontes e uso de srcSet/width/height
  npm test
  ```

## Login

Página em **split**: o formulário fica à esquerda, num card sólido, e à direita um painel com
foto de destino e os números do catálogo (26 destinos, 156 fotos, 8 categorias). A imagem troca
junto com o tema.

- Foto do noturno: Rio ao pôr do sol visto do Pão de Açúcar — Adam Jones, CC BY-SA 3.0
- Foto do claro: Balneário Camboriú visto do Parque Unipraias — Trustable, CC BY-SA 4.0
- Autofoco no campo de usuário só quando há mouse (`hover: hover`), para não abrir teclado no toque
- Erro de credenciais anunciado com `role="alert"` e limpo assim que a pessoa volta a digitar
- O contraste dos pares de cor é medido por `node scripts/verificar-contraste.mjs`

Regenerar as fotos do login: `python scripts/baixar-login-hero.py`.

## Limitações conhecidas

- Sem modal/lightbox e sem upload de fotos (fora de escopo).
- A busca na Wikipedia acontece em runtime; se falhar, o catálogo local assume com um aviso discreto.
- Projeto usa `localStorage` (sem backend próprio).
