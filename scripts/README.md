# Curadoria das fotos dos destinos

Cada destino tem **6 fotos** do Wikimedia Commons, cada uma com **categoria própria**.
As imagens são fixas (sem busca em runtime) e todas as URLs foram validadas com HTTP 200.
Hoje são **26 destinos × 6 fotos = 156 fotos**.

## Arquivos

| Arquivo | Papel |
|---|---|
| `curadoria.json` | **Fonte da verdade.** Destino → 6 arquivos do Commons + categoria de cada foto. |
| `gerar-destinos.py` | Lê `curadoria.json`, resolve a URL de thumbnail 960px na API do Commons, deriva as categorias do destino a partir das fotos e grava `src/data/destinos.ts`. |
| `validar-fotos.py` | Faz GET (Range de 1 KB) em cada URL final e falha se alguma não responder 200/206. |
| `checar-catalogo.py` | Confere o catálogo gerado (26 destinos, 6 fotos cada, sem URL duplicada, categorias coerentes) e o merge com a Wikipedia em lotes de 20. |
| `commons_lib.py` | Funções compartilhadas da API (User-Agent identificado, pausa entre chamadas). |
| `coletar-pool.py` | Coleta um pool de candidatas por destino para re-curadoria (catálogo antigo). |
| `coletar-pool-novos.py` / `coletar-pool-alvo.py` | Coletas de pool dos 15 destinos novos → `pool-novos.json` / `pool-alvo.json`. |
| `curar-novos.py` | Casa as escolhas (chave + título + categoria) com os pools e acrescenta os destinos novos à curadoria. Idempotente: rodar de novo substitui as entradas. |
| `baixar-fundo.py` | Baixa/otimiza as duas fotos de fundo da seção de contato para `public/`. |
| `baixar-login-hero.py` | Baixa/otimiza as duas fotos do painel do login (uma por tema) para `public/`. |
| `medir-fundo.py` | Mede o pior contraste do texto sobre as fotos, por tema e por breakpoint. |
| `verificar-tokens.mjs` | Garante que todo token `--*` usado em `src/styles/tokens.css`, `src/styles/login.css` e `src/index.css` está definido ali. |
| `verificar-contraste.mjs` | Calcula os 24 pares de cor do design system e falha abaixo de 4,5:1 (texto) ou 3:1 (borda/foco). |
| `verificar-assets.mjs` | Confere logos otimizados, pacotes de fonte, import de `fontes.css` e uso de `srcSet`/`width`/`height` nas logos. |
| `otimizar-logo.ps1` | Redimensiona `public/flynow-logo-transparente.png` para 88 px e 176 px (2,9 MB → 5,7 KB e 16,5 KB). |
| `verificacao-fotos.json` | Última verificação: 156 registros `{destino, arquivo, url, categoria}`. |

## Como regerar

```bash
python scripts/gerar-destinos.py    # atualiza src/data/destinos.ts
python scripts/validar-fotos.py     # confirma que as 156 URLs respondem
python scripts/checar-catalogo.py   # confere estrutura + títulos da Wikipedia
```

Para refazer a curadoria dos 15 destinos novos (os pools são artefatos temporários,
gerados na hora e não versionados):

```bash
python scripts/coletar-pool-novos.py
python scripts/coletar-pool-alvo.py
python scripts/curar-novos.py --dry-run   # mostra o casamento antes de gravar
python scripts/curar-novos.py
python scripts/gerar-destinos.py
```

## Fundos da seção de contato

Cada tema carrega **uma** imagem (o CSS só referencia a do tema ativo, então o navegador não
baixa a outra). Reproduzir: `python scripts/baixar-fundo.py`.

| Tema | Arquivo | Origem | Licença | Tamanho |
|------|---------|--------|---------|---------|
| noturno | `public/fundo-contato.jpg` | *Revoada de guarás no Delta do Parnaíba* — MTur Destinos | domínio público | 1280×853, 192 KB |
| claro | `public/fundo-contato-claro.jpg` | *Areia e Mar* — Wanessa Gabrielle | CC BY-SA 4.0 (crédito exibido na seção) | 1280×853, 266 KB |

- Gradiente sobre a foto: escuro no tema noturno (alpha 0,95 → 0,55), branco-azulado no claro
  (0,97 → 0,34) — mais fechado à esquerda, onde fica o texto, e aberto à direita, onde a foto aparece.
- No mobile o gradiente é vertical (0,97 → 0,88 no claro; 0,95 → 0,78 no noturno).
- `python scripts/medir-fundo.py` recalcula o pior contraste **sobre os pixels reais** das duas fotos.
  Última medição: claro 6,28:1 / noturno 7,48:1 (pior caso, mobile — todos ≥ 4,5:1 AA).

## Fotos do painel do login

Mesma regra do contato: **uma foto por tema**, escolhida por variável CSS
(`--login-foto`, em `src/styles/login.css`), então o navegador só baixa a do tema ativo.
Reproduzir: `python scripts/baixar-login-hero.py`.

| Tema | Arquivo | Origem | Licença | Tamanho |
|------|---------|--------|---------|---------|
| noturno | `public/login-hero.jpg` | *View from Sugarloaf Mountain-Pao de Acucar at Sunset* — Rio de Janeiro | CC BY-SA 3.0 (Adam Jones — crédito exibido no painel) | 1100×1650, 183 KB |
| claro | `public/login-hero-claro.jpg` | *Balneário Camboriú from Unipraias Park* | CC BY-SA 4.0 (Trustable — crédito exibido no painel) | 950×1425, 212 KB |

- Gradiente navy sobre as duas fotos, agora **ancorado na base** (0,88 no rodapé → 0,35 a 45% →
  transparente a 75%), porque o texto e o crédito passaram a ocupar a parte inferior do painel.
  A foto aparece livre no terço superior.
- `python scripts/medir-fundo.py` mede **por região de texto** (`faixa`) na geometria antiga
  (texto no topo): noturno 8,89 / 7,98 / 10,35:1 e claro 6,79 / 6,09 / 9,46:1. A região da base,
  onde o texto está hoje, é a de maior alpha — os valores de base (10,35 e 9,46) são o piso próximo.

## Regras aprendidas

- A API em português devolve `Ficheiro:`; o Commons só aceita `File:`.
- Thumbnails só funcionam nos tamanhos listados: `960px` funciona, `800px` retorna 400.
- Não remover os parâmetros `utm_*` da URL devolvida pela API — eles fazem parte do link válido.
- Títulos com redirecionamento mudam de nome (`Jalapão` → `Parque Estadual do Jalapão`); o merge
  em `DestinosContext` usa o mapa de `redirects` da própria API.
- Arquivos com `logo`, `bandeira`, `mapa`, `planta` ou `.svg` são descartados na coleta.
- **A Wikipedia devolve no máximo 20 extracts por requisição** (`exlimit`). Com 25 destinos, uma
  requisição só deixaria 5 sem descrição — por isso o app e o `checar-catalogo.py` consultam em
  lotes de 20 (2 lotes: 20 + 5), todos com `redirects=1`.
- **Busca livre por palavra genérica entrega lugares errados** (o "ru" de "Joy-Con 2 RU", "Ilha
  Grande" de Chipre, "Periquitúos" em SP). Foto só entra se vier do pool coletado **para aquele
  destino** (artigo da Wikipedia + categorias do Commons) ou de uma busca extra com termo
  inequívoco.
- **Casamento de arquivo por substring com dobra NFKD** (sem acento, minúsculo): nomes reais têm
  grafias que enganam (`Bençãos`, `Cataramá`, `Ilha das Couves`) e busca por título exato falha.
- O nome do arquivo sozinho não prova o lugar: a categoria do destino é a **união das categorias
  das fotos**, gerada no `gerar-destinos.py` — assim filtro e etiquetas nunca divergem.
- Thumbnails do Commons só existem nos tamanhos permitidos pela API: usar `iiurlwidth` na chamada,
  nunca editar a URL à mão.
