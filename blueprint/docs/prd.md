# Product Requirement Document (PRD) — EnPassant.live

---

## 1. Visão Geral do Produto

### 1.1. Identidade e Nome Oficial
* **Nome Escolhido:** **♟️ EnPassant.live**
* **Conceito:** Inspirado na clássica e emblemática jogada do xadrez (*En Passant*), remetendo a agilidade, dinamismo e estratégia, com o sufixo *.live* destacando o foco em transmissões em tempo real.

---

### 1.2. Resumo Executivo
O **EnPassant.live** é uma aplicação web interativa, leve e responsiva desenvolvida em React que consome a API pública do Chess.com para listar streamers de xadrez parceiros, permitindo aos usuários identificar imediatamente quem está transmitindo ao vivo na Twitch e acessar seus canais com um clique.

O projeto foca no domínio consistente e idiomático dos fundamentos do React moderno (`useState`, `useEffect`, `fetch` nativo, renderização condicional, paginação client-side e passagem de propriedades), mantendo a arquitetura limpa e sem sobrecarga de bibliotecas externas desnecessárias.

---

## 2. Objetivos e Proposta de Valor

1. **Centralização e Monitoramento Ágil:** Oferecer um hub visual direto para a comunidade enxadrista descobrir streamers ativos no momento.
2. **Identificação Visual Instantânea:** Distinguir claramente canais `AO VIVO` de canais `OFFLINE`.
3. **Navegação Confortável e Fluida:** Paginação em memória para organizar a listagem em lotes de 12 criadores, garantindo alta performance e experiência visual sem sobrecarga de scroll infinito.
4. **Engenharia Focada nos Fundamentos:** Demonstrar domínio de conceitos essenciais do React sem abstrações complexas (sem Redux, sem Axios, sem Context API), com código limpo, componentização modular e estilização pura.

---

## 3. Delimitação de Escopo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MATRIZ DE ESCOPO                              │
├────────────────────────────────────┬────────────────────────────────────┤
│          FASE 1 — MVP              │      FORA DO MVP (FUTURO)          │
├────────────────────────────────────┼────────────────────────────────────┤
│ • React + Vite                     │ • Filtros (Todos/Ao Vivo/Offline)  │
│ • JavaScript (ES6+)                │ • Barra de busca por nome          │
│ • useState + useEffect             │ • Ordenação automática             │
│ • fetch nativo da Web API          │ • Polling / Auto-refresh           │
│ • CSS Puro (Vanilla) + Dark Theme  │ • Debounce                         │
│ • Header com contadores dinâmicos  │ • Context API / Redux / Zustand    │
│ • Grid responsivo e Cards          │ • Axios                            │
│ • Paginação (12 itens por página)  │ • Backend próprio / Proxy          │
│ • Controles e indicador de páginas │                                    │
│ • Avatar com duplo fallback        │                                    │
│ • Status direto via streamer.is_live│                                   │
│ • Link seguro Twitch (nova aba)    │                                    │
│ • Estados: Loading, Error e Empty  │                                    │
│ • Retry no erro (fetchStreamers)   │                                    │
│ • Responsividade mobile/desktop    │                                    │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## 4. Requisitos Funcionais (RF) — MVP

* **[RF01] Consumo da API Pública:**
  * O `App.jsx` deve conter uma função assíncrona dedicada `fetchStreamers()` que faz a requisição `GET` para `https://api.chess.com/pub/streamers`.
  * Essa função é acionada na montagem do componente via `useEffect(() => { fetchStreamers(); }, [])` e também quando o usuário clica em "Tentar Novamente" após um erro.
* **[RF02] Modelo e Gestão de Estados:**
  * Constante de configuração (definida fora do componente `App.jsx`):
    ```javascript
    const ITEMS_PER_PAGE = 12;
    ```
  * Estados principais no componente `App.jsx`:
    ```javascript
    const [streamers, setStreamers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    ```
  * **Cálculo Derivado da Paginação (Sem estado duplicado):**
    ```javascript
    const totalPages = Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    ```
* **[RF03] Contadores Dinâmicos no Header:**
  * Os números exibidos no cabeçalho devem ser calculados diretamente a partir da lista no estado atual:
    * Total de streamers: `streamers.length`
    * Total ao vivo: `streamers.filter(streamer => streamer.is_live).length`
* **[RF04] Card do Streamer e Apresentação de Dados:**
  * **Nome de Usuário:** `username` legível e destacado.
  * **Status de Transmissão:** Baseado estritamente no campo booleano `streamer.is_live`:
    * `true` → Badge **AO VIVO** (verde neon com indicativo visual).
    * `false` → Badge **OFFLINE** (cinza/neutro).
  * **Avatar com Duplo Fallback:**
    1. Se `avatar` for inexistente ou vazio na resposta, renderiza placeholder padrão de xadrez.
    2. Se a URL existir mas falhar no download, o evento `onError` na tag `<img>` substitui a imagem pelo placeholder padrão.
  * **Link para Twitch:** Botão ou link direcionando para `twitch_url`.
* **[RF05] Navegação Externa Segura:**
  * Links para a Twitch devem abrir em nova aba com `target="_blank"` e `rel="noopener noreferrer"`.
* **[RF06] Tratamento de Estados da Interface:**
  * **LoadingState:** Exibido enquanto `loading === true`.
  * **ErrorState:** Exibido quando `error !== null`, apresentando mensagem clara e botão "Tentar Novamente" que reexecuta `fetchStreamers()`.
  * **StreamerGrid:** Exibido quando `loading === false` e `!error`, renderizando a fatia `currentStreamers`.
  * **Empty State:** Mensagem amigável caso `streamers.length === 0`.
* **[RF07] Paginação da Listagem:**
  * A aplicação deve implementar paginação para a apresentação dos streamers, limitando a quantidade de cards exibidos simultaneamente.
  * A paginação deve ser utilizada na listagem quando aplicável ao layout da interface, com prioridade para telas desktop e widescreen (12 cards por página), adaptando-se confortavelmente também em tablets e dispositivos móveis.
  * A paginação deve utilizar os dados já carregados da API em memória, sem realizar novas requisições ao navegar entre páginas.
  * Os controles devem permitir avançar (*Próxima*), retroceder (*Anterior*) e selecionar páginas numeradas disponíveis, apresentando visualmente a página atual em destaque e desabilitando botões nos limites (primeira e última página).
  * A paginação deve ser aplicada sobre a lista de streamers e permanecer compatível com futuras funcionalidades de busca, filtros e ordenação.

---

## 5. Requisitos Não Funcionais (RNF)

* **[RNF01] Stack Tecnológica:**
  * Framework: **React** com **Vite**.
  * Linguagem: **JavaScript (ES6+)**.
  * Estilos: **CSS Puro / Vanilla CSS** com CSS Variables para consistência de cores, espaçamentos e temas.
* **[RNF02] Design System & Dark Theme:**
  * Paleta escura sofisticada inspirada no tabuleiro de xadrez:
    * Fundo: Ardósia/Grafite profundo (`#0d1117` / `#161b22`).
    * Cards: Superfícies elevadas com bordas sutis (`#21262d`).
    * Destaques: Verde esmeralda/neon para status Live (`#238636` / `#3fb950`) e detalhes em roxo Twitch (`#9146ff`).
  * Tipografia moderna (Google Fonts: *Inter* ou *Outfit*).
  * Microinterações fluidas (elevação suave dos cards, efeitos de hover e transição suave ao trocar de página).
* **[RNF03] Responsividade & Grid:**
  * Layout fluido em CSS Grid / Flexbox que se adapta dinamicamente:
    * **Mobile:** 1 coluna (lista otimizada para rolagem ou paginação).
    * **Tablet:** 2 colunas.
    * **Desktop:** 3 colunas (12 cards por página).
    * **Widescreen:** 4 colunas (12 cards por página).
* **[RNF04] Semântica & Boas Práticas:**
  * Uso correto de tags HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<button>`).
  * Imagens com atributos `alt` descritivos para acessibilidade.

---

## 6. Arquitetura de Componentes e Fluxo de Dados

### 6.1. Hierarquia de Componentes
```
App (Gerenciador de Estado: streamers, loading, error, currentPage e fetchStreamers)
├── Header (Recebe liveCount e totalCount)
├── LoadingState (Exibido durante o carregamento)
├── ErrorState (Recebe onRetry={fetchStreamers})
├── StreamerGrid (Recebe currentStreamers)
│   └── StreamerCard (Recebe dados individuais de cada streamer)
└── Pagination (Recebe currentPage, totalPages e onPageChange={setCurrentPage})
```

### 6.2. Diagrama de Fluxo da Aplicação
```
                    App
                     │
             useEffect() executa
                     │
                     ▼
             GET /streamers (fetchStreamers)
                     │
          ┌──────────┴──────────┐
          │                     │
       sucesso                 erro
          │                     │
          ▼                     ▼
 setStreamers(data)       setError(...)
          │                     │
          ▼                     ▼
  currentStreamers          ErrorState
    (slice 12)                  │
          │                     │
          ▼                     ▼
   StreamerGrid          Tentar Novamente
   + Pagination                 │
          │                     │
          ▼                     │
    StreamerCard                │
          │                     │
          └─────────┬───────────┘
                    │
                    ▼
              fetchStreamers()
```

### 6.3. Estrutura de Arquivos do Projeto
```
src/
├── assets/
│   └── chess-avatar-placeholder.svg
├── components/
│   ├── Header.jsx
│   ├── LoadingState.jsx
│   ├── ErrorState.jsx
│   ├── StreamerGrid.jsx
│   ├── StreamerCard.jsx
│   └── Pagination.jsx
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

---

## 7. Wireframe Conceitual (UI/UX)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ♟️ EnPassant.live                [ ● 8 AO VIVO ]  [ 42 STREAMERS ]     │
│  Acompanhe os mestres e criadores de xadrez em tempo real              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────┐ │
│  │     [ AVATAR ]       │ │     [ AVATAR ]       │ │    [ AVATAR ]   │ │
│  │                      │ │                      │ │                 │ │
│  │       Hikaru         │ │      Eric Rosen      │ │    BotezLive    │ │
│  │   twitch.tv/hikaru   │ │  twitch.tv/imrosen   │ │ twitch/botezlive│ │
│  │                      │ │                      │ │                 │ │
│  │     ● AO VIVO        │ │      ○ OFFLINE       │ │    ● AO VIVO    │ │
│  │                      │ │                      │ │                 │ │
│  │  [ Assistir Agora ]  │ │  [ Canal na Twitch ] │ │[ Assistir Agora]│ │
│  └──────────────────────┘ └──────────────────────┘ └─────────────────┘ │
│                                                                        │
│  ... (12 cards por página)                                             │
│                                                                        │
│              [ < Anterior ]  [ 1 ]  ( 2 )  [ 3 ]  [ 4 ]  [ Próxima > ] │
│                              Página 2 de 4                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Critérios de Aceitação do MVP

| ID | Critério | Validação |
|---|---|---|
| **CA-01** | Inicialização Automática | Ao carregar a página, `fetchStreamers()` é executado via `useEffect`. |
| **CA-02** | Contadores Dinâmicos | Os valores de *Ao Vivo* e *Total* no `Header` refletem exatamente o cálculo dos dados retornados. |
| **CA-03** | Status Preciso | Streamers com `is_live: true` exibem status "AO VIVO"; os demais exibem "OFFLINE". |
| **CA-04** | Resiliência do Avatar | Se a propriedade `avatar` for nula/vazia ou falhar no carregamento (`onError`), o placeholder SVG de xadrez é exibido. |
| **CA-05** | Links Seguros | Clicar em qualquer botão/link de streamer abre a página da Twitch correspondente em nova aba (`target="_blank"` e `rel="noopener noreferrer"`). |
| **CA-06** | Recuperação de Erro (Retry) | Em caso de erro na requisição, a tela de erro é exibida com o botão "Tentar Novamente", que dispara `fetchStreamers()` com sucesso. |
| **CA-07** | Responsividade | Layout se adapta perfeitamente entre 1 coluna (mobile) e 3-4 colunas (desktop). |
| **CA-08** | Paginação em Lotes | Quando a quantidade de streamers exceder 12, os cards são divididos em páginas de no máximo 12 itens. |
| **CA-09** | Navegação em Memória | Usuário consegue avançar e retornar entre as páginas de forma instantânea, sem disparar nova chamada à API. |
| **CA-10** | Estado dos Controles | A página atual é destacada visualmente e os botões "Anterior" (na pág 1) e "Próxima" (na última pág) ficam desabilitados. |
| **CA-11** | Última Página Limpa | A última página apresenta somente os streamers restantes, sem renderizar cards vazios ou quebrar o grid. |

---

## 9. Próximos Passos
1. **Aprovação do PRD consolidado.**
2. **Criação do Plano de Implementação detalhado** quando você der o sinal verde para iniciarmos o código.
