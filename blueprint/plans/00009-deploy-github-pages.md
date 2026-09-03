# Plano de Implementação — EnPassant.live

**Plano:** 00009  
**Status:** Revisado / Pronto para Implementação  
**Data:** 2026-09-03  
**Referência:** PRD — EnPassant.live (`blueprint/docs/prd.md`), Planos 00001 a 00008, Base de Código Atual & GitHub Pages  

---

## 1. Título

**Plano de Implementação 00009 — Deploy do EnPassant.live no GitHub Pages via gh-pages com Base Path Dinâmico, Suporte a .nojekyll e Preservação Estrita da Branch Principal**

---

## 2. Identificação, Data e Status

* **Identificador:** 00009
* **Data:** 2026-09-03
* **Status:** Revisado / Pronto para Implementação

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
  * `00008-filtros-status-streamers.md` (Filtros por Status, Contadores Globais, Composição) — **Imutável**

### 3.1. Regras de Não-Regressão e Imutabilidade
1. **Preservação de Código e Componentes React:** Nenhuma lógica interna ou componente (`App.jsx`, `Header.jsx`, `SearchBar.jsx`, `Pagination.jsx`, `StreamerCard.jsx`, `StreamerGrid.jsx`, `EmptyState.jsx`, `ErrorState.jsx`, `LoadingState.jsx`) será modificado.
2. **Preservação da API Pública do Chess.com:** O endpoint `https://api.chess.com/pub/streamers` e o fluxo de consumo via `fetch` assíncrono com `AbortController` permanecem inalterados.
3. **Preservação do Design System e Favicon:** Todos os estilos em `App.css`, tokens em `index.css`, o `favicon.svg` e screenshots em `public/` permanecem intocados.
4. **Isolamento da Branch Principal (`main`):** A pasta de compilação `dist/` **NUNCA** será versionada na branch `main`. Ela permanece estritamente restrita ao ambiente local e à branch de publicação `gh-pages`.

---

## 4. Objetivo

Especificar tecnicamente o processo de publicação e hospedagem contínua da aplicação **EnPassant.live** no **GitHub Pages** utilizando o utilitário `gh-pages`, assegurando:

1. **Configuração do `base` no Vite:** A aplicação resolverá e carregará seus assets (`.js`, `.css`, `.svg`, `.jpg`) sob o subdiretório `/enpassant.live/` correspondente ao repositório oficial no GitHub (`https://github.com/slayer-br/enpassant.live.git`).
2. **Prevenção de Processamento Jekyll via `.nojekyll`:** Inclusão do arquivo `public/.nojekyll` para que o Vite o copie para `dist/.nojekyll`, desativando o processamento Jekyll no GitHub Pages e garantindo o carregamento irrestrito de todos os arquivos estáticos.
3. **Automação de Scripts no `package.json`:** Inclusão dos scripts `"predeploy"` e `"deploy"` para orquestrar o build e publicar o conteúdo compilado diretamente na branch `gh-pages`.
4. **Isolamento Estrito da Branch `main`:** A branch `main` conterá exclusivamente código-fonte, documentação e configurações, mantendo a pasta `dist/` protegida pelo `.gitignore`.
5. **Acesso Público Funcional e Validado:** A aplicação publicada em `https://slayer-br.github.io/enpassant.live/` manterá 100% de suas funcionalidades operacionais (filtros, busca, ordenação, auto-refresh, temas, favicon e responsividade).

---

## 5. Contexto e Análise do Ambiente

### 5.1. Repositório Remoto
* **URL Remota Oficial:** `https://github.com/slayer-br/enpassant.live.git`
* **Usuário / Organização:** `slayer-br`
* **Nome do Repositório:** `enpassant.live`
* **URL Esperada do GitHub Pages:** `https://slayer-br.github.io/enpassant.live/`
* **Base Path no Vite:** `/enpassant.live/`

### 5.2. Estado do `.gitignore`
O arquivo [`.gitignore`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/.gitignore) já contém as regras:
```gitignore
# Production build
dist/
dist-ssr/
```
O `.gitignore` deve continuar contendo `dist/`. Como a regra já está presente e ativa, nenhuma alteração será necessária neste arquivo.

---

## 6. Arquitetura e Fluxo de Deploy

```
                         Desenvolvimento / Código-fonte
                                       │
                                       ▼
                              Branch: `main`
             (src/, public/, blueprint/, README.md, package.json)
                         [SEM a pasta dist/]
                                       │
                                       ▼
                       Comando: `npm run deploy`
                                       │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
                     ▼                                   ▼
             1. `npm run build`                  2. `gh-pages -d dist`
      (Vite compila com base path           (Publica o diretório dist/
       e inclui dist/.nojekyll)              na branch remota gh-pages)
                     │                                   │
                     ▼                                   ▼
          Pasta local: `dist/`                  Branch: `gh-pages`
          (Ignorada pelo .gitignore)         (Conteúdo compilado e .nojekyll)
                                                         │
                                                         ▼
                                                GitHub Pages Engine
                                           (Source: branch gh-pages / root)
                                                         │
                                                         ▼
                                       https://slayer-br.github.io/enpassant.live/
```

---

## 7. Escopo

* Configuração da propriedade `base: '/enpassant.live/'` no [`vite.config.js`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/vite.config.js).
* Criação do arquivo vazio `public/.nojekyll` para desativar o Jekyll no GitHub Pages.
* Instalação do pacote `gh-pages` como dependência de desenvolvimento (`devDependencies`).
* Adição dos scripts `"predeploy": "npm run build"` e `"deploy": "gh-pages -d dist"` no [`package.json`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/package.json).
* Validação local do build (`npm run build`) e visualização com subpath (`npm run preview`).
* Execução do deploy via `npm run deploy` e publicação na branch `gh-pages`.
* Configuração do GitHub Pages no repositório (`Source: Deploy from a branch` $\rightarrow$ `gh-pages` $\rightarrow$ `/ (root)`).
* Validação completa de carregamento, assets, API e interatividade no ambiente online.
* Atualização do [`README.md`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/README.md) com a URL pública **somente após a confirmação do deploy**.

---

## 8. Fora do Escopo

* Modificação de componentes React, hooks ou regras de negócio em `src/`.
* Criação de workflows customizados do GitHub Actions (`.github/workflows/deploy.yml`).
* Alteração no endpoint ou na lógica de consumo da API do Chess.com.
* Instalação de bibliotecas adicionais além de `gh-pages` (ex: React Router, Axios).
* Inclusão ou versionamento manual da pasta `dist/` na branch `main`.
* Configuração de domínio customizado (CNAME / DNS).

---

## 9. Detalhamento Técnico das Modificações

### 9.1. Configuração do Vite ([`vite.config.js`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/vite.config.js))

O Vite precisa prefixar os caminhos absolutos gerados no build com o nome do repositório:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/enpassant.live/',
});
```

### 9.2. Criação do Arquivo `.nojekyll` (`public/.nojekyll`)

* Criação de um arquivo vazio `public/.nojekyll`.
* Durante o `npm run build`, o Vite copia automaticamente os arquivos de `public/` para `dist/`.
* O arquivo resultante `dist/.nojekyll` é enviado para a raiz da branch `gh-pages`, instruindo o GitHub Pages a ignorar o motor Jekyll e servir todos os arquivos estáticos diretamente.

### 9.3. Dependência e Scripts no [`package.json`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/package.json)

1. **Instalação:**
   ```bash
   npm install -D gh-pages
   ```
2. **Scripts Configurados:**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

### 9.4. Mecanismo do `gh-pages`
* O utilitário `gh-pages -d dist` publica o conteúdo do diretório compilado `dist/` diretamente na branch `gh-pages` do repositório remoto configurado.
* A branch `main` permanece intacta e sem arquivos gerados de compilação.
* Deploys subsequentes executam o mesmo fluxo de compilação e sobrescrevem a branch `gh-pages` com a versão mais recente.

---

## 10. Configuração no GitHub Pages

O projeto utilizará exclusivamente a publicação clássica a partir de branch, sem necessidade de criação de arquivos de workflow de CI/CD:

1. Acessar o repositório no GitHub: `https://github.com/slayer-br/enpassant.live`.
2. Acessar **Settings** $\rightarrow$ **Pages** (menu lateral).
3. Na seção **Build and deployment**:
   * **Source:** Selecionar **Deploy from a branch**.
   * **Branch:** Selecionar `gh-pages` e a pasta `/ (root)`.
4. Clicar em **Save**.
5. Aguardar a disponibilização da URL pública pelo GitHub Pages.

---

## 11. Matriz de Arquivos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MATRIZ DE ARQUIVOS                             │
├─────────────────────────────────────┬───────────────────────────────────┤
│ Arquivo                             │ Ação / Responsabilidade           │
├─────────────────────────────────────┼───────────────────────────────────┤
│ vite.config.js                      │ MODIFICAR                         │
│                                     │ • Adicionar base: '/enpassant.live/'│
├─────────────────────────────────────┼───────────────────────────────────┤
│ package.json                        │ MODIFICAR                         │
│                                     │ • Adicionar predeploy e deploy    │
│                                     │ • Adicionar devDependency gh-pages│
├─────────────────────────────────────┼───────────────────────────────────┤
│ package-lock.json                   │ MODIFICAR                         │
│                                     │ • Atualização automática npm      │
├─────────────────────────────────────┼───────────────────────────────────┤
│ public/.nojekyll                    │ CRIAR DURANTE A IMPLEMENTAÇÃO     │
│                                     │ • Arquivo vazio para desativar    │
│                                     │   o processamento do Jekyll       │
├─────────────────────────────────────┼───────────────────────────────────┤
│ README.md                           │ MODIFICAR APÓS DEPLOY CONFIRMADO  │
│                                     │ • Adicionar link oficial da demo  │
├─────────────────────────────────────┼───────────────────────────────────┤
│ .gitignore                          │ NÃO MODIFICAR (dist/ já ignorada) │
│ index.html                          │ NÃO MODIFICAR                     │
│ src/App.jsx                         │ NÃO MODIFICAR (Imutável)          │
│ src/App.css                         │ NÃO MODIFICAR (Imutável)          │
│ src/components/*                    │ NÃO MODIFICAR (Imutável)          │
│ public/favicon.svg                  │ NÃO MODIFICAR (Imutável)          │
│ public/*.jpg                        │ NÃO MODIFICAR (Imutável)          │
│ blueprint/plans/00001–00008         │ NÃO MODIFICAR (Imutáveis)         │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 12. Fases de Implementação

### Fase 1: Configuração e Dependência
* Configurar `base: '/enpassant.live/'` no [`vite.config.js`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/vite.config.js).
* Criar o arquivo vazio `public/.nojekyll`.
* Instalar `gh-pages` como dependência de desenvolvimento via `npm install -D gh-pages`.
* Adicionar scripts `"predeploy": "npm run build"` e `"deploy": "gh-pages -d dist"` no [`package.json`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/package.json).

### Fase 2: Validação do Build Local
* Executar `npm run build`.
* Inspecionar `dist/` e verificar se `dist/.nojekyll`, `dist/favicon.svg`, `dist/index.html` e `dist/assets/` foram gerados corretamente com prefixo `/enpassant.live/`.
* Executar `npm run preview` para inspecionar localmente o comportamento do build sob o subpath configurado.

### Fase 3: Execução do Deploy
* Executar `npm run deploy`.
* Validar a compilação automática via `predeploy` e a publicação na branch `gh-pages`.

### Fase 4: Configuração no GitHub
* Confirmar as configurações de **Pages** no GitHub (`Source: Deploy from a branch` $\rightarrow$ `gh-pages` $\rightarrow$ `/ (root)`).
* Aguardar a publicação da página pelo serviço.

### Fase 5: Validação no Ambiente Publicado
* Acessar `https://slayer-br.github.io/enpassant.live/`.
* Validar carregamento sem erros HTTP 404 de assets (CSS, JS, SVG, Favicon e imagens).
* Validar consumo da API do Chess.com, ordenação, filtros de status (`TODOS`, `AO VIVO`, `OFFLINE`), busca por username, auto-refresh de 5 minutos, alternância de temas e responsividade.

### Fase 6: Documentação e Encerramento
* **Somente após confirmação do deploy online:** atualizar o [`README.md`](file:///c:/Users/casilva/Documents/B7web/fullstack_ia/react/streamerchess/README.md) incluindo o link da aplicação publicada.
* Executar build final de integridade.

---

## 13. Critérios de Aceitação

| ID | Critério | Validação Objetiva |
|---|---|---|
| **CA-01** | Dependência `gh-pages` | `gh-pages` presente exclusivamente em `devDependencies` no `package.json`. |
| **CA-02** | Configuração do `base` no Vite | `vite.config.js` possui `base: '/enpassant.live/'`. |
| **CA-03** | Arquivo `.nojekyll` | `public/.nojekyll` criado e copiado para `dist/.nojekyll` no build. |
| **CA-04** | Scripts de Deploy | `package.json` possui `"predeploy": "npm run build"` e `"deploy": "gh-pages -d dist"`. |
| **CA-05** | Pasta `dist/` Ignorada | A pasta `dist/` permanece listada no `.gitignore` e não é rastreada na branch `main`. |
| **CA-06** | Integridade da Branch Principal | A branch `main` contém exclusivamente código-fonte e documentação, sem arquivos compilados da pasta `dist/`. |
| **CA-07** | Build Local Bem-sucedido | `npm run build` compila com sucesso gerando assets com prefixo `/enpassant.live/`. |
| **CA-08** | Criação da Branch `gh-pages` | `npm run deploy` cria/atualiza a branch remota `gh-pages` contendo os arquivos compilados de `dist/`. |
| **CA-09** | Disponibilidade Pública | A URL `https://slayer-br.github.io/enpassant.live/` responde com HTTP 200 e carrega a aplicação. |
| **CA-10** | Carregamento de Assets | CSS, JavaScript, SVGs e imagens estáticas carregam sem erros HTTP 404. |
| **CA-11** | Favicon em Produção | O ícone `favicon.svg` é exibido na aba do navegador no ambiente publicado. |
| **CA-12** | Consumo da API em Produção | A requisição para `https://api.chess.com/pub/streamers` é completada com sucesso online. |
| **CA-13** | Ordenação Preservada | Canais transmitindo ao vivo aparecem no topo seguidos por A-Z (Plano 00004). |
| **CA-14** | Filtros de Status Preservados | Botões `TODOS`, `AO VIVO` e `OFFLINE` funcionam perfeitamente online (Plano 00008). |
| **CA-15** | Busca por Username Preservada | O campo de pesquisa filtra dinamicamente os streamers (Plano 00007). |
| **CA-16** | Paginação Preservada | A paginação inteligente funciona com limite de 12 itens e janela dinâmica (Plano 00006). |
| **CA-17** | Auto-Refresh Preservado | O ciclo de 5 minutos, countdown `MM:SS` e sync bar operam normalmente (Plano 00005). |
| **CA-18** | Temas Dark/Light Preservados | Alternância e persistência em `LocalStorage` funcionam em produção (Plano 00002). |
| **CA-19** | Responsividade Preservada | A interface adapta-se sem quebra de layout de 320px a 1440px+. |
| **CA-20** | README Atualizado Pós-Deploy | O link da aplicação online só é adicionado ao `README.md` após confirmação do deploy online. |
| **CA-21** | Zero Alterações de Código React | Nenhum arquivo em `src/` foi modificado para a realização do deploy. |

---

## 14. Riscos e Mitigações

| Risco | Impacto | Mitigação Técnica |
|---|---|---|
| Processamento Jekyll interferir na entrega de arquivos estáticos | Alto | Inclusão do arquivo `public/.nojekyll`, que é copiado para `dist/.nojekyll` e publicado na raiz da branch `gh-pages`. |
| Assets com caminho quebrado (HTTP 404) | Alto | Configuração explícita de `base: '/enpassant.live/'` no `vite.config.js`. |
| Inclusão acidental da pasta `dist/` na branch `main` | Alto | A pasta `dist/` permanece estritamente listada no `.gitignore`; o script `gh-pages -d dist` envia os arquivos diretamente para a branch isolada `gh-pages`. |
| Comportamento de CORS na API do Chess.com em produção | Médio | Validação do consumo da API pública diretamente no ambiente de produção na Fase 5. |
| Invalidação de cache em novas versões | Baixo | O Vite gera hashes automáticos nos nomes dos bundles (`assets/index-[hash].js`), forçando atualização imediata nos navegadores. |

---

## 15. Declaração de Não Alteração na Fase de Planejamento

Em conformidade estrita com as diretrizes do projeto:
* **Nenhum arquivo de código-fonte foi alterado durante a revisão deste plano.**
* **Nenhuma dependência foi instalada.**
* **Nenhum comando de deploy foi executado.**
* **Nenhum commit ou push foi realizado.**
* **Os Planos 00001 a 00008 foram integralmente preservados como contratos imutáveis.**
