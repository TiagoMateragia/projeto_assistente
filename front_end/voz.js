const btnMicrofone =
    document.getElementById("btnMicrofone");

const status =
    document.getElementById("status");


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


const reconhecimento =
    new SpeechRecognition();


reconhecimento.lang = "pt-BR";
reconhecimento.continuous = false;
reconhecimento.interimResults = false;


let ouvindo = false;


// ==========================================
// CONVERSA ATUAL
// ==========================================

let conversaId =
    Number(
        localStorage.getItem("conversa_id")
    ) || 1;


// ==========================================
// CONVERSAS SALVAS
// ==========================================

let conversas =
    JSON.parse(
        localStorage.getItem("conversas")
    ) || [];


// ==========================================
// ATUALIZAR TÍTULO DA CONVERSA
// ==========================================

function atualizarTitulo(texto) {

    const conversa =
        conversas.find(
            conversa =>
                conversa.id === conversaId
        );


    if (!conversa) {
        return;
    }


    // Só altera se ainda for uma nova conversa

    if (
        conversa.titulo ===
        "Nova conversa"
    ) {

        conversa.titulo =
            texto.length > 30
                ? texto.substring(0, 30) + "..."
                : texto;


        localStorage.setItem(
            "conversas",
            JSON.stringify(conversas)
        );

    }

}


// ==========================================
// TRANSFORMAR PCM EM WAV
// ==========================================

function criarWav(pcm, sampleRate = 24000) {

    const buffer =
        new ArrayBuffer(
            44 + pcm.length
        );

    const view =
        new DataView(buffer);


    function escreverTexto(posicao, texto) {

        for (
            let i = 0;
            i < texto.length;
            i++
        ) {

            view.setUint8(
                posicao + i,
                texto.charCodeAt(i)
            );

        }

    }


    // RIFF

    escreverTexto(
        0,
        "RIFF"
    );


    view.setUint32(
        4,
        36 + pcm.length,
        true
    );


    // WAVE

    escreverTexto(
        8,
        "WAVE"
    );


    // fmt

    escreverTexto(
        12,
        "fmt "
    );


    view.setUint32(
        16,
        16,
        true
    );


    // PCM

    view.setUint16(
        20,
        1,
        true
    );


    // Mono

    view.setUint16(
        22,
        1,
        true
    );


    // Sample rate

    view.setUint32(
        24,
        sampleRate,
        true
    );


    // Byte rate

    view.setUint32(
        28,
        sampleRate * 2,
        true
    );


    // Block align

    view.setUint16(
        32,
        2,
        true
    );


    // Bits por sample

    view.setUint16(
        34,
        16,
        true
    );


    // data

    escreverTexto(
        36,
        "data"
    );


    view.setUint32(
        40,
        pcm.length,
        true
    );


    // PCM dentro do WAV

    new Uint8Array(
        buffer,
        44
    ).set(pcm);


    return new Blob(
        [buffer],
        {
            type: "audio/wav"
        }
    );

}


// ==========================================
// RESULTADO DA FALA
// ==========================================

reconhecimento.onresult =
    async (evento) => {

        const texto =
            evento
                .results[0][0]
                .transcript;


        console.log(
            "Você disse:",
            texto
        );


        // ==========================================
        // ATUALIZAR TÍTULO
        // ==========================================

        atualizarTitulo(texto);


        status.textContent =
            "Processando...";


        try {

            const resposta =
                await fetch(
                    "http://localhost:3001/voz",
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


            console.log(
                "Resposta do servidor:",
                dados.resposta
            );


            // ==========================================
            // VERIFICAR ERRO
            // ==========================================

            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    "Erro no servidor."
                );

            }


            // ==========================================
            // ATUALIZAR CONVERSA
            // ==========================================

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


            status.textContent =
                dados.resposta;


            // ==========================================
            // VERIFICAR ÁUDIO
            // ==========================================

            if (!dados.audio) {

                throw new Error(
                    "O servidor não retornou áudio."
                );

            }


            // ==========================================
            // BASE64 → BYTES
            // ==========================================

            const audioBytes =
                Uint8Array.from(
                    atob(dados.audio),
                    caractere =>
                        caractere.charCodeAt(0)
                );


            console.log(
                "Áudio recebido:",
                audioBytes.length,
                "bytes"
            );


            // ==========================================
            // PCM → WAV
            // ==========================================

            const blob =
                criarWav(
                    audioBytes,
                    24000
                );


            const urlAudio =
                URL.createObjectURL(
                    blob
                );


            const audio =
                new Audio(
                    urlAudio
                );


            audio.volume = 1;


            audio.onended = () => {

                URL.revokeObjectURL(
                    urlAudio
                );

            };


            // ==========================================
            // REPRODUZIR
            // ==========================================

            await audio.play();


        } catch (erro) {

            console.error(
                "Erro ao conectar com o servidor:",
                erro
            );


            status.textContent =
                "Não consegui gerar a resposta em voz.";

        }

    };


// ==========================================
// QUANDO TERMINAR
// ==========================================

reconhecimento.onend =
    () => {

        console.log(
            "Reconhecimento encerrado."
        );


        ouvindo = false;


        status.textContent =
            "Aguardando você...";

    };


// ==========================================
// ERRO
// ==========================================

reconhecimento.onerror =
    (evento) => {

        console.error(
            "Erro:",
            evento.error
        );


        ouvindo = false;


        status.textContent =
            "Erro no reconhecimento.";

    };


// ==========================================
// BOTÃO MICROFONE
// ==========================================

btnMicrofone.addEventListener(
    "click",
    () => {

        if (ouvindo) {
            return;
        }


        ouvindo = true;


        status.textContent =
            "Estou ouvindo...";


        try {

            reconhecimento.start();

        } catch (erro) {

            console.error(
                "Erro ao iniciar:",
                erro
            );


            ouvindo = false;

        }

    }
);