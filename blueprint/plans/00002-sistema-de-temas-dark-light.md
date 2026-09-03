# Plano de Implementação — EnPassant.live

**Plano:** 00002  
**Status:** Revisado / Pronto para Implementação  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Plano 00001 (`blueprint/plans/00001-implementacao-inicial-do-mvp.md`) & Base de Código Real do Projeto  

---

## 1. Resumo da Implementação

Este plano técnico revisado orienta a implementação completa do **Sistema de Temas Dark/Light** na aplicação web **EnPassant.live**. A funcionalidade permite que o usuário alterne de forma fluida entre os modos escuro (*Dark*) e claro (*Light*), utilizando como tema inicial a preferência configurada no sistema operacional/navegador do usuário via `window.matchMedia('(prefers-color-scheme: dark)')`, e persistindo qualquer seleção manual no `localStorage`.

---

## 2. Objetivos

* **Suporte a Temas Dark e Light:** Implementar a troca dinâmica de temas através de **CSS Variables** e do atributo semântico `data-theme="dark"` / `data-theme="light"` no elemento raiz `<html>`.
* **Preservação Estrita do Tema Dark Atual:** Manter 100% da identidade visual, contraste, sombras e paleta de cores do tema escuro existente entregue no Plano 00001 (não-regressão visual).
* **Criação de Tema Light Temático e Acessível:** Desenvolver uma paleta clara profissional, com alto contraste (conforme padrões WCAG AA), inspirada nas peças claras e tabuleiros de xadrez contemporâneos.
* **Detecção Automática do Sistema Operacional:** Na primeira visita (sem preferência salva no `localStorage`), inicializar a aplicação respeitando a configuração de `prefers-color-scheme` do dispositivo.
* **Persistência de Preferência Manual:** Armazenar a escolha manual do usuário no `localStorage` sob a chave `enpassant-theme` (`'dark'` ou `'light'`), com prioridade absoluta sobre a preferência do sistema.
* **Reatividade Dinâmica ao Sistema:** Atualizar a interface em tempo real caso o sistema operacional mude de tema, exclusivamente enquanto não houver preferência manual salva.
* **Prevenção Total de FOUC (*Flash of Unstyled Content*):** Eliminar o flash de tema incorreto no carregamento inicial através de um script inline síncrono e leve no `<head>` do `index.html`.
* **Sincronização de Metadados do Navegador:** Manter a meta tag `<meta name="theme-color">` sincronizada com o tema ativo para garantir coerência visual na barra de status de navegadores móveis e desktop.
* **Controle de Interface Acessível no Header:** Integrar um botão semântico `<button>` com SVG inline (ícones Sol/Lua), foco visível (`:focus-visible`), área de toque mínima de 44x44px e suporte total a leitores de tela e navegação por teclado (`Tab`, `Enter`, `Espaço`).
* **Zero Regressão Funcional:** Garantir que todas as funcionalidades do MVP (consumo da API Chess.com, cancelamento com `AbortController`, paginação em memória com 12 cards, fallbacks de imagem e contadores dinâmicos) permaneçam 100% íntegras.

---

## 3. Análise da Arquitetura Atual

A auditoria realizada sobre a base de código real do projeto revelou a seguinte estrutura:

1. **Ponto de Entrada e HTML (`index.html`, `src/main.jsx`):**
   * O `index.html` possui `<html lang="pt-BR">` sem atributo `data-theme` e com `<meta name="theme-color" content="#0d1117" />` estática.
   * `src/main.jsx` renderiza `<App />` dentro de `<React.StrictMode>`.
2. **Design Tokens e CSS (`src/index.css`, `src/App.css`):**
   * `src/index.css` define todos os tokens escuros diretamente no seletor `:root` (sem suporte a temas alternativos).
   * `src/App.css` possui algumas cores fixas em formato hexadecimal (ex: `.status-live` com background `#0b2212`, `.status-offline` com `#1c2128` e `.btn-twitch.btn-disabled` com `#21262d`) que precisam ser migradas para variáveis semânticas para suportar adequadamente o tema Light sem gerar contrastes deficientes.
3. **Estado e Orquestração (`src/App.jsx`):**
   * Centraliza todo o estado funcional (`streamers`, `loading`, `error`, `currentPage`) sem uso de bibliotecas externas ou Context API.
   * Calcula dados derivados (`liveCount`, `totalCount`, `totalPages`, `currentStreamers`) em tempo de renderização.
4. **Componentes da Interface (`src/components/`):**
   * `Header.jsx` recebe `liveCount` e `totalCount` e renderiza a marca e os badges de contadores.
   * `StreamerCard.jsx` opera de forma puramente stateless com duplo fallback de avatar (`src` condicional + `onError` nativo no DOM).
   * `Pagination.jsx` renderiza controles de página com navegação em memória.
   * `LoadingState.jsx`, `ErrorState.jsx` e `EmptyState.jsx` gerenciam os estados visuais da aplicação.

---

## 4. Estratégia Técnica e Decisões de Arquitetura

### 4.1. Resolução e Prioridade do Tema
A precedência para definição do tema ativo segue a ordem estrita:
```text
1. Preferência manual válida no localStorage ('enpassant-theme' === 'dark' | 'light')
2. Preferência do sistema operacional (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
3. Fallback padrão do projeto ('dark')
```

### 4.2. Decisão Técnica: Preferência Manual vs. Preferência do Sistema
* **Comportamento Adotado (Opção A - Escolha Explícita Persistente):**
  * Ao carregar a aplicação sem histórico no `localStorage`, o sistema determina o tema inicial (ex: SO Light ➔ App Light).
  * O listener de `matchMedia` permanece ativo e reativo: se o usuário mudar o SO de Light para Dark sem ter interagido com o toggle, a aplicação muda automaticamente.
  * No momento em que o usuário clica no botão de alternância de tema no cabeçalho, ele expressa uma **preferência manual explícita**. Essa escolha é imediatamente salva no `localStorage` (`localStorage.setItem('enpassant-theme', nextTheme)`).
  * Com o registro no `localStorage`, a escolha do usuário prevalece permanentemente sobre o SO. Alterações no sistema operacional não irão sobrescrever a decisão do usuário.
  * Caso o usuário limpe os dados do navegador (ou se o `localStorage` for limpo), a aplicação reverte automaticamente para o modo de acompanhamento do sistema.
* **Justificativa:** Esta abordagem oferece a melhor experiência de usuário (UX) em aplicações web modernas (padrão GitHub, Tailwind, Vite), dispensando controles tri-state ("Dark / Light / Sistema") que poluíram visualmente o cabeçalho em telas mobile, ao mesmo tempo em que respeita fielmente o SO no primeiro acesso.

### 4.3. Estratégia de Eliminação de FOUC (Flash of Unstyled Content)
* Um script síncrono e autoexecutável é inserido no topo do `<head>` do `index.html`.
* O script lê o `localStorage` e o `matchMedia`, definindo imediatamente o atributo `data-theme` no elemento `<html>` antes do carregamento do CSS e do bundle React.
* A função `getInitialTheme()` no `App.jsx` replica a exata mesma lógica durante a inicialização do `useState`. Assim, quando o React monta o componente raiz, o estado interno e o DOM já estão em perfeita sincronia, prevenindo qualquer flash visual ou re-render corretivo.

### 4.4. UX e Acessibilidade do Botão de Alternância
* **Elemento:** `<button type="button" className="theme-toggle-btn">`.
* **Semântica do Ícone e Texto:**
  * Quando o tema ativo for **Dark**, o botão exibe o ícone de **Sol** (indicando a luz) e o rótulo acessível `aria-label="Alternar para tema claro"`.
  * Quando o tema ativo for **Light**, o botão exibe o ícone de **Lua** (indicando a escuridão) e o rótulo acessível `aria-label="Alternar para tema escuro"`.
  * `title` sincronizado com o `aria-label` para fornecer tooltip nativo no hover de desktop.
  * SVGs inline com `aria-hidden="true"` para evitar leitura redundante por tecnologias assistivas.
  * Dimensões de toque mínimas de 44x44px para conformidade com diretrizes móveis da WCAG.

---

## 5. Restrições Rígidas (Proibições)

* **NÃO utilizar:** Context API, Redux, Zustand, Recoil ou bibliotecas globais de gerenciamento de estado.
* **NÃO utilizar:** Bibliotecas externas de temas como `next-themes`, `styled-components`, `emotion` ou CSS-in-JS.
* **NÃO utilizar:** Bibliotecas externas de ícones (Lucide, FontAwesome, React Icons, etc.); utilizar exclusivamente SVG inline sem dependências.
* **NÃO utilizar:** Frameworks CSS como TailwindCSS, Bootstrap, Material UI ou Chakra UI.
* **NÃO utilizar:** Bibliotecas externas de armazenamento ou media queries.
* **NÃO alterar:** Nenhuma lógica de negócio existente (API Chess.com, `AbortController`, paginação de 12 itens, duplo fallback de avatar).

---

## 6. Organização por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEQUÊNCIA DE FASES DO PLANO 00002                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fase 1: Estruturação dos Tokens do Design System (index.css & App.css)      │
│ Fase 2: Prevenção de FOUC e Sincronização no HTML (index.html)              │
│ Fase 3: Gerenciamento de Estado, Persistência e Listener no App (App.jsx)   │
│ Fase 4: Controle de Alternância Acessível no Cabeçalho (Header.jsx)         │
│ Fase 5: Refinamento Visual dos Componentes e Estados no Tema Light (App.css)│
│ Fase 6: Validação de Acessibilidade, Responsividade e Não-Regressão         │
│ Fase 7: Matriz de Testes Manuais, Critérios de Aceite e Build               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Detalhamento de cada Fase

### Fase 1 — Estruturação dos Tokens do Design System

#### Objetivo
Expandir o `src/index.css` para organizar as variáveis CSS dos temas Dark e Light através de seletores de atributo `[data-theme]`, e refatorar `src/App.css` substituindo cores fixas por variáveis semânticas.

#### Tarefas
- [ ] No `src/index.css`, reestruturar o bloco escuro padrão sob `:root, [data-theme="dark"]`:
  ```css
  :root,
  [data-theme="dark"] {
    --bg-primary: #0d1117;
    --bg-card: #161b22;
    --bg-card-hover: #21262d;
    --border-color: #30363d;
    --text-primary: #f0f6fc;
    --text-secondary: #8b949e;
    --accent-live: #3fb950;
    --accent-live-glow: rgba(63, 185, 80, 0.2);
    --accent-twitch: #9146ff;
    --accent-twitch-hover: #772ce8;
    --accent-offline: #6e7681;
    --accent-error: #f85149;
    --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.45);
    --badge-live-bg: #0b2212;
    --badge-offline-bg: #1c2128;
    --btn-disabled-bg: #21262d;
    --btn-disabled-color: #6e7681;
  }
  ```
- [ ] No `src/index.css`, definir o bloco de variáveis para o tema claro sob `[data-theme="light"]`:
  ```css
  [data-theme="light"] {
    --bg-primary: #f6f8fa;
    --bg-card: #ffffff;
    --bg-card-hover: #f0f2f5;
    --border-color: #d0d7de;
    --text-primary: #1f2328;
    --text-secondary: #57606a;
    --accent-live: #1a7f37;
    --accent-live-glow: rgba(26, 127, 55, 0.15);
    --accent-twitch: #772ce8;
    --accent-twitch-hover: #5c16c5;
    --accent-offline: #656d76;
    --accent-error: #cf222e;
    --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
    --shadow-card-hover: 0 6px 16px rgba(0, 0, 0, 0.12);
    --badge-live-bg: #dafbe1;
    --badge-offline-bg: #eaeef2;
    --btn-disabled-bg: #eaeef2;
    --btn-disabled-color: #8c959f;
  }
  ```
- [ ] No `src/index.css`, adicionar transição suave no `body`:
  ```css
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color var(--transition-normal), color var(--transition-normal);
  }
  ```
- [ ] No `src/App.css`, substituir as cores fixas nas seguintes regras:
  * `.status-live`: substituir `background-color: #0b2212;` por `background-color: var(--badge-live-bg);`
  * `.status-offline`: substituir `background-color: #1c2128;` por `background-color: var(--badge-offline-bg);`
  * `.btn-twitch.btn-disabled`: substituir `background-color: #21262d;` por `background-color: var(--btn-disabled-bg);` e `color: var(--accent-offline);` por `color: var(--btn-disabled-color);`

#### Arquivos Envolvidos
* `src/index.css` (Modificar)
* `src/App.css` (Modificar)

#### Resultado Esperado
Conjunto completo de tokens de tema configurado, com 100% de preservação visual no tema Dark e classes de componentes desacopladas de valores fixos.

#### Critérios de Conclusão
* Variáveis declaradas em `:root, [data-theme="dark"]` e `[data-theme="light"]`.
* Cores fixas eliminadas em `src/App.css`.
* Nenhuma quebra visual no tema escuro.

#### Sugestão de Commit (posterior)
```bash
git add src/index.css src/App.css
git commit -m "style(theme): estruturar tokens css para suporte aos temas dark e light"
```

---

### Fase 2 — Prevenção de FOUC e Sincronização no HTML

#### Objetivo
Adicionar um script síncrono no `<head>` do `index.html` para avaliar a preferência do usuário ou do sistema antes do primeiro paint da página, eliminando qualquer flash de tema incorreto.

#### Tarefas
- [ ] No `index.html`, adicionar o script inline no `<head>`:
  ```html
  <script>
    (function () {
      try {
        var STORAGE_KEY = 'enpassant-theme';
        var savedTheme = localStorage.getItem(STORAGE_KEY);
        var theme = 'dark';
        if (savedTheme === 'dark' || savedTheme === 'light') {
          theme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          theme = 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        var metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#0d1117');
        }
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
  ```
- [ ] Assegurar que o script trate exceções com `try...catch` (como cookies/storage bloqueados em modo privado).

#### Arquivos Envolvidos
* `index.html` (Modificar)

#### Resultado Esperado
O elemento `<html>` inicia com `data-theme` preenchido antes da montagem da interface, garantindo carregamento visual limpo.

#### Critérios de Conclusão
* Página em modo claro carrega instantaneamente em claro, sem flash escuro prévio.
* Tag `<meta name="theme-color">` inicializada corretamente.

#### Sugestão de Commit (posterior)
```bash
git add index.html
git commit -m "feat(theme): adicionar script de prevencao de fouc no index.html"
```

---

### Fase 3 — Gerenciamento de Estado, Persistência e Listener no App

#### Objetivo
Implementar o estado do tema e a lógica de ciclo de vida no componente raiz `src/App.jsx`, tratando lazy initialization, persistência no `localStorage` e escuta do evento `change` do `matchMedia`.

#### Tarefas
- [ ] No `src/App.jsx`, declarar a constante e a função `getInitialTheme()` fora do componente:
  ```javascript
  const THEME_STORAGE_KEY = 'enpassant-theme';

  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      console.warn('Erro ao acessar localStorage:', e);
    }
    return 'dark';
  };
  ```
- [ ] No corpo do `App.jsx`, declarar o estado com lazy initialization:
  ```javascript
  const [theme, setTheme] = useState(getInitialTheme);
  ```
- [ ] Implementar a função `toggleTheme`:
  ```javascript
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (e) {
        console.warn('Falha ao salvar tema no localStorage:', e);
      }
      return nextTheme;
    });
  };
  ```
- [ ] Implementar `useEffect` para sincronização com o DOM e meta tag:
  ```javascript
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#0d1117');
    }
  }, [theme]);
  ```
- [ ] Implementar `useEffect` para escutar mudanças no sistema operacional:
  ```javascript
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch (err) {
        console.warn('Erro ao verificar preferencia do sistema:', err);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);
  ```
- [ ] Repassar `theme` e `onToggleTheme={toggleTheme}` como props para `<Header />`.

#### Arquivos Envolvidos
* `src/App.jsx` (Modificar)

#### Resultado Esperado
Estado do tema integrado de forma reativa e persistente no `App.jsx`, sem acréscimo de dependências externas.

#### Critérios de Conclusão
* Estado `theme` inicializado corretamente via `getInitialTheme`.
* Alternância persiste a escolha no `localStorage`.
* Alterações no SO são refletidas apenas quando não houver preferência salva.

#### Sugestão de Commit (posterior)
```bash
git add src/App.jsx
git commit -m "feat(theme): implementar gestao de estado e deteccao de preferencia de tema no App"
```

---

### Fase 4 — Controle de Alternância Acessível no Cabeçalho

#### Objetivo
Atualizar o componente `src/components/Header.jsx` para exibir o botão semântico de alternância de tema ao lado dos badges existentes, utilizando ícones vetoriais SVG inline.

#### Tarefas
- [ ] No `src/components/Header.jsx`, receber as props `theme = 'dark'` e `onToggleTheme`:
  ```jsx
  function Header({ liveCount = 0, totalCount = 0, theme = 'dark', onToggleTheme }) {
  ```
- [ ] Criar a estrutura JSX do botão dentro de uma seção de ações do cabeçalho:
  ```jsx
  <div className="header-actions">
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
    >
      {theme === 'dark' ? (
        <svg
          className="theme-icon icon-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg
          className="theme-icon icon-moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  </div>
  ```
- [ ] No `src/App.css`, estilizar o `.theme-toggle-btn`:
  ```css
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .theme-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: var(--radius-full);
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-card);
  }

  .theme-toggle-btn:hover {
    background-color: var(--bg-card-hover);
    border-color: var(--text-secondary);
    transform: translateY(-1px);
  }

  .theme-icon {
    width: 20px;
    height: 20px;
  }

  .icon-sun {
    color: #f59e0b;
  }

  .icon-moon {
    color: var(--accent-twitch);
  }
  ```

#### Arquivos Envolvidos
* `src/components/Header.jsx` (Modificar)
* `src/App.css` (Modificar)

#### Resultado Esperado
Botão visualmente atraente, perfeitamente alinhado no cabeçalho e acessível por teclado.

#### Critérios de Conclusão
* Botão renderiza o ícone de Sol no tema Dark e Lua no tema Light.
* Ação de clique aciona a alternância instantânea.
* Totalmente navegável via `Tab` e operável com `Enter` / `Espaço`.

#### Sugestão de Commit (posterior)
```bash
git add src/components/Header.jsx src/App.css
git commit -m "feat(theme): adicionar botao de alternancia de tema no header"
```

---

### Fase 5 — Refinamento Visual dos Componentes no Tema Light

#### Objetivo
Revisar e refinar o contraste visual de todos os componentes da interface (`Header`, `StreamerCard`, `LoadingState`, `ErrorState`, `EmptyState`, `Pagination`, `Footer`) no tema claro, garantindo aderência aos critérios WCAG AA.

#### Tarefas
- [ ] Validar o contraste de cores do texto e fundo no tema claro:
  * Texto primário `#1f2328` sobre fundo `#ffffff` e `#f6f8fa` (Contraste > 12:1).
  * Texto secundário `#57606a` sobre fundo `#ffffff` (Contraste > 4.5:1 — atende WCAG AA).
  * Badge AO VIVO com texto `#1a7f37` sobre fundo `#dafbe1` (Contraste > 4.5:1).
  * Badge OFFLINE com texto `#656d76` sobre fundo `#eaeef2`.
- [ ] No `src/App.css`, certificar que sombras e bordas do card oferecem profundidade adequada no tema claro (`--shadow-card: 0 2px 8px rgba(0,0,0,0.08)`).
- [ ] Verificar a paginação: botões inativos com fundo claro e botão ativo com `--accent-twitch` e texto branco com alto contraste.
- [ ] Verificar o rodapé: link com contraste legível em tema claro.

#### Arquivos Envolvidos
* `src/App.css` (Modificar)

#### Resultado Esperado
Interface no tema claro elegante, consistente, moderna e com excelente legibilidade.

#### Critérios de Conclusão
* Todos os estados e componentes legíveis e visualmente harmoniosos no modo claro.
* Sem textos apagados ou bordas invisíveis.

#### Sugestão de Commit (posterior)
```bash
git add src/App.css
git commit -m "style(theme): refinar estilos visuais dos componentes para o tema light"
```

---

### Fase 6 — Validação de Acessibilidade, Responsividade e Não-Regressão

#### Objetivo
Garantir total acessibilidade por teclado, leitores de tela, integridade em dispositivos móveis e certificar que nenhuma funcionalidade do Plano 00001 foi afetada.

#### Tarefas
- [ ] Validar navegação exclusiva por teclado (`Tab`, `Shift+Tab`, `Enter`, `Espaço`).
- [ ] Validar a presença de anel de foco `:focus-visible` visível no botão de tema e em todos os links e botões da aplicação.
- [ ] Testar a quebra responsiva do cabeçalho em viewports móveis (320px, 375px, 414px) garantindo que o botão não sofra overflow nem oculte os badges.
- [ ] Executar testes de não-regressão:
  * Requisição da API e cancelamento com `AbortController`.
  * Paginação client-side dividida em 12 cards.
  * Duplo fallback do avatar do streamer (imagem nula e erro de rede `onError`).
  * Links externos para a Twitch abrindo em nova guia com `rel="noopener noreferrer"`.
  * Estados de Loading, Error e Empty operando perfeitamente.

#### Arquivos Envolvidos
* `src/App.css` (Modificar se necessário)
* `src/components/Header.jsx` (Modificar se necessário)

#### Resultado Esperado
Sistema de temas 100% acessível, responsivo e sem qualquer regressão funcional.

#### Critérios de Conclusão
* Todos os fluxos do Plano 00001 continuam operacionais.
* Foco visível e atributos ARIA aprovados.

#### Sugestão de Commit (posterior)
```bash
git add src/App.css src/components/Header.jsx
git commit -m "style(a11y): aprimorar acessibilidade e responsividade do sistema de temas"
```

---

### Fase 7 — Matriz de Testes Manuais, Critérios de Aceite e Build

#### Objetivo
Executar a bateria completa de testes manuais, validar os 10 Critérios de Aceitação (CA-T01 a CA-T10) e verificar a compilação do build de produção via `npm run build`.

#### Tarefas
- [ ] Executar todos os testes descritos na Seção 13 (Matriz de Testes Manuais).
- [ ] Validar todos os 10 critérios de aceitação da Seção 14.
- [ ] Executar `npm run build` e confirmar que o bundle de produção compila sem erros ou advertências.

#### Arquivos Envolvidos
* Todos os arquivos do projeto

#### Resultado Esperado
Entrega do sistema de temas validada com 100% de sucesso.

#### Critérios de Conclusão
* Todos os critérios CA-T01 a CA-T10 validados.
* Build de produção bem-sucedido (`vite build`).

#### Sugestão de Commit (posterior)
```bash
git add .
git commit -m "test(theme): validar matriz de testes e criterios de aceite do sistema de temas"
```

---

## 8. Responsabilidades do `App.jsx`

| Item | Tipo | Descrição |
|---|---|---|
| `THEME_STORAGE_KEY` | Constante (`'enpassant-theme'`) | Chave utilizada para persistência no `localStorage` |
| `getInitialTheme()` | Função Auxiliar | Avalia `localStorage` ➔ `matchMedia` ➔ fallback `'dark'` |
| `theme` | Estado (`useState(getInitialTheme)`) | Armazena o tema ativo (`'dark'` ou `'light'`) |
| `toggleTheme` | Função Handler | Alterna o tema e grava a escolha manual no `localStorage` |
| `useEffect (DOM Sync)` | Efeito | Atualiza `data-theme` no `<html>` e a meta tag `theme-color` |
| `useEffect (System Matcher)` | Efeito | Escuta `change` em `matchMedia` e atualiza quando sem preferência manual |
| `streamers` | Estado (`useState([])`) | Lista bruta de streamers retornada pela API |
| `loading` | Estado (`useState(true)`) | Indicador de carregamento ativo |
| `error` | Estado (`useState(null)`) | Mensagem de erro ou `null` se sucesso |
| `currentPage` | Estado (`useState(1)`) | Índice da página atual de visualização |
| `ITEMS_PER_PAGE` | Constante (`12`) | Definida fora do componente para evitar realocações |
| `fetchStreamers` | Função Assíncrona | Executa a chamada `fetch`, trata exceções e gerencia estados |
| `liveCount` | Dado Derivado | `streamers.filter(s => s.is_live).length` |
| `totalCount` | Dado Derivado | `streamers.length` |
| `totalPages` | Dado Derivado | `Math.ceil(streamers.length / ITEMS_PER_PAGE) \|\| 1` |
| `currentStreamers` | Dado Derivado | `streamers.slice((currentPage - 1) * 12, currentPage * 12)` |

---

## 9. Responsabilidades dos Componentes

| Componente | Responsabilidade Principal | Estado Próprio | Props Recebidas |
|---|---|---|---|
| **App** | Orquestrador de dados, paginação e estado do tema | Sim (`streamers`, `loading`, `error`, `currentPage`, `theme`) | N/A |
| **Header** | Exibição da marca, contadores dinâmicos e controle de tema | Não | `liveCount`, `totalCount`, `theme`, `onToggleTheme` |
| **LoadingState** | Feedback visual de carregamento | Não | N/A |
| **ErrorState** | Feedback visual de erro e botão de retry | Não | `message`, `onRetry` |
| **EmptyState** | Feedback visual quando a lista é vazia | Não | N/A |
| **StreamerGrid** | Container do grid adaptativo de cards | Não | `streamers` |
| **StreamerCard** | Apresentação individual do streamer, status e link | Não *(onError nativo via DOM)* | `streamer` |
| **Pagination** | Controles de navegação entre páginas | Não | `currentPage`, `totalPages`, `onPageChange` |

---

## 10. Diagramas e Fluxos de Dados

### 10.1. Inicialização e Precedência do Tema
```
                         Carregamento Inicial da Aplicação
                                        │
                                        ▼
                     Existe valor salvo no localStorage?
                               ('enpassant-theme')
                                  │            │
                           SIM ───┘            └─── NÃO
                            │                        │
                            ▼                        ▼
                   Valor é 'dark'/'light'?   Sistema prefere Light?
                     │                │      (prefers-color-scheme)
               SIM ──┘                └── NÃO       │            │
                │                        │   SIM ───┘            └─── NÃO
                ▼                        ▼    │                        │
        Aplica Tema Salvo                └────┼──────────┐             │
      (localStorage value)                    │          │             ▼
                │                             ▼          ▼     Aplica Tema Dark
                │                      Aplica Light   Aplica Dark  (Dark System/Fallback)
                │                      (Light System) (Fallback)       │
                └─────────────────────────────┼──────────┴─────────────┘
                                              │
                                              ▼
                         1. <html data-theme="..."> é definido (anti-FOUC)
                         2. <meta name="theme-color"> é atualizado
                         3. App instancia useState(theme)
```

### 10.2. Alternância Manual do Usuário
```
        Usuário clica no botão de tema (<button className="theme-toggle-btn">)
                                        │
                                        ▼
                              Dispara onToggleTheme()
                                        │
                                        ▼
                             App executa toggleTheme()
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              Próximo tema = 'light'         Próximo tema = 'dark'
              (se atual era 'dark')          (se atual era 'light')
                         │                             │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
              1. localStorage.setItem('enpassant-theme', nextTheme)
              2. setTheme(nextTheme)
              3. useEffect dispara:
                 - document.documentElement.setAttribute('data-theme', nextTheme)
                 - metaThemeColor.setAttribute('content', ...)
              4. Re-render da UI com novos tokens CSS
```

### 10.3. Alteração na Preferência do Sistema Operacional
```
       Sistema Operacional altera preferência (ex: Light ➔ Dark)
                                    │
                                    ▼
                 Evento 'change' no window.matchMedia dispara
                                    │
                                    ▼
                 Existe valor salvo no localStorage?
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                 SIM                                NÃO
                   │                                 │
                   ▼                                 ▼
         Ignora evento do sistema           Atualiza estado no App:
         (mantém a escolha manual           setTheme(e.matches ? 'dark' : 'light')
          salva pelo usuário)                        │
                                                     ▼
                                            UI acompanha o sistema
```

---

## 11. Mapeamento de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `index.html` | Modificar | Inserir script inline anti-FOUC e atualizar meta tag `theme-color` |
| `src/index.css` | Modificar | Estruturar tokens sob `:root, [data-theme="dark"]` e `[data-theme="light"]`, transição no body |
| `src/App.css` | Modificar | Desacoplar cores fixas, estilizar `.theme-toggle-btn` e refinar tema claro |
| `src/App.jsx` | Modificar | Gerenciar estado `theme`, lazy init, persistência, listeners de SO e repassar props |
| `src/components/Header.jsx` | Modificar | Receber `theme` e `onToggleTheme`, renderizar botão acessível com SVG |
| `blueprint/plans/00002-sistema-de-temas-dark-light.md` | Manter/Atualizar | Documento técnico oficial do Plano de Implementação 00002 |

---

## 12. Design System e Matriz de Tokens

| Token CSS | Tema Dark (Preservado) | Tema Light (Novo) | Finalidade / Elementos |
|---|---|---|---|
| `--bg-primary` | `#0d1117` | `#f6f8fa` | Fundo principal da página (`body`, containers) |
| `--bg-card` | `#161b22` | `#ffffff` | Fundo dos cards, header badges e paginação |
| `--bg-card-hover` | `#21262d` | `#f0f2f5` | Estado hover de cards e botões |
| `--border-color` | `#30363d` | `#d0d7de` | Linhas divisórias, contornos de cards e botões |
| `--text-primary` | `#f0f6fc` | `#1f2328` | Títulos, nomes de streamers e texto de alto destaque |
| `--text-secondary` | `#8b949e` | `#57606a` | Subtítulos, labels secundários, contagens e paginação |
| `--accent-live` | `#3fb950` | `#1a7f37` | Indicador visual e badge de streamer AO VIVO |
| `--accent-live-glow` | `rgba(63, 185, 80, 0.2)` | `rgba(26, 127, 55, 0.15)` | Brilho e fundo suave do badge AO VIVO |
| `--accent-twitch` | `#9146ff` | `#772ce8` | Botão de assistir na Twitch, foco e página ativa |
| `--accent-twitch-hover`| `#772ce8` | `#5c16c5` | Hover do botão de assistir na Twitch |
| `--accent-offline` | `#6e7681` | `#656d76` | Badge e indicador de status OFFLINE |
| `--accent-error` | `#f85149` | `#cf222e` | Título e ícone de estado de erro |
| `--badge-live-bg` | `#0b2212` | `#dafbe1` | Fundo do badge AO VIVO nos cards |
| `--badge-offline-bg` | `#1c2128` | `#eaeef2` | Fundo do badge OFFLINE nos cards |
| `--btn-disabled-bg` | `#21262d` | `#eaeef2` | Fundo do botão Twitch quando desabilitado |
| `--btn-disabled-color` | `#6e7681` | `#8c959f` | Texto do botão Twitch quando desabilitado |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,0.25)` | `0 2px 8px rgba(0,0,0,0.08)` | Sombra de repouso dos cards |
| `--shadow-card-hover` | `0 8px 24px rgba(0,0,0,0.45)` | `0 6px 16px rgba(0,0,0,0.12)` | Sombra no hover dos cards |

---

## 13. Matriz de Testes Manuais

### 13.1. Inicialização & Preferência do Sistema
* [ ] Abrir aplicação com SO em modo Escuro (sem `localStorage`) ➔ Renderiza em Dark.
* [ ] Abrir aplicação com SO em modo Claro (sem `localStorage`) ➔ Renderiza em Light.
* [ ] Alterar o tema do SO em tempo real sem ter clicado no toggle ➔ Aplicação atualiza o tema instantaneamente.

### 13.2. Alternância Manual & Persistência no LocalStorage
* [ ] Estando em Dark, clicar no toggle ➔ Aplicação muda para Light e salva `'light'` em `enpassant-theme`.
* [ ] Recarregar a página (F5) ➔ Permanece em Light.
* [ ] Com preferência manual salva em Light, alterar o SO para Dark ➔ Permanece em Light (prevalência da escolha manual).
* [ ] Clicar no toggle para voltar a Dark ➔ Muda para Dark e salva `'dark'` em `enpassant-theme`.
* [ ] Recarregar a página (F5) ➔ Permanece em Dark.

### 13.3. Prevenção de FOUC e Sincronização de Metadados
* [ ] Com tema Light ativo, executar recarregamento forçado (Ctrl+F5 / Cmd+Shift+R) ➔ A página não pisca em Dark.
* [ ] Verificar `<meta name="theme-color">` no DevTools ➔ `#0d1117` em Dark e `#f6f8fa` em Light.

### 13.4. Resiliência do Storage
* [ ] Inserir valor inválido no `localStorage` (`localStorage.setItem('enpassant-theme', 'invalid')`) e recarregar ➔ Aplicação ignora o valor e recorre ao sistema/fallback `'dark'` com segurança.
* [ ] Simular bloqueio de `localStorage` (modo anônimo restrito) ➔ Aplicação funciona sem lançar exceções não tratadas no console.

### 13.5. Acessibilidade & Usabilidade
* [ ] Focar o botão de alternância usando a tecla `Tab`.
* [ ] Verificar o contorno visual de foco (`:focus-visible`).
* [ ] Acionar o botão com `Enter` e `Espaço` ➔ O tema alterna corretamente.
* [ ] Inspecionar `aria-label` e `title` do botão (deve refletir a ação para o próximo tema).
* [ ] Validar contraste dos textos e botões no tema claro (WCAG AA).

### 13.6. Responsividade
* [ ] Validar layout do cabeçalho com o botão de tema em 320px, 375px, 414px, 768px, 1024px, 1440px e 1920px.
* [ ] Assegurar que nenhum elemento gere scroll horizontal indesejado.

### 13.7. Não-Regressão das Funcionalidades do Plano 00001
* [ ] Streamers são listados a partir da API oficial do Chess.com.
* [ ] Contadores no cabeçalho exibem contagens precisas de AO VIVO e TOTAL.
* [ ] Duplo fallback de avatar funciona (sem avatar e URL 404 via `onError`).
* [ ] Links para a Twitch abrem em nova aba com `target="_blank"` e `rel="noopener noreferrer"`.
* [ ] Paginação em memória opera com 12 cards por página e botões de limite desabilitados.
* [ ] Estados de Loading, Error (com botão Tentar Novamente) e Empty operam normalmente em ambos os temas.

---

## 14. Critérios de Aceite

| ID | Critério | Fase de Implementação | Método de Validação |
|---|---|---|---|
| **CA-T01** | Inicialização por Preferência do Sistema | Fase 2 e 3 | Testar primeiro acesso sem storage em SO Light e SO Dark. |
| **CA-T02** | Alternância Bidirecional Manual | Fase 3 e 4 | Clicar no botão de tema e checar alternância instantânea entre Dark e Light. |
| **CA-T03** | Persistência em LocalStorage | Fase 3 | Checar `localStorage.getItem('enpassant-theme')` após alternar e recarregar a página. |
| **CA-T04** | Prevalência da Escolha Manual sobre o SO | Fase 3 | Gravar escolha manual, mudar SO e validar que a escolha manual é preservada. |
| **CA-T05** | Reatividade ao Sistema sem Escolha Manual | Fase 3 | Sem chave no storage, alterar tema no SO e verificar atualização em tempo real. |
| **CA-T06** | Prevenção Total de FOUC | Fase 2 | Recarregar forçadamente com tema Light e verificar ausência de flash escuro. |
| **CA-T07** | Preservação Visual do Tema Dark | Fase 1 e 5 | Comparar a aparência do tema Dark com a versão original do Plano 00001. |
| **CA-T08** | Harmonia e Contraste do Tema Light | Fase 1 e 5 | Inspecionar contrastes de cores de texto, superfícies e badges (WCAG AA). |
| **CA-T09** | Acessibilidade e Teclado | Fase 4 e 6 | Navegar por `Tab`, acionar por `Enter`/`Space` e verificar `aria-label`/foco. |
| **CA-T10** | Não-Regressão do MVP (Plano 00001) | Fase 6 e 7 | Executar testes funcionais de API, cards, paginação, loading e retry. |

---

## 15. Riscos e Mitigações

| Risco Identificado | Impacto | Estratégia de Mitigação |
|---|---|---|
| **`localStorage` inacessível (ex: navegação privada restrita)** | Baixo | Tratar todas as operações em blocos `try...catch` com fallback para detecção de sistema ou `'dark'`. |
| **FOUC (Flash de tema escuro antes de carregar tema claro)** | Médio | Script síncrono no `<head>` do `index.html` aplicando `data-theme` antes do paint da página. |
| **Incompatibilidade com navegadores sem suporte a `matchMedia`** | Muito Baixo | Verificação preventiva `if (window.matchMedia)` com fallback automático para `'dark'`. |
| **Quebra de contraste em elementos com cores fixas (hex)** | Médio | Mapeamento e substituição de todas as cores *hardcoded* por variáveis CSS semânticas. |
| **Quebra de layout no cabeçalho em telas mobile muito estreitas** | Baixo | Uso de flex-wrap e dimensões otimizadas no botão com ícone compacto. |

---

## 16. Ordem de Execução Recomendada

1. **Fase 1:** Configurar as variáveis CSS no `src/index.css` e substituir cores fixas no `src/App.css`.
2. **Fase 2:** Inserir script inline de prevenção de FOUC e meta tag no `index.html`.
3. **Fase 3:** Implementar a inicialização do estado, persistência e listener do sistema no `src/App.jsx`.
4. **Fase 4:** Adicionar o botão de alternância de tema no `src/components/Header.jsx` e estilizar no `src/App.css`.
5. **Fase 5:** Refinar contrastes, sombras e estados de hover dos componentes no tema claro.
6. **Fase 6:** Testar acessibilidade por teclado, leitores de tela e responsividade em múltiplos breakpoints.
7. **Fase 7:** Executar a bateria de testes manuais, checagem dos critérios CA-T01 a CA-T10 e validação do build (`npm run build`).

---

## 17. Estratégia de Git e Histórico de Commits

O repositório Git já se encontra inicializado e estruturado a partir da conclusão do Plano 00001. A execução da implementação deste plano deve seguir o padrão **Conventional Commits** com mensagens em **pt-BR** (mantendo os tipos técnicos em inglês):

* `style(theme): estruturar tokens css para suporte aos temas dark e light`
* `feat(theme): adicionar script de prevencao de fouc no index.html`
* `feat(theme): implementar gestao de estado e deteccao de preferencia de tema no App`
* `feat(theme): adicionar botao de alternancia de tema no header`
* `style(theme): refinar estilos visuais dos componentes para o tema light`
* `style(a11y): aprimorar acessibilidade e responsividade do sistema de temas`
* `test(theme): validar matriz de testes e criterios de aceite do sistema de temas`

> **Nota:** Nenhum commit deve ser executado durante a fase de planejamento. Os commits acima são diretrizes para a etapa de execução.

---

## 18. Declaração de Não Implementação

Nenhum código de aplicação, componente, folha de estilo ou configuração foi alterado ou implementado nesta etapa. O escopo desta atividade restringiu-se estritamente à análise arquitetural do projeto existente, auditoria técnica e elaboração da versão oficial revisada do **Plano de Implementação 00002**.
