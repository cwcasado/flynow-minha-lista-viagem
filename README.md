# FlyNow — Minha Lista de Viagem

[![CI](https://github.com/cwcasado/flynow-minha-lista-viagem/actions/workflows/ci.yml/badge.svg)](https://github.com/cwcasado/flynow-minha-lista-viagem/actions/workflows/ci.yml)

Aplicação React + TypeScript (Vite) que lista destinos brasileiros, cada um com **6 fotos em carrossel**
e classificação em **8 categorias**. A pessoa pode salvar destinos numa lista pessoal, filtrar por
categoria, buscar por nome/descrição e alternar tema claro/noturno.

## Stack

- **React 19** + **Vite 8** + **TypeScript** (`strict`)
- **react-router-dom 7** — rotas `/`, `/login`, `/desejos`, `*`
- **axios** — login e CRUD na API DummyJSON
- **oxlint** — lint
- CSS puro com design system em variáveis (`src/index.css`)

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
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
  pages/        Destinos, Login, Desejos, NaoEncontrada
  routes/       ProtectedRoute
  services/     desejos.ts
  utils/        erros.ts
public/         logos e fotos de fundo da seção de contato (claro e noturno)
scripts/        pipeline de curadoria e validação das fotos
Exercícios/     material das aulas (fora do controle de versão)
```

## Limitações conhecidas

- Sem modal/lightbox e sem upload de fotos (fora de escopo).
- A busca na Wikipedia acontece em runtime; se falhar, o catálogo local assume com um aviso discreto.
- Projeto usa `localStorage` (sem backend próprio).
