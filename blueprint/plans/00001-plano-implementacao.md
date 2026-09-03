# Plano de Implementação — EnPassant.live

**Plano:** 00001  
**Status:** Planejado  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`)  

---

## 1. Resumo da Implementação

Este plano técnico orienta a construção completa da aplicação web **EnPassant.live**, um hub interativo e responsivo desenvolvido em **React** que consome a API pública do Chess.com (`https://api.chess.com/pub/streamers`) para listar streamers de xadrez parceiros, identificando quais estão transmitindo ao vivo na Twitch.

### Objetivos Principais
* Desenvolver uma Single Page Application (SPA) enxuta, veloz e robusta utilizando **React**, **Vite**, **JavaScript (ES6+)** e **CSS puro (Vanilla CSS)**.
* Implementar o gerenciamento de estados assíncronos e de ciclo de vida através dos hooks essenciais `useState` e `useEffect`, com `fetch` nativo e cancelamento real de requisição via `AbortController`.
* Apresentar os streamers em cards modernos com duplo fallback de avatar (ausência no payload ou falha de rede via `onError` nativo no DOM, sem estado), indicação estrita de status (`is_live`) e links externos seguros utilizando exclusivamente a propriedade oficial `twitch_url`.
* Fornecer paginação *client-side* em memória com **12 streamers por página**, garantindo navegação instantânea sem novas requisições.
* Implementar tema escuro (*dark theme*) imersivo inspirado em xadrez e layout responsivo (1 a 4 colunas).

---

## 2. Estratégia de Implementação e Restrições Técnicas

### Diretrizes e Tecnologias
* **Ambiente de Construção:** React 18+ com Vite.
* **Linguagem:** JavaScript moderno (ES6+).
* **Estilização:** CSS Puro (Vanilla CSS) com Design Tokens em Variáveis CSS (`:root`), garantindo controle total, performance máxima e zero dependências pesadas de UI.
* **Requisições:** `fetch` nativo do navegador integrado à função assíncrona `fetchStreamers()` com suporte a `AbortSignal`.
* **Gerenciamento de Estado:** Exclusivamente no componente raiz `App.jsx` com `useState`.
* **Dados Derivados:** Calculados em tempo de execução sem duplicação de estados (ex: `liveCount`, `totalCount`, `totalPages`, `currentStreamers`).
* **Configuração de Módulo:** Constante de paginação `const ITEMS_PER_PAGE = 12;` declarada fora do componente `App`.

### Restrições Rígidas (Proibições)
* **NÃO utilizar:** Redux, Zustand, Recoil, Context API.
* **NÃO utilizar:** Axios, React Query, SWR.
* **NÃO utilizar:** TailwindCSS, Bootstrap, Material UI, Chakra UI ou bibliotecas de componentes.
* **NÃO utilizar:** Bibliotecas externas de paginação, carrosséis ou ícones pesados.
* **NÃO utilizar:** Servidores backend, microserviços ou proxies intermediários.

---

## 3. Organização por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEQUÊNCIA DE FASES DO PLANO                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fase 1: Inspeção e Preparação da Estrutura do Projeto (Vite + React)        │
│ Fase 2: Fundação Visual e Design System (index.css)                         │
│ Fase 3: Asset de Fallback do Avatar (chess-avatar-placeholder.svg)          │
│ Fase 4: Componentes Estruturais (Header, LoadingState, ErrorState, etc.)    │
│ Fase 5: Integração com a API (fetchStreamers & AbortController)             │
│ Fase 6: Cards dos Streamers e Resiliência de Imagem (StreamerCard)         │
│ Fase 7: Header e Contadores Dinâmicos Calculados                            │
│ Fase 8: Orquestração dos Estados da Interface (Loading, Error, Empty, Grid) │
│ Fase 9: Paginação Client-Side e Sincronização de Estado (Pagination)        │
│ Fase 10: Responsividade e Layout Grid Adaptativo                            │
│ Fase 11: Acessibilidade Semântica e Navegação por Teclado                  │
│ Fase 12: Validação Completa, Testes Manuais e Critérios de Aceite          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1 — Inspeção e Preparação da Estrutura do Projeto

#### Objetivo
Inspecionar o workspace atual para verificar a existência prévia de arquivos de configuração do Vite/React (`package.json`, `vite.config.js`, etc.) e inicializar a estrutura somente se necessário, sem comprometer a pasta `blueprint/` e organizando a árvore final.

#### Tarefas
- [ ] Inspecionar os arquivos da raiz do workspace para verificar se o projeto React/Vite já existe.
- [ ] Caso não exista, inicializar o projeto React + JavaScript via Vite (`npm create vite@latest . -- --template react` ou scaffold não destrutivo).
- [ ] Validar e ajustar o `package.json` para garantir scripts de desenvolvimento (`dev`) e build (`build`).
- [ ] Limpar arquivos boilerplate de exemplo que não serão utilizados (ex: `src/assets/react.svg`).
- [ ] Assegurar a existência dos diretórios: `src/assets/` e `src/components/`.
- [ ] Ajustar `index.html` com o título oficial `<title>EnPassant.live — Chess Streamers</title>` e meta tags semânticas.

#### Resultado Esperado
Estrutura React/Vite validada e limpa, preservando os artefatos de documentação existentes.

#### Critérios de Conclusão
* Scripts `npm run dev` e `npm run build` funcionais.
* A pasta `blueprint/` e seus documentos permanecem intactos.
* As pastas `src/assets` e `src/components` existem no sistema de arquivos.

---

### Fase 2 — Fundação Visual e Design System

#### Objetivo
Construir o design system global em `src/index.css` e o layout base em `src/App.css`, estabelecendo o tema escuro (*dark theme*) imersivo, tipografia e microinterações com CSS puro.

#### Tarefas
- [ ] Importar tipografia moderna do Google Fonts (Inter / Outfit) no `index.html` ou topo do `index.css`.
- [ ] Definir as variáveis CSS de design tokens no seletor `:root`:
  * Fundo principal: `--bg-primary: #0d1117;`
  * Fundo secundário/cards: `--bg-card: #161b22;`
  * Superfície elevada/hover: `--bg-card-hover: #21262d;`
  * Bordas sutis: `--border-color: #30363d;`
  * Texto primário: `--text-primary: #f0f6fc;`
  * Texto secundário/muted: `--text-secondary: #8b949e;`
  * Acento Live (Verde esmeralda): `--accent-live: #3fb950;`
  * Acento Live glow/bg: `--accent-live-glow: rgba(63, 185, 80, 0.2);`
  * Acento Twitch (Roxo): `--accent-twitch: #9146ff;`
  * Acento Twitch hover: `--accent-twitch-hover: #772ce8;`
  * Status Offline: `--accent-offline: #6e7681;`
  * Alerta de Erro: `--accent-error: #f85149;`
- [ ] Implementar o CSS Reset moderno (box-sizing border-box, margens zeradas, fontes fluidas).
- [ ] Definir estilos utilitários para foco visual (`:focus-visible`), transições suaves e scrollbar estilizada.

#### Resultado Esperado
Base de estilos sólida, elegante, consistente com a temática de xadrez escuro e pronta para ser consumida pelos componentes.

#### Critérios de Conclusão
* Variáveis CSS declaradas no `:root`.
* Dark theme aplicado ao `body` com fundo `#0d1117` e tipografia legível.
* Estilos de foco e transições definidos sem erros de lint.

---

### Fase 3 — Asset de Fallback do Avatar

#### Objetivo
Criar e disponibilizar o arquivo vetorial `chess-avatar-placeholder.svg` dentro de `src/assets/` para servir de fallback elegante para qualquer streamer sem foto ou cuja imagem falhe no download.

#### Tarefas
- [ ] Criar o arquivo `src/assets/chess-avatar-placeholder.svg` contendo o desenho vetorial de uma peça de xadrez (ex: Cavalo / Peão) em tons escuros e borda sutil, com dimensões proporcionais (ex: `viewBox="0 0 100 100"`).
- [ ] Assegurar que o SVG seja autossuficiente (cores embutidas compatíveis com o tema escuro).
- [ ] Importar e disponibilizar o asset para consumo no `StreamerCard.jsx`.

#### Resultado Esperado
Vetor SVG estático disponível em `src/assets/chess-avatar-placeholder.svg` pronto para ser renderizado localmente.

#### Critérios de Conclusão
* O arquivo SVG existe e abre corretamente sem dependências externas.
* As cores do SVG se integram harmoniosamente com o fundo escuro dos cards.

---

### Fase 4 — Componentes Estruturais

#### Objetivo
Criar os 7 componentes modulares em `src/components/`, delimitando com precisão suas responsabilidades, tipagem de props e estrutura JSX semântica.

#### Tarefas
- [ ] Criar `src/components/Header.jsx`:
  * Props: `liveCount` (number), `totalCount` (number).
  * Exibe: Logo ♟️ `EnPassant.live`, subtítulo e pills/badges com os contadores calculados.
- [ ] Criar `src/components/LoadingState.jsx`:
  * Renderiza indicador de carregamento com animação suave de pulso.
- [ ] Criar `src/components/ErrorState.jsx`:
  * Props: `message` (string), `onRetry` (function).
  * Renderiza ícone de alerta, mensagem amigável e botão "Tentar Novamente" com hover interativo.
- [ ] Criar `src/components/EmptyState.jsx`:
  * Renderiza mensagem e ícone amigável informando que nenhum streamer foi encontrado.
- [ ] Criar `src/components/StreamerGrid.jsx`:
  * Props: `streamers` (array).
  * Responsabilidade única: renderizar o container CSS Grid e iterar sobre a lista recebida instanciando `StreamerCard`.
- [ ] Criar `src/components/StreamerCard.jsx`:
  * Props: `streamer` (object com `username`, `avatar`, `twitch_url`, `is_live`).
  * 100% Stateless: o fallback de imagem opera diretamente no DOM via `onError`.
- [ ] Criar `src/components/Pagination.jsx`:
  * Props: `currentPage` (number), `totalPages` (number), `onPageChange` (function).
  * Renderiza botões "Anterior", "Próxima", lista de páginas numéricas e texto "Página X de Y".

#### Resultado Esperado
Todos os 7 componentes criados de forma desacoplada e modular, prontos para orquestração.

#### Critérios de Conclusão
* Componentes exportados corretamente como módulos ES6 (`export default`).
* Nenhum componente secundário gerencia estado da API (apenas props recebidas).

---

### Fase 5 — Integração com a API Externa e Cancelamento Real

#### Objetivo
Implementar a comunicação assíncrona com o endpoint do Chess.com no `App.jsx`, gerenciando loading, erro, dados retornados, ação de retry e cancelamento real da requisição HTTP via `AbortController`.

#### Tarefas
- [ ] Declarar no escopo de módulo do `App.jsx`:
  ```javascript
  const ITEMS_PER_PAGE = 12;
  const API_URL = 'https://api.chess.com/pub/streamers';
  ```
- [ ] Declarar os estados principais no `App`:
  ```javascript
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  ```
- [ ] Criar a função `fetchStreamers`:
  * Aceita um parâmetro opcional `signal` (`AbortSignal`).
  * Define `setLoading(true)` e `setError(null)`.
  * Executa `fetch(API_URL, { signal })`.
  * Verifica `response.ok`; caso contrário, lança erro com o status HTTP.
  * Converte a resposta em JSON (`const data = await response.json();`).
  * Atualiza o estado: `setStreamers(Array.isArray(data.streamers) ? data.streamers : []);`.
  * Em caso de falha (`catch`), verifica se o erro é de cancelamento (`err.name === 'AbortError'`). Se for, encerra silenciosamente. Caso contrário, define `setError('Não foi possível carregar os streamers. Verifique sua conexão.')`.
  * Em `finally`, define `setLoading(false)`.
- [ ] Configurar o `useEffect` para instanciar o `AbortController` e cancelar a requisição na desmontagem:
  ```javascript
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        setStreamers(Array.isArray(data.streamers) ? data.streamers : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Não foi possível carregar os streamers. Verifique sua conexão.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, []);
  ```

#### Resultado Esperado
Comunicação robusta com a API do Chess.com, cancelamento real via `AbortController` e sem erros no console durante desmontagens.

#### Critérios de Conclusão
* `fetchStreamers` funciona na montagem e pode ser chamada sob demanda no retry.
* AbortError é ignorado no catch sem gerar falsos erros de interface.
* Falhas reais de rede alteram o estado `error` adequadamente.

---

### Fase 6 — Cards dos Streamers e Resiliência de Imagem

#### Objetivo
Refinar o componente `StreamerCard.jsx` para apresentar os dados com fidelidade visual estrita ao PRD, links oficiais seguros e duplo fallback de imagem.

#### Tarefas
- [ ] Implementar a exibição do avatar com fallback duplo:
  * Fallback 1: Se `streamer.avatar` for nulo/vazio, utilizar `chess-avatar-placeholder.svg` como `src`.
  * Fallback 2: Adicionar manipulador nativo `onError={(e) => { e.currentTarget.src = placeholderSvg; e.currentTarget.onerror = null; }}` para capturar URLs quebradas sem necessidade de estado no componente.
  * Inserir atributo `alt={`Avatar de ${streamer.username}`}`.
- [ ] Exibir o nome de usuário (`streamer.username`).
- [ ] Renderizar a tag/badge de status estritamente via `streamer.is_live`:
  * `is_live === true`: Badge com classe `.badge-live`, texto "AO VIVO" e indicador pulsante (LED verde).
  * `is_live === false`: Badge com classe `.badge-offline`, texto "OFFLINE" e círculo cinza neutro.
- [ ] Exibir o link/botão para a Twitch utilizando estritamente `streamer.twitch_url`:
  * Se `streamer.twitch_url` estiver presente: renderizar `<a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="streamer-link">Assistir na Twitch</a>`.
  * Se `streamer.twitch_url` estiver ausente: renderizar botão/tag com estado desabilitado/inativo (`<span className="streamer-link disabled">Canal indisponível</span>`), sem inventar URLs manuais.

#### Resultado Esperado
Cards de streamers estilizados, seguros, resilientes a falhas de imagem e estritamente fiéis aos dados oficiais da API.

#### Critérios de Conclusão
* Nenhum card quebra o layout caso o avatar não exista ou dê erro 404.
* Links utilizam exclusivamente `streamer.twitch_url` e abrem em nova guia com `rel="noopener noreferrer"`.

---

### Fase 7 — Header e Contadores Dinâmicos Calculados

#### Objetivo
Implementar o cabeçalho `Header.jsx` e o cálculo derivado dos indicadores dinâmicos diretamente no `App.jsx`.

#### Tarefas
- [ ] Calcular os totais no `App.jsx` a partir do estado `streamers`:
  ```javascript
  const totalCount = streamers.length;
  const liveCount = streamers.filter(s => s.is_live).length;
  ```
- [ ] Passar `totalCount` e `liveCount` como props para `<Header />`.
- [ ] No `Header.jsx`, exibir:
  * Título da aplicação: `♟️ EnPassant.live`.
  * Subtítulo explicativo: "Acompanhe os mestres e criadores de xadrez em tempo real".
  * Badge dinâmico de Live: `● ${liveCount} AO VIVO`.
  * Badge de Total: `${totalCount} STREAMERS`.
- [ ] Implementar estilo flexível com layout fluido (wrap automático em telas menores).

#### Resultado Esperado
Header elegante e moderno com contadores calculados dinamicamente a partir dos dados retornados.

#### Critérios de Conclusão
* Os contadores refletem com exatidão a quantidade de itens no estado `streamers`.
* Nenhum estado intermediário é criado no `Header`.

---

### Fase 8 — Orquestração dos Estados da Interface

#### Objetivo
Estruturar a renderização condicional no `App.jsx` com prioridade estrita entre os estados: *Loading*, *Error*, *Empty* e *Success*, utilizando componentes dedicados para cada um.

#### Tarefas
- [ ] Definir a ordem de precedência de renderização no corpo do `App.jsx`:
  1. Se `loading === true`: renderizar `<LoadingState />`.
  2. Se `error !== null`: renderizar `<ErrorState message={error} onRetry={fetchStreamers} />`.
  3. Se `streamers.length === 0`: renderizar `<EmptyState />`.
  4. Caso contrário: renderizar `<StreamerGrid streamers={currentStreamers} />` seguido de `<Pagination />`.
- [ ] Assegurar que o `<Header />` permaneça visível para dar contexto à aplicação em todos os estados.

#### Resultado Esperado
Experiência do usuário consistente, arquitetura limpa e sem sobreposição de telas durante as transições de estado.

#### Critérios de Conclusão
* Não ocorre sobreposição entre tela de erro, tela vazia e listagem.
* O botão de retry reinicia o ciclo corretamente com feedback de loading.

---

### Fase 9 — Paginação Client-Side e Sincronização de Estado

#### Objetivo
Implementar a paginação em memória para fatiar a listagem em lotes de 12 streamers, sincronizando efetivamente o estado `currentPage` dentro dos limites válidos.

#### Tarefas
- [ ] **Decisão Arquitetural Registrada:** Toda nova carga completa da coleção (seja inicial ou via ação de retry em `fetchStreamers()`) redefine a paginação para a página 1 (`setCurrentPage(1)`).
- [ ] No `App.jsx`, calcular as variáveis derivadas da paginação:
  ```javascript
  const totalPages = Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  ```
- [ ] Implementar `useEffect` no `App.jsx` para sincronizar o estado `currentPage` caso a lista mude e a página atual exceda `totalPages`:
  ```javascript
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  ```
- [ ] Construir o componente `Pagination.jsx`:
  * Botão "Anterior" (`disabled={currentPage === 1}`).
  * Botões numéricos de `1` até `totalPages` com classe `.active` na página atual.
  * Botão "Próxima" (`disabled={currentPage === totalPages}`).
  * Indicador de texto: `Página ${currentPage} de ${totalPages}`.
  * Disparo de evento: `onPageChange(pageNumber)`.
- [ ] Ao mudar de página, rolar suavemente a tela para o topo da lista (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
- [ ] Ocultar a paginação caso `totalPages <= 1`.

#### Resultado Esperado
Navegação em páginas rápida, sem recarregar a página, sem requisições à rede e com estado de página rigorosamente protegido.

#### Critérios de Conclusão
* Apenas 12 streamers são renderizados por página.
* Botões "Anterior" e "Próxima" respeitam os limites extremos.
* Troca de páginas não dispara nova chamada `fetch`.

---

### Fase 10 — Responsividade e Layout Grid Adaptativo

#### Objetivo
Ajustar as regras CSS em `src/App.css` e nos componentes para garantir adaptação perfeita em dispositivos móveis, tablets, notebooks e monitores ultrawide.

#### Tarefas
- [ ] Configurar o grid dos streamers em `StreamerGrid`:
  * Mobile (< 640px): `grid-template-columns: 1fr;`
  * Tablet (640px - 1024px): `grid-template-columns: repeat(2, 1fr);`
  * Desktop (1024px - 1440px): `grid-template-columns: repeat(3, 1fr);`
  * Widescreen (> 1440px): `grid-template-columns: repeat(4, 1fr);`
- [ ] Garantir espaçamento consistente (`gap: 1.5rem;` ou `24px`).
- [ ] Estilizar a paginação para que os botões numéricos não quebrem em telas estreitas (usando flex-wrap ou paginação compacta em mobile).

#### Resultado Esperado
Layout fluido e esteticamente harmonioso em qualquer resolução de tela.

#### Critérios de Conclusão
* O layout adapta-se de 1 a 4 colunas conforme a largura do viewport.
* Nenhum elemento gera overflow horizontal indesejado.

---

### Fase 11 — Acessibilidade Semântica e Navegação por Teclado

#### Objetivo
Assegurar padrões modernos de acessibilidade (a11y) e semântica HTML5 em toda a aplicação.

#### Tarefas
- [ ] Validar estrutura semântica: `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`.
- [ ] Adicionar `aria-label` descritivo nos botões de navegação da paginação.
- [ ] Adicionar `aria-current="page"` no botão numérico da página ativa.
- [ ] Adicionar `role="status"` ou `aria-live="polite"` no componente `LoadingState`.
- [ ] Garantir navegação completa via tecla `Tab` e acionamento via `Enter` / `Espaço`.
- [ ] Testar contraste de cores entre os textos e os fundos escuros (mínimo WCAG AA).

#### Resultado Esperado
Aplicação acessível a leitores de tela e navegável inteiramente por teclado.

#### Critérios de Conclusão
* Foco visível presente em todos os elementos interativos.
* Atributos ARIA aplicados corretamente sem advertências no console.

---

### Fase 12 — Validação Completa, Testes Manuais e Critérios de Aceite

#### Objetivo
Executar a bateria completa de testes manuais e checagem de todos os critérios de aceitação do PRD (CA-01 a CA-11) antes da entrega final.

#### Tarefas
- [ ] Executar os testes de integração com a API real do Chess.com.
- [ ] Simular estados de erro (desconectando a rede) e validar o botão de retry.
- [ ] Validar o duplo fallback de imagens forçando URLs inválidas.
- [ ] Validar todas as interações da paginação e cálculos de limites.
- [ ] Testar a responsividade em emuladores de dispositivos móveis e desktops.
- [ ] Conferir o checklist dos critérios de aceitação.

#### Resultado Esperado
Todos os critérios de aceite (CA-01 a CA-11) validados com sucesso de forma objetiva.

#### Critérios de Conclusão
* Todos os 11 critérios de aceitação (CA-01 a CA-11) validados com sucesso.

---

## 4. Responsabilidades do `App.jsx`

O componente raiz `App.jsx` atuará como orquestrador central:

| Item | Tipo | Descrição |
|---|---|---|
| `streamers` | Estado (`useState([])`) | Lista bruta retornada pela API do Chess.com |
| `loading` | Estado (`useState(true)`) | Booleano que indica carregamento ativo |
| `error` | Estado (`useState(null)`) | Mensagem de erro ou `null` se sucesso |
| `currentPage` | Estado (`useState(1)`) | Índice da página atual de visualização |
| `ITEMS_PER_PAGE` | Constante (`12`) | Definida fora do componente para evitar realocações |
| `fetchStreamers` | Função assíncrona | Executa a chamada `fetch`, trata exceções e atualiza estados |
| `liveCount` | Dado Derivado | `streamers.filter(s => s.is_live).length` |
| `totalCount` | Dado Derivado | `streamers.length` |
| `totalPages` | Dado Derivado | `Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1` |
| `currentStreamers` | Dado Derivado | `streamers.slice((currentPage - 1) * 12, currentPage * 12)` |

---

## 5. Responsabilidades dos Componentes

| Componente | Responsabilidade Principal | Estado Próprio | Props Recebidas |
|---|---|---|---|
| **App** | Orquestrador de estado, API e paginação | Sim | N/A |
| **Header** | Exibição da marca e contadores dinâmicos | Não | `liveCount`, `totalCount` |
| **LoadingState** | Feedback visual durante carregamento | Não | N/A |
| **ErrorState** | Feedback visual de erro e botão de retry | Não | `message`, `onRetry` |
| **EmptyState** | Feedback visual quando a lista é vazia | Não | N/A |
| **StreamerGrid** | Container do grid e iteração dos cards | Não | `streamers` |
| **StreamerCard** | Apresentação individual do streamer, status e link | Não *(onError nativo via DOM)* | `streamer` |
| **Pagination** | Controles de navegação entre páginas | Não | `currentPage`, `totalPages`, `onPageChange` |

---

## 6. Diagramas de Fluxo de Dados

### 6.1. Fluxo Principal da Aplicação
```
                    App (Mount)
                         │
                 useEffect() dispara
                 (com AbortController)
                         │
                         ▼
             fetchStreamers() executa
                         │
               fetch(API do Chess.com)
                         │
          ┌──────────────┴──────────────┐
          │                             │
       Sucesso                        Erro
          │                             │
          ▼                             ▼
 setStreamers(data.streamers)      setError(mensagem)
 setLoading(false)                 setLoading(false)
          │                             │
          ▼                             ▼
   Cálculo Derivado                ErrorState
  • liveCount                           │
  • totalCount                          │
  • totalPages                    Botão "Tentar Novamente"
  • currentStreamers (slice 12)         │
          │                             ▼
          ▼                       fetchStreamers()
   Header + StreamerGrid
          │
          ▼
   StreamerCard (x12)
          │
          ▼
   Pagination (1, 2, 3...)
```

### 6.2. Fluxo da Paginação em Memória
```
  [ Estado streamers ] (ex: 42 criadores)
           │
           ├──> totalPages = Math.ceil(42 / 12) = 4 páginas
           │
  [ Estado currentPage ] (ex: página 2)
           │
           ├──> startIndex = (2 - 1) * 12 = 12
           │
           └──> currentStreamers = streamers.slice(12, 24)
                         │
                         ▼
                Renderiza 12 cards
                         │
                Pagination Controls:
         [ < Anterior ] [ 1 ] ( 2 ) [ 3 ] [ 4 ] [ Próxima > ]
```

---

## 7. Mapeamento de Arquivos do Projeto

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `index.html` | Modificar | Título da página, meta tags e fonte Google Fonts |
| `src/main.jsx` | Modificar | Ponto de entrada padrão do React |
| `src/index.css` | Criar/Modificar | Reset CSS, variáveis CSS, tipografia e design tokens |
| `src/App.jsx` | Criar/Modificar | Estado central, `fetchStreamers` e renderização condicional |
| `src/App.css` | Criar/Modificar | Estilos de layout, grid, containers e animações |
| `src/assets/chess-avatar-placeholder.svg` | Criar | Vetor SVG para fallback do avatar |
| `src/components/Header.jsx` | Criar | Cabeçalho com título e contadores dinâmicos |
| `src/components/LoadingState.jsx` | Criar | Estado de carregamento com feedback visual |
| `src/components/ErrorState.jsx` | Criar | Estado de erro com botão de retry |
| `src/components/EmptyState.jsx` | Criar | Estado de lista vazia sem resultados |
| `src/components/StreamerGrid.jsx` | Criar | Grid dos streamers (container e iteração) |
| `src/components/StreamerCard.jsx` | Criar | Card individual com avatar, status e link oficial Twitch |
| `src/components/Pagination.jsx` | Criar | Controles de navegação de páginas |

---

## 8. Roteiro de Testes Manuais

### API e Integração
* [ ] Aplicação carrega automaticamente ao abrir a página inicial.
* [ ] Resposta de sucesso renderiza os cards corretamente.
* [ ] Desmontagem rápida do componente aborta a requisição via `AbortController` sem erros no console.
* [ ] Simulação de erro de rede (offline) exibe a tela `ErrorState`.
* [ ] Clicar no botão "Tentar Novamente" reexecuta a busca e recupera a interface se a rede voltar.
* [ ] Retorno com array vazio exibe a tela `EmptyState` amigável.

### Status dos Streamers
* [ ] Streamer com `is_live: true` exibe badge verde brilhante com texto **AO VIVO**.
* [ ] Streamer com `is_live: false` exibe badge neutro com texto **OFFLINE**.

### Avatar e Resiliência
* [ ] Streamer com imagem válida renderiza o avatar correspondente.
* [ ] Streamer sem campo `avatar` exibe o placeholder SVG de xadrez.
* [ ] Streamer com URL de imagem inexistente/quebrada (404) dispara `onError` e renderiza o placeholder SVG sem quebrar o layout.

### Links Oficiais e Segurança
* [ ] Clicar no botão de assistir redireciona para a URL oficial da Twitch (`twitch_url`).
* [ ] Caso `twitch_url` não exista, o botão fica inativo/desabilitado sem link fictício gerado.
* [ ] O link abre obrigatoriamente em uma nova aba (`target="_blank"`).
* [ ] Os atributos de proteção `rel="noopener noreferrer"` estão presentes na tag `<a>`.

### Paginação Client-Side
* [ ] Quantidade menor ou igual a 12 streamers não exibe controles redundantes de paginação.
* [ ] Quantidade maior que 12 divide os dados em páginas de no máximo 12 itens por página.
* [ ] A página inicial é sempre a página 1.
* [ ] O botão "Anterior" fica desabilitado quando `currentPage === 1`.
* [ ] O botão "Próxima" fica desabilitado quando `currentPage === totalPages`.
* [ ] A última página exibe apenas a quantidade restante de streamers sem gerar cards vazios.
* [ ] A troca de páginas é instantânea e não realiza nenhuma nova requisição na aba Network.

### Responsividade
* [ ] **Mobile (< 640px):** Cards dispostos em 1 coluna única, legível e sem scroll horizontal.
* [ ] **Tablet (640px - 1024px):** Cards dispostos em 2 colunas.
* [ ] **Desktop (1024px - 1440px):** Cards dispostos em 3 colunas.
* [ ] **Widescreen (> 1440px):** Cards dispostos em 4 colunas.

---

## 9. Mapeamento dos Critérios de Aceite (PRD)

| Critério | Descrição | Fase de Implementação | Método de Validação |
|---|---|---|---|
| **CA-01** | Inicialização Automática | Fase 5 | Verificar que o `useEffect` dispara a chamada para a API assim que o app carrega. |
| **CA-02** | Contadores Dinâmicos | Fase 7 | Checar se as contagens no `Header` equivalem ao total de streamers e total com `is_live: true`. |
| **CA-03** | Status Preciso | Fase 6 | Verificar se o indicador reflete estritamente a propriedade `streamer.is_live`. |
| **CA-04** | Resiliência do Avatar | Fase 3 e 6 | Testar streamers com avatar ausente e imagens corrompidas, checando se o SVG é exibido. |
| **CA-05** | Links Seguros | Fase 6 | Inspecionar a tag `<a>` e verificar `target="_blank"` e `rel="noopener noreferrer"`. |
| **CA-06** | Recuperação de Erro (Retry) | Fase 5 e 8 | Simular falha de rede e clicar em "Tentar Novamente", verificando a recuperação. |
| **CA-07** | Responsividade | Fase 10 | Redimensionar a janela e inspecionar a adaptação de 1, 2, 3 e 4 colunas. |
| **CA-08** | Paginação em Lotes | Fase 9 | Verificar que no máximo 12 cards são renderizados simultaneamente. |
| **CA-09** | Navegação em Memória | Fase 9 | Conferir no DevTools (Network) que alternar entre páginas não gera requisições HTTP. |
| **CA-10** | Estado dos Controles | Fase 9 | Verificar classe ativa no número da página e botões desabilitados nos extremos. |
| **CA-11** | Última Página Limpa | Fase 9 | Checar se a página final apresenta apenas o saldo restante sem espaços vazios defeituosos. |

---

## 10. Dependências e Análise de Riscos

| Risco Identificado | Impacto | Estratégia de Mitigação |
|---|---|---|
| **Indisponibilidade da API do Chess.com** | Alto | O `catch` captura a falha e renderiza o `ErrorState` amigável com botão de retry. |
| **Imagens de avatares quebradas ou inacessíveis** | Médio | Duplo fallback: verificação de campo nulo + evento nativo `onError` apontando para o SVG local. |
| **Ausência do campo `twitch_url` no streamer** | Baixo | Renderização de estado inativo/desabilitado no botão sem gerar links manuais/fictícios. |
| **Mudança no número de páginas ao atualizar dados** | Baixo | Sincronização via `useEffect` que redefine `currentPage` para `1` se `currentPage > totalPages`. |
| **Grande volume de dados sobrecarregando a DOM** | Baixo | A paginação client-side restringe a renderização a no máximo 12 componentes DOM por página. |

---

## 11. Ordem de Execução Recomendada

1. **Fase 1:** Inspecionar e preparar a estrutura do projeto React/Vite.
2. **Fase 2:** Configurar `src/index.css` com variáveis e design system.
3. **Fase 3:** Criar o SVG `src/assets/chess-avatar-placeholder.svg`.
4. **Fase 4:** Criar os 7 arquivos de componentes modulares (`Header`, `LoadingState`, `ErrorState`, `EmptyState`, `StreamerGrid`, `StreamerCard`, `Pagination`).
5. **Fase 5:** Implementar `fetchStreamers()` com cancelamento via `AbortController` no `App.jsx`.
6. **Fase 6:** Implementar a lógica dos cards e resiliência de imagem no `StreamerCard.jsx`.
7. **Fase 7:** Implementar contadores dinâmicos calculados no `Header.jsx`.
8. **Fase 8:** Integrar a orquestração dos estados (*Loading*, *Error*, *Empty* e *Success*).
9. **Fase 9:** Implementar a lógica de paginação e sincronização no `Pagination.jsx` e `App.jsx`.
10. **Fase 10:** Aplicar regras de responsividade nos breakpoints CSS.
11. **Fase 11:** Revisar semântica e acessibilidade.
12. **Fase 12:** Executar testes manuais e validar os critérios de aceite CA-01 a CA-11.

---

## 12. Declaração de Não Implementação

Nenhum código de aplicação, componente, estilo ou dependência foi alterado ou criado nesta etapa. O escopo desta atividade restringiu-se exclusivamente à análise do PRD e estruturação detalhada deste plano de implementação.
