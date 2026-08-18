const inputMensagem =
    document.getElementById("inputMensagem");

const btnEnviar =
    document.getElementById("btnEnviar");

const btnVoz =
    document.getElementById("btnVoz");

const btnNovaConversa =
    document.getElementById("btnNovaConversa");

const mensagens =
    document.getElementById("mensagens");

const listaConversas =
    document.getElementById("listaConversas");


// ==================================
// CONVERSAS SALVAS
// ==================================

let conversas =
    JSON.parse(
        localStorage.getItem("conversas")
    ) || [];


// ==================================
// CONVERSA ATUAL
// ==================================

let conversaId =
    Number(
        localStorage.getItem("conversa_id")
    ) || null;


// ==================================
// SALVAR CONVERSAS
// ==================================

function salvarConversas() {

    localStorage.setItem(
        "conversas",
        JSON.stringify(conversas)
    );

}


// ==================================
// CRIAR NOVA CONVERSA
// ==================================

function criarConversa() {

    const novaConversa = {

        id: Date.now(),

        titulo: "Nova conversa"

    };


    conversas.push(
        novaConversa
    );


    salvarConversas();


    conversaId =
        novaConversa.id;


    localStorage.setItem(
        "conversa_id",
        conversaId
    );


    renderizarConversas();

}


// ==================================
// RENDERIZAR LISTA DE CONVERSAS
// ==================================

function renderizarConversas() {

    listaConversas.innerHTML = "";


    // Mais recentes primeiro

    const lista =
        [...conversas].reverse();


    for (
        const conversa
        of lista
    ) {

        const botao =
            document.createElement("button");


        botao.type = "button";


        botao.classList.add(
            "conversa"
        );


        // Marcar conversa atual

        if (
            conversa.id ===
            conversaId
        ) {

            botao.classList.add(
                "ativa"
            );

        }


        botao.textContent =
            conversa.titulo;


        // Clicar na conversa

        botao.addEventListener(
            "click",
            () => {

                selecionarConversa(
                    conversa.id
                );

            }
        );


        listaConversas.appendChild(
            botao
        );

    }

}


// ==================================
// SELECIONAR CONVERSA
// ==================================

async function selecionarConversa(
    id
) {

    conversaId =
        Number(id);


    localStorage.setItem(
        "conversa_id",
        conversaId
    );


    renderizarConversas();


    await carregarHistorico();

}


// ==================================
// ATUALIZAR TÍTULO
// ==================================

function atualizarTitulo(
    texto
) {

    const conversa =
        conversas.find(
            conversa =>
                conversa.id ===
                conversaId
        );


    if (!conversa) {
        return;
    }


    // Só altera se ainda for
    // uma conversa nova

    if (
        conversa.titulo ===
        "Nova conversa"
    ) {

        conversa.titulo =
            texto.length > 35
                ? texto.substring(0, 35) + "..."
                : texto;


        salvarConversas();


        renderizarConversas();

    }

}


// ==================================
// ADICIONAR MENSAGEM
// ==================================

function adicionarMensagem(
    texto,
    tipo
) {

    const mensagem =
        document.createElement("div");


    mensagem.classList.add(
        "mensagem",
        tipo
    );


    const conteudo =
        document.createElement("div");


    conteudo.classList.add(
        "conteudo"
    );


    const nome =
        document.createElement("span");


    nome.classList.add(
        "nome"
    );


    nome.textContent =
        tipo === "usuario"
            ? "Você"
            : "AGA";


    const textoMensagem =
        document.createElement("p");


    textoMensagem.textContent =
        texto;


    conteudo.appendChild(
        nome
    );


    conteudo.appendChild(
        textoMensagem
    );


    mensagem.appendChild(
        conteudo
    );


    mensagens.appendChild(
        mensagem
    );


    mensagens.scrollTop =
        mensagens.scrollHeight;

}


// ==================================
// CARREGAR HISTÓRICO
// ==================================

async function carregarHistorico() {

    if (!conversaId) {

        criarConversa();

    }


    try {

        const resposta =
            await fetch(
                `http://localhost:3001/historico?conversa_id=${conversaId}`
            );


        const historico =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                historico.erro ||
                "Erro ao carregar histórico."
            );

        }


        // Limpar chat

        mensagens.innerHTML = "";


        // Mostrar mensagens

        for (
            const conversa
            of historico
        ) {

            adicionarMensagem(
                conversa.mensagem,
                "usuario"
            );


            adicionarMensagem(
                conversa.resposta,
                "AGA"
            );

        }


        // Se não houver histórico

        if (
            historico.length === 0
        ) {

            adicionarMensagem(
                "Olá. Como posso ajudar?",
                "AGA"
            );

        }


        mensagens.scrollTop =
            mensagens.scrollHeight;


    } catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );

    }

}


// ==================================
// ENVIAR PERGUNTA
// ==================================

async function enviarPergunta() {

    const texto =
        inputMensagem.value.trim();


    if (!texto) {
        return;
    }


    // ==================================
    // GARANTIR CONVERSA
    // ==================================

    if (!conversaId) {

        criarConversa();

    }


    // ==================================
    // ATUALIZAR TÍTULO
    // ==================================

    atualizarTitulo(
        texto
    );


    // ==================================
    // MOSTRAR MENSAGEM
    // ==================================

    adicionarMensagem(
        texto,
        "usuario"
    );


    inputMensagem.value = "";


    // Desativar controles

    btnEnviar.disabled =
        true;

    inputMensagem.disabled =
        true;


    // ==================================
    // PENSANDO
    // ==================================

    const carregando =
        document.createElement("div");


    carregando.classList.add(
        "mensagem",
        "AGA"
    );


    carregando.innerHTML = `

        <div class="conteudo">

            <span class="nome">
                AGA
            </span>

            <p>
                Pensando...
            </p>

        </div>

    `;


    mensagens.appendChild(
        carregando
    );


    mensagens.scrollTop =
        mensagens.scrollHeight;


    try {

        const resposta =
            await fetch(
                "http://localhost:3001/perguntar",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        mensagem:
                            texto,

                        conversa_id:
                            conversaId

                    })

                }
            );


        const dados =
            await resposta.json();


        carregando.remove();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro no servidor."
            );

        }


        // ==================================
        // ATUALIZAR ID
        // ==================================

        if (
            dados.conversa_id
        ) {

            conversaId =
                Number(
                    dados.conversa_id
                );


            localStorage.setItem(
                "conversa_id",
                conversaId
            );

        }


        // ==================================
        // MOSTRAR RESPOSTA
        // ==================================

        adicionarMensagem(
            dados.resposta,
            "AGA"
        );


        // Atualizar lista

        renderizarConversas();


    } catch (erro) {

        console.error(
            "Erro ao enviar pergunta:",
            erro
        );


        carregando.remove();


        adicionarMensagem(
            "Não consegui me conectar ao servidor.",
            "AGA"
        );

    }


    // Reativar controles

    btnEnviar.disabled =
        false;

    inputMensagem.disabled =
        false;

    inputMensagem.focus();

}


// ==================================
// NOVA CONVERSA
// ==================================

function novaConversa() {

    criarConversa();


    mensagens.innerHTML = "";


    adicionarMensagem(
        "Olá. Como posso ajudar?",
        "AGA"
    );


    renderizarConversas();


    inputMensagem.focus();

}


// ==================================
// BOTÃO ENVIAR
// ==================================

btnEnviar.addEventListener(
    "click",
    enviarPergunta
);


// ==================================
// BOTÃO NOVA CONVERSA
// ==================================

btnNovaConversa.addEventListener(
    "click",
    novaConversa
);


// ==================================
// ENTER
// ==================================

inputMensagem.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Enter"
        ) {

            enviarPergunta();

        }

    }
);


// ==================================
// BOTÃO VOZ
// ==================================

btnVoz.addEventListener(
    "click",
    () => {

        localStorage.setItem(
            "conversa_id",
            conversaId
        );


        window.location.href =
            "voz.html";

    }
);


// ==================================
// INICIAR
// ==================================

renderizarConversas();

carregarHistorico();