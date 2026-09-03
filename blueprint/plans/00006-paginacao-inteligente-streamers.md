# Plano de Implementação — EnPassant.live

**Plano:** 00006  
**Status:** Rascunho / Aguardando Revisão Técnica  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00005 & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00006 — Paginação Inteligente de Streamers, Navegação Rápida (Primeira/Última), Janela Dinâmica com Reticências e Acessibilidade**

---

## 2. Identificação, Data e Status

* **Identificador:** 00006
* **Data:** 2026-09-03
* **Status:** Rascunho / Aguardando Revisão Técnica

---

## 3. Referência ao Projeto e Preservação dos Planos Anteriores

* **PRD Oficial:** `blueprint/docs/prd.md`
* **Planos Anteriores Concluídos / Aprovados:**
  * `00001-implementacao-inicial-do-mvp.md` (MVP, API Chess.com, Grid, Cards, Paginação Básica)
  * `00002-sistema-de-temas-dark-light.md` (Design Tokens, Dark/Light, LocalStorage, Meta Theme-Color)
  * `00003-indicadores-de-status-offline.md` (Contador Offline no Header, Identidade Vermelha)
  * `00004-ordenacao-streamers-status-e-nome.md` (Ordenação Automática por Status e Nome de Usuário) — **Imutável**
  * `00005-atualizacao-automatica-streamers.md` (Atualização Periódica a cada 5 Minutos, Sync Bar, Countdown) — **Imutável**
* **Regra de Não-Regressão e Imutabilidade:**
  * O algoritmo de ordenação `sortStreamers` do **Plano 00004** permanece 100% inalterado.
  * O pipeline de atualização automática, sincronização em segundo plano e contador regressivo do **Plano 00005** permanece 100% inalterado.
  * A paginação atua exclusivamente sobre o resultado fatiado (`currentStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE)`) a partir dos dados em memória gerenciados no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx).

---

## 4. Objetivo

Especificar tecnicamente a evolução do componente de paginação do **EnPassant.live**, substituindo a renderização bruta de todas as páginas por um **algoritmo de paginação inteligente/dinâmica** com janela deslizante e reticências (`...`), adicionando controles explícitos para **Primeira Página** e **Última Página**, garantindo:

1. **Eliminação da poluição visual:** Exibição de um conjunto compacto e estritamente determinístico de tokens de páginas numéricas e reticências (máximo de 7 tokens em `paginationItems`), independentemente do volume total de streamers (ex: 65+ páginas).
2. **Navegação rápida e direta:** Inclusão dos controles de salto imediato para a primeira (`page = 1`) e última página (`page = totalPages`), além dos botões existentes de avançar (`currentPage + 1`) e retroceder (`currentPage - 1`).
3. **Isolamento de lógica:** Separação pura entre o algoritmo de cálculo de páginas (`getPaginationPages`) e a renderização JSX.
4. **Semântica e Acessibilidade (a11y):** Uso correto de `aria-label`, `aria-current="page"`, `disabled`, elementos não-interativos para as reticências e suporte integral a navegação por teclado.
5. **Responsividade verificável:** Layout sem quebras com overflow horizontal em viewports mobile (320px a 640px) e tablets.
6. **Resiliência a alterações de dados:** Tratamento transparente de cenários onde uma atualização periódica da API altera o total de páginas disponíveis.

---

## 5. Contexto e Problema Atual

### 5.1. Implementação Atual

Atualmente, o componente [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx) gera todas as páginas numéricas sem qualquer filtragem ou agrupamento:

```javascript
// Implementação atual em src/components/Pagination.jsx:
const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
```

Com o total de streamers parceiros retornado pela API do Chess.com (geralmente entre 750 e 800 streamers) e `ITEMS_PER_PAGE = 12`, o cálculo resulta em `totalPages = 65`.

### 5.2. Problemas Identificados

1. **Poluição Visual Extrema:** São renderizados 65 botões simultaneamente na base da página.
2. **Quebra de Linhas Excessiva:** Em telas desktop, os botões ocupam múltiplas linhas empilhadas; em dispositivos móveis, a experiência fica completamente sobrecarregada.
3. **Falta de Atalhos de Borda:** Para chegar à última página a partir da página 1, o usuário precisa rolar por uma massa de 65 botões e clicar no último ou clicar repetidamente em "Próxima".
4. **Descompasso com Padrões Modernos de UX:** Sistemas modernos de paginação usam reticências e janelas de contexto (`1 2 3 4 5 ... 65` ou `1 ... 31 32 33 ... 65`) para manter a barra compacta e elegante.

---

## 6. Requisitos Funcionais (RF)

* **[RF-01] Janela Dinâmica de Páginas:**
  * O componente não deve renderizar todas as páginas de uma só vez quando `totalPages > 7`.
  * Deve exibir no máximo 7 tokens numéricos e de reticências (`paginationItems`), contendo: primeira página, páginas vizinhas à atual (janela deslizante com `siblingCount = 1`), última página e reticências (`...`) nas lacunas.
* **[RF-02] Botão Primeira Página (`« Primeira`):**
  * Ao ser acionado, navega imediatamente para `page = 1`.
  * Deve estar desabilitado (`disabled`) quando `currentPage === 1`.
* **[RF-03] Botão Página Anterior (`< Anterior`):**
  * Ao ser acionado, navega para `currentPage - 1`.
  * Deve estar desabilitado (`disabled`) quando `currentPage === 1`.
* **[RF-04] Botão Próxima Página (`Próxima >`):**
  * Ao ser acionado, navega para `currentPage + 1`.
  * Deve estar desabilitado (`disabled`) quando `currentPage === totalPages`.
* **[RF-05] Botão Última Página (`Última »`):**
  * Ao ser acionado, navega imediatamente para `page = totalPages`.
  * Deve estar desabilitado (`disabled`) quando `currentPage === totalPages`.
* **[RF-06] Seleção Direta de Página Numérica:**
  * Ao clicar em qualquer número de página visível, navega diretamente para aquela página e dispara a rolagem suave para o topo (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
* **[RF-07] Destaque da Página Atual:**
  * A página ativa deve receber classe CSS de destaque (`active`) e o atributo `aria-current="page"`.
* **[RF-08] Reticências Informativas (`...`):**
  * As reticências devem ser puramente informativas (não-clicáveis), sem foco de teclado e tratadas como separadores visuais não-interativos.
* **[RF-09] Indicador Textual de Status:**
  * Manter o elemento informativo `"Página {currentPage} de {totalPages}"` com `aria-live="polite"` para clareza visual e acessibilidade.
* **[RF-10] Ocultação com Apenas 1 Página:**
  * Quando `totalPages <= 1`, o componente `Pagination` retorna `null` (sem renderizar controles na tela).

---

## 7. Requisitos Não Funcionais (RNF)

* **[RNF-01] Performance e Pureza Algorítmica:**
  * A função de geração de itens da paginação deve ser determinística, pura, síncrona e executar em tempo constante $O(1)$.
* **[RNF-02] Sem Dependências Externas:**
  * Implementação em Vanilla JavaScript / React nativo, sem bibliotecas de terceiros.
* **[RNF-03] Acessibilidade (WCAG 2.1 AA):**
  * Uso de elemento `<nav aria-label="Navegação da paginação">`.
  * `aria-label` descritivo em todos os botões (`"Ir para a primeira página"`, `"Ir para a página anterior"`, `"Página X"`, `"Ir para a próxima página"`, `"Ir para a última página"`).
  * `disabled` nativo nos botões desabilitados.
  * Reticências marcadas com `aria-hidden="true"` em tag neutra `<span>` não-focável.
  * Apenas o container textual `.pagination-info` pode utilizar `aria-live="polite"`. Botões e reticências não devem conter atributos `aria-live`.
* **[RNF-04] Responsividade (Mobile First / Flexbox):**
  * O container `.pagination-controls` deve utilizar `flex-wrap: wrap` com espaçamentos proporcionais.
  * Nenhum elemento deve causar estouro horizontal (`overflow-x`) em viewports de `320px` a `1440px+`.
  * É permitido e esperado que os botões quebrem em múltiplas linhas em telas estreitas, desde que todos permaneçam visíveis, clicáveis e alinhados.
* **[RNF-05] Manutenibilidade e Testabilidade:**
  * A regra de geração deve ficar isolada na função utilitária pura `getPaginationPages(currentPage, totalPages, siblingCount = 1)`, permitindo testes unitários diretos sem necessidade de montar o DOM.

---

## 8. Arquitetura e Algoritmo de Geração da Paginação

### 8.1. Estrutura de Itens e Contrato da Função

A função geradora de itens da paginação retorna uma lista de tokens representando números de página ou identificadores únicos de reticências:

```typescript
type PaginationToken = number | 'DOTS_LEFT' | 'DOTS_RIGHT';

function getPaginationPages(
  currentPage: number,
  totalPages: number,
  siblingCount?: number
): PaginationToken[];
```

#### Tratamento Defensivo de Entradas:
* Se `totalPages` for nulo, indefinido, menor ou igual a zero ou não numérico: a função normaliza para `0` e retorna array vazio `[]`.
* Se `totalPages === 1`: retorna `[1]`.
* Se `currentPage` não for inteiro ou estiver fora do intervalo $[1, \text{totalPages}]$: é normalizado defensivamente via `Math.min(Math.max(1, Math.floor(currentPage) || 1), totalPages)`.
* `siblingCount` é padronizado estritamente como `1`.

### 8.2. Especificação da Regra Única e Determinística

A regra é baseada em uma janela deslizante com `siblingCount = 1` e limiar de reticências em `totalPages <= 7`:

1. **Limiar sem Reticências ($totalPages \le 7$):**
   * Retorna todas as páginas sequenciais de $1$ a $totalPages$:
     $$\text{resultado} = [1, 2, \dots, totalPages]$$
   * Quantidade de tokens: de 2 a 7 tokens numéricos; 0 reticências.

2. **Para $totalPages > 7$ (Ex: $totalPages = 65$), a função avalia 3 casos mutuamente exclusivos:**

   * **Caso A — Extremidade Inicial ($currentPage \le 4$):**
     * Exibe os 5 primeiros números, a reticência direita e a última página:
       $$\text{resultado} = [1, 2, 3, 4, 5, \text{'DOTS\_RIGHT'}, totalPages]$$
     * Quantidade de tokens: exatamente 7 tokens (6 números + 1 reticência).

   * **Caso B — Extremidade Final ($currentPage \ge totalPages - 3$):**
     * Exibe a primeira página, a reticência esquerda e os 5 últimos números:
       $$\text{resultado} = [1, \text{'DOTS\_LEFT'}, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]$$
     * Para $totalPages = 65$: $[1, \text{'DOTS\_LEFT'}, 61, 62, 63, 64, 65]$
     * Quantidade de tokens: exatamente 7 tokens (6 números + 1 reticência).

   * **Caso C — Intervalo Central ($5 \le currentPage \le totalPages - 4$):**
     * Exibe a primeira página, reticência esquerda, a página atual com seu vizinho anterior e posterior, reticência direita e última página:
       $$\text{resultado} = [1, \text{'DOTS\_LEFT'}, currentPage - 1, currentPage, currentPage + 1, \text{'DOTS\_RIGHT'}, totalPages]$$
     * Para $totalPages = 65, currentPage = 32$: $[1, \text{'DOTS\_LEFT'}, 31, 32, 33, \text{'DOTS\_RIGHT'}, 65]$
     * Quantidade de tokens: exatamente 7 tokens (5 números + 2 reticências).

### 8.3. Resumo de Tokens da Coleção `paginationItems`

* **Quantidade máxima de tokens em `paginationItems`:** Exatamente 7 tokens para qualquer $totalPages \ge 7$.
* **Quantidade máxima de páginas numéricas visíveis simultaneamente:** 6 números (nos casos A e B) ou 5 números (no caso C).
* **Quantidade máxima de reticências:** 2 reticências (`DOTS_LEFT` e `DOTS_RIGHT` no caso C).
* **Escopo do Limite:** Os 4 controles de navegação (`« Primeira`, `< Anterior`, `Próxima >`, `Última »`) são botões externos ao container de páginas numéricas e não são contabilizados no array `paginationItems`.

---

## 9. Análise Detalhada dos Casos de Borda

A tabela abaixo consolida todas as situações de contorno de forma 100% determinística:

| Total de Páginas ($N$) | Página Atual ($C$) | Saída Oficial do Algoritmo (`getPaginationPages`) | Controles Desabilitados |
|---|---|---|---|
| **$N = 0$ ou $N = 1$** | $1$ | `Pagination` retorna `null` | Nenhum (componente não renderizado) |
| **$N = 2$** | $1$ | `[1, 2]` | Primeira, Anterior |
| **$N = 2$** | $2$ | `[1, 2]` | Próxima, Última |
| **$N = 3$** | $2$ | `[1, 2, 3]` | Nenhum |
| **$N = 4$** | $2$ | `[1, 2, 3, 4]` | Nenhum |
| **$N = 5$** | $3$ | `[1, 2, 3, 4, 5]` | Nenhum |
| **$N = 6$** | $3$ | `[1, 2, 3, 4, 5, 6]` | Nenhum |
| **$N = 7$** | $4$ | `[1, 2, 3, 4, 5, 6, 7]` | Nenhum |
| **$N = 8$** | $1$ | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 8]` | Primeira, Anterior |
| **$N = 8$** | $4$ | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 8]` | Nenhum |
| **$N = 8$** | $5$ | `[1, 'DOTS_LEFT', 4, 5, 6, 7, 8]` | Nenhum |
| **$N = 8$** | $8$ | `[1, 'DOTS_LEFT', 4, 5, 6, 7, 8]` | Próxima, Última |
| **$N = 65$** | $1$ (Primeira) | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` | Primeira, Anterior |
| **$N = 65$** | $2$ (Segunda) | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $3$ (Terceira) | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $4$ (Quarta) | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $5$ (Início Centro) | `[1, 'DOTS_LEFT', 4, 5, 6, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $32$ (Centro) | `[1, 'DOTS_LEFT', 31, 32, 33, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $61$ (Fim Centro) | `[1, 'DOTS_LEFT', 60, 61, 62, 'DOTS_RIGHT', 65]` | Nenhum |
| **$N = 65$** | $62$ (Próx. Fim) | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` | Nenhum |
| **$N = 65$** | $63$ (Antepenúltima) | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` | Nenhum |
| **$N = 65$** | $64$ (Penúltima) | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` | Nenhum |
| **$N = 65$** | $65$ (Última) | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` | Próxima, Última |

---

## 10. Controles de Navegação e Estados Desabilitados

### 10.1. Especificação dos Botões

1. **Primeira Página (`« Primeira`):**
   * Ação: `onPageChange(1)`
   * Atributos: `disabled={currentPage === 1}`, `aria-label="Ir para a primeira página"`
2. **Página Anterior (`< Anterior`):**
   * Ação: `onPageChange(currentPage - 1)`
   * Atributos: `disabled={currentPage === 1}`, `aria-label="Ir para a página anterior"`
3. **Página Numérica (`1`, `2`, ..., `N`):**
   * Ação: `onPageChange(page)`
   * Atributos: `aria-current={page === currentPage ? 'page' : undefined}`, `aria-label={`Página ${page}`}`
   * Classes: `btn-page-number` e `active` quando selecionada.
4. **Próxima Página (`Próxima >`):**
   * Ação: `onPageChange(currentPage + 1)`
   * Atributos: `disabled={currentPage === totalPages}`, `aria-label="Ir para a próxima página"`
5. **Última Página (`Última »`):**
   * Ação: `onPageChange(totalPages)`
   * Atributos: `disabled={currentPage === totalPages}`, `aria-label="Ir para a última página"`

### 10.2. Regra de Limites e Proteção no `App.jsx`

A função `handlePageChange` existente em [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx#L235-L240) já implementa guarda estrita de limites:

```javascript
const handlePageChange = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
```

Qualquer tentativa de chamar páginas menores que `1` ou maiores que `totalPages` é ignorada com segurança.

---

## 11. Semântica e Acessibilidade das Reticências (`...`)

* **Elemento HTML:** `<span>` não-interativo com a classe `.pagination-ellipsis`.
* **Atributos de Acessibilidade:** `aria-hidden="true"` para evitar leitura indevida por leitores de tela.
* **Chave Única no React (Keys):**
  * `key="dots-left"` para o token `'DOTS_LEFT'`.
  * `key="dots-right"` para o token `'DOTS_RIGHT'`.
* **Estilização Visual:** Alinhamento centralizado com dimensões equivalentes aos botões numéricos (`38px` desktop / `32px` mobile), `cursor: default`, sem foco e sem eventos de clique.

---

## 12. Acessibilidade (a11y) e Navegação por Teclado

1. **Tag Semântica:** A estrutura principal é delimitada por `<nav aria-label="Navegação da paginação">`.
2. **Navegação por Teclado (`Tab` e `Enter`/`Space`):**
   * Todos os botões interativos são elementos `<button type="button">`, garantindo navegabilidade nativa via teclado.
   * Botões com atributo `disabled` são automaticamente desconsiderados da ordem de tabulação.
3. **Identificação da Página Ativa:** O botão da página atual recebe `aria-current="page"`.
4. **Foco Visível:** Preservar estilos de `:focus-visible` com anel de foco destacado (`outline: 2px solid var(--accent-twitch)`).
5. **Comunicação de Mudanças:** O container `.pagination-info` exibe `Página {currentPage} de {totalPages}` com `aria-live="polite"`. Botões, contadores de streamers e reticências não devem utilizar `aria-live` para evitar poluição sonora em leitores de tela.

---

## 13. Responsividade e Adaptação para Telas Menores

### 13.1. Desktop e Widescreen (> 768px)
* Controles alinhados horizontalmente em linha única.
* Textos completos: `"« Primeira"`, `"< Anterior"`, números + reticências, `"Próxima >"`, `"Última »"`.

### 13.2. Dispositivos Móveis e Telas Pequenas (320px a 640px)
* `.pagination-controls` utiliza `flex-wrap: wrap` com `gap: 0.35rem` a `0.5rem`.
* É expressamente permitido que os controles quebrem em duas linhas compactas (ex: botões de navegação em uma linha e números de página na outra), garantindo usabilidade ergonômica.
* Botões com padding compacto (`0.45rem 0.65rem`) e botões numéricos com `min-width: 32px` e `height: 32px`.
* **Critério de Validação:** A barra não gera overflow horizontal em viewports a partir de 320px de largura e todos os botões permanecem com área de clique confortável.

---

## 14. Compatibilidade com os Planos Anteriores

```
┌────────────────────────────────────────────────────────────────────────┐
│              COMPATIBILIDADE E ISOLAMENTO ARQUITETURAL                 │
├────────────────────────────────────────────────────────────────────────┤
│ [Plano 00004] sortStreamers() (AO VIVO primeiro + A-Z)                 │
│         │                                                              │
│         ▼                                                              │
│ [Plano 00005] Auto-refresh (5 min) / Sync Bar / Countdown              │
│         │                                                              │
│         ▼                                                              │
│ [App.jsx] streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE)     │
│         │                                                              │
│         ▼                                                              │
│ [Plano 00006] Pagination Inteligente                                   │
│   • getPaginationPages(currentPage, totalPages, 1)                     │
│   • Renderização compacta: Primeira | Anterior | Páginas | Próx | Últ  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Plano 00004 (Ordenação Automática):**
   * A ordenação ocorre no array de streamers antes da paginação. O componente `Pagination` opera exclusivamente sobre os inteiros `currentPage` e `totalPages`, sem tocar na ordenação ou nos cards.
2. **Plano 00005 (Atualização Automática):**
   * Quando uma atualização automática ou manual ocorre a cada 5 minutos, a lista `streamers` é atualizada.
   * `totalPages` é recalculado: `Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1`.
   * A paginação inteligente reflete instantaneamente o novo total.

---

## 15. Tratamento de Alteração Dinâmica no Total de Páginas

Quando a lista de streamers é atualizada em segundo plano (Plano 00005), a quantidade total de streamers pode variar:

### Cenário 1: Redução no total de páginas com página atual fora do limite
* **Situação:** O usuário está na página `65` de `65`. Uma atualização reduz os streamers para uma quantidade equivalente a `40` páginas.
* **Mecanismo de Correção Existente no `App.jsx`:**
  ```javascript
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  ```
* **Comportamento Garantido:** O `App.jsx` ajusta `currentPage` para `1`, e o componente `Pagination` recalcula `getPaginationPages(1, 40)` de forma transparente, exibindo `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 40]`.

### Cenário 2: Aumento no total de páginas
* **Situação:** O usuário está na página `10` de `65`. Uma atualização eleva o total para `70` páginas.
* **Comportamento:** A página atual `10` permanece ativa; `totalPages` passa a ser `70` e o botão `"Última »"` passa a navegar para `70`.

---

## 16. Arquivos Envolvidos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MATRIZ DE ARQUIVOS                             │
├─────────────────────────────────────┬───────────────────────────────────┤
│ Arquivo                             │ Ação / Responsabilidade           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/components/Pagination.jsx       │ MODIFICAR                         │
│                                     │ • Incluir função getPaginationPages│
│                                     │ • Adicionar botões Primeira/Última│
│                                     │ • Renderizar tokens numéricos/dots│
│                                     │ • Configurar atributos a11y       │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.css                         │ MODIFICAR                         │
│                                     │ • Estilos para .pagination-ellipsis│
│                                     │ • Ajustes para botões de navegação│
│                                     │ • Responsividade mobile           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.jsx                         │ NÃO MODIFICAR                     │
│ src/components/Header.jsx           │ NÃO MODIFICAR                     │
│ src/components/StreamerCard.jsx     │ NÃO MODIFICAR                     │
│ src/components/StreamerGrid.jsx     │ NÃO MODIFICAR                     │
│ src/components/LoadingState.jsx     │ NÃO MODIFICAR                     │
│ src/components/ErrorState.jsx       │ NÃO MODIFICAR                     │
│ src/components/EmptyState.jsx       │ NÃO MODIFICAR                     │
│ blueprint/plans/00004-...           │ NÃO MODIFICAR                     │
│ blueprint/plans/00005-...           │ NÃO MODIFICAR                     │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 17. Estratégia de Implementação e Código Previsto

### 17.1. Função Pura no Componente [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx)

```javascript
/**
 * Gera o array determinístico de páginas e tokens de reticências.
 * @param {number} currentPage - Página atualmente ativa (1-based)
 * @param {number} totalPages - Total de páginas disponíveis
 * @param {number} [siblingCount=1] - Quantidade de vizinhos ao redor da atual (padrão estrito: 1)
 * @returns {Array<number|'DOTS_LEFT'|'DOTS_RIGHT'>} Lista de tokens da paginação
 */
export function getPaginationPages(currentPage, totalPages, siblingCount = 1) {
  const safeTotalPages = Math.max(0, Math.floor(totalPages) || 0);
  if (safeTotalPages <= 1) {
    return safeTotalPages === 1 ? [1] : [];
  }

  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(currentPage) || 1),
    safeTotalPages
  );

  // Limiar pequeno: exibe todas sem reticências
  if (safeTotalPages <= 7) {
    return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
  }

  // Caso 1: Próximo do início (páginas 1 a 4)
  if (safeCurrentPage <= 4) {
    return [1, 2, 3, 4, 5, 'DOTS_RIGHT', safeTotalPages];
  }

  // Caso 2: Próximo do fim (últimas 4 páginas)
  if (safeCurrentPage >= safeTotalPages - 3) {
    return [
      1,
      'DOTS_LEFT',
      safeTotalPages - 4,
      safeTotalPages - 3,
      safeTotalPages - 2,
      safeTotalPages - 1,
      safeTotalPages
    ];
  }

  // Caso 3: Meio (entre 5 e totalPages - 4)
  return [
    1,
    'DOTS_LEFT',
    safeCurrentPage - 1,
    safeCurrentPage,
    safeCurrentPage + 1,
    'DOTS_RIGHT',
    safeTotalPages
  ];
}
```

### 17.2. Estrutura JSX do Componente [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx)

```jsx
import React from 'react';

function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const paginationItems = getPaginationPages(currentPage, totalPages, 1);

  return (
    <nav className="pagination-container" aria-label="Navegação da paginação">
      <div className="pagination-controls">
        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Ir para a primeira página"
        >
          « Primeira
        </button>

        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Ir para a página anterior"
        >
          &lt; Anterior
        </button>

        <div className="pagination-pages" role="list">
          {paginationItems.map((item) => {
            if (item === 'DOTS_LEFT') {
              return (
                <span
                  key="dots-left"
                  className="pagination-ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            if (item === 'DOTS_RIGHT') {
              return (
                <span
                  key="dots-right"
                  className="pagination-ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const page = item;
            const isCurrent = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                className={`btn-page-number ${isCurrent ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Ir para a próxima página"
        >
          Próxima &gt;
        </button>

        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Ir para a última página"
        >
          Última »
        </button>
      </div>

      <div className="pagination-info" aria-live="polite">
        Página {currentPage} de {totalPages}
      </div>
    </nav>
  );
}

export default Pagination;
```

### 17.3. Estilos CSS Previstos em [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css)

```css
/* ==========================================================================
   Pagination Component (Plano 00006)
   ========================================================================== */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-ellipsis {
  min-width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-weight: 700;
  letter-spacing: 0.1em;
  user-select: none;
}

.btn-pagination {
  padding: 0.6rem 1rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn-pagination:hover:not(:disabled) {
  background-color: var(--bg-card-hover);
  border-color: var(--text-secondary);
}

.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-page-number {
  min-width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn-page-number:hover:not(.active) {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

.btn-page-number.active {
  background-color: var(--accent-twitch);
  border-color: var(--accent-twitch);
  color: #ffffff;
}

/* Responsividade Mobile (<= 640px) */
@media (max-width: 640px) {
  .pagination-controls {
    gap: 0.35rem;
  }

  .pagination-pages {
    gap: 0.25rem;
  }

  .btn-pagination {
    padding: 0.45rem 0.65rem;
    font-size: 0.8rem;
  }

  .btn-page-number,
  .pagination-ellipsis {
    min-width: 32px;
    height: 32px;
    font-size: 0.85rem;
    padding: 0 0.25rem;
  }
}
```

---

## 18. Critérios de Aceitação

| ID | Critério | Validação Objetiva |
|---|---|---|
| **CA-01** | Compactação da Coleção de Páginas | Para $totalPages > 7$, o array `paginationItems` gerado possui exatamente 7 tokens (páginas numéricas e reticências). Os controles externos (Primeira, Anterior, Próxima, Última) não fazem parte dessa contagem. |
| **CA-02** | Botão Primeira Página | Clicar em "« Primeira" navega para a página 1 e desabilita o botão. |
| **CA-03** | Botão Página Anterior | Clicar em "< Anterior" retrocede 1 página; desabilitado quando na página 1. |
| **CA-04** | Botão Próxima Página | Clicar em "Próxima >" avança 1 página; desabilitado quando na última página. |
| **CA-05** | Botão Última Página | Clicar em "Última »" navega para a página $N$ (`totalPages`) e desabilita o botão. |
| **CA-06** | Clique Direto em Página | Clicar em qualquer botão numérico visível seleciona a página e rola suavemente a tela ao topo. |
| **CA-07** | Destaque Visual e A11y da Ativa | A página atual possui classe `.active` e `aria-current="page"`. |
| **CA-08** | Reticências Não-Interativas | As reticências `...` possuem `aria-hidden="true"`, não recebem foco via Tab e não disparam eventos ao clique. |
| **CA-09** | Ausência de Reticências em Poucas Páginas | Para $totalPages \le 7$, todas as páginas são exibidas sequencialmente sem reticências. |
| **CA-10** | Acesso às Extremidades | Primeira página (`1`) e última página (`totalPages`) permanecem sempre visíveis e acessíveis. |
| **CA-11** | Acessibilidade e Semântica | `<nav>` com `aria-label`, todos os botões com `aria-label`, estados `disabled` nativos e `aria-live="polite"` exclusivamente no `.pagination-info`. |
| **CA-12** | Responsividade Verificável | Em viewports de 320px a 640px, a barra de paginação não causa overflow horizontal e permite quebra em linhas mantendo todos os botões acessíveis. |
| **CA-13** | Não-Regressão do Plano 00004 | A ordenação de streamers (AO VIVO primeiro, seguido de A-Z) permanece 100% preservada. |
| **CA-14** | Não-Regressão do Plano 00005 | O ciclo de auto-refresh de 5 minutos, countdown e sync bar continuam operando normalmente. |
| **CA-15** | Integridade no Build | O comando `npm run build` termina com sucesso, sem erros de compilação. |

---

## 19. Matriz Completa de Testes

### 19.1. Testes do Algoritmo Determinístico (`getPaginationPages`)

| ID | Cenário | Parâmetros de Entrada | Saída Esperada |
|---|---|---|---|
| **T-01** | Total de 1 página | `currentPage = 1, totalPages = 1` | `[1]` (Componente renderiza `null`) |
| **T-02** | Total de 2 páginas | `currentPage = 1, totalPages = 2` | `[1, 2]` |
| **T-03** | Total de 3 páginas | `currentPage = 2, totalPages = 3` | `[1, 2, 3]` |
| **T-04** | Total de 5 páginas | `currentPage = 3, totalPages = 5` | `[1, 2, 3, 4, 5]` |
| **T-05** | Total de 7 páginas | `currentPage = 4, totalPages = 7` | `[1, 2, 3, 4, 5, 6, 7]` |
| **T-06** | Total 65 (Na pág 1) | `currentPage = 1, totalPages = 65` | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` |
| **T-07** | Total 65 (Na pág 2) | `currentPage = 2, totalPages = 65` | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` |
| **T-08** | Total 65 (Na pág 3) | `currentPage = 3, totalPages = 65` | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` |
| **T-09** | Total 65 (Na pág 4) | `currentPage = 4, totalPages = 65` | `[1, 2, 3, 4, 5, 'DOTS_RIGHT', 65]` |
| **T-10** | Total 65 (No meio - 32) | `currentPage = 32, totalPages = 65` | `[1, 'DOTS_LEFT', 31, 32, 33, 'DOTS_RIGHT', 65]` |
| **T-11** | Total 65 (Próx. Fim - 62) | `currentPage = 62, totalPages = 65` | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` |
| **T-12** | Total 65 (Penúltima - 64) | `currentPage = 64, totalPages = 65` | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` |
| **T-13** | Total 65 (Última - 65) | `currentPage = 65, totalPages = 65` | `[1, 'DOTS_LEFT', 61, 62, 63, 64, 65]` |

### 19.2. Testes de Controles e Limites de Navegação

| ID | Ação do Usuário | Estado Inicial | Estado Final Esperado |
|---|---|---|---|
| **T-14** | Clicar em "« Primeira" | `currentPage = 35` | `currentPage = 1`, Primeira e Anterior desabilitados |
| **T-15** | Clicar em "< Anterior" | `currentPage = 2` | `currentPage = 1`, Primeira e Anterior desabilitados |
| **T-16** | Clicar em "Próxima >" | `currentPage = 64` | `currentPage = 65`, Próxima e Última desabilitados |
| **T-17** | Clicar em "Última »" | `currentPage = 1` | `currentPage = 65`, Próxima e Última desabilitados |
| **T-18** | Clicar no número `33` | `currentPage = 32` | `currentPage = 33`, card da posição correspondente renderizado |

### 19.3. Testes de Sincronização com Atualização Automática (Plano 00005)

| ID | Cenário | Condição | Comportamento Esperado |
|---|---|---|---|
| **T-19** | Total de streamers aumenta | `currentPage = 10`, páginas vão de 65 para 70 | Página 10 mantida, `Última »` passa a levar para 70 |
| **T-20** | Total de streamers diminui | `currentPage = 65`, páginas caem de 65 para 40 | `App.jsx` reseta para página válida (`1`), paginação atualiza |
| **T-21** | Erro de conexão em background | `currentPage = 15`, falha de rede na atualização | Página atual mantida, lista preservada sem quebras |

### 19.4. Testes de Acessibilidade e Responsividade

| ID | Cenário | Validação |
|---|---|---|
| **T-22** | Navegação por Teclado (`Tab`/`Shift+Tab`) | Foco percorre Primeira -> Anterior -> Números visíveis -> Próxima -> Última, ignorando reticências. |
| **T-23** | Leitor de Tela (Screen Reader) | Botões anunciam labels descritivos, a página ativa possui `aria-current="page"` e `.pagination-info` possui `aria-live="polite"`. |
| **T-24** | Dispositivo Mobile (320px e 360px) | Barra quebra em linhas sem overflow horizontal e todos os botões permanecem acessíveis. |
| **T-25** | Tema Dark / Light | Botões, bordas e destaque roxo Twitch adaptam suas cores de acordo com `data-theme`. |

---

## 20. Riscos, Impactos e Cuidados Técnicos

1. **Risco de Chaves Duplicadas (`key`) no React:**
   * *Mitigação:* Usar `key="dots-left"` para `'DOTS_LEFT'`, `key="dots-right"` para `'DOTS_RIGHT'` e o próprio número para botões (`key={page}`).
2. **Risco de Salto Fora dos Limites:**
   * *Mitigação:* Botões possuem `disabled` nativo e `handlePageChange` possui guarda estrita `if (newPage >= 1 && newPage <= totalPages)`.
3. **Risco de Quebra de Estilo em Telas Pequenas:**
   * *Mitigação:* Utilizar `flex-wrap: wrap`, gap proporcional e media queries específicas para <= 640px.

---

## 21. Fases de Implementação

* **Fase 1:** Criação da função auxiliar `getPaginationPages` no [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx).
* **Fase 2:** Atualização do JSX do componente [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx) com os botões "« Primeira" e "Última »", suporte a reticências e atributos de acessibilidade.
* **Fase 3:** Atualização dos estilos CSS em [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css) para suportar os novos botões, reticências e responsividade mobile.
* **Fase 4:** Execução dos testes manuais em desktop e mobile, verificação de compatibilidade com ordenação (Plano 00004) e atualização em tempo real (Plano 00005).
* **Fase 5:** Validação de build (`npm run build`).

---

## 22. Itens Fora de Escopo

* Alteração da quantidade de itens por página (`ITEMS_PER_PAGE = 12`).
* Alteração da ordenação de streamers (Plano 00004).
* Alteração do fluxo de atualização automática ou manual (Plano 00005).
* Criação de paginação infinita / scroll infinito.
* Adição de campo de input manual para digitar o número da página ("Ir para página X").

---

## 23. Declaração de Não Alteração de Código

Em conformidade estrita com as regras desta etapa de planejamento:
* **Nenhum arquivo de código-fonte (`src/App.jsx`, `src/App.css`, `src/components/*.jsx`) foi alterado.**
* **Nenhuma dependência foi instalada.**
* **Nenhum commit ou push foi realizado.**
* **Os Planos 00004 e 00005 foram integralmente preservados.**
