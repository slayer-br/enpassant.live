# Plano de Implementação — EnPassant.live

**Plano:** 00005  
**Status:** Revisado / Pronto para Implementação  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00004 & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00005 — Atualização Automática de Streamers, Timestamp da Última Atualização, Contador Regressivo e Atualização Manual**

---

## 2. Identificação, Data e Status

* **Identificador:** 00005
* **Data:** 2026-09-03
* **Status:** Revisado / Pronto para Implementação

---

## 3. Referência ao Projeto e Preservação do Plano 00004

* **PRD Oficial:** `blueprint/docs/prd.md`
* **Planos Anteriores Concluídos:**
  * `00001-implementacao-inicial-do-mvp.md` (MVP, API Chess.com, Grid, Cards, Paginação)
  * `00002-sistema-de-temas-dark-light.md` (Design Tokens, Dark/Light, Anti-FOUC, LocalStorage, Meta Theme-Color)
  * `00003-indicadores-de-status-offline.md` (Contador Offline no Header, Identidade Vermelha)
  * `00004-ordenacao-streamers-status-e-nome.md` (Ordenação Automática por Status e Nome de Usuário)
* **Regra de Não-Regressão do Plano 00004:** O algoritmo de ordenação `sortStreamers` e sua integração na carga de dados são tratados como funcionalidades concluídas e estáveis. O fluxo de atualização do Plano 00005 consumirá o pipeline existente, garantindo que qualquer nova busca continue gerando a lista perfeitamente ordenada (AO VIVO primeiro, seguido de OFFLINE em ordem alfabética A-Z).

---

## 4. Objetivo

Especificar tecnicamente a implementação de um sistema robusto, sincronizado e não-bloqueante de atualização contínua para a lista de streamers do **EnPassant.live**, contemplando:
1. Exibição do timestamp local da **última atualização bem-sucedida** formatado para `pt-BR` (ex: `"Atualizado em 03/09/2026 às 16:20"`).
2. **Atualização automática periódica a cada 5 minutos (300 segundos)** iniciada a partir do término com sucesso da última busca.
3. Exibição de um **contador regressivo visual no formato `MM:SS`** sincronizado com o tempo real.
4. Botão de **atualização manual imediata ("Atualizar agora")** que reinicia o ciclo de 5 minutos após o sucesso.
5. **Prevenção rigorosa de requisições concorrentes ou simultâneas** através de lock síncrono centralizado.
6. **Política explícita e não-destrutiva de tratamento de erros** em atualizações de segundo plano.
7. **Cleanup de timers e requisições pendentes no ciclo de vida do React**.

---

## 5. Contexto

Atualmente, o **EnPassant.live** carrega os streamers do Chess.com exclusivamente na montagem inicial ou quando o usuário clica no botão de retry após uma falha. As transmissões de xadrez são dinâmicas, com mestres iniciando e encerrando lives com frequência. A adição deste ciclo automatizado e controlado sob demanda garante que a lista e os contadores (`liveCount`, `offlineCount`, `totalCount`) permaneçam precisos durante sessões prolongadas de uso.

---

## 6. Requisitos Funcionais

1. **RF-01 — Timestamp da Última Atualização:**
   * Exibir na interface o momento da última busca bem-sucedida formatado em `pt-BR` (ex: `"Atualizado em 03/09/2026 às 16:20"`).
   * O timestamp só é registrado após uma requisição concluída com sucesso.
   * Não deve ser alterado caso uma atualização posterior falhe.
2. **RF-02 — Atualização Automática de 5 Minutos:**
   * A aplicação deve disparar automaticamente uma nova busca a cada 300 segundos.
   * O ciclo de 5 minutos é iniciado a partir do momento em que a última requisição com sucesso for concluída.
3. **RF-03 — Contador Regressivo em Tempo Real:**
   * Apresentar visualmente o tempo restante no formato `MM:SS` (de `05:00` a `00:00`).
   * O contador deve calcular o tempo restante a partir da diferença real contra o timestamp alvo (`nextUpdateAt - Date.now()`), evitando atrasos acumulados causados por throttling de abas inativas.
   * Ao atingir `00:00`, a atualização automática é acionada.
4. **RF-04 — Atualização Manual Imediata:**
   * Disponibilizar o botão `"Atualizar agora"` na interface.
   * Ao ser clicado, dispara imediatamente a busca sem aguardar o timer de 5 minutos.
   * Ao concluir com sucesso, a lista é atualizada, o timestamp é renovado e o ciclo de 5 minutos é reiniciado para `05:00`.
5. **RF-05 — Bloqueio de Concorrência:**
   * O botão `"Atualizar agora"` deve ficar desabilitado (`disabled`) durante qualquer busca ativa.
   * Múltiplos cliques consecutivos ou disparos simultâneos do timer não devem gerar requisições de rede duplicadas.
6. **RF-06 — Resiliência em Caso de Erro:**
   * Em caso de falha em atualização automática ou manual de fundo, a lista atual de streamers e o `lastUpdated` permanecem visíveis.
   * Para atualização automática com falha, uma nova tentativa é reagendada para **60 segundos** (em vez de 5 minutos), permitindo recuperação rápida.
7. **RF-07 — Primeira Carga da Aplicação:**
   * Durante o carregamento inicial (`loading === true`), a interface não deve exibir contagens regressivas ou timestamps incompletos.
   * O bloco de sincronização é exibido somente após a resolução da primeira busca bem-sucedida.

---

## 7. Requisitos Técnicos

1. **RT-01 — Fluxo Único Centralizado de Busca:**
   * Todas as ações (carga inicial, atualização periódica, atualização manual e retry) devem utilizar a mesma função `fetchStreamers` no [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx), mantendo a ordenação automática (`sortStreamers` do Plano 00004) e a paginação inalteradas.
2. **RT-02 — Cálculo Anti-Drift e Sincronização de Visibilidade:**
   * O tempo restante deve ser calculado a cada segundo a partir da diferença:
     ```javascript
     const remaining = Math.max(0, Math.ceil((nextUpdateAtRef.current - Date.now()) / 1000));
     ```
   * Adicionar escuta ao evento `visibilitychange`: quando o usuário retornar à aba (`document.visibilityState === 'visible'`), se o timestamp alvo já tiver expirado (`Date.now() >= nextUpdateAtRef.current`), o disparo da atualização é acionado de imediato.
3. **RT-03 — Cleanup Rigoroso no Ciclo de Vida do React:**
   * Limpar o timer ativo (`clearInterval`) no retorno do `useEffect`.
   * Cancelar requisições pendentes via `AbortController` ao desmontar o componente, tratando `AbortError` silenciosamente sem exibir erro ao usuário.
4. **RT-04 — Estado Numérico para Timestamp:**
   * Armazenar o momento da atualização como timestamp numérico (`lastUpdated: number | null`). A formatação textual em `pt-BR` deve ocorrer exclusivamente na apresentação.
5. **RT-05 — Zero Dependências Externas:**
   * Utilizar exclusivamente recursos nativos do JavaScript (`Date`, `toLocaleDateString`, `toLocaleTimeString`, `setInterval`, `clearInterval`, `AbortController`) e React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`).

---

## 8. Arquitetura Proposta e Fluxos de Dados

### 8.1. Arquitetura do Pipeline Centralizado

```
             ┌──────────────────────────────────────────────┐
             │            GATILHOS DE ATUALIZAÇÃO           │
             │                                              │
             │  • Carga Inicial (Montagem do Componente)    │
             │  • Timer Automático (secondsLeft === 0)      │
             │  • Retorno de Aba Inativa (visibilitychange) │
             │  • Clique Manual ("Atualizar agora")         │
             │  • Botão de Retry (após erro inicial)        │
             └──────────────────────┬───────────────────────┘
                                    │
                                    ▼
             ┌──────────────────────────────────────────────┐
             │       LOCK SÍNCRONO: isFetchingRef.current   │
             │       (Se true ➔ descarta chamadas paralelas)│
             └──────────────────────┬───────────────────────┘
                                    │
                                    ▼
             ┌──────────────────────────────────────────────┐
             │      fetchStreamers(isBackgroundRefresh)     │
             │      1. fetch('https://api.chess.com/...')   │
             │      2. sortStreamers(data.streamers)        │
             └──────────────────────┬───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
               [ SUCESSO ]                       [ ERRO ]
                    │                               │
     1. setStreamers(sortedData)        A. Carga Inicial:
     2. setLastUpdated(Date.now())         ➔ Exibe ErrorState com Retry
     3. nextUpdateAtRef = now + 300s    B. Atualização em Segundo Plano:
     4. setSecondsLeft(300)                ➔ Mantém streamers e lastUpdated
     5. isFetchingRef = false              ➔ Reagenda tentativa para 60s
                                           ➔ isFetchingRef = false
```

---

## 9. Responsabilidade dos Estados no `App.jsx`

| Identificador | Tipo | Responsabilidade |
|---|---|---|
| `streamers` | `Array` (existente) | Lista de streamers recebida e ordenada da API |
| `loading` | `boolean` (existente) | `true` exclusivamente durante a carga inicial da aplicação |
| `isRefreshing` | `boolean` (novo) | `true` durante atualizações em segundo plano (automáticas ou manuais) |
| `error` | `string \| null` (existente) | Mensagem de erro de conexão/API |
| `lastUpdated` | `number \| null` (novo) | Timestamp numérico da última requisição bem-sucedida (`null` antes do primeiro sucesso) |
| `secondsLeft` | `number` (novo) | Segundos restantes até a próxima atualização (`300` a `0`), utilizado para renderizar o contador |
| `nextUpdateAtRef` | `useRef(number \| null)` (novo) | Timestamp alvo da próxima atualização automática (sem provocar re-renders desnecessários na atribuição) |
| `isFetchingRef` | `useRef(boolean)` (novo) | Lock síncrono mutável que impede requisições concorrentes ou simultâneas |
| `abortControllerRef`| `useRef(AbortController \| null)` (novo)| Referência para controle e cancelamento seguro de requisições de rede no unmount |

---

## 10. Estratégia de Timers e Resiliência a Background

### 10.1. Mitigação de Throttling e Drift
Navegadores reduzem a prioridade de timers em abas inativas. Por isso, a contagem não depende de decrementos unitários cegos (`seconds - 1`), mas da diferença contra o relógio do sistema:

```javascript
const tick = () => {
  if (!nextUpdateAtRef.current) return;
  const now = Date.now();
  const diff = Math.max(0, Math.ceil((nextUpdateAtRef.current - now) / 1000));
  setSecondsLeft(diff);

  if (diff === 0) {
    triggerUpdate(true); // Atualização automática periódica
  }
};
```

### 10.2. Evento `visibilitychange`
Para garantir que o usuário veja dados atualizados ao retornar a uma aba que ficou muito tempo em segundo plano:
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && nextUpdateAtRef.current) {
      const now = Date.now();
      if (now >= nextUpdateAtRef.current) {
        triggerUpdate(true);
      } else {
        setSecondsLeft(Math.max(0, Math.ceil((nextUpdateAtRef.current - now) / 1000)));
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [triggerUpdate]);
```

---

## 11. Estratégia de Prevenção de Concorrência

1. **Lock Síncrono no Início da Execução:**
   ```javascript
   if (isFetchingRef.current) return;
   isFetchingRef.current = true;
   ```
2. **Liberação Garantida no Bloco `finally`:**
   ```javascript
   try {
     // chamada fetch e ordenação
   } finally {
     isFetchingRef.current = false;
     setLoading(false);
     setIsRefreshing(false);
   }
   ```
3. **Estado `disabled` no Botão:**
   O botão `"Atualizar agora"` recebe `disabled={isRefreshing || loading}`.

---

## 12. Política Explícita de Tratamento de Erros

| Cenário | Comportamento da Interface | Comportamento do Ciclo e Dados |
|---|---|---|
| **Erro na Carga Inicial** | Renderiza `<ErrorState message={error} onRetry={handleRetry} />` | `lastUpdated` permanece `null`; contador permanece inativo |
| **Erro em Atualização Automática** | Mantém a lista atual visível; exibe alerta discreto ou badge de aviso | `lastUpdated` anterior é preservado; agenda retry automático em **60 segundos** (`nextUpdateAt = now + 60s`) |
| **Erro em Atualização Manual** | Mantém a lista atual visível; botão volta a ficar habilitado | `lastUpdated` anterior é preservado; agenda tentativa em **60 segundos** ou aguarda novo clique do usuário |

---

## 13. Formatação de Timestamp e Apresentação

Para atender rigorosamente ao formato `"Atualizado em DD/MM/AAAA às HH:MM"` sem depender de bibliotecas externas:

```javascript
const formatLastUpdated = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('pt-BR');
  const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Atualizado em ${datePart} às ${timePart}`;
};
```

Para o contador regressivo em `MM:SS`:
```javascript
const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
```

---

## 14. Interface e Posicionamento Visual

As informações de sincronização serão agrupadas em uma barra de status discreta e responsiva (`.sync-bar`), integrada ao cabeçalho no [`src/components/Header.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/components/Header.jsx):

```jsx
{lastUpdated && (
  <div className="sync-bar">
    <div className="sync-info">
      <span className="sync-timestamp">{formatLastUpdated(lastUpdated)}</span>
      <span className="sync-separator" aria-hidden="true">•</span>
      <span className="sync-countdown">
        Próxima atualização em {formatCountdown(secondsLeft)}
      </span>
    </div>

    <button
      type="button"
      className="btn-sync-refresh"
      onClick={onRefresh}
      disabled={isRefreshing || loading}
      aria-busy={isRefreshing}
    >
      <svg
        className={`sync-icon ${isRefreshing ? 'is-spinning' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
      <span>{isRefreshing ? 'Atualizando...' : 'Atualizar agora'}</span>
    </button>
  </div>
)}
```

---

## 15. Acessibilidade

* **Ausência de Poluição Sonora para Leitores de Tela:**
  * O contador regressivo de segundos não utiliza `aria-live`, impedindo anúncios ininterruptos a cada segundo.
  * O anúncio de atualização bem-sucedida ou falha pode ser feito através de feedback textual do estado.
* **Semântica do Botão:**
  * `<button type="button">` com texto visível claro (`"Atualizar agora"` / `"Atualizando..."`), estado `disabled` nativo e `aria-busy={isRefreshing}`.
  * Ícone SVG decorativo com `aria-hidden="true"`.
  * Anel de foco `:focus-visible` com contraste aprovado nos temas Dark e Light.

---

## 16. Performance e Ciclo de Renderização

* **Execução do Timer:** O tick de 1 segundo executa uma subtração aritmética $O(1)$ e atualiza `secondsLeft`.
* **Escopo de Renderização:** O estado no `App` atualiza os componentes filhos sem disparar novas chamadas de API ou reprocessamentos pesados, já que a lista de streamers permanece memorizada no estado até a chegada de novo payload.
* **Volume de Rede:** 1 requisição a cada 5 minutos (12 requisições por hora em repouso), em total conformidade com as diretrizes de uso da API do Chess.com.

---

## 17. Escopo

### Dentro do Escopo
* Estado e timestamp numérico da última atualização bem-sucedida formatado em `pt-BR`.
* Ciclo de atualização periódica automática de 5 minutos (300 segundos).
* Contador regressivo `MM:SS` com algoritmo baseado em timestamp alvo e evento `visibilitychange`.
* Botão de atualização manual imediata com estado de carregamento e desabilitação.
* Lock síncrono centralizado contra requisições simultâneas ou concorrentes.
* Política de erro de atualização em segundo plano (preservação de dados e retry em 60s).
* Limpeza de timers e cancelamento com `AbortController` no unmount.
* Estilização da barra de sincronização no `App.css` compatível com Dark e Light.

### Fora do Escopo
* WebSockets, Server-Sent Events ou polling com frequência inferior a 1 minuto.
* Banco de dados local (IndexedDB), Service Workers ou notificações push do sistema operacional.
* Alterações no algoritmo de ordenação do Plano 00004.
* Redesign geral do cabeçalho ou dos cards.

---

## 18. Mapeamento de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/App.jsx` | Modificar | Gerenciar ciclo de 5 minutos, timestamps, timer anti-drift, lock síncrono e repassar props ao Header |
| `src/components/Header.jsx` | Modificar | Renderizar a barra `.sync-bar` com timestamp em `pt-BR`, contador `MM:SS` e botão "Atualizar agora" |
| `src/App.css` | Modificar | Estilizar `.sync-bar`, `.btn-sync-refresh`, ícone SVG e animação de rotação |
| `blueprint/plans/00005-atualizacao-automatica-streamers.md` | Manter/Atualizar | Documento técnico oficial do Plano 00005 |

---

## 19. Critérios de Aceitação (CA-01 a CA-14)

| ID | Critério | Descrição | Validação |
|---|---|---|---|
| **CA-01** | **Timestamp de Última Atualização** | Exibe `"Atualizado em DD/MM/AAAA às HH:MM"` após uma busca bem-sucedida. | Inspecionar texto exibido após a conclusão da busca. |
| **CA-02** | **Atualização Automática de 5 Minutos** | Nova busca é disparada automaticamente após 300 segundos da última atualização bem-sucedida. | Validar chamada de rede no término do ciclo. |
| **CA-03** | **Formato do Contador Regressivo** | O contador exibe o tempo no formato `MM:SS` decrementando a cada segundo. | Inspecionar a contagem visual de `05:00` a `00:00`. |
| **CA-04** | **Sincronização Anti-Drift e Visibilidade**| Retornar à aba após período em segundo plano recalcula o tempo real ou dispara a busca se o prazo expirou. | Minimizar aba e verificar sincronia com o relógio do sistema. |
| **CA-05** | **Atualização Manual Imediata** | Clicar em "Atualizar agora" dispara a busca de imediato sem aguardar os 5 minutos. | Clicar no botão e inspecionar a requisição na aba Network. |
| **CA-06** | **Reset do Ciclo de 5 Minutos** | Toda atualização com sucesso reinicia o contador regressivo em `05:00`. | Verificar o retorno do contador para `05:00` após sucesso manual ou automático. |
| **CA-07** | **Prevenção de Concorrência** | Cliques múltiplos rápidos não geram requisições duplicadas ou simultâneas. | Executar cliques consecutivos rápidos e validar que apenas 1 requisição ocorre. |
| **CA-08** | **Preservação de Dados em Falha de Refresh**| Falha em atualização periódica/manual em segundo plano mantém a lista e o timestamp anterior. | Simular erro de rede durante refresh e checar que os dados permanecem na tela. |
| **CA-09** | **Reagendamento após Falha de Refresh**| Falha em atualização automática em segundo plano agenda nova tentativa para 60 segundos. | Verificar que o ciclo não para permanentemente após erro. |
| **CA-10** | **Continuidade do Retry Inicial** | Botão de retry em falha de carga inicial continua operando normalmente. | Testar retry no `ErrorState` inicial. |
| **CA-11** | **Cleanup no Unmount** | Timers e requisições pendentes são cancelados na desmontagem do componente sem memory leak. | Inspecionar retorno de cleanup nos efeitos. |
| **CA-12** | **Tratamento de Primeira Carga** | O bloco de sincronização não exibe dados antes da primeira resposta com sucesso. | Inspecionar a tela durante `loading === true`. |
| **CA-13** | **Não-Regressão Funcional Geral** | Ordenação do Plano 00004, contadores do Plano 00003, paginação e temas continuam 100% íntegros. | Validar A-Z, badges, navegação de páginas e temas Dark/Light. |
| **CA-14** | **Compilação do Build** | O projeto compila com sucesso via `npm run build` com código de saída 0. | Executar `npm run build` no terminal. |

---

## 20. Matriz de Testes Manuais

| Cenário | Entrada / Ação | Resultado Esperado |
|---|---|---|
| **Carga Inicial com Sucesso** | Carregar a página pela 1ª vez | Carrega dados, ordena lista, exibe timestamp e inicia contador em `05:00` |
| **Contagem Normal** | Observar tela por 10 segundos | Contador decrementa de forma suave a cada segundo (`05:00` ➔ `04:59` ➔ `04:58`...) |
| **Disparo Automático no 00:00** | Contador atinge `00:00` | Dispara busca, ativa `isRefreshing`, atualiza lista e reseta para `05:00` |
| **Disparo Manual** | Clicar em "Atualizar agora" aos `03:40` | Dispara requisição imediatamente, atualiza lista e reseta contador para `05:00` |
| **Clique Concorrente com Timer Zero** | Usuário clica no momento exato em que o timer atinge `00:00` | Lock síncrono impede requisição dupla; apenas uma chamada é executada |
| **Múltiplos Cliques Rápidos** | Clicar repetidamente no botão manual | Botão fica `disabled` e apenas uma requisição trafega na rede |
| **Aba em Segundo Plano (Parcial)** | Mudar de aba por 2 minutos e retornar | Ao voltar, o contador exibe o tempo restante real (ex: `03:00`), sem atraso |
| **Aba em Segundo Plano (Total)** | Mudar de aba por 6 minutos e retornar | Ao voltar, detecta prazo expirado e dispara a atualização imediatamente |
| **Erro na Atualização Automática** | API retorna erro 500 no refresh automático | Mantém a lista atual e o `lastUpdated` anterior; agenda novo retry para 60s |
| **Erro na Atualização Manual** | API retorna erro durante clique manual | Mantém os dados na tela; botão volta a ficar habilitado para nova tentativa |
| **Erro na Carga Inicial** | API inacessível no 1º acesso | Renderiza `ErrorState` com botão "Tentar Novamente" |
| **Unmount durante Requisição** | Desmontar componente durante fetch | `AbortController` cancela a requisição sem erros no console |
| **Troca de Páginas** | Navegar para página 2 ou 3 | A barra de sincronização permanece ativa no topo sem interromper a paginação |
| **Alternância de Tema** | Alternar entre Dark e Light | Barra de sincronização e botão adaptam suas cores aos tokens do tema ativo |
| **Não-Regressão da Ordenação** | Após atualização automática ou manual | Streamers continuam perfeitamente ordenados (AO VIVO primeiro, A-Z) |

---

## 21. Análise de Riscos e Mitigações

| Severidade | Risco Identificado | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **ALTO** | **Timers múltiplos e concorrentes em re-renders** | Memory leaks e múltiplos disparos de rede | Utilizar `useEffect` com dependências controladas e função de cleanup com `clearInterval`. |
| **ALTO** | **Disparo concorrente entre timer e clique manual** | Requisições duplicadas e condições de corrida | Lock síncrono via `isFetchingRef.current` bloqueando novas chamadas enquanto uma estiver em curso. |
| **MÉDIO** | **Drift do contador por throttling em abas inativas** | Contador dessincronizado do tempo real | Cálculo a partir de timestamp absoluto (`nextUpdateAtRef.current - Date.now()`) e listener de `visibilitychange`. |
| **MÉDIO** | **Tela piscar em branco durante atualizações de fundo** | Degradação da experiência de uso | Diferenciar `loading` (carga inicial com spinner central) de `isRefreshing` (atualização de fundo mantendo cards na tela). |
| **BAIXO** | **Formatação de data inconsistente com a especificação** | Exibição visual fora do padrão `pt-BR` | Função explícita combinando `toLocaleDateString` e `toLocaleTimeString` para compor `"Atualizado em ... às ..."`. |

---

## 22. Dependências

* Nenhuma dependência externa será instalada.
* Funcionalidade puramente implementada com APIs nativas do navegador e React Hooks.

---

## 23. Plano de Implementação por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEQUÊNCIA DE FASES DO PLANO 00005                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fase 1: Estruturação de Estados, Lock e Pipeline Centralizado no App.jsx     │
│ Fase 2: Implementação do Timer Anti-Drift e Listener de Visibilidade        │
│ Fase 3: Integração da Barra de Sincronização e Botão Manual no Header       │
│ Fase 4: Estilização da Barra e Micro-animações no App.css                   │
│ Fase 5: Validação Completa, Testes de Concorrência, Não-Regressão e Build   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das Fases

#### Fase 1 — Estruturação de Estados, Lock e Pipeline Centralizado no App.jsx
* **Objetivo:** Adicionar os estados `lastUpdated`, `isRefreshing`, `secondsLeft`, `nextUpdateAtRef`, `isFetchingRef` e `abortControllerRef` no `src/App.jsx`, unificando a função `fetchStreamers` para suportar cargas iniciais e atualizações de fundo com lock síncrono e preservação de dados em falha.
* **Arquivos Envolvidos:** `src/App.jsx` (Modificar)
* **Sugestão de Commit:** `feat(sync): estruturar pipeline centralizado de atualizacao e estados de sincronizacao no App`

#### Fase 2 — Implementação do Timer Anti-Drift e Listener de Visibilidade
* **Objetivo:** Implementar o efeito de contagem regressiva baseado no timestamp alvo, tratamento de evento `visibilitychange`, disparo automático no término do ciclo de 5 minutos e reagendamento para 60 segundos em caso de falha.
* **Arquivos Envolvidos:** `src/App.jsx` (Modificar)
* **Sugestão de Commit:** `feat(sync): implementar timer anti-drift de 5 minutos e listener de visibilidade`

#### Fase 3 — Integração da Barra de Sincronização e Botão Manual no Header
* **Objetivo:** Atualizar o `src/components/Header.jsx` para receber as props de sincronização, formatar o timestamp em `pt-BR`, renderizar o contador `MM:SS` e o botão acessível "Atualizar agora" com suporte a teclado e `aria-busy`.
* **Arquivos Envolvidos:** `src/components/Header.jsx`, `src/App.jsx` (Modificar)
* **Sugestão de Commit:** `feat(header): integrar barra de sincronizacao e botao de atualizacao manual`

#### Fase 4 — Estilização da Barra e Micro-animações no App.css
* **Objetivo:** Estilizar a barra de sincronização `.sync-bar`, botão `.btn-sync-refresh`, estados hover/disabled, ícone SVG com animação de rotação durante `isRefreshing` e layout responsivo para Dark e Light.
* **Arquivos Envolvidos:** `src/App.css` (Modificar)
* **Sugestão de Commit:** `style(sync): estilizar barra de sincronizacao e micro-animacoes do botao`

#### Fase 5 — Validação Completa, Testes de Concorrência, Não-Regressão e Build
* **Objetivo:** Executar a bateria de testes manuais da Seção 20, validar todos os critérios CA-01 a CA-14 e verificar o build de produção (`npm run build`).
* **Arquivos Envolvidos:** Nenhum (fase estritamente de validação).

---

## 24. Estratégia de Validação

* Testar a contagem regressiva segundo a segundo.
* Testar a atualização manual e o reset imediato para 5 minutos.
* Testar a resiliência a abas em segundo plano e evento `visibilitychange`.
* Validar que nenhuma funcionalidade dos Planos 00001, 00002, 00003 e 00004 sofreu regressão.
* Executar `npm run build` com código de saída 0.

---

## 25. Checklist Final

- [x] Nome do arquivo padronizado (`00005-atualizacao-automatica-streamers.md`).
- [x] Status definido como `Revisado / Pronto para Implementação`.
- [x] Ordenação do Plano 00004 tratada como pré-requisito estável e intocada.
- [x] Timestamp formatado em `pt-BR` exclusivamente na apresentação.
- [x] Algoritmo anti-drift baseado em timestamp alvo (`nextUpdateAtRef`) e `visibilitychange`.
- [x] Lock centralizado contra requisições simultâneas via `useRef(isFetchingRef)`.
- [x] Política explícita de erro (preservação de dados e retry em 60 segundos).
- [x] Cleanup completo de timers e cancelamento com AbortController no unmount.
- [x] Acessibilidade revisada (sem `aria-live` no contador de segundos).
- [x] Matriz de testes expandida cobrindo concorrência, visibilidade e erros.
- [x] 14 critérios de aceitação objetivos e testáveis.

---

## 26. Declaração de Não Implementação

Nenhum arquivo de código da aplicação (`src/`, `index.html`, etc.) foi alterado ou implementado nesta etapa. O escopo desta atividade restringiu-se exclusivamente à revisão técnica aprofundada e consolidação deste documento de planejamento oficial.
