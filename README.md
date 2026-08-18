## AGA — Assistente Pessoal de IA

AGA (Alternative Gemini Assistant) é um assistente pessoal de inteligência artificial desenvolvido com JavaScript e Node.js, utilizando a API do Google Gemini para geração das respostas.
O projeto possui uma interface de chat, sistema de conversas, armazenamento do histórico em MySQL e um modo de interação por voz com reconhecimento de fala e geração de respostas em áudio.

> Este projeto foi desenvolvido para execução local. Para utilizá-lo, é necessário configurar uma chave própria da API do Google Gemini e um banco de dados MySQL.

## Funcionalidades

### Chat com IA

- Conversação com o assistente AGA.
- Respostas geradas utilizando o Google Gemini.
- Interface de chat responsiva.
- Envio de mensagens pelo botão ou pela tecla Enter.
- Indicador de processamento enquanto a resposta é gerada.

### Histórico e memória

- Histórico das conversas armazenado no MySQL.
- Recuperação das mensagens anteriores ao abrir uma conversa.
- As últimas mensagens da conversa são utilizadas como contexto para o Gemini.
- Suporte a múltiplas conversas.
- Títulos das conversas baseados na primeira mensagem enviada.

### Assistente por voz

- Reconhecimento de fala utilizando a Web Speech API.
- Conversão da fala do usuário em texto.
- Envio da pergunta para o backend.
- Geração da resposta utilizando o Gemini.
- Conversão da resposta em áudio utilizando o modelo de Text-to-Speech do Gemini.
- Reprodução automática da resposta.

### Processamento local

Algumas solicitações são processadas diretamente pelo backend, sem necessidade de consultar o Gemini:

- Data atual.
- Horário atual.
- Cálculos matemáticos simples.

Isso reduz chamadas desnecessárias à API de inteligência artificial.

## Tecnologias utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- Web Speech API
- LocalStorage

### Backend

- Node.js
- Node HTTP
- JavaScript (ES Modules)
- CORS
- dotenv

### Banco de dados

- MySQL
- mysql2

### Inteligência artificial

- Google Gemini API
- `@google/genai`
- Gemini para geração de texto
- Gemini TTS para geração de áudio

---

## 📁 Estrutura do projeto

```text
projeto_assistente/
│
├── back_end/
│   ├── database.js
│   └── server.js
│
├── front_end/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── voz.html
│   ├── voz.js
│   └── voz.css
│
├── Imagens/
│   ├── logo_aga.ico
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```
## API do backend

O backend roda localmente na porta 3001.

    POST /perguntar
Envia uma pergunta para o assistente.

Exemplo de requisição:

    {
    "mensagem": "Quem descobriu o Brasil?",
    "conversa_id": 123456
    }
Resposta:

    {
        "resposta": "A resposta do AGA aparecerá aqui.",
        "conversa_id": 123456
    }

Já o:

    POST /voz

Recebe uma pergunta obtida através do reconhecimento de voz.

Exemplo:

    {
        "mensagem": "Que horas são?",
        "conversa_id": 123456
    }

A rota retorna a resposta em texto e o áudio gerado pelo sistema.

    GET /historico

Retorna o histórico de uma conversa.

Exemplo:

    http://localhost:3001/historico?conversa_id=123456

Em relação as conversas do histórico:

    GET /conversas

Retorna as conversas cadastradas no banco de dados.

    POST /conversas

Cria uma nova conversa.

Exemplo:

    {
        "id": 123456,
        "titulo": "Minha conversa"
    }

## Banco de dados

O projeto utiliza o MySQL para armazenar as conversas e o histórico das interações.

O banco utilizado pelo projeto é:

    aga_assistente

As principais tabelas utilizadas são:

    conversas
    historico

### Tabela conversas

Armazena as informações das conversas.

Principais dados:

- ID da conversa
- Título
- Data de criação
- Data de atualização

### Tabela historico

Armazena as mensagens e respostas.

Principais dados:

- ID
- Mensagem do usuário
- Resposta da AGA
- Data e hora
- ID da conversa

> O repositório não contém um banco de dados pronto. É necessário criar o banco e as tabelas no ambiente local antes de executar o projeto.

## Configuração da API

A chave da API do Gemini deve ficar em um arquivo .env.

Crie um arquivo:

    .env

Com:

    GEMINI_API_KEY=SUA_CHAVE_AQUI

O projeto já possui um .env.example para servir como modelo.

## Instalação
1. Clone o repositório

       git clone https://github.com/TiagoMateragia/projeto_assistente.git

2. Entre na pasta:

        cd projeto_assistente

3. Instale as dependências:

        npm install
   
4. Configure o arquivo .env

        Crie um arquivo .env e coloque sua chave da API.


5. Configure o MySQL, criando o banco:

        CREATE DATABASE aga_assistente;
       
        E adicione as tabelas Historico e Conversas.

6. Configure o database.js:

        Host: localhost
        Usuário: root
        Senha: vazia
        Banco: aga_assistente

7. Inicie o Back-end:

        npm start

8. Abra o frontend:

         front_end/index.html

## LocalStorage

O frontend utiliza o localStorage do navegador para manter informações relacionadas às conversas utilizadas pela interface.

Entre elas está o identificador da conversa atual.

O histórico completo das mensagens, entretanto, é armazenado no MySQL.

## Observações

Este projeto foi desenvolvido como projeto de estudo e portfólio.

A aplicação atualmente foi projetada para execução local e não possui uma infraestrutura de produção.

Também é necessário possuir uma chave própria da API do Gemini para utilizar os recursos de inteligência artificial.

O funcionamento do reconhecimento de voz pode variar de acordo com o navegador utilizado.

## Objetivo do projeto

O objetivo deste projeto é desenvolver, na prática, uma aplicação completa envolvendo frontend, backend, banco de dados, APIs externas e interação por voz.

O projeto também serve como estudo de integração entre JavaScript, Node.js, MySQL e serviços de inteligência artificial.

## Autor

Tiago Materagia

## Licença

Este projeto está licenciado sob a licença MIT.
