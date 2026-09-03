# Plano de Implementação — EnPassant.live

**Plano:** 00008  
**Status:** Rascunho / Aguardando Revisão Técnica  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00007 & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00008 — Filtros Interativos por Status dos Streamers (Todos / Ao Vivo / Offline), Composição Síncrona com Busca por Username e Contadores Globais Independentes do Filtro**

---

## 2. Identificação, Data e Status

* **Identificador:** 00008
* **Data:** 2026-09-03
* **Status:** Rascunho / Aguardando Revisão Técnica

---

## 3. Referência ao Projeto e Preservação dos Contratos Anteriores

* **PRD Oficial:** `blueprint/docs/prd.md`
* **Planos Anteriores Concluídos (Contratos Imutáveis):**
  * `00001-implementacao-inicial-do-mvp.md` (MVP, Grid, Cards, Loading/Error/Empty States)
  * `00002-sistema-de-temas-dark-light.md` (Design Tokens, Dark/Light, LocalStorage, Meta Theme-Color)
  * `00003-indicadores-de-status-offline.md` (Contador Offline no Header, Identidade Vermelha)
  * `00004-ordenacao-streamers-status-e-nome.md` (Ordenação Automática por Status e Nome de Usuário) — **Imutável**
  * `00005-atualizacao-automatica-streamers.md` (Atualização Periódica a cada 5 Minutos, Sync Bar, Countdown) — **Imutável**
  * `00006-paginacao-inteligente-streamers.md` (Janela Dinâmica, Primeira/Última, Reticências, A11y) — **Imutável**
  * `00007-busca-streamers.md` (Busca por Username, Case-Insensitive, Substring, SearchBar) — **Imutável**

### 3.1. Regras de Não-Regressão e Imutabilidade

1. **Preservação do Plano 00004 (Ordenação Automática):**
   * A função `sortStreamers()` não será alterada nem bifurcada.
   * O pipeline de filtragem opera sobre o array já ordenado (`streamers`), garantindo que o filtro por status e a busca não alterem a ordem relativa dos streamers definida por `sortStreamers()`, preservando a ordenação estabelecida pelo Plano 00004.
2. **Preservação do Plano 00005 (Atualização Automática):**
   * O ciclo de refresh a cada 300 segundos, o contador regressivo `MM:SS`, a barra de sincronização, o lock de concorrência e o botão `"Atualizar agora"` permanecem 100% intactos.
   * Ao ocorrer uma atualização automática ou manual em segundo plano, os novos dados são recebidos, reordenados via `sortStreamers()` e alimentam imediatamente a composição de filtros ativos (`statusFilter` e `searchTerm`), enquanto os contadores globais dos badges são recalculados sobre o novo total de streamers. Nenhuma chamada adicional à API é realizada em razão dos filtros.
3. **Preservação do Plano 00006 (Paginação Inteligente):**
   * O arquivo [`src/components/Pagination.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Pagination.jsx) não será alterado.
   * O cálculo de `totalPages` permanece como responsabilidade exclusiva de [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx), sendo passado como prop para `Pagination`.
4. **Preservação do Plano 00007 (Busca de Streamers):**
   * O componente [`src/components/SearchBar.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/SearchBar.jsx) e a regra de normalização de busca (`trim().toLowerCase()`) permanecem 100% inalterados.
   * A busca por username opera em composição cumulativa sobre o resultado do filtro de status.

---

## 4. Objetivo

Especificar tecnicamente a transformação dos badges informativos de quantidade no cabeçalho ([`src/components/Header.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Header.jsx)) em **filtros interativos por status** (`Todos`, `Ao Vivo`, `Offline`), garantindo:

1. **Interatividade Acessível nos Badges:** Conversão semântica dos elementos visuais em botões `<button type="button">` com atributo `aria-pressed`, foco visível e suporte total a navegação por teclado.
2. **Contadores Globais Independentes do Filtro:** Os números exibidos nos badges continuam representando a contagem da **lista completa de streamers** em memória (`totalCount`, `liveCount`, `offlineCount`), sem sofrer redução ao selecionar um filtro específico.
3. **Composição Síncrona com a Busca (Plano 00007):** Aplicação cumulativa e aditiva do filtro de status e do termo de busca pesquisado no `SearchBar`.
4. **Integração com a Paginação Inteligente (Plano 00006):** Recálculo imediato de `totalPages` em `App.jsx` para o conjunto filtrado e reset de `currentPage = 1` ao alternar o status.
5. **Tratamento Semântico de Estados Sem Resultados:** Feedback visual contextual tanto para buscas sem correspondência quanto para filtros sem streamers no status selecionado.
6. **Zero Dependências e Zero Chamadas de Rede Extras:** Filtragem síncrona $O(N)$ em memória client-side sem alterar a arquitetura do projeto.

---

## 5. Contexto e Definição Determinística de Status

### 5.1. Regra Oficial de Status
A identificação do status de cada streamer segue estritamente a propriedade booleana `is_live`:
* **Ao Vivo (`live`):** `streamer.is_live === true`
* **Offline (`offline`):** `streamer.is_live !== true` (qualquer valor diferente de estritamente `true`, incluindo `false`, `null`, `undefined` ou propriedade ausente).

### 5.2. Contadores Globais Independentes do Filtro
As fórmulas dos contadores no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx) são calculadas sobre o array completo `streamers`:

```javascript
const totalCount = streamers.length;
const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
const offlineCount = totalCount - liveCount;
```

Estes valores são passados diretamente para o `Header` e não sofrem alteração quando o usuário seleciona um filtro. Uma atualização em segundo plano (Plano 00005) atualiza `streamers`, recalculando os contadores de forma natural.

---

## 6. Requisitos Funcionais (RF)

* **[RF-01] Estado Determinístico do Filtro de Status:**
  * O estado `statusFilter` reside no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx) com os valores possíveis:
    * `'all'` (Todos os streamers - estado padrão inicial)
    * `'live'` (Apenas streamers com `streamer.is_live === true`)
    * `'offline'` (Apenas streamers com `streamer.is_live !== true`)
* **[RF-02] Badges Interativos no Header:**
  * Os badges no [`src/components/Header.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Header.jsx) são implementados como `<button type="button">`.
  * O badge correspondente ao `statusFilter` ativo recebe a classe CSS `active` e o atributo `aria-pressed="true"`, enquanto os inativos possuem `aria-pressed="false"`.
* **[RF-03] Contadores Globais Independentes do Filtro:**
  * Os números exibidos nos badges representam os totais calculados sobre o array completo `streamers`:
    * Total: `totalCount = streamers.length`
    * Ao Vivo: `liveCount = streamers.filter(s => s.is_live === true).length`
    * Offline: `offlineCount = streamers.length - liveCount`
  * A seleção de um filtro não altera os números exibidos nos badges.
* **[RF-04] Composição Cumulativa com a Busca (Plano 00007):**
  * O filtro de status e a busca por username atuam de forma cumulativa:
    $$\text{streamer atende ao statusFilter} \quad \text{AND} \quad \text{streamer.username contém searchTerm}$$
* **[RF-05] Reset da Página Ativa:**
  * Ao selecionar um novo filtro de status (`handleStatusChange`), `currentPage` é explicitamente resetado para `1`.
  * O termo pesquisado no `searchTerm` permanece intacto.
* **[RF-06] Preservação do Status ao Alterar ou Limpar a Busca:**
  * Ao alterar o texto da busca ou clicar no botão de limpeza (`✕`), `statusFilter` permanece no valor atualmente selecionado e `currentPage` reseta para `1`.
* **[RF-07] Precedência e Estados Sem Resultados Contextuais:**
  * Se `filteredStreamers.length === 0`:
    * **Caso A (com busca ativa):** Exibe a mensagem de busca do Plano 00007 (`"Não encontramos nenhum streamer correspondente à busca \"{searchTerm}\"."`) com botão `"Limpar busca"` (`handleClearSearch`).
    * **Caso B (sem busca ativa, filtro de status sem resultados):** Exibe mensagem de status (`"Nenhum streamer ao vivo no momento."` ou `"Nenhum streamer offline no momento."`) com botão `"Ver todos os streamers"` (`() => handleStatusChange('all')`).
    * Em ambos os casos, `StreamerGrid` e `Pagination` não são renderizados.
* **[RF-08] Sincronização no Auto-Refresh (Plano 00005):**
  * O `statusFilter` e o `searchTerm` sobrevivem ao ciclo de atualização periódica de 5 minutos, sendo reaplicados instantaneamente sobre a nova lista recebida. Os contadores globais são atualizados com a nova lista.

---

## 7. Requisitos Não Funcionais (RNF)

* **[RNF-01] Complexidade e Performance ($O(N)$):**
  * A filtragem combinada possui complexidade $O(N)$, sendo adequada ao volume atual de dados carregados em memória. A operação é síncrona e client-side, sem necessidade de debounce ou chamadas adicionais à API.
* **[RNF-02] Sem Dependências Externas:**
  * Utilização exclusiva de recursos nativos de React (`useState`, props, variáveis derivadas).
* **[RNF-03] Acessibilidade (WCAG 2.1 AA):**
  * Badges como elementos semânticos `<button type="button">`.
  * Atributo `aria-pressed="true|false"` indicando o estado de seleção.
  * Rótulos descritivos via `aria-label` (ex: `"Filtrar por streamers ao vivo ({liveCount})"`).
  * Foco visível com anel destacado (`outline: 2px solid var(--accent-twitch)`).
  * Navegação nativa por teclado (`Tab`, `Enter`, `Space`).
* **[RNF-04] Responsividade (Mobile First):**
  * `.header-badges` utiliza `flex-wrap: wrap` e espaçamento proporcional, adaptando-se sem quebra indesejada ou overflow horizontal em viewports de 320px a 1440px+.
* **[RNF-05] Integração com Temas (Dark / Light):**
  * Utilizar exclusivamente as variáveis CSS do sistema de design tokens (`var(--bg-card)`, `var(--accent-live)`, `var(--accent-offline)`, `var(--accent-twitch)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-live-glow)`, `var(--accent-offline-glow)`, `var(--badge-offline-border)`).

---

## 8. Arquitetura e Fluxo dos Dados

A sequência de transformação de dados é estritamente unidirecional:

```
                     ┌────────────────────────────────────┐
                     │   API Chess.com (fetchStreamers)   │
                     │  (Carga inicial ou auto-refresh)   │
                     └─────────────────┬──────────────────┘
                                       │
                                       ▼
                     ┌────────────────────────────────────┐
                     │   sortStreamers() (Plano 00004)    │
                     │  (AO VIVO primeiro + A-Z username) │
                     └─────────────────┬──────────────────┘
                                       │
                                       ▼
                             streamers (Array)
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼                         ▼                         ▼
        liveCount                offlineCount                totalCount
  (Contadores Globais Independentes do Filtro exibidos no Header)
                                       │
                                       ▼
                     ┌────────────────────────────────────┐
                     │   statusFilter (Plano 00008)       │
                     │    ('all' | 'live' | 'offline')    │
                     └─────────────────┬──────────────────┘
                                       │
                                       ▼
                              statusFiltered (Array)
                                       │
                                       ▼
                     ┌────────────────────────────────────┐
                     │   searchTerm (Plano 00007)         │
                     │      (Username substring)          │
                     └─────────────────┬──────────────────┘
                                       │
                                       ▼
                        filteredStreamers (Derivado)
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
        filteredStreamers.length === 0        filteredStreamers.length > 0
                    │                                     │
                    ▼                                     ▼
            search-empty-state                  totalPages = Math.ceil(len / 12)
        (Mensagem contextual + Botão)                     │ (Calculado no App.jsx)
                                                          ▼
                                                currentStreamers (slice 12)
                                                          │
                                             ┌────────────┴────────────┐
                                             ▼                         ▼
                                       StreamerGrid               Pagination
                                      (12 streamers)           (Plano 00006)
```

---

## 9. Gerenciamento de Estado e Pipeline de Derivação

### 9.1. Estados no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx)

```javascript
const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'live' | 'offline'
const [searchTerm, setSearchTerm] = useState('');
```

### 9.2. Pipeline de Derivação Síncrona

```javascript
// 1. Contadores Globais Independentes do Filtro
const totalCount = streamers.length;
const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
const offlineCount = totalCount - liveCount;

// 2. Filtro por Status (Plano 00008)
const statusFiltered = statusFilter === 'all'
  ? streamers
  : streamers.filter((streamer) => {
      if (statusFilter === 'live') {
        return streamer.is_live === true;
      }
      if (statusFilter === 'offline') {
        return streamer.is_live !== true;
      }
      return true;
    });

// 3. Filtro por Username (Plano 00007)
const normalizedSearch = searchTerm.trim().toLowerCase();
const filteredStreamers = normalizedSearch === ''
  ? statusFiltered
  : statusFiltered.filter((streamer) =>
      String(streamer.username || '').toLowerCase().includes(normalizedSearch)
    );

// 4. Paginação (Plano 00006) - totalPages calculado no App.jsx
const totalPages = Math.ceil(filteredStreamers.length / ITEMS_PER_PAGE) || 1;
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const currentStreamers = filteredStreamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

### 9.3. Handlers de Interação com Reset de Página

```javascript
const handleStatusChange = (newStatus) => {
  if (newStatus === statusFilter) return;
  setStatusFilter(newStatus);
  setCurrentPage(1);
};

const handleSearchChange = (newTerm) => {
  setSearchTerm(newTerm);
  setCurrentPage(1);
};

const handleClearSearch = () => {
  setSearchTerm('');
  setCurrentPage(1);
};
```

---

## 10. Integração entre Header e App

### 10.1. Contrato de Props do [`src/components/Header.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Header.jsx)

```typescript
interface HeaderProps {
  liveCount: number;
  offlineCount: number;
  totalCount: number;
  currentStatus: 'all' | 'live' | 'offline';
  onStatusChange: (status: 'all' | 'live' | 'offline') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  lastUpdated: number | null;
  secondsLeft: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}
```

### 10.2. Estrutura JSX dos Badges/Botões no Header

```jsx
<div className="header-badges" role="group" aria-label="Filtrar streamers por status">
  <button
    type="button"
    className={`badge badge-filter badge-total-count ${currentStatus === 'all' ? 'active' : ''}`}
    onClick={() => onStatusChange('all')}
    aria-pressed={currentStatus === 'all'}
    aria-label={`Filtrar por todos os streamers (${totalCount})`}
  >
    <span>TODOS {totalCount}</span>
  </button>

  <button
    type="button"
    className={`badge badge-filter badge-live-count ${currentStatus === 'live' ? 'active' : ''}`}
    onClick={() => onStatusChange('live')}
    aria-pressed={currentStatus === 'live'}
    aria-label={`Filtrar por streamers ao vivo (${liveCount})`}
  >
    <span className="pulse-dot" aria-hidden="true"></span>
    <span>{liveCount} AO VIVO</span>
  </button>

  <button
    type="button"
    className={`badge badge-filter badge-offline-count ${currentStatus === 'offline' ? 'active' : ''}`}
    onClick={() => onStatusChange('offline')}
    aria-pressed={currentStatus === 'offline'}
    aria-label={`Filtrar por streamers offline (${offlineCount})`}
  >
    <span className="dot dot-offline" aria-hidden="true"></span>
    <span>{offlineCount} OFFLINE</span>
  </button>
</div>
```

---

## 11. Estados de UI e Precedência de Renderização

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TABELA DE PRECEDÊNCIA DE ESTADOS                     │
├─────────────────────────────────────┬───────────────────────────────────┤
│ Condição                            │ Renderização                      │
├─────────────────────────────────────┼───────────────────────────────────┤
│ loading === true                    │ LoadingState                      │
│ !loading && error                   │ ErrorState (com Retry)            │
│ !loading && !error && streamers === 0│ EmptyState (Lista API vazia)     │
│ !loading && !error && streamers > 0 │ SearchBar (Sempre visível) +      │
│   ├── filteredStreamers === 0       │   search-empty-state contextual   │
│   └── filteredStreamers > 0         │   StreamerGrid + Pagination       │
└─────────────────────────────────────┴───────────────────────────────────┘
```

### Mensagem e Ação do `search-empty-state`:
1. **Se `searchTerm.trim() !== ''`:**
   * Título: `"Nenhum streamer encontrado"`
   * Mensagem: `"Não encontramos nenhum streamer correspondente à busca \"{searchTerm}\" com o filtro atual."`
   * Botão: `"Limpar busca"` (`handleClearSearch`).
2. **Se `searchTerm.trim() === ''` e `statusFilter !== 'all'`:**
   * Título: `"Nenhum streamer encontrado"`
   * Mensagem: `statusFilter === 'live' ? 'Nenhum streamer ao vivo no momento.' : 'Nenhum streamer offline no momento.'`
   * Botão: `"Ver todos os streamers"` (`() => handleStatusChange('all')`).

---

## 12. Estilos CSS e Design System

### 12.1. Estilos dos Badges/Filtros em [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css)

```css
/* ==========================================================================
   Header Filter Badges (Plano 00008)
   ========================================================================== */
.badge-filter {
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
  font-family: inherit;
  outline: none;
}

.badge-filter:hover {
  transform: translateY(-1px);
  border-color: var(--text-secondary);
}

.badge-filter:focus-visible {
  outline: 2px solid var(--accent-twitch);
  outline-offset: 2px;
}

/* Estado Ativo / Selecionado */
.badge-total-count.active {
  background-color: var(--text-primary);
  color: var(--bg-primary);
  border-color: var(--text-primary);
}

.badge-live-count.active {
  background-color: var(--accent-live);
  color: var(--bg-card);
  border-color: var(--accent-live);
}

.badge-live-count.active .pulse-dot {
  background-color: var(--bg-card);
  box-shadow: 0 0 6px var(--bg-card);
}

.badge-offline-count.active {
  background-color: var(--accent-offline);
  color: var(--bg-card);
  border-color: var(--accent-offline);
}

.badge-offline-count.active .dot-offline {
  background-color: var(--bg-card);
}
```

---

## 13. Arquivos Envolvidos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MATRIZ DE ARQUIVOS                             │
├─────────────────────────────────────┬───────────────────────────────────┤
│ Arquivo                             │ Ação / Responsabilidade           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/components/Header.jsx           │ MODIFICAR                         │
│                                     │ • Transformar badges em buttons   │
│                                     │ • Receber currentStatus / onChange│
│                                     │ • Atributos aria-pressed / a11y   │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.jsx                         │ MODIFICAR                         │
│                                     │ • Estado statusFilter             │
│                                     │ • Pipeline de filtro composto     │
│                                     │ • Passagem de props ao Header     │
│                                     │ • Reset de página ao mudar status │
│                                     │ • Tratamento de empty state       │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.css                         │ MODIFICAR                         │
│                                     │ • Estilos de .badge-filter        │
│                                     │ • Estados .active para cada badge │
│                                     │ • Hover, foco e temas             │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/components/Pagination.jsx       │ NÃO MODIFICAR (Imutável)          │
│ src/components/SearchBar.jsx        │ NÃO MODIFICAR (Imutável)          │
│ src/components/StreamerCard.jsx     │ NÃO MODIFICAR                     │
│ src/components/StreamerGrid.jsx     │ NÃO MODIFICAR                     │
│ src/components/LoadingState.jsx     │ NÃO MODIFICAR                     │
│ src/components/ErrorState.jsx       │ NÃO MODIFICAR                     │
│ src/components/EmptyState.jsx       │ NÃO MODIFICAR                     │
│ blueprint/plans/00004-...           │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00005-...           │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00006-...           │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00007-...           │ NÃO MODIFICAR (Imutável)          │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 14. Critérios de Aceitação

| ID | Critério | Validação Objetiva |
|---|---|---|
| **CA-01** | Badges Interativos | Os três badges (Todos, Ao Vivo, Offline) são elementos `<button type="button">` clicáveis e focáveis por teclado. |
| **CA-02** | Filtro "Todos" | Ao selecionar "Todos", exibe todos os streamers da lista (respeitando eventual busca ativa). |
| **CA-03** | Filtro "Ao Vivo" | Ao selecionar "Ao Vivo", exibe exclusivamente streamers com `streamer.is_live === true`. |
| **CA-04** | Filtro "Offline" | Ao selecionar "Offline", exibe exclusivamente streamers com `streamer.is_live !== true`. |
| **CA-05** | Contadores Globais Independentes | Os números exibidos nos badges (`totalCount`, `liveCount`, `offlineCount`) permanecem inalterados ao selecionar qualquer filtro. |
| **CA-06** | Reset de Página ao Mudar Filtro | Ao selecionar um filtro de status diferente do filtro atualmente ativo, `currentPage` é resetado para `1`. Selecionar novamente o filtro já ativo não altera o estado atual. |
| **CA-07** | Composição com a Busca | A busca por username opera cumulativamente sobre a lista filtrada pelo status ativo (`statusFilter` E `searchTerm`). |
| **CA-08** | Preservação do Status ao Alterar Busca | Digitar ou alterar o termo no `SearchBar` mantém o `statusFilter` selecionado e reseta `currentPage` para `1`. |
| **CA-09** | Preservação do Status ao Limpar Busca | Clicar no botão `✕` do `SearchBar` limpa o texto mas preserva o `statusFilter` ativo e reseta `currentPage` para `1`. |
| **CA-10** | Preservação da Ordenação | A ordem dos streamers resultante do `sortStreamers()` do Plano 00004 é preservada após a aplicação dos filtros de status e busca. |
| **CA-11** | Paginação com 12 Itens | Quando `filteredStreamers.length === 12`, `totalPages = 1` e `Pagination` retorna `null`. |
| **CA-12** | Paginação com 13 Itens | Quando `filteredStreamers.length === 13`, `totalPages = 2` e `Pagination` é renderizada com 2 páginas. |
| **CA-13** | Compatibilidade com Auto-Refresh | Ao ocorrer o refresh de 5 minutos do Plano 00005, o `statusFilter` e o `searchTerm` permanecem ativos sobre a nova lista recebida. |
| **CA-14** | Recálculo dos Contadores Globais no Refresh | Ao atualizar os dados no auto-refresh, os badges exibem os novos totais globais da lista completa. |
| **CA-15** | Destaque Visual e Acessibilidade | O badge ativo possui classe `.active`, `aria-pressed="true"` e feedback visual contrastante. |
| **CA-16** | Navegação por Teclado | Tab percorre os três badges com foco visível, e Enter/Space aciona o filtro. |
| **CA-17** | Compatibilidade de Temas | Os badges ativos e inativos utilizam os tokens CSS definidos pelo Design System e permanecem visualmente distinguíveis nos temas Dark e Light, sem alteração do comportamento funcional. |
| **CA-18** | Responsividade Mobile | Em viewports de 320px a 1440px+, os badges adaptam seu layout sem gerar overflow horizontal. |
| **CA-19** | Estado Sem Resultados Contextual | Se a combinação de status e busca resultar em 0 streamers, exibe o estado vazio com ação contextual adequada. |
| **CA-20** | Zero Chamadas de Rede Extras | A filtragem ocorre exclusivamente client-side em memória. |
| **CA-21** | Zero Dependências Adicionadas | Nenhuma biblioteca externa é necessária. |
| **CA-22** | Build Sem Erros | O comando `npm run build` executa com sucesso sem erros de compilação durante a implementação. |

---

## 15. Matriz Completa de Testes

| ID | Cenário / Entrada | Condição / Dados | Saída Esperada | Validação |
|---|---|---|---|---|
| **T-01** | Filtro padrão "Todos" | `statusFilter = 'all'` | Todos os streamers de `streamers` exibidos | Filtro Todos |
| **T-02** | Filtro "Ao Vivo" (`is_live: true`) | `statusFilter = 'live'` | Apenas streamers com `is_live === true` | Filtro Live |
| **T-03** | Filtro "Offline" (`is_live: false`) | `statusFilter = 'offline'` | Apenas streamers com `is_live !== true` | Filtro Offline |
| **T-04** | Offline com `is_live: null` | Item com `is_live: null` | Exibido no filtro Offline, oculto no filtro Live | Tratamento defensivo |
| **T-05** | Offline com `is_live: undefined` | Item com `is_live: undefined` | Exibido no filtro Offline, oculto no filtro Live | Tratamento defensivo |
| **T-06** | Contadores Globais com Filtro Live | `statusFilter = 'live'` | Badges exibem contadores de `streamers.length`, `liveCount` e `offlineCount` | Independência de contadores |
| **T-07** | Ao Vivo + Busca por Username | `status = 'live'`, `search = 'hikaru'` | Streamers com `is_live === true` E username contendo `"hikaru"` | Composição cumulativa |
| **T-08** | Offline + Busca por Username | `status = 'offline'`, `search = 'hikaru'` | Streamers com `is_live !== true` E username contendo `"hikaru"` | Composição cumulativa |
| **T-09** | Alterar busca mantendo status | `status = 'live'`, altera busca | `status` permanece `'live'`, busca atualizada, `currentPage = 1` | Preservação de status |
| **T-10** | Alterar status mantendo busca | `search = 'chess'`, altera status | `search` permanece `"chess"`, status atualizado, `currentPage = 1` | Preservação de busca |
| **T-11** | Limpar busca mantendo status | `status = 'live'`, clica em limpar | `search = ''`, status permanece `'live'`, `currentPage = 1` | Limpeza de busca |
| **T-12** | Filtro com exatamente 12 itens | Resultado filtrado com 12 streamers | `totalPages = 1`, `Pagination` retorna `null` | Limite $\le 12$ |
| **T-13** | Filtro com exatamente 13 itens | Resultado filtrado com 13 streamers | `totalPages = 2`, `Pagination` renderizada com 2 páginas | Limite $> 12$ |
| **T-14** | Mudança de filtro em página alta | `currentPage = 10`, clica em `"Ao Vivo"` | `currentPage = 1`, lista exibida a partir do início | Reset de página |
| **T-15** | Preservação da ordenação no filtro | Filtro aplicado sobre lista previamente ordenada | Os streamers restantes mantêm a mesma ordem relativa definida pelo `sortStreamers()` | Preservação da ordenação do Plano 00004 |
| **T-16** | Preservação da ordenação com busca + status | Filtro de status e busca aplicados sobre lista previamente ordenada | Os streamers restantes mantêm a mesma ordem relativa definida pelo `sortStreamers()` | Preservação da ordenação do Plano 00004 |
| **T-17** | Auto-refresh mantendo status + busca | `status = 'live'`, `search = 'botez'`, refresh ocorre | Filtros permanecem ativos sobre a nova lista recebida | Plano 00005 |
| **T-18** | Atualização dos contadores no refresh | Refresh altera dados de streamers | Badges exibem novos números globais de `totalCount`, `liveCount`, `offlineCount` | Sincronia global |
| **T-19** | Filtro de status sem resultados | `status = 'live'`, 0 lives na lista | Exibe mensagem contextual de status e botão `"Ver todos"` | Estado vazio de status |
| **T-20** | Busca sem resultados com filtro ativo | `status = 'live'`, busca inexistente | Exibe mensagem de busca e botão `"Limpar busca"` | Estado vazio de busca |
| **T-21** | Selecionar "Todos" restaura lista | Clicar em "TODOS" | `statusFilter = 'all'`, exibe todos (respeitando busca ativa) | Restauração completa |
| **T-22** | Sem chamadas extras de rede | Alternar entre Todos, Ao Vivo e Offline | 0 requisições HTTP adicionais disparadas | Client-side puro |
| **T-23** | Navegação por Teclado | Tab nos badges -> Enter/Space seleciona | Foco visível com anel Twitch e `aria-pressed` atualizado | Acessibilidade |
| **T-24** | Dark Theme | Alternar para Dark no Header | Badges ativos e inativos com contraste e cores corretas | Tema Escuro |
| **T-25** | Light Theme | Alternar para Light no Header | Badges ativos e inativos com contraste e cores corretas | Tema Claro |
| **T-26** | Viewports 320px e 360px | Telas compactas mobile | Badges adaptam layout sem gerar overflow horizontal | Responsividade |
| **T-27** | Offline com propriedade `is_live` ausente | Item sem a propriedade `is_live` | Exibido no filtro Offline e oculto no filtro Ao Vivo | Regra `is_live !== true` |

---

## 16. Fases de Implementação

* **Fase 1:** Atualização de [`src/components/Header.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Header.jsx) para transformar badges em botões interativos acessíveis com `aria-pressed` e `aria-label`.
* **Fase 2:** Integração do estado `statusFilter`, pipeline de composição síncrona (`statusFiltered` -> `filteredStreamers`) e handlers no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx).
* **Fase 3:** Implementação dos estilos CSS em [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css) para `.badge-filter`, estados `.active`, hover, foco e temas Dark/Light.
* **Fase 4:** Execução dos testes manuais cobrindo a matriz (T-01 a T-27) e validação de compatibilidade com Planos 00004 a 00007.
* **Fase 5:** Validação de build com `npm run build`.

---

## 17. Itens Fora de Escopo

* Novos filtros além de Todos / Ao Vivo / Offline.
* Filtros por país, título enxadrístico ou categoria.
* Filtros server-side ou parâmetros na API do Chess.com.
* Persistência do filtro no LocalStorage.
* Alteração da ordenação do Plano 00004.
* Alteração do auto-refresh do Plano 00005.
* Alteração da paginação inteligente do Plano 00006.
* Alteração do `SearchBar` do Plano 00007.

---

## 18. Declaração de Não Alteração de Código na Fase de Planejamento

Em conformidade estrita com as diretrizes do projeto:
* **Nenhum arquivo de código-fonte foi alterado durante a elaboração deste plano.**
* **Nenhuma dependência externa foi adicionada.**
* **Nenhum commit ou push foi realizado.**
* **Os Planos 00004, 00005, 00006 e 00007 foram integralmente preservados como contratos imutáveis.**
