# Plano de Implementação — EnPassant.live

**Plano:** 00003  
**Status:** Revisado / Pronto para Implementação  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Plano 00001 (`blueprint/plans/00001-implementacao-inicial-do-mvp.md`), Plano 00002 (`blueprint/plans/00002-sistema-de-temas-dark-light.md`) & Base de Código Atual  

---

## 1. Título

**Plano de Implementação 00003 — Indicadores de Status Offline e Contador Dinâmico no Header**

---

## 2. Data e Status

* **Data:** 2026-09-03
* **Status:** Revisado / Pronto para Implementação

---

## 3. Objetivo

Especificar tecnicamente a inclusão do indicador dinâmico **`N OFFLINE`** no cabeçalho da aplicação e a reformulação da identidade visual dos criadores de conteúdo com status **OFFLINE** para uma tonalidade de vermelho elegante, profissional e discreta, preservando integralmente o verde neon do status **AO VIVO**, o funcionamento da API, a paginação em memória e a compatibilidade total com os temas **Dark** e **Light**.

---

## 4. Contexto

O **EnPassant.live** consome a API pública do Chess.com (`https://api.chess.com/pub/streamers`) e lista centenas de criadores parceiros. No cabeçalho atual, são exibidos dois indicadores numéricos:
* `N AO VIVO` (em destaque verde)
* `N STREAMERS` (total de criadores)

Na listagem de streamers, os criadores com transmissão inativa (`is_live !== true`) utilizam atualmente uma paleta cinza neutra (`#6e7681` / `#656d76`). A presente melhoria tem por finalidade dar visibilidade imediata à proporção de streamers offline no topo da aplicação e uniformizar a semântica visual dos status através do par conceitual: **AO VIVO (Verde)** e **OFFLINE (Vermelho)**.

---

## 5. Problema Atual

1. **Ausência de Métrica Explícita de Offline:** O usuário visualiza o total de streamers e os que estão online, mas não tem um indicador direto da quantidade de canais offline sem fazer cálculo mental.
2. **Identidade Visual Neutra para Offline:** O status offline atual utiliza tons de cinza/ardósia, o que reduz o contraste semântico direto com o status online (verde) e não transmite com clareza imediata o estado de indisponibilidade da transmissão ao vivo.
3. **Equilíbrio de Layout no Header:** A inclusão de um terceiro badge de dados no cabeçalho exige atenção na distribuição espacial responsiva (mobile, tablet e desktop) para evitar quebras indesejadas com o botão de alternância de temas (Dark/Light).

---

## 6. Solução Proposta

1. **Cálculo Derivado de `offlineCount`:** Derivar no componente raiz `App.jsx` a quantidade de streamers offline subtraindo a quantidade de streamers ao vivo do total (`totalCount - liveCount`), garantindo matematicamente que `liveCount + offlineCount === totalCount` em uma única passagem de filtro, e repassando o valor como prop ao `<Header />`.
2. **Novo Badge no Header:** Inserir o badge `badge-offline-count` entre o badge de Live e o total de streamers, com a ordenação:
   ```text
   [ N AO VIVO ]   [ N OFFLINE ]   [ N STREAMERS ]   [ Toggle ]
   ```
3. **Nova Identidade Visual Vermelha (Tokens Semânticos):**
   * **Dark Theme:** Vermelho discreto e luminoso (`--accent-offline: #f87171;`) sobre fundo vinho sutil (`--badge-offline-bg: #2a1215;`).
   * **Light Theme:** Vermelho rubi refinado (`--accent-offline: #cf222e;`) sobre fundo vermelho claro suave (`--badge-offline-bg: #ffebe9;`).
   * **Validação WCAG:** As combinações finais de foreground/background deverão ser validadas para atendimento ao WCAG AA (mínimo de 4.5:1 para texto normal), realizando o ajuste dos tokens caso necessário.
4. **Atualização no `StreamerCard`:** Atualizar a badge `.status-offline` para utilizar os novos tokens semânticos vermelhos e incluir o ponto indicador `.dot-offline-sm` com `aria-hidden="true"` (sem animação pulsante, mantendo a exclusividade de atenção no status AO VIVO).
5. **Responsividade Otimizada:** Ajustar as regras flexíveis em `src/App.css` para assegurar que os 3 badges e o botão de tema quebrem com fluidez em dispositivos móveis sem sobreposição ou overflow horizontal.

---

## 7. Análise da Implementação Atual

* **`src/App.jsx`:**
  * Calcula em tempo de execução:
    ```javascript
    const totalCount = streamers.length;
    const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
    const offlineCount = totalCount - liveCount;
    ```
  * Repassa atualmente ao Header: `<Header liveCount={liveCount} totalCount={totalCount} theme={theme} onToggleTheme={toggleTheme} />`.
* **`src/components/Header.jsx`:**
  * Renderiza dentro de `.header-badges` os blocos `.badge-live-count` e `.badge-total-count`.
* **`src/components/StreamerCard.jsx`:**
  * Renderiza `.status-badge` com classe condicional `${is_live ? 'status-live' : 'status-offline'}` e `aria-label={is_live ? 'Transmitindo ao vivo' : 'Offline'}`.
* **`src/index.css`:**
  * Define `:root, [data-theme="dark"]` e `[data-theme="light"]` contendo `--accent-offline`, `--badge-offline-bg`, `--badge-live-bg`, etc.
* **`src/App.css`:**
  * Define regras visuais para `.badge-live-count`, `.badge-total-count`, `.pulse-dot`, `.status-live`, `.status-offline`, `.theme-toggle-btn` e breakpoints responsivos.

---

## 8. Regras de Negócio

1. **Status Oficial:**
   * `is_live === true` ➔ Streamer transmitindo ao vivo (**AO VIVO** — Verde).
   * Qualquer outro valor (falsy ou diferente de `true`) ➔ Streamer sem transmissão ativa (**OFFLINE** — Vermelho).
2. **Relação Matemática Estrita:**
   * A relação `liveCount + offlineCount === totalCount` é garantida pela definição `offlineCount = totalCount - liveCount`.
3. **Preservação de Outros Elementos:**
   * O botão da Twitch desabilitado (`.btn-twitch.btn-disabled` quando `twitch_url` for nulo) continuará neutro/acinzentado, distinguindo claramente "canal indisponível" de "streamer offline com canal válido".

---

## 9. Regra de Contagem

* A contagem de streamers offline é calculada exclusivamente sobre o **array completo de streamers carregados da API** (`streamers`), e **NUNCA** sobre a fatia paginada (`currentStreamers`).
* **Implementação Técnica Preferencial:**
  ```javascript
  const totalCount = streamers.length;
  const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
  const offlineCount = totalCount - liveCount;
  ```
* Esta implementação otimiza o processamento em uma única iteração com `.filter()` e garante que nenhum streamer seja contado duas vezes ou omitido.

---

## 10. Arquitetura

```
                     App.jsx (Estado Raiz: streamers, theme)
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
         Cálculos Derivados                  Renderização
         • totalCount = streamers.length     • LoadingState
         • liveCount = filter(=== true)      • ErrorState
         • offlineCount = total - live       • EmptyState
         • totalPages / currentStreamers     • StreamerGrid
                  │                          • Pagination
                  ▼                                   │
         Props para <Header />                        ▼
     (liveCount, offlineCount, totalCount)     <StreamerCard />
                                            (is_live: status-live/offline)
```

---

## 11. Responsabilidades por Arquivo

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/App.jsx` | Modificar | Calcular `offlineCount` (`totalCount - liveCount`) e repassar via prop para `<Header />` |
| `src/components/Header.jsx` | Modificar | Receber `offlineCount = 0` e renderizar o badge `.badge-offline-count` com ponto indicador |
| `src/index.css` | Modificar | Atualizar tokens `--accent-offline`, `--badge-offline-bg`, `--badge-offline-border` e `--accent-offline-glow` para os temas Dark e Light |
| `src/App.css` | Modificar | Estilizar `.badge-offline-count`, `.dot-offline`, `.status-offline`, `.dot-offline-sm` e ajustar espaçamento do Header |
| `src/components/StreamerCard.jsx` | Modificar | Incluir o ponto indicador estático `.dot-offline-sm` dentro do status badge offline |

---

## 12. Alterações no Header

O componente `src/components/Header.jsx` receberá a prop `offlineCount` e atualizará a seção `.header-badges`:

```jsx
<div className="header-badges">
  <div className="badge badge-live-count">
    <span className="pulse-dot" aria-hidden="true"></span>
    <span>{liveCount} AO VIVO</span>
  </div>
  <div className="badge badge-offline-count">
    <span className="dot dot-offline" aria-hidden="true"></span>
    <span>{offlineCount} OFFLINE</span>
  </div>
  <div className="badge badge-total-count">
    <span>{totalCount} STREAMERS</span>
  </div>
</div>
```

---

## 13. Alterações no StreamerCard

O componente `src/components/StreamerCard.jsx` preservará sua estrutura e atributos de acessibilidade atuais, adicionando o ponto indicador estático com `aria-hidden="true"` para offline:

```jsx
<span
  className={`status-badge ${is_live ? 'status-live' : 'status-offline'}`}
  aria-label={is_live ? 'Transmitindo ao vivo' : 'Offline'}
>
  {is_live ? (
    <>
      <span className="pulse-dot" aria-hidden="true"></span>
      AO VIVO
    </>
  ) : (
    <>
      <span className="dot dot-offline-sm" aria-hidden="true"></span>
      OFFLINE
    </>
  )}
</span>
```

---

## 14. Tokens CSS

### Matriz de Tokens

| Token CSS | Tema Dark (Preservado / Ajustado) | Tema Light (Preservado / Ajustado) | Finalidade |
|---|---|---|---|
| `--accent-live` | `#3fb950` (inalterado) | `#1a7f37` (inalterado) | Cor do texto e ponto de status AO VIVO |
| `--accent-live-glow` | `rgba(63, 185, 80, 0.2)` | `rgba(26, 127, 55, 0.15)` | Fundo e brilho suave do badge AO VIVO |
| `--badge-live-bg` | `#0b2212` | `#dafbe1` | Fundo do badge AO VIVO nos cards |
| `--accent-offline` | `#f87171` *(novo vermelho)* | `#cf222e` *(novo vermelho)* | Cor do texto e ponto de status OFFLINE |
| `--accent-offline-glow`| `rgba(248, 113, 113, 0.15)` | `rgba(207, 34, 46, 0.12)` | Fundo do badge OFFLINE no Header |
| `--badge-offline-bg` | `#2a1215` *(novo vinho)* | `#ffebe9` *(novo vermelho claro)* | Fundo do badge OFFLINE nos cards |
| `--badge-offline-border`| `rgba(248, 113, 113, 0.4)` | `rgba(207, 34, 46, 0.35)` | Borda do badge OFFLINE |
| `--btn-disabled-bg` | `#21262d` (inalterado) | `#eaeef2` (inalterado) | Fundo do botão Twitch desabilitado |
| `--btn-disabled-color`| `#6e7681` (inalterado) | `#8c959f` (inalterado) | Texto do botão Twitch desabilitado |

---

## 15. Dark Theme

* **Identidade Offline no Dark Mode:**
  * Texto / Destaque: `--accent-offline: #f87171;` (vermelho coral suave, contrastante com fundos escuros).
  * Fundo do Badge no Card: `--badge-offline-bg: #2a1215;` (tom vinho muito discreto e escuro).
  * Fundo do Badge no Header: `--accent-offline-glow: rgba(248, 113, 113, 0.15);`.
  * Borda do Badge: `--badge-offline-border: rgba(248, 113, 113, 0.4);`.
* **Resultado Visual:** Preservação da atmosfera escura de xadrez, substituindo a neutralidade do cinza por um vermelho refinado e perfeitamente legível.

---

## 16. Light Theme

* **Identidade Offline no Light Mode:**
  * Texto / Destaque: `--accent-offline: #cf222e;` (vermelho rubi clássico com alta legibilidade sobre fundos claros).
  * Fundo do Badge no Card: `--badge-offline-bg: #ffebe9;` (vermelho suave).
  * Fundo do Badge no Header: `--accent-offline-glow: rgba(207, 34, 46, 0.12);`.
  * Borda do Badge: `--badge-offline-border: rgba(207, 34, 46, 0.35);`.
* **Resultado Visual:** Elegância, clareza e contraste pleno sobre o fundo branco e cinza claro.

---

## 17. Responsividade

* **Disposição dos Badges no Header:**
  * Desktop (> 1024px): Os 3 badges e o toggle alinham-se horizontalmente na barra superior.
  * Tablet (640px - 1024px): Layout flexível com wrap natural.
  * Mobile (< 640px): As classes `.header-actions` e `.header-badges` utilizam `gap: 0.5rem` com `flex-wrap: wrap`, permitindo que os 3 badges caibam confortavelmente sem criar scroll horizontal ou ocultar o botão de alternância de tema.

---

## 18. Acessibilidade

* **Diferenciação Não Apenas por Cor:** A distinção entre canais online e offline é explícita pelo texto `"AO VIVO"` e `"OFFLINE"`, mantendo os atributos semânticos já existentes.
* **Ponto Indicador Estático vs. Pulsante:** O status AO VIVO possui ponto pulsante (`.pulse-dot`), enquanto o status OFFLINE possui ponto estático (`.dot-offline` / `.dot-offline-sm`), criando diferenciação visual adicional para usuários com discromatopsia (daltonismo).
* **Critério de Contraste WCAG AA:** As combinações finais de foreground/background deverão ser validadas para atendimento ao WCAG AA (mínimo de 4.5:1 para texto normal), realizando o ajuste dos tokens caso necessário durante a validação.

---

## 19. Estados da Aplicação

| Estado | Comportamento dos Contadores |
|---|---|
| **Loading** | Header permanece visível exibindo os contadores no estado atual ou zerados (`0 AO VIVO`, `0 OFFLINE`, `0 STREAMERS`) até a resolução da Promise |
| **Success** | Exibição das contagens exatas calculadas (`N AO VIVO`, `N OFFLINE`, `N STREAMERS`), onde `liveCount + offlineCount === totalCount` |
| **Empty** | `0 AO VIVO`, `0 OFFLINE`, `0 STREAMERS` |
| **Error** | Mantém a visualização do estado com segurança sem disparar erros no console |

---

## 20. Escopo

### Dentro do Escopo
* Adicionar cálculo derivado de `offlineCount` no `src/App.jsx`.
* Adicionar badge `N OFFLINE` no `src/components/Header.jsx`.
* Atualizar tokens semânticos de offline em `src/index.css` (Dark e Light).
* Estilizar badges e pontos indicadores em `src/App.css`.
* Atualizar a apresentação de status offline no `src/components/StreamerCard.jsx`.
* Ajustar a responsividade do cabeçalho para acomodar 3 badges + toggle.
* Validar contrastes WCAG AA e integridade funcional.

---

## 21. Fora de Escopo

* Filtros por status (ex: botão para exibir apenas online ou apenas offline).
* Campo de busca por nome de streamer.
* Ordenação da lista por status.
* Modificações no consumo da API ou endpoints do Chess.com.
* Alteração da quantidade de cards por página (permanece fixo em 12).
* Redesign geral da aplicação ou do layout do card.
* Adição de novas bibliotecas externas.

---

## 22. Divisão do Plano por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEQUÊNCIA DE FASES DO PLANO 00003                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fase 1: Cálculo de Offline e Integração do Badge no Header (App.jsx, Header)│
│ Fase 2: Tokens Semânticos e Identidade Visual do Header (index.css, App.css)│
│ Fase 3: Identidade do StreamerCard e Refinamento Responsivo (Card, App.css) │
│ Fase 4: Validação Completa, Testes de Não-Regressão e Build                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 23. Detalhamento das Fases

### Fase 1 — Cálculo de Offline e Integração do Badge no Header

#### Objetivo
Calcular o dado derivado `offlineCount` no `App.jsx` através da relação matemática `totalCount - liveCount` e repassá-lo ao `Header.jsx`, renderizando o novo badge com a contagem total de streamers offline retornada pela API.

#### Tarefas
- [ ] No `src/App.jsx`, calcular `offlineCount`:
  ```javascript
  const totalCount = streamers.length;
  const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
  const offlineCount = totalCount - liveCount;
  ```
- [ ] No `src/App.jsx`, passar `offlineCount={offlineCount}` como prop para `<Header />`.
- [ ] No `src/components/Header.jsx`, receber `offlineCount = 0` e renderizar o elemento `.badge-offline-count`:
  ```jsx
  <div className="badge badge-offline-count">
    <span className="dot dot-offline" aria-hidden="true"></span>
    <span>{offlineCount} OFFLINE</span>
  </div>
  ```
- [ ] Posicionar o badge entre o badge de Live e o badge de total.

#### Arquivos Envolvidos
* `src/App.jsx` (Modificar)
* `src/components/Header.jsx` (Modificar)

#### Critérios de Conclusão
* O Header exibe os 3 badges (`AO VIVO`, `OFFLINE`, `STREAMERS`).
* A soma de `liveCount + offlineCount` equivale exatamente a `totalCount`.

#### Sugestão de Commit (posterior)
```bash
git add src/App.jsx src/components/Header.jsx
git commit -m "feat(header): adicionar contador e badge de streamers offline"
```

---

### Fase 2 — Tokens Semânticos e Identidade Visual do Header

#### Objetivo
Configurar os tokens semânticos em `src/index.css` para a paleta vermelha de Offline nos temas Dark e Light, e estilizar o badge `.badge-offline-count` e ponto indicador `.dot-offline` em `src/App.css`.

#### Tarefas
- [ ] No `src/index.css`, atualizar o bloco `:root, [data-theme="dark"]`:
  ```css
  --accent-offline: #f87171;
  --accent-offline-glow: rgba(248, 113, 113, 0.15);
  --badge-offline-bg: #2a1215;
  --badge-offline-border: rgba(248, 113, 113, 0.4);
  ```
- [ ] No `src/index.css`, atualizar o bloco `[data-theme="light"]`:
  ```css
  --accent-offline: #cf222e;
  --accent-offline-glow: rgba(207, 34, 46, 0.12);
  --badge-offline-bg: #ffebe9;
  --badge-offline-border: rgba(207, 34, 46, 0.35);
  ```
- [ ] No `src/App.css`, estilizar `.badge-offline-count` e `.dot-offline`:
  ```css
  .badge-offline-count {
    color: var(--accent-offline);
    background-color: var(--accent-offline-glow);
    border-color: var(--badge-offline-border);
  }

  .dot-offline {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--accent-offline);
  }
  ```

#### Arquivos Envolvidos
* `src/index.css` (Modificar)
* `src/App.css` (Modificar)

#### Critérios de Conclusão
* O badge de offline no cabeçalho exibe a nova identidade vermelha perfeitamente integrada aos temas Dark e Light.

#### Sugestão de Commit (posterior)
```bash
git add src/index.css src/App.css
git commit -m "style(theme): definir tokens e estilos visuais para o status offline no header"
```

---

### Fase 3 — Identidade do StreamerCard e Refinamento Responsivo

#### Objetivo
Atualizar o badge de status no `src/components/StreamerCard.jsx` para incluir o ponto indicador `.dot-offline-sm`, atualizar `.status-offline` em `src/App.css` para a nova identidade vermelha e refinar os breakpoints responsivos do cabeçalho.

#### Tarefas
- [ ] No `src/components/StreamerCard.jsx`, adicionar o ponto indicador visual `.dot-offline-sm` com `aria-hidden="true"` no status offline:
  ```jsx
  <span
    className={`status-badge ${is_live ? 'status-live' : 'status-offline'}`}
    aria-label={is_live ? 'Transmitindo ao vivo' : 'Offline'}
  >
    {is_live ? (
      <>
        <span className="pulse-dot" aria-hidden="true"></span>
        AO VIVO
      </>
    ) : (
      <>
        <span className="dot dot-offline-sm" aria-hidden="true"></span>
        OFFLINE
      </>
    )}
  </span>
  ```
- [ ] No `src/App.css`, atualizar `.status-offline` e `.dot-offline-sm`:
  ```css
  .status-offline {
    background-color: var(--badge-offline-bg);
    color: var(--accent-offline);
    border-color: var(--badge-offline-border);
  }

  .dot-offline-sm {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--accent-offline);
  }
  ```
- [ ] No `src/App.css`, ajustar `@media (max-width: 640px)` para garantir layout fluido com os 3 badges e o botão de tema.

#### Arquivos Envolvidos
* `src/components/StreamerCard.jsx` (Modificar)
* `src/App.css` (Modificar)

#### Critérios de Conclusão
* Cards de streamers offline exibem badge vermelho discreto com ponto indicador.
* Cabeçalho se adapta perfeitamente sem quebras bruscas ou overflow em mobile.

#### Sugestão de Commit (posterior)
```bash
git add src/components/StreamerCard.jsx src/App.css
git commit -m "style(status): aplicar identidade vermelha nos cards e refinar responsividade"
```

---

### Fase 4 — Validação Completa, Testes de Não-Regressão e Build

#### Objetivo
Executar testes manuais abrangentes, checar todos os critérios de aceitação (CA-01 a CA-12) e validar o build de produção (`npm run build`).

#### Regra de Execução da Fase 4
* A Fase 4 é estritamente de validação e não deve gerar commit automaticamente.
* Caso nenhum arquivo seja alterado durante a validação, não haverá commit sugerido.
* Caso ocorra qualquer falha em critérios (ex: `CA-08 FAIL`), o agente **NÃO deve realizar correções silenciosas**: deve identificar o problema, relatar ao usuário, propor a correção, aguardar autorização e somente então aplicar e revalidar.

#### Tarefas
- [ ] Validar a matriz de testes manuais da Seção 24.
- [ ] Validar os critérios de aceitação CA-01 a CA-12.
- [ ] Executar `npm run build` e confirmar 0 erros.

#### Critérios de Conclusão
* Todos os 12 critérios de aceitação atendidos com status `PASS`.
* Build validado com código de saída 0.

---

## 24. Matriz de Testes Manuais

| Cenário | Entrada / Condição | Resultado Esperado |
|---|---|---|
| **Cálculo Global** | API retorna 42 streamers (8 ao vivo, 34 offline) | Header exibe `8 AO VIVO`, `34 OFFLINE`, `42 STREAMERS` em todas as páginas da paginação |
| **Todos Live** | API retorna streamers com `is_live === true` | `N AO VIVO`, `0 OFFLINE`, `N STREAMERS` |
| **Todos Offline** | API retorna streamers com `is_live !== true` | `0 AO VIVO`, `N OFFLINE`, `N STREAMERS` |
| **Lista Vazia** | API retorna array vazio `[]` | `0 AO VIVO`, `0 OFFLINE`, `0 STREAMERS`, tela de EmptyState exibida |
| **Navegação de Página** | Usuário navega da Página 1 para Página 2 | Contadores no Header permanecem fixos no total global da API |
| **Dark Theme** | Tema escuro ativo | Badges e cards offline renderizam em vermelho suave (`#f87171`) sobre fundo vinho |
| **Light Theme** | Tema claro ativo | Badges e cards offline renderizam em vermelho rubi (`#cf222e`) com alto contraste |
| **Alternância de Tema** | Usuário clica no botão de tema | Cores de Live (verde) e Offline (vermelho) adaptam seus tokens instantaneamente |
| **Mobile (320px - 414px)**| Viewport móvel estreito | 3 badges e botão de tema quebram de forma limpa, sem barra de rolagem horizontal |
| **Tablet (768px)** | Viewport de tablet | Header acomoda os elementos com espaçamento balanceado |
| **Desktop (1440px)** | Viewport desktop | Header alinhado em linha única |
| **Leitor de Tela / A11y** | Foco nos badges e cards | Leitor anuncia claramente o status textual "AO VIVO" e "OFFLINE" |
| **Não-Regressão** | Links Twitch, Avatares, Retry | Todas as funções do Plano 00001 e 00002 operam sem alterações |

---

## 25. Critérios de Aceitação

| ID | Critério | Descrição | Validação |
|---|---|---|---|
| **CA-01** | **Badge Offline no Header** | O Header exibe o badge `N OFFLINE` posicionado entre o badge de Live e o de total de streamers. | Inspecionar a interface e o DOM do `Header.jsx`. |
| **CA-02** | **Contagem Correta** | O valor de `offlineCount` representa exatamente a quantidade de streamers com `is_live !== true`. | Comparar a contagem do Header com os dados da API. |
| **CA-03** | **Contagem Global** | O valor no Header permanece constante ao mudar de página na paginação. | Navegar entre páginas e checar que os contadores não se alteram. |
| **CA-04** | **Atualização Dinâmica** | Ao recarregar dados ou acionar retry, os 3 contadores são recalculados instantaneamente. | Simular nova chamada de API e validar atualização. |
| **CA-05** | **Estado Derivado** | `offlineCount` não é armazenado em `useState` separado no `App.jsx`. | Inspecionar `App.jsx` e confirmar que é variável derivada. |
| **CA-06** | **Identidade Offline Vermelha** | Streamers offline e o badge do Header apresentam variação de vermelho profissional. | Verificar estilos aplicados no card e no Header. |
| **CA-07** | **Identidade Live Preservada** | Streamers ao vivo mantêm 100% de sua identidade verde neon original. | Verificar que status AO VIVO permanece inalterado. |
| **CA-08** | **Contraste no Dark Theme** | O estado offline no tema escuro apresenta legibilidade validada conforme WCAG AA. | Validar no tema Dark a legibilidade de `#f87171`. |
| **CA-09** | **Contraste no Light Theme** | O estado offline no tema claro apresenta legibilidade validada conforme WCAG AA. | Validar no tema Light a legibilidade de `#cf222e`. |
| **CA-10** | **Responsividade do Header** | O Header acomoda os 3 badges e o toggle em telas mobile (320px+) sem overflow. | Testar em emulador de dispositivo móvel. |
| **CA-11** | **Acessibilidade Semântica** | Status Live e Offline possuem identificação textual explícita e pontos visuais distintos. | Validar texto, ARIA e contraste. |
| **CA-12** | **Não-Regressão Geral** | Funcionalidades dos Planos 00001 e 00002 continuam 100% operacionais. | Executar testes funcionais completos e build. |

---

## 26. Riscos e Mitigações

| Risco Identificado | Impacto | Estratégia de Mitigação |
|---|---|---|
| **Quebra de linha desordenada no Header em telas muito estreitas (< 360px)** | Baixo | Uso de flex-wrap, gap proporcional e padding otimizado nos badges. |
| **Vermelho excessivamente saturado prejudicando a estética Dark** | Médio | Utilização de tons suaves e desaturados (`#f87171` e fundo vinho `#2a1215`), evitando vermelhos puros agressivos (`#ff0000`). |
| **Confusão visual entre "offline com canal" e "canal indisponível"** | Baixo | Manter o botão de canal desabilitado com tons neutros acinzentados, restringindo o vermelho apenas ao status de transmissão. |
| **Recálculo pesado com grande volume de dados** | Muito Baixo | Um único `.filter()` em memória com subtração aritmética executa em menos de 1 milissegundo no JavaScript moderno. |

---

## 27. Estratégia de Git

A execução da implementação seguirá o padrão estrito de fases com **Conventional Commits** em **pt-BR**:

* Fase 1: `feat(header): adicionar contador e badge de streamers offline`
* Fase 2: `style(theme): definir tokens e estilos visuais para o status offline no header`
* Fase 3: `style(status): aplicar identidade vermelha nos cards e refinar responsividade`
* Fase 4: Sem commit automático (apenas se houver alterações de arquivos autorizadas individualmente).

> **Nota:** Nenhum commit será executado durante o planejamento.

---

## 28. Commits Sugeridos (Consolidação)

```bash
# Fase 1
git add src/App.jsx src/components/Header.jsx
git commit -m "feat(header): adicionar contador e badge de streamers offline"

# Fase 2
git add src/index.css src/App.css
git commit -m "style(theme): definir tokens e estilos visuais para o status offline no header"

# Fase 3
git add src/components/StreamerCard.jsx src/App.css
git commit -m "style(status): aplicar identidade vermelha nos cards e refinar responsividade"
```

---

## 29. Checklist Final

- [x] O documento respeita a nova convenção de nomenclatura (`00003-indicadores-de-status-offline.md`).
- [x] O cálculo de `offlineCount` é estritamente derivado no `App.jsx` com `totalCount - liveCount`.
- [x] A contagem é global e desacoplada da paginação.
- [x] Os tokens suportam Dark Theme e Light Theme com validação de contraste WCAG AA.
- [x] A identidade verde do status Live é 100% preservada.
- [x] A acessibilidade não depende unicamente da cor.
- [x] Zero emojis utilizados em código, esquemas conceituais ou comentários.
- [x] O plano está estruturado em 4 fases sequenciais com critérios objetivos (CA-01 a CA-12) e sem `git add .` indiscriminado.

---

## 30. Declaração de Não Implementação

Nenhum arquivo de código da aplicação (`src/`, `index.html`, etc.) foi alterado ou implementado nesta etapa. O escopo desta atividade restringiu-se exclusivamente à análise técnica e elaboração deste documento oficial de planejamento revisado.
