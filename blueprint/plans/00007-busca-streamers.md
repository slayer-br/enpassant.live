# Plano de Implementação — EnPassant.live

**Plano:** 00007  
**Status:** Rascunho / Aguardando Revisão Técnica  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00006 & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00007 — Busca de Streamers por Username (Client-Side), Filtro Dinâmico, Integração com Paginação Inteligente e Limpeza de Busca**

---

## 2. Identificação, Data e Status

* **Identificador:** 00007
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

### 3.1. Regras de Não-Regressão e Imutabilidade

1. **Preservação do Plano 00004 (Ordenação Automática):**
   * A função `sortStreamers()` não será alterada nem bifurcada.
   * O filtro de busca é aplicado **sobre a lista previamente ordenada** (`streamers`), preservando integralmente a precedência de streamers `AO VIVO` e a ordenação alfabética A-Z para os resultados que corresponderem à pesquisa.
2. **Preservação do Plano 00005 (Atualização Automática):**
   * O ciclo de refresh a cada 300 segundos, o contador regressivo `MM:SS`, a barra de sincronização, o lock de concorrência e o botão `"Atualizar agora"` permanecem 100% intactos.
   * Não serão adicionadas novas requisições, novos intervalos, timers concorrentes nem alterações no Sync Bar.
   * Quando uma atualização automática ou manual ocorre em segundo plano, os novos dados recebidos da API são reordenados via `sortStreamers()` e alimentam imediatamente a busca ativa sem requisições adicionais.
3. **Preservação do Plano 00006 (Paginação Inteligente):**
   * A função pura `getPaginationPages()`, a janela dinâmica de no máximo 7 tokens, as reticências e os botões de navegação (`« Primeira`, `< Anterior`, `Próxima >`, `Última »`) permanecem inalterados.
   * A paginação opera exclusivamente sobre o array de itens filtrados (`filteredStreamers`), calculando `totalPages` dinamicamente para os resultados correspondentes.

---

## 4. Objetivo

Especificar tecnicamente a implementação de um **campo de busca client-side** para localização rápida de streamers pelo seu **username** (`streamer.username`) no **EnPassant.live**, garantindo:

1. **Filtragem em tempo real em memória:** Busca instantânea sobre os dados já carregados no estado, sem chamadas extras de rede à API do Chess.com.
2. **Correspondência flexível e defensiva:** Busca parcial (*substring*), insensível a maiúsculas/minúsculas (*case-insensitive*) e normalizada com remoção de espaços nas extremidades (`trim()`).
3. **Integração transparente com a paginação:** Recálculo automático de `totalPages` e reinício seguro de `currentPage = 1` ao digitar ou limpar a busca.
4. **Sobrevivência a atualizações de dados:** Manutenção do termo pesquisado após ciclos de auto-refresh do Plano 00005.
5. **Experiência de busca vazia e sem resultados:** Feedback visual claro quando nenhum streamer corresponder ao termo pesquisado, com opção de limpeza rápida.
6. **Acessibilidade e responsividade completas:** Elementos semânticos, rótulos acessíveis via `<label>` associado, suporte nativo a teclado e adaptação para temas claro/escuro e dispositivos móveis.

---

## 5. Contexto e Problema Atual

Atualmente, o **EnPassant.live** carrega centenas de streamers (geralmente entre 750 e 800 criadores). Embora a ordenação do Plano 00004 organize os canais (AO VIVO primeiro, seguido de A-Z) e a paginação do Plano 00006 facilite a navegação, encontrar um streamer específico cujo username começa com letras intermediárias ou finais exige folhear dezenas de páginas.

A inclusão de uma busca client-side por username resolve esse atrito, permitindo localização imediata sem onerar a rede ou a infraestrutura do Chess.com.

---

## 6. Requisitos Funcionais (RF)

* **[RF-01] Campo de Busca Determinístico (`type="search"`):**
  * Renderizar um campo de busca `<input type="search" />` com placeholder descritivo (`"Buscar streamer por username..."`).
  * Conter ícone visual SVG de lupa e botão para limpar a busca quando houver texto digitado.
* **[RF-02] Busca Client-Side em Memória:**
  * A filtragem deve ocorrer exclusivamente em memória sobre o array `streamers` já ordenado por `sortStreamers()`.
  * Nenhuma requisição HTTP ou chamada à API deve ser disparada durante a digitação.
* **[RF-03] Comparação Parcial e Case-Insensitive por `username`:**
  * A comparação deve ser do tipo *substring* (`String.prototype.includes`).
  * O filtro atua exclusivamente sobre a propriedade `streamer.username`.
  * Ambas as pontas (termo pesquisado e `streamer.username`) devem ser normalizadas para minúsculas (`toLowerCase()`).
  * O termo pesquisado deve sofrer `trim()` para ignorar espaços acidentais no início ou no fim.
* **[RF-04] Restauração em Busca Vazia:**
  * Quando o campo estiver vazio (`""`) ou contiver apenas espaços em branco, a aplicação deve exibir a listagem completa de streamers em sua ordenação padrão do Plano 00004.
* **[RF-05] Estado Sem Resultados (No Matches):**
  * Quando o termo pesquisado não encontrar correspondência em nenhum streamer (`filteredStreamers.length === 0`), a interface deve exibir uma mensagem clara contendo o termo pesquisado e um botão `"Limpar busca"`.
  * Nesse estado, a paginação e o grid de streamers não devem ser renderizados.
* **[RF-06] Integração e Recálculo da Paginação:**
  * O total de páginas deve ser derivado exclusivamente dos resultados filtrados:
    $$\text{totalPages} = \lceil \text{filteredStreamers.length} / \text{ITEMS\_PER\_PAGE} \rceil \quad (\text{mínimo } 1)$$
  * Quando `filteredStreamers.length <= 12`, `totalPages = 1` e o componente `Pagination` retornará `null` (conforme regra do Plano 00006).
  * Quando `filteredStreamers.length > 12`, `Pagination` exibirá a navegação dinâmica correspondente à quantidade filtrada.
* **[RF-07] Reset Explícito de Página ao Alterar o Termo:**
  * Ao digitar, alterar ou limpar o termo de busca, as funções de manipulação (`handleSearchChange` e `handleClearSearch`) devem resetar a página ativa explicitamente para `currentPage = 1`.
* **[RF-08] Botão de Limpeza Rápida com Ícone SVG:**
  * Exibir um botão `<button type="button" aria-label="Limpar busca">` contendo ícone SVG de fechamento/limpeza com `aria-hidden="true"`, visível apenas quando `searchTerm.length > 0`.
  * Ao clicar no botão, o termo de busca é resetado para `""` e a página ativa volta para `1`.
* **[RF-09] Persistência do Filtro durante Auto-Refresh:**
  * Caso ocorra uma atualização periódica em segundo plano (Plano 00005) enquanto o usuário tiver um termo pesquisado, a nova lista de streamers é atualizada e o filtro ativo é reaplicado automaticamente sobre os novos dados.
* **[RF-10] Contador Informativo de Resultados:**
  * Exibir contador textual de resultados somente enquanto houver termo de busca ativo:
    * Singular: `"1 streamer encontrado"` (quando `filteredStreamers.length === 1`).
    * Plural: `"N streamers encontrados"` (quando `filteredStreamers.length > 1`).
    * Quando `filteredStreamers.length === 0`, o estado visual de busca sem resultados tem precedência.

---

## 7. Requisitos Não Funcionais (RNF)

* **[RNF-01] Complexidade e Performance ($O(N)$):**
  * A filtragem será realizada em memória utilizando `Array.prototype.filter()`, com complexidade $O(N)$, adequada ao volume atual esperado de streamers (~800 itens). Não será utilizado debounce nem mecanismo de busca complexo, pois a busca é síncrona e o volume atual de dados é pequeno.
* **[RNF-02] Sem Dependências Externas:**
  * Implementação em Vanilla JavaScript / React nativo (`useState`, variáveis derivadas síncronas), sem bibliotecas externas.
* **[RNF-03] Acessibilidade (WCAG 2.1 AA):**
  * Associação semântica de `<label htmlFor="streamer-search-input" className="sr-only">Buscar streamer por username</label>` com o input `<input id="streamer-search-input" type="search" />`, sem uso de `aria-label` redundante no campo.
  * Botão de limpar com `aria-label="Limpar busca"` e ícone SVG decorativo com `aria-hidden="true"`.
  * Sem uso indiscriminado de `aria-live`.
* **[RNF-04] Responsividade (Mobile First):**
  * O campo de busca deve se ajustar com fluidez de `320px` a `1440px+`.
  * Em telas mobile (<= 640px), o campo ocupa 100% da largura útil sem overflow horizontal.
* **[RNF-05] Integração com Temas (Dark / Light):**
  * Utilizar exclusivamente os tokens de design existentes (`var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-twitch)`, `var(--radius-md)`).

---

## 8. Arquitetura e Fluxo dos Dados

A sequência de transformação de dados é estritamente unidirecional e determinística:

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
          ┌────────────────────────────┴────────────────────────────┐
          │                                                         │
          │                                                         ▼
          │                                              searchTerm (Estado React)
          │                                                         │
          └────────────────────────────┬────────────────────────────┘
                                       │
                                       ▼
                        filteredStreamers (Derivado)
             streamers.filter(s => s.username.includes(search))
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
        filteredStreamers.length === 0        filteredStreamers.length > 0
                    │                                     │
                    ▼                                     ▼
          search-empty-state                    totalPages = Math.ceil(len / 12)
        (Mensagem + Botão Limpar)                         │
                                                          ▼
                                                currentStreamers (slice 12)
                                                          │
                                             ┌────────────┴────────────┐
                                             ▼                         ▼
                                       StreamerGrid               Pagination
                                      (12 streamers)           (Plano 00006)
```

> [!IMPORTANT]
> A busca opera sobre **todos os streamers carregados em memória** antes do fatiamento da paginação. Nunca aplicar a busca após o `slice()`.

---

## 9. Estratégia de Estado e Tratamento de `currentPage`

### 9.1. Definição do Estado Atômico

No componente [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx), adiciona-se apenas um único estado:

```javascript
const [searchTerm, setSearchTerm] = useState('');
```

### 9.2. Variável Derivada Pura e Defensiva

A lista filtrada é calculada de forma síncrona a cada ciclo de renderização:

```javascript
const normalizedSearch = searchTerm.trim().toLowerCase();

const filteredStreamers = normalizedSearch === ''
  ? streamers
  : streamers.filter((streamer) => {
      const username = String(streamer.username || '').toLowerCase();
      return username.includes(normalizedSearch);
    });
```

### 9.3. Cálculos de Paginação Derivados de `filteredStreamers`

A derivação de paginação passa a consumir `filteredStreamers`:

```javascript
const totalPages = Math.ceil(filteredStreamers.length / ITEMS_PER_PAGE) || 1;
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const currentStreamers = filteredStreamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

* **Comportamento quando `filteredStreamers.length === 0`:** O valor de `totalPages` é normalizado para `1` para manter a integridade matemática dos tipos numéricos. No entanto, o estado vazio de busca (`search-empty-state`) tem precedência na árvore de renderização, garantindo que nem `StreamerGrid` nem `Pagination` sejam exibidos.

### 9.4. Controle e Não-Duplicação do Efeito de `currentPage`

1. **Reset Explícito no Evento:** A mudança de busca dispara `setCurrentPage(1)` de forma síncrona no handler do evento:
   ```javascript
   const handleSearchChange = (newTerm) => {
     setSearchTerm(newTerm);
     setCurrentPage(1);
   };

   const handleClearSearch = () => {
     setSearchTerm('');
     setCurrentPage(1);
   };
   ```
2. **Preservação do Efeito Existente:** O efeito de salvaguarda existente em [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx#L229-L233) é estritamente preservado e não deve ser duplicado:
   ```javascript
   useEffect(() => {
     if (currentPage > totalPages) {
       setCurrentPage(1);
     }
   }, [totalPages, currentPage]);
   ```
   Ele atua exclusivamente como camada de proteção para atualizações em segundo plano (Plano 00005) quando a quantidade de páginas mudar dinamicamente.

---

## 10. Componentização: `SearchBar.jsx`

### 10.1. Contrato de Props do Componente

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  totalMatches: number;
}
```

* O componente não possui estado interno de carregamento (`isSearching`) pois a busca é síncrona em memória.
* Contém botão com ícone SVG de fechamento para limpar o campo quando `value.length > 0`.
* Apresenta contador descritivo de resultados quando `value.trim().length > 0`.

---

## 11. Tratamento de Estados Visuais na Interface

### 11.1. Cenário A — Lista Vazia da API (`streamers.length === 0`)
* Exibe o componente [`EmptyState.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/EmptyState.jsx) original:
  *"No momento não há nenhum streamer de xadrez disponível na lista."*
* O `SearchBar` não é exibido.

### 11.2. Cenário B — Busca com Resultados (`filteredStreamers.length > 0`)
* Exibe `SearchBar`, `StreamerGrid` (com `currentStreamers`) e `Pagination` (quando `totalPages > 1`).

### 11.3. Cenário C — Busca Sem Resultados (`streamers.length > 0 && filteredStreamers.length === 0`)
* Exibe `SearchBar` com o texto digitado.
* Exibe um bloco determinístico de busca sem resultados (`search-empty-state`):
  * Ícone SVG de busca decorativo com `aria-hidden="true"`.
  * Título: `"Nenhum streamer encontrado"`
  * Mensagem: `"Não encontramos nenhum streamer correspondente a \"{searchTerm}\"."`
  * Botão de ação: `"Limpar busca"` (que executa `handleClearSearch()`).
* A paginação (`Pagination`) e o grid (`StreamerGrid`) não são renderizados.

---

## 12. Acessibilidade (a11y) e Navegação por Teclado

1. **Rótulo Semântico Único:** `<label htmlFor="streamer-search-input" className="sr-only">Buscar streamer por username</label>` associado ao `<input id="streamer-search-input" type="search" />`.
2. **Botão de Limpeza Acessível:** Elemento `<button type="button" className="btn-search-clear" onClick={onClear} aria-label="Limpar busca">` com ícone SVG decorativo (`aria-hidden="true"`).
3. **Foco e Teclado:** O input possui anel de foco destacado (`outline: 2px solid var(--accent-twitch)`), e o botão de limpeza é focável e acionável via `Tab`, `Enter` e `Space`.
4. **Semântica Não-Intrusiva:** Sem uso de `aria-live` no campo ou no contador para evitar interrupções de voz enquanto o usuário digita.

---

## 13. Responsividade e Adaptação a Telas

* **Viewports Desktop (> 768px):** O `SearchBar` possui `max-width: 420px` alinhado à esquerda na barra de ferramentas.
* **Viewports Mobile (320px a 640px):** O `SearchBar` expande para `width: 100%`, com área de toque mínima confortável (`42px` de altura) e sem overflow horizontal em 320px e 360px.

---

## 14. Integração com Temas (Dark / Light)

O campo de busca utiliza exclusivamente as variáveis CSS do sistema de temas do Plano 00002:
* Fundo: `var(--bg-card)`
* Borda: `var(--border-color)`
* Foco / Hover: `var(--accent-twitch)` / `var(--text-secondary)`
* Texto: `var(--text-primary)`
* Placeholder: `var(--text-secondary)`
* Ícones: `var(--text-secondary)`

---

## 15. Arquivos Envolvidos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MATRIZ DE ARQUIVOS                             │
├─────────────────────────────────────┬───────────────────────────────────┤
│ Arquivo                             │ Ação / Responsabilidade           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/components/SearchBar.jsx        │ CRIAR                             │
│                                     │ • Input type="search"             │
│                                     │ • Label associado por htmlFor     │
│                                     │ • Botão de limpeza SVG            │
│                                     │ • Contador de resultados          │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.jsx                         │ MODIFICAR                         │
│                                     │ • Estado searchTerm               │
│                                     │ • Cálculo derivado filteredStreamers│
│                                     │ • Paginação derivada de filtro    │
│                                     │ • Renderização condicional busca  │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/App.css                         │ MODIFICAR                         │
│                                     │ • Estilos da SearchBar            │
│                                     │ • Estilos de SearchEmptyState     │
│                                     │ • Responsividade mobile           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ src/components/Pagination.jsx       │ NÃO MODIFICAR (Imutável)          │
│ src/components/Header.jsx           │ NÃO MODIFICAR                     │
│ src/components/StreamerCard.jsx     │ NÃO MODIFICAR                     │
│ src/components/StreamerGrid.jsx     │ NÃO MODIFICAR                     │
│ src/components/LoadingState.jsx     │ NÃO MODIFICAR                     │
│ src/components/ErrorState.jsx       │ NÃO MODIFICAR                     │
│ src/components/EmptyState.jsx       │ NÃO MODIFICAR                     │
│ blueprint/plans/00004-...           │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00005-...           │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00006-...           │ NÃO MODIFICAR (Imutável)          │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 16. Estratégia de Implementação e Código de Referência

### 16.1. Novo Componente [`src/components/SearchBar.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/SearchBar.jsx)

```jsx
function SearchBar({ value, onChange, onClear, totalMatches }) {
  const hasValue = value.length > 0;
  const isSearching = value.trim().length > 0;

  return (
    <div className="search-toolbar">
      <div className="search-input-wrapper">
        <label htmlFor="streamer-search-input" className="sr-only">
          Buscar streamer por username
        </label>
        <span className="search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          id="streamer-search-input"
          type="search"
          className="search-input"
          placeholder="Buscar streamer por username..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {hasValue && (
          <button
            type="button"
            className="btn-search-clear"
            onClick={onClear}
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isSearching && totalMatches > 0 && (
        <div className="search-feedback">
          <span>
            {totalMatches} {totalMatches === 1 ? 'streamer encontrado' : 'streamers encontrados'}
          </span>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
```

### 16.2. Integração no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx)

```jsx
// 1. Estado da busca:
const [searchTerm, setSearchTerm] = useState('');

// 2. Filtragem puramente derivada por username:
const normalizedSearch = searchTerm.trim().toLowerCase();
const filteredStreamers = normalizedSearch === ''
  ? streamers
  : streamers.filter((streamer) =>
      String(streamer.username || '').toLowerCase().includes(normalizedSearch)
    );

// 3. Paginação derivada de filteredStreamers:
const totalPages = Math.ceil(filteredStreamers.length / ITEMS_PER_PAGE) || 1;
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const currentStreamers = filteredStreamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

// 4. Handlers de busca com reset de página:
const handleSearchChange = (newTerm) => {
  setSearchTerm(newTerm);
  setCurrentPage(1);
};

const handleClearSearch = () => {
  setSearchTerm('');
  setCurrentPage(1);
};
```

### 16.3. Estilos CSS Previstos em [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css)

```css
/* ==========================================================================
   SearchBar Component (Plano 00007)
   ========================================================================== */
.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 420px;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon svg {
  width: 100%;
  height: 100%;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.5rem 0.65rem 2.6rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.search-input:hover {
  border-color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-twitch);
  box-shadow: 0 0 0 3px rgba(145, 70, 255, 0.2);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.8;
}

/* Oculta o botão nativo de cancelamento do input type="search" em navegadores WebKit */
.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.btn-search-clear {
  position: absolute;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
  background-color: var(--bg-card-hover);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-search-clear svg {
  width: 12px;
  height: 12px;
}

.btn-search-clear:hover {
  background-color: var(--accent-twitch);
  color: #ffffff;
  border-color: var(--accent-twitch);
}

.search-feedback {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Empty Search State */
.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem;
  background-color: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  margin: 1.5rem 0;
  width: 100%;
}

.search-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.search-empty-icon svg {
  width: 100%;
  height: 100%;
}

.search-empty-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.search-empty-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  max-width: 480px;
}

.btn-search-reset {
  padding: 0.6rem 1.25rem;
  background-color: var(--accent-twitch);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-search-reset:hover {
  background-color: var(--accent-twitch-hover);
  box-shadow: 0 2px 8px rgba(145, 70, 255, 0.4);
}

/* Responsividade Mobile */
@media (max-width: 640px) {
  .search-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .search-input-wrapper {
    max-width: 100%;
  }

  .search-feedback {
    font-size: 0.8rem;
  }
}
```

---

## 17. Critérios de Aceitação

| ID | Critério | Validação Objetiva |
|---|---|---|
| **CA-01** | Renderização com `type="search"` | O campo de busca é renderizado como `<input type="search" />` com `<label>` associado por `htmlFor="streamer-search-input"`. |
| **CA-02** | Filtragem Parcial por Username | Digitar `"hik"`, `"HIKARU"` ou `"karu"` filtra e exibe todos os streamers cujo `streamer.username` contenha a substring informada. |
| **CA-03** | Normalização com `trim()` | Digitar `"  hikaru  "` é tratado como `"hikaru"`, ignorando espaços extras nas extremidades. |
| **CA-04** | Restauração em Busca Vazia | Ao limpar o campo (`""`), a lista completa de streamers é restabelecida na ordenação do Plano 00004. |
| **CA-05** | Preservação Estrita da Ordenação | Os streamers filtrados preservam integralmente a ordenação do Plano 00004 (AO VIVO primeiro, seguido de A-Z por username). |
| **CA-06** | Limite de 12 Itens na Paginação | Quando `filteredStreamers.length === 12`, `totalPages = 1` e `Pagination` retorna `null`. |
| **CA-07** | Limite de 13 Itens na Paginação | Quando `filteredStreamers.length === 13`, `totalPages = 2` e `Pagination` é renderizada com 2 páginas. |
| **CA-08** | Reset de Página para 1 | Digitar ou limpar a busca reseta `currentPage` imediatamente para `1`. |
| **CA-09** | Estado Sem Resultados | Se nenhum streamer for encontrado, exibe `search-empty-state` com ícone SVG, mensagem informativa e botão `"Limpar busca"`, ocultando grid e paginação. |
| **CA-10** | Botão Limpar com Ícone SVG | O botão com ícone SVG de limpeza aparece apenas quando há texto no input e, ao ser acionado, limpa o campo e restaura a lista. |
| **CA-11** | Persistência no Auto-Refresh | Ao ocorrer o refresh de 5 minutos do Plano 00005, o termo pesquisado permanece ativo e o filtro é reaplicado sobre a nova lista recebida. |
| **CA-12** | Não-Regressão do Plano 00006 | A paginação inteligente continua operando normalmente com botões Primeira, Anterior, Próxima, Última e reticências quando `totalPages > 1`. |
| **CA-13** | Tratamento Defensivo de Username | Streamers com `username` nulo ou indefinido não geram exceções e são tratados com segurança como `""`. |
| **CA-14** | Responsividade Mobile | Em viewports de 320px a 640px, a barra de busca ocupa 100% da largura sem overflow horizontal. |
| **CA-15** | Compatibilidade com Temas | O campo de busca e o estado sem resultados adaptam suas cores de acordo com os temas Claro e Escuro. |
| **CA-16** | Build Sem Erros | O comando `npm run build` termina com sucesso sem erros de compilação. |

---

## 18. Matriz Completa de Testes

| ID | Cenário / Entrada | Condição / Dados | Saída Esperada | Validação |
|---|---|---|---|---|
| **T-01** | Busca vazia | `searchTerm = ""` | Exibe 780 streamers | Lista completa restaurada |
| **T-02** | Busca com espaços | `searchTerm = "   "` | Exibe 780 streamers | `trim()` resulta em vazio |
| **T-03** | Busca lowercase | `searchTerm = "hikaru"` | Retorna streamers com `"hikaru"` | Case-insensitive verificado |
| **T-04** | Busca uppercase | `searchTerm = "HIKARU"` | Mesmos resultados de `"hikaru"` | Case-insensitive verificado |
| **T-05** | Busca com espaços externos | `searchTerm = "  hikaru  "` | Mesmos resultados de `"hikaru"` | `trim()` verificado |
| **T-06** | Substring do meio | `searchTerm = "karu"` | Retorna streamers com `"karu"` | Substring parcial verificada |
| **T-07** | Nenhum resultado | `searchTerm = "xyz999naoexiste"` | 0 resultados | Exibe `search-empty-state`, sem grid e sem paginação |
| **T-08** | Exatamente 8 resultados | Termo retorna 8 streamers | `totalPages = 1`, `Pagination` não renderizada (`null`) | Limite $\le 12$ verificado |
| **T-09** | Exatamente 12 resultados | Termo retorna 12 streamers | `totalPages = 1`, `Pagination` não renderizada (`null`) | Limite $= 12$ verificado |
| **T-10** | Exatamente 13 resultados | Termo retorna 13 streamers | `totalPages = 2`, `Pagination` renderizada | Limite $> 12$ verificado |
| **T-11** | 25 resultados | Termo retorna 25 streamers | `totalPages = 3`, `Pagination` exibe páginas 1 a 3 | Múltiplas páginas verificadas |
| **T-12** | Busca iniciada na página alta | `currentPage = 40`, usuário digita `"botez"` | `currentPage = 1`, totalPages recalculado | Reset de página verificado |
| **T-13** | Limpar pelo botão `✕` | `searchTerm = "botez", currentPage = 2` | `searchTerm = ""`, `currentPage = 1`, 65 páginas | Botão SVG de limpeza verificado |
| **T-14** | Limpar pelo EmptyState | `searchTerm = "xyz", filtered = 0` | Clicar em "Limpar busca" restaura lista completa | Reset do EmptyState verificado |
| **T-15** | Auto-refresh com busca ativa | `searchTerm = "botez"`, timer atinge 00:00 | Nova lista carregada, filtro `"botez"` reaplicado | Compatibilidade Plano 00005 |
| **T-16** | Streamer muda para live na busca | `searchTerm = "botez"`, streamer entra ao vivo | Streamer sobe para o topo dos resultados filtrados | Ordenação dinâmica verificada |
| **T-17** | Navegação por Teclado | Tab percorre input -> botão de limpar -> cards -> paginação | Foco visível e navegável | Acessibilidade verificada |
| **T-18** | Viewport 320px | Tela compacta mobile | Largura 100%, sem overflow horizontal | Responsividade verificada |
| **T-19** | Viewport 360px | Tela mobile padrão | Alinhamento e paddings corretos | Responsividade verificada |
| **T-20** | Alternância Dark / Light | Alternar tema pelo Header | Cores e bordas adaptam perfeitamente | Temas verificados |
| **T-21** | `username` ausente / null | Streamer no payload com `username: null` | Tratado como `""` sem lançar exceção | Resiliência defensiva verificada |
| **T-22** | Preservação da Ordenação | Vários streamers retornados para o mesmo termo (live e offline) | AO VIVO primeiro, seguido de A-Z | Preservação Plano 00004 |

---

## 19. Riscos, Impactos e Decisões Técnicas

1. **Risco de Dessincronização de Página ao Filtrar:**
   * *Mitigação:* `handleSearchChange` e `handleClearSearch` realizam `setCurrentPage(1)` explicitamente, enquanto o efeito existente em `App.jsx` permanece como salvaguarda passiva contra redução de `totalPages` em auto-refresh.
2. **Risco de Null Pointer Exception em Payloads Anômalos:**
   * *Mitigação:* Uso do padrão defensivo `String(streamer.username || '')` antes de qualquer manipulação de string.
3. **Decisão Técnica de Ausência de Debounce:**
   * Como a filtragem ocorre em memória com complexidade $O(N)$ sobre menos de 1.000 itens, o tempo de execução é imperceptível, proporcionando resposta instantânea sem a complexidade adicional de sincronização de timers de debounce.

---

## 20. Fases de Implementação

* **Fase 1:** Criação do componente [`src/components/SearchBar.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/SearchBar.jsx).
* **Fase 2:** Integração do estado `searchTerm`, filtragem derivada `filteredStreamers` e recálculo da paginação no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx).
* **Fase 3:** Implementação dos estilos CSS no [`src/App.css`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.css) para `SearchBar`, feedback de resultados, estado sem resultados e responsividade mobile.
* **Fase 4:** Execução dos testes manuais cobrindo todos os cenários da matriz (T-01 a T-22) e validação de compatibilidade com Planos 00004, 00005 e 00006.
* **Fase 5:** Validação de build com `npm run build`.

---

## 21. Itens Fora de Escopo

* Busca server-side ou parâmetros de busca na API do Chess.com.
* Filtros adicionais por status (ex: botões "Apenas Ao Vivo", "Apenas Offline").
* Busca por país, título enxadrístico (GM/IM) ou outros campos não presentes no payload básico.
* Destaque em negrito (*highlight*) das letras digitadas dentro dos cards.
* Debounce ou fuzzy search.
* Alteração da quantidade de itens por página (`ITEMS_PER_PAGE = 12`).
* Alteração dos Planos 00004, 00005 ou 00006.

---

## 22. Declaração de Não Alteração de Código na Fase de Planejamento

Em estrita conformidade com as diretrizes do projeto:
* **Nenhum arquivo de código-fonte foi alterado durante a elaboração deste plano.**
* **Nenhuma dependência externa foi adicionada.**
* **Nenhum commit ou push foi realizado.**
* **Os Planos 00004, 00005 e 00006 foram integralmente preservados como contratos imutáveis.**
