
Braindump — Chess Streamers

1. Objetivo

Criar uma aplicação web em React para listar os streamers de xadrez disponibilizados pela API pública do Chess.com.

A aplicação deverá apresentar os streamers de forma visual e permitir identificar rapidamente quais estão ao vivo na Twitch.

2. Stack
   Frontend
   React
   JavaScript
   CSS
   useState
   useEffect
   fetch
   API

Endpoint:

Chess.com Streamers API

A API é pública e não exige autenticação para esse endpoint.

3. Dados dos streamers

Cada streamer deverá apresentar:

Informação	Origem
Avatar	avatar
Nome	username
Twitch	twitch_url
Status	is_live

Exemplo conceitual:

{
  username: "hikaru",
  avatar: "https://...",
  twitch_url: "https://twitch.tv/hikaru",
  is_live: true
}
4. Comportamento da aplicação

Ao abrir a aplicação:

React inicia o componente.
useEffect é executado.
A aplicação faz fetch para a API.
A resposta JSON é recebida.
Os streamers são armazenados no useState.
A lista é renderizada.
Cada streamer aparece em um card.

Fluxo:

React
  ↓
useEffect
  ↓
fetch()
  ↓
Chess.com API
  ↓
JSON
  ↓
setStreamers()
  ↓
useState
  ↓
Renderização dos Cards
5. Card do streamer

Cada streamer poderá ser exibido aproximadamente assim:

┌─────────────────────────────┐
│                             │
│          [ AVATAR ]         │
│                             │
│           Hikaru            │
│                             │
│       Twitch: hikaru        │
│                             │
│          ● AO VIVO          │
│                             │
└─────────────────────────────┘

Quando não estiver ao vivo:

┌─────────────────────────────┐
│                             │
│          [ AVATAR ]         │
│                             │
│           Hikaru            │
│                             │
│       Twitch: hikaru        │
│                             │
│        ○ OFFLINE            │
│                             │
└─────────────────────────────┘
6. Estado

O estado principal pode ser:

const [streamers, setStreamers] = useState([]);

Opcionalmente, para deixar o projeto mais completo:

const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

Assim teremos três situações:

Carregando
   ↓
API
   ├── sucesso → lista
   └── erro    → mensagem de erro
7. useEffect

O useEffect será responsável por buscar os dados quando o componente for montado.

Conceitualmente:

useEffect(() => {
  // buscar streamers
}, []);

O array vazio [] faz com que a busca aconteça na montagem do componente.

8. Renderização

Depois que streamers receber os dados:

streamers.map((streamer) => ...)

Cada objeto gera um card.

O status poderá utilizar:

streamer.is_live

Por exemplo:

{streamer.is_live ? "AO VIVO" : "OFFLINE"}

A documentação atual do endpoint inclui is_live como propriedade do streamer.

9. Link para Twitch

O nome ou um botão do card poderá direcionar para:

streamer.twitch_url

Exemplo visual:

Hikaru

[ Assistir na Twitch ]

O ideal é abrir a Twitch em uma nova aba.

10. Estados da interface

O projeto pode trabalhar com quatro estados:

Loading
Carregando streamers...
Sucesso
[Streamer] [Streamer] [Streamer]
[Streamer] [Streamer] [Streamer]
Nenhum resultado
Nenhum streamer encontrado.
Erro
Não foi possível carregar os streamers.
11. Possível estrutura de componentes

Uma estrutura simples e didática:

src/
├── components/
│   ├── StreamerCard.jsx
│   └── Loading.jsx
│
├── App.jsx
├── main.jsx
├── App.css
└── index.css

Ou, mantendo o projeto ainda mais simples:

src/
├── App.jsx
├── App.css
├── main.jsx
└── index.css

Para esse projeto, eu começaria pela segunda opção e só criaria componentes quando houver necessidade.

12. Funcionalidades do MVP
    Obrigatórias
    React
    useState
    useEffect
    Consumir API do Chess.com
    Listar todos os streamers retornados
    Mostrar avatar
    Mostrar nome
    Mostrar Twitch
    Mostrar status online/offline
    Identificar streamer ao vivo
    Link para Twitch
    Loading
    Tratamento básico de erro
13. Possíveis melhorias futuras

Depois do MVP, dá para evoluir bastante:

Filtro
Todos | Ao vivo | Offline
Busca
Pesquisar streamer...
Ordenação

Colocar os streamers ao vivo primeiro:

AO VIVO
─────────────
Hikaru
Eric Rosen
BotezLive

OFFLINE
─────────────
...
Atualização automática

Como o objetivo é mostrar quem está ao vivo, poderíamos atualizar os dados periodicamente.

Por exemplo:

API
 ↓
5 minutos
 ↓
API
 ↓
5 minutos
 ↓
API

A documentação histórica do endpoint informa atualização periódica e fontes mais recentes também descrevem o endpoint como tendo atualização em torno de minutos.

Contador
Chess Streamers

● 8 AO VIVO
   42 STREAMERS
14. Ideia visual

Eu faria uma interface com temática de xadrez + streaming:

┌──────────────────────────────────────────────────────┐
│                                                      │
│              CHESS STREAMERS                         │
│       Streamers de xadrez ao vivo                    │
│                                                      │
│       [ Todos ] [ Ao Vivo ] [ Offline ]              │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Avatar  │  │ Avatar  │  │ Avatar  │              │
│  │         │  │         │  │         │              │
│  │ Hikaru  │  │ Streamer│  │ Streamer│              │
│  │         │  │         │  │         │              │
│  │ ● LIVE  │  │ ○ OFF   │  │ ● LIVE  │              │
│  │ Twitch  │  │ Twitch  │  │ Twitch  │              │
│  └─────────┘  └─────────┘  └─────────┘              │
│                                                      │
└──────────────────────────────────────────────────────┘
15. Conceito principal do projeto

O projeto é pequeno, mas é ótimo para praticar React, porque força o uso de conceitos importantes:

API externa
   ↓
fetch
   ↓
useEffect
   ↓
useState
   ↓
renderização dinâmica
   ↓
.map()
   ↓
componentização
   ↓
condicional
   ↓
interação com links externos

E eu manteria o primeiro desafio sem Context API, Redux, Axios ou outras abstrações. A ideia é justamente exercitar useState + useEffect + consumo de API de forma clara e idiomática.
