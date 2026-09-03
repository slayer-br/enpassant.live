# Plano de Implementação — EnPassant.live

**Plano:** 00004  
**Status:** Revisado / Pronto para Implementação  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00003 & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00004 — Ordenação Automática de Streamers por Status e Nome de Usuário**

---

## 2. Data e Status

* **Data:** 2026-09-03
* **Status:** Revisado / Pronto para Implementação

---

## 3. Objetivo

Especificar tecnicamente a implementação da ordenação automática da lista de streamers no **EnPassant.live**, priorizando primeiramente os criadores que estão transmitindo **AO VIVO** (`is_live === true`) e, em segundo nível, ordenando por **nome de usuário** (`username` em ordem A-Z, insensível a maiúsculas, minúsculas e acentos na comparação base), tanto para o grupo de streamers ao vivo quanto para o grupo de streamers offline.

---

## 4. Contexto

O **EnPassant.live** consome o endpoint público do Chess.com (`https://api.chess.com/pub/streamers`), que retorna uma lista com centenas de streamers parceiros. Atualmente, os streamers são exibidos na ordem bruta retornada pelo payload da API. Embora a API do Chess.com tenda a colocar criadores com `is_live: true` nas primeiras posições, a ordem interna dos nomes dentro de cada grupo não é alfabética.

---

## 5. Problema Atual

1. **Desorganização na Busca Visual:** O usuário que procura um streamer específico precisa navegar aleatoriamente entre os cards de cada página, pois os nomes não seguem ordem alfabética.
2. **Dependência da Ordem do Payload:** A ordem de exibição depende exclusivamente da listagem arbitrária da API externa, o que pode gerar inconsistências caso a API altere sua ordenação interna entre consultas.

---

## 6. Solução Proposta

1. **Ordenação em Dois Níveis:**
   * **Nível 1 (Status):** Streamers com `is_live === true` têm precedência sobre streamers com `is_live !== true`.
   * **Nível 2 (Alfabético):** Em caso de mesmo status, os streamers são ordenados pelo campo `username` em ordem crescente (A-Z) utilizando `localeCompare` com sensibilidade base (`{ sensitivity: 'base', numeric: true }`) e critério estrito de desempate.
2. **Ponto Único de Aplicação:** A ordenação é realizada no momento em que a resposta da API é recebida e convertida em JSON na função `fetchStreamers()` do [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx), antes de persistir a lista no estado `setStreamers`.
3. **Preservação Total de Contadores e Paginação:** Como a ordenação apenas organiza as posições dos objetos no array de estado `streamers`, todos os contadores (`liveCount`, `offlineCount`, `totalCount`) e a lógica de paginação em memória (`slice(startIndex, startIndex + ITEMS_PER_PAGE)`) continuam operando de forma 100% íntegra e sem necessidade de estados adicionais.

---

## 7. Análise da Implementação Atual

No arquivo [`src/App.jsx`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/src/App.jsx), a função `fetchStreamers` recebe os dados da seguinte forma:

```javascript
const response = await fetch(API_URL, { signal });
if (!response.ok) {
  throw new Error(`Erro na requisição: status ${response.status}`);
}
const data = await response.json();
const streamersList = Array.isArray(data.streamers) ? data.streamers : [];
setStreamers(streamersList);
```

Após o carregamento, a paginação fatia `streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE)`. Portanto, aplicar a ordenação na lista `streamersList` antes de chamar `setStreamers()` garante que todas as páginas e contadores reflitam a nova ordenação de forma estável e consistente.

---

## 8. Regras de Negócio e Critérios de Ordenação

1. **Regra de Precedência (Nível 1 - Status):**
   * Somente o valor booleano estrito `is_live === true` é considerado como status **AO VIVO**.
   * Qualquer outro valor (`false`, `null`, `undefined`, `0`, `"true"`, etc.) é considerado como status **OFFLINE**.
   * Se `Streamer A` for AO VIVO e `Streamer B` for OFFLINE, `Streamer A` vem **antes** (`-1`).
   * Se `Streamer A` for OFFLINE e `Streamer B` for AO VIVO, `Streamer A` vem **depois** (`1`).
2. **Regra de Desempate Alfabético (Nível 2 - Nome de Usuário):**
   * Se ambos estiverem no mesmo grupo de status, os nomes são comparados via `localeCompare` com `{ sensitivity: 'base', numeric: true }`, o que ignora diferenças de caixa alta/baixa e acentuação primária na comparação principal (ex: `"Álex"`, `"alex"` e `"Alex"` tratados na mesma raiz alfabética, e `"streamer2"` antes de `"streamer10"`).
   * **Desempate Secundário:** Caso a comparação com `sensitivity: 'base'` resulte em `0`, realiza-se uma comparação estrita de fallback (`nameA.localeCompare(nameB, 'pt-BR')`) para diferenciar variações de caixa ou acentuação.
   * **Estabilidade do ECMAScript:** Caso dois streamers possuam exatamente o mesmo `username`, ambos os critérios retornarão `0`, e a ordenação preservará a ordem relativa de origem do array devido à estabilidade garantida do `Array.prototype.sort()`.
3. **Resiliência e Tratamento Defensivo:**
   * O tratamento `String(a.username || '')` garante conversão segura para string caso a propriedade `username` esteja ausente, nula ou venha com tipo não-string em payloads anômalos, prevenindo qualquer exceção de execução (`TypeError`).

---

## 9. Arquitetura e Ponto de Ordenação

```
                     fetch('https://api.chess.com/pub/streamers')
                                     │
                                     ▼
                            data.streamers (Array)
                                     │
                                     ▼
                     Função de Comparação Defensiva
                     1. is_live === true (AO VIVO primeiro)
                     2. localeCompare(nameB, 'pt-BR', { sensitivity: 'base', numeric: true })
                     3. Desempate estrito localeCompare(nameB, 'pt-BR')
                                     │
                                     ▼
                           Array Ordenado Estável
                                     │
                                     ▼
                         setStreamers(sortedList)
                                     │
                  ┌──────────────────┴──────────────────┐
                  │                                     │
         Cálculo de Contadores                 Fatiamento Paginado
         • totalCount = streamers.length       • Página 1: itens 0 a 11
         • liveCount = filter(=== true)        • Página 2: itens 12 a 23
         • offlineCount = total - live         • ...
```

---

## 10. Responsabilidades por Arquivo

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/App.jsx` | Modificar | Implementar o algoritmo de ordenação defensivo dentro da função `fetchStreamers()` antes de `setStreamers` |
| `blueprint/plans/00004-ordenacao-streamers-status-e-nome.md` | Manter/Atualizar | Documento oficial de planejamento da melhoria de ordenação |

---

## 11. Comparação e Algoritmo de Ordenação

A função de comparação oficial a ser integrada no `src/App.jsx`:

```javascript
const sortStreamers = (list) => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const isLiveA = a.is_live === true;
    const isLiveB = b.is_live === true;

    // 1. Prioridade por status (AO VIVO primeiro)
    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;

    // 2. Ordem alfabética insensível a maiúsculas/minúsculas e acentos
    const nameA = String(a.username || '');
    const nameB = String(b.username || '');
    const comparison = nameA.localeCompare(nameB, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });

    // 3. Desempate estrito se houver equivalência de base
    if (comparison === 0) {
      return nameA.localeCompare(nameB, 'pt-BR');
    }

    return comparison;
  });
};
```

---

## 12. Impacto na Paginação e Contadores

* **Contadores (`liveCount`, `offlineCount`, `totalCount`):** Permanecem exatamente iguais, pois a quantidade total de elementos e a quantidade de cada status não sofrem alterações pela reordenação de posições no array.
* **Paginação:** As páginas iniciais conterão todos os streamers AO VIVO ordenados de A a Z. Assim que os criadores ao vivo terminarem, iniciarão os streamers OFFLINE, também ordenados de A a Z.
* **Reset de Página no Carregamento:** O `setCurrentPage(1)` já existente em `fetchStreamers()` garante que o usuário sempre inicie no topo da lista ordenada ao carregar ou recarregar os dados.

---

## 13. Acessibilidade e UX

* **Previsibilidade:** O usuário pode prever facilmente a localização de qualquer streamer pelo nome, tornando a busca visual e a exploração confortáveis.
* **Leitores de Tela:** O fluxo de navegação por teclado e tecnologias assistivas segue uma ordem alfabética coerente e contínua.
* **Ciclo de Renderização Suave:** A ordenação é aplicada antes de salvar a lista no estado `streamers`, evitando uma etapa adicional de reordenação após a renderização dos dados.

---

## 14. Performance e Complexidade Computacional

* **Complexidade Temporal:** A ordenação com `Array.prototype.sort()` possui complexidade média assintótica esperada de $O(N \log N)$.
* **Complexidade Espacial:** $O(N)$ adicional devido à cópia rasa defensiva com `[...list]`.
* **Frequência de Execução:** A ordenação ocorre exclusivamente uma vez por chamada à API (no carregamento inicial e em cliques de retry). Não é executada a cada ciclo de renderização do componente, não requer `useMemo` e não introduz novos estados.
* O custo computacional é pequeno em relação às etapas de rede e parsing de JSON da aplicação.

---

## 15. Estados da Aplicação

* **Loading:** Inalterado.
* **Error:** Inalterado (o bloco `catch` trata falhas de rede sem tentar ordenar dados inexistentes).
* **Empty:** Se a API retornar lista vazia `[]`, a função retorna `[]` com segurança.
* **Success:** A lista é ordenada e apresentada de forma fluida.

---

## 16. Escopo

### Dentro do Escopo
* Implementar a ordenação prioritária por status (`is_live === true` primeiro) no `src/App.jsx`.
* Implementar a ordenação alfabética secundária por `username` (A-Z com `localeCompare`) no `src/App.jsx`.
* Validar a ordenação de criadores ao vivo e offline em todas as páginas da paginação.
* Validar que não há regressão de temas, contadores, links ou requisições.

---

## 17. Fora de Escopo

* Criação de controles visuais de ordenação na interface (ex: botões de inverter para Z-A ou dropdowns de ordenação manual).
* Filtros dinâmicos adicionais por status ou busca por texto.
* Modificações no CSS, Header, StreamerCard ou Pagination.

---

## 18. Divisão do Plano por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEQUÊNCIA DE FASES DO PLANO 00004                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fase 1: Implementação da Função de Ordenação no App.jsx                     │
│ Fase 2: Validação Completa, Testes de Não-Regressão e Build                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 19. Detalhamento das Fases

### Fase 1 — Implementação da Função de Ordenação no App.jsx

#### Objetivo
Integrar o algoritmo de ordenação de dois níveis na função `fetchStreamers()` do `src/App.jsx`, ordenando a lista antes de disparar `setStreamers()`.

#### Tarefas
- [ ] No `src/App.jsx`, definir a função auxiliar de ordenação `sortStreamers`:
  ```javascript
  const sortStreamers = (list) => {
    if (!Array.isArray(list)) return [];

    return [...list].sort((a, b) => {
      const isLiveA = a.is_live === true;
      const isLiveB = b.is_live === true;

      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;

      const nameA = String(a.username || '');
      const nameB = String(b.username || '');
      const comparison = nameA.localeCompare(nameB, 'pt-BR', {
        sensitivity: 'base',
        numeric: true,
      });

      if (comparison === 0) {
        return nameA.localeCompare(nameB, 'pt-BR');
      }

      return comparison;
    });
  };
  ```
- [ ] No `fetchStreamers()`, ordenar a lista antes de salvar no estado:
  ```javascript
  const sortedStreamers = sortStreamers(streamersList);
  setStreamers(sortedStreamers);
  ```

#### Arquivos Envolvidos
* `src/App.jsx` (Modificar)

#### Critérios de Conclusão
* Streamers ao vivo aparecem antes de streamers offline.
* Dentro de cada grupo, streamers aparecem em ordem alfabética por username.

#### Sugestão de Commit (posterior)
```bash
git add src/App.jsx
git commit -m "feat(streamers): ordenar lista por status ao vivo e nome de usuario"
```

---

### Fase 2 — Validação Completa, Testes de Não-Regressão e Build

#### Objetivo
Validar a ordem dos streamers em todas as páginas, checar a integridade dos contadores e dos temas Dark/Light, e executar o build de produção (`npm run build`).

#### Regra de Execução da Fase 2
* Fase estritamente de validação. Não gera commit automático caso nenhum arquivo seja modificado.
* Caso ocorra qualquer falha, o problema deve ser relatado com proposta de correção para autorização prévia antes de qualquer alteração de código.

#### Tarefas
- [ ] Validar que os streamers AO VIVO aparecem ordenados de A a Z nas páginas iniciais.
- [ ] Validar a transição entre o último streamer AO VIVO e o primeiro streamer OFFLINE.
- [ ] Validar que os streamers OFFLINE aparecem ordenados de A a Z nas páginas seguintes.
- [ ] Validar casos limites da matriz de testes (nomes com números, acentos, caixa mista).
- [ ] Validar que os contadores (`liveCount`, `offlineCount`, `totalCount`) permanecem precisos.
- [ ] Validar compilação do build de produção via `npm run build`.

#### Critérios de Conclusão
* Todos os critérios CA-01 a CA-08 com status `PASS`.
* Build com código de saída 0.

---

## 20. Matriz de Testes Manuais

| Cenário | Entrada / Condição | Resultado Esperado |
|---|---|---|
| **Grupo Ao Vivo Ordenado** | Lista contendo streamers ao vivo: `['Zeta', 'Alpha', 'Beta']` | Cards ao vivo aparecem na ordem: `Alpha`, `Beta`, `Zeta` |
| **Grupo Offline Ordenado** | Lista contendo streamers offline: `['Zara', 'Ana', 'Bruno']` | Cards offline aparecem na ordem: `Ana`, `Bruno`, `Zara` |
| **Transição de Status** | Último streamer ao vivo e primeiro streamer offline | O último streamer ao vivo antecede imediatamente o primeiro streamer offline |
| **Case Insensitive & Acentos**| Nomes com maiúsculas/minúsculas e acentos (`'Álex'`, `'alex'`, `'Alex'`) | Comparação base trata os nomes de forma uniforme sem jogar minúsculas/acentos para o fim da lista |
| **Números no Username** | Nomes contendo numerais (`'streamer2'`, `'streamer10'`) | Ordenação natural (`streamer2` antes de `streamer10`) devido a `numeric: true` |
| **Username Ausente / Nulo** | Objeto `{ is_live: true }` ou `{ is_live: true, username: null }` | Não lança exceção; tratado defensivamente como string vazia |
| **Username Não-String** | Objeto `{ is_live: true, username: 123 }` | Não lança `TypeError`; convertido via `String()` |
| **`is_live` Não-Booleano** | Valores como `null`, `undefined`, `0`, `"true"`, `"false"` | Somente `is_live === true` é tratado como AO VIVO; os demais vão para o grupo OFFLINE |
| **Empate de Base** | Nomes equivalentes em base (`'Hikaru'`, `'hikaru'`) | Desempate estrito secundário aplicado; se idênticos, preservada ordem estável de origem |
| **Lista Vazia** | Array vazio `[]` | Retorna `[]` sem erros e renderiza `EmptyState` |
| **Sincronização de Contadores** | Total 741 streamers (ex: 30 ao vivo, 711 offline) | Contadores no Header exibem exatamente `30 AO VIVO`, `711 OFFLINE`, `741 STREAMERS` |
| **Paginação Consistente** | Navegar entre páginas da paginação | Continuidade alfabética perfeita entre os 12 cards de cada página |
| **Não-Regressão** | Temas Dark/Light, Botão de Retry, Links Twitch | Funcionamento idêntico sem alterações visuais ou quebras |

---

## 21. Critérios de Aceitação

| ID | Critério | Descrição | Validação |
|---|---|---|---|
| **CA-01** | **Prioridade de Status** | Todos os streamers com `is_live === true` são renderizados antes de qualquer streamer com `is_live !== true`. | Inspecionar a ordem de cards na listagem. |
| **CA-02** | **Ordem Alfabética de Criadores Ao Vivo** | O grupo de criadores ao vivo está ordenado alfabeticamente por `username` (A-Z). | Conferir os nomes dos cards nas primeiras páginas. |
| **CA-03** | **Ordem Alfabética de Criadores Offline** | O grupo de criadores offline está ordenado alfabeticamente por `username` (A-Z). | Conferir os nomes dos cards nas páginas seguintes. |
| **CA-04** | **Insensibilidade a Caixa e Acentuação** | A ordenação trata letras maiúsculas/minúsculas e acentuação primária com sensibilidade base (`localeCompare`). | Verificar que nomes iniciados por minúsculas ou acentos seguem a ordem alfabética natural. |
| **CA-05** | **Integridade de Contadores** | `liveCount`, `offlineCount` e `totalCount` no Header mantêm valores idênticos e precisos. | Comparar contadores do Header com a API. |
| **CA-06** | **Compatibilidade com Paginação** | A divisão de 12 cards por página preserva a sequência contínua da lista ordenada. | Navegar entre páginas e inspecionar a sequência. |
| **CA-07** | **Custo da Ordenação** | A ordenação ocorre uma única vez sobre a lista recebida pela `fetchStreamers()`, antes de `setStreamers()`, sem introdução de estado adicional, `useEffect` adicional ou reordenação a cada renderização. | Inspecionar a implementação do `App.jsx` e o fluxo de dados. |
| **CA-08** | **Não-Regressão Geral** | Funcionalidades dos Planos 00001, 00002 e 00003 permanecem 100% operacionais. | Testar build, temas e interações. |

---

## 22. Riscos e Mitigações

| Risco Identificado | Impacto | Estratégia de Mitigação |
|---|---|---|
| **Streamer com `username` ausente, nulo ou não-string** | Médio | Coerção defensiva explícita `String(a.username \|\| '')` antes de invocar `.localeCompare()`. |
| **Valores não-booleanos em `is_live` no payload** | Baixo | Comparação estrita `a.is_live === true`, tratando qualquer outro valor como offline. |
| **Empate de comparação com `sensitivity: 'base'`** | Baixo | Desempate secundário com `nameA.localeCompare(nameB, 'pt-BR')`, recorrendo à estabilidade natural do `sort()` para nomes idênticos. |
| **Mutação acidental do array original retornado** | Baixo | Uso de shallow copy `[...list].sort(...)` antes da ordenação. |

---

## 23. Estratégia de Git e Commits Sugeridos

A implementação seguirá a divisão em fases:

* **Fase 1:**
  ```bash
  git add src/App.jsx
  git commit -m "feat(streamers): ordenar lista por status ao vivo e nome de usuario"
  ```
* **Fase 2:** Sem commit automático (apenas se houver ajustes adicionais autorizados).

---

## 24. Checklist Final

- [x] Nome do arquivo padronizado (`00004-ordenacao-streamers-status-e-nome.md`).
- [x] Algoritmo defensivo com `String(username || '')` consistente em todas as seções.
- [x] Desempate de comparação base e estabilidade do `sort()` documentados com precisão.
- [x] Contadores e paginação 100% preservados.
- [x] CA-07 reformulado como critério técnico verificável.
- [x] Terminologia de UX e performance corrigidas (sem menções a "Zero FOUC" ou "< 2 ms").
- [x] Matriz de testes expandida com casos limites (nulos, não-strings, não-booleanos, números, empates).
- [x] Status atualizado para **Revisado / Pronto para Implementação**.

---

## 25. Declaração de Não Implementação

Nenhum arquivo de código da aplicação (`src/`, `index.html`, etc.) foi alterado ou implementado nesta etapa. O escopo desta atividade restringiu-se exclusivamente à elaboração e consolidação deste documento oficial de planejamento pós-revisão.
