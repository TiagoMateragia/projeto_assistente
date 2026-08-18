import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import conexao from "./database.js";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const servidor = createServer((req, res) => {

    cors()(req, res, async () => {


        // ==================================================
        // PERGUNTAR
        // ==================================================

        if (req.method === "POST" && req.url === "/perguntar") {

            let corpo = "";

            req.on("data", (parte) => {
                corpo += parte;
            });


            req.on("end", async () => {

                try {

                    const dados = JSON.parse(corpo);

                    const conversaId =
                        dados.conversa_id || 1;


                    console.log(
                        "Mensagem recebida:",
                        dados.mensagem
                    );

                    console.log(
                        "Conversa:",
                        conversaId
                    );


                    let textoResposta = "";


                    // ==================================================
                    // DATA
                    // ==================================================

                    if (
                        dados.mensagem
                            .toLowerCase()
                            .includes("data") ||

                        dados.mensagem
                            .toLowerCase()
                            .includes("dia de hoje") ||

                        dados.mensagem
                            .toLowerCase()
                            .includes("que dia é hoje")
                    ) {

                        const agora = new Date();

                        textoResposta =
                            `Hoje é dia ${agora.getDate()} de ${agora.toLocaleString(
                                "pt-BR",
                                {
                                    month: "long"
                                }
                            )} de ${agora.getFullYear()}.`;

                    }


                    // ==================================================
                    // HORA
                    // ==================================================

                    else if (
                        dados.mensagem
                            .toLowerCase()
                            .includes("hora") ||

                        dados.mensagem
                            .toLowerCase()
                            .includes("horas")
                    ) {

                        const agora = new Date();

                        textoResposta =
                            `Agora são ${agora.toLocaleTimeString(
                                "pt-BR",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            )}.`;

                    }


                    // ==================================================
                    // CÁLCULOS
                    // ==================================================

                    else if (
                        dados.mensagem
                            .toLowerCase()
                            .includes("quanto é") ||

                        dados.mensagem
                            .toLowerCase()
                            .includes("calcule")
                    ) {

                        try {

                            let calculo =
                                dados.mensagem
                                    .toLowerCase()
                                    .replace("quanto é", "")
                                    .replace("calcule", "")
                                    .replace("?", "")
                                    .trim();


                            calculo =
                                calculo
                                    .replace(/mais/g, "+")
                                    .replace(/menos/g, "-")
                                    .replace(/vezes/g, "*")
                                    .replace(
                                        /multiplicado por/g,
                                        "*"
                                    )
                                    .replace(
                                        /dividido por/g,
                                        "/"
                                    );


                            if (
                                /^[0-9+\-*/().\s]+$/
                                    .test(calculo)
                            ) {

                                const resultado =
                                    Function(
                                        `"use strict"; return (${calculo})`
                                    )();


                                textoResposta =
                                    `O resultado é ${resultado}.`;

                            } else {

                                textoResposta =
                                    "Não consegui identificar o cálculo.";

                            }

                        } catch (erro) {

                            console.error(
                                "Erro no cálculo:",
                                erro
                            );


                            textoResposta =
                                "Não consegui realizar esse cálculo.";

                        }

                    }


                    // ==================================================
                    // GEMINI + MEMÓRIA
                    // ==================================================

                    else {

                        const [historico] =
                            await conexao.execute(

                                `SELECT mensagem, resposta
                                 FROM historico
                                 WHERE conversa_id = ?
                                 ORDER BY id DESC
                                 LIMIT 10`,

                                [
                                    conversaId
                                ]

                            );


                        historico.reverse();


                        let contexto = "";


                        for (
                            const conversa
                            of historico
                        ) {

                            contexto += `
Usuário: ${conversa.mensagem}
AGA: ${conversa.resposta}
`;

                        }


                        const resposta =
                            await ai.models.generateContent({

                                model:
                                    "gemini-3.6-flash",


                                config: {

                                    systemInstruction: `
Você é AGA, um assistente pessoal de inteligência artificial.

Seu nome é AGA, Alternative Gemini Assistant.

Regras:

- Responda sempre em português brasileiro.
- Seja direto, natural e objetivo.
- Como suas respostas podem ser faladas em voz alta, prefira respostas curtas.
- Evite explicações longas quando não forem necessárias.
- Não use Markdown.
- Não use listas quando uma resposta simples for suficiente.
- Não repita a pergunta do usuário.
- Não comece respostas com "Claro!", "Com certeza!" ou "É claro!" sem necessidade.
- Responda exatamente ao que foi perguntado.
- Se a pergunta puder ser respondida em uma ou duas frases, faça isso.
- Só dê uma explicação detalhada quando o usuário pedir.
- Mantenha uma personalidade de assistente pessoal educado, calmo e prestativo.

Você possui acesso ao histórico recente desta conversa.

Use o histórico quando ele for relevante para responder à pergunta atual.

Se o usuário perguntar sobre algo que foi dito anteriormente, consulte o histórico antes de responder.

Não diga que não possui memória quando a informação estiver presente no histórico.

Não invente informações que não estejam no histórico.
`

                                },


                                contents: `
Histórico recente da conversa:

${contexto}

Nova mensagem do usuário:

${dados.mensagem}
`

                            });


                        textoResposta =
                            resposta.text;

                    }


                    console.log(
                        "Resposta:",
                        textoResposta
                    );


                    // ==================================================
                    // SALVAR NO MYSQL
                    // ==================================================

                    await conexao.execute(

                        `INSERT INTO historico
                        (mensagem, resposta, conversa_id)
                        VALUES (?, ?, ?)`,

                        [
                            dados.mensagem,
                            textoResposta,
                            conversaId
                        ]

                    );


                    // ==================================================
                    // RESPONDER AO FRONTEND
                    // ==================================================

                    res.writeHead(200, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            resposta:
                                textoResposta,

                            conversa_id:
                                conversaId

                        })

                    );

                } catch (erro) {

                    console.error(
                        "Erro ao consultar Gemini:",
                        erro
                    );


                    res.writeHead(500, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            erro:
                                "Erro ao processar a pergunta."

                        })

                    );

                }

            });


            return;

        }


        // ==================================================
        // HISTÓRICO
        // ==================================================

        if (
            req.method === "GET" &&
            req.url.startsWith("/historico")
        ) {

            try {

                const url =
                    new URL(
                        req.url,
                        "http://localhost:3001"
                    );


                const conversaId =
                    url.searchParams.get(
                        "conversa_id"
                    ) || 1;


                const [historico] =
                    await conexao.execute(

                        `SELECT
                            id,
                            mensagem,
                            resposta,
                            data_hora,
                            conversa_id
                         FROM historico
                         WHERE conversa_id = ?
                         ORDER BY id ASC`,

                        [
                            conversaId
                        ]

                    );


                res.writeHead(200, {

                    "Content-Type":
                        "application/json"

                });


                res.end(

                    JSON.stringify(
                        historico
                    )

                );

            } catch (erro) {

                console.error(
                    "Erro ao buscar histórico:",
                    erro
                );


                res.writeHead(500, {

                    "Content-Type":
                        "application/json"

                });


                res.end(

                    JSON.stringify({

                        erro:
                            "Erro ao buscar histórico."

                    })

                );

            }


            return;

        }


        // ==================================================
        // VOZ + MEMÓRIA + TTS
        // ==================================================

        if (
            req.method === "POST" &&
            req.url === "/voz"
        ) {

            let corpo = "";


            req.on("data", (parte) => {

                corpo += parte;

            });


            req.on("end", async () => {

                try {

                    const dados =
                        JSON.parse(corpo);


                    const conversaId =
                        dados.conversa_id || 1;


                    console.log(
                        "Mensagem recebida na voz:",
                        dados.mensagem
                    );


                    console.log(
                        "Conversa:",
                        conversaId
                    );


                    // ==================================================
                    // BUSCAR HISTÓRICO DA CONVERSA
                    // ==================================================

                    const [historico] =
                        await conexao.execute(

                            `SELECT mensagem, resposta
                             FROM historico
                             WHERE conversa_id = ?
                             ORDER BY id DESC
                             LIMIT 10`,

                            [
                                conversaId
                            ]

                        );


                    historico.reverse();


                    let contexto = "";


                    for (
                        const conversa
                        of historico
                    ) {

                        contexto += `
Usuário: ${conversa.mensagem}
AGA: ${conversa.resposta}
`;

                    }


                    // ==================================================
                    // GEMINI COM MEMÓRIA
                    // ==================================================

                    const resposta =
                        await ai.models.generateContent({

                            model:
                                "gemini-3.6-flash",


                            config: {

                                systemInstruction: `
Você é AGA, um assistente pessoal de inteligência artificial.

Seu nome é AGA, Alternative Gemini Assistant.

Regras:

- Responda sempre em português brasileiro.
- Seja direto, natural e objetivo.
- Como sua resposta será falada em voz alta, prefira respostas curtas.
- Evite explicações longas.
- Não use Markdown.
- Não use listas quando uma resposta simples for suficiente.
- Não repita a pergunta do usuário.
- Mantenha uma personalidade de assistente pessoal educado, calmo e prestativo.

Você possui acesso ao histórico recente desta conversa.

Use o histórico quando ele for relevante para responder à pergunta atual.

Se o usuário perguntar sobre algo que foi dito anteriormente, consulte o histórico antes de responder.

Não diga que não possui memória quando a informação estiver presente no histórico.

Não invente informações que não estejam no histórico.
`

                            },


                            contents: `
Histórico recente da conversa:

${contexto}

Nova mensagem do usuário:

${dados.mensagem}
`

                        });


                    const texto =
                        resposta.text;


                    console.log(
                        "Resposta para voz:",
                        texto
                    );


                    // ==================================================
                    // SALVAR CONVERSA NO MYSQL
                    // ==================================================

                    await conexao.execute(

                        `INSERT INTO historico
                        (mensagem, resposta, conversa_id)
                        VALUES (?, ?, ?)`,

                        [
                            dados.mensagem,
                            texto,
                            conversaId
                        ]

                    );


                    // ==================================================
                    // GEMINI TTS
                    // ==================================================

                    const respostaAudio =
                        await ai.models.generateContent({

                            model:
                                "gemini-3.1-flash-tts-preview",


                            contents:
                                texto,


                            config: {

                                responseModalities:
                                    ["AUDIO"],


                                speechConfig: {

                                    voiceConfig: {

                                        prebuiltVoiceConfig: {

                                            voiceName:
                                                "Puck"

                                        }

                                    }

                                }

                            }

                        });


                    // ==================================================
                    // PEGAR ÁUDIO
                    // ==================================================

                    const dadosAudio =
                        respostaAudio
                            .candidates?.[0]
                            ?.content?.parts?.[0]
                            ?.inlineData?.data;


                    if (!dadosAudio) {

                        throw new Error(
                            "Áudio não foi gerado."
                        );

                    }


                    // ==================================================
                    // RESPONDER
                    // ==================================================

                    res.writeHead(200, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            resposta:
                                texto,

                            audio:
                                dadosAudio,

                            conversa_id:
                                conversaId

                        })

                    );


                } catch (erro) {

                    console.error(
                        "Erro na voz:",
                        erro
                    );


                    res.writeHead(500, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            erro:
                                "Erro ao gerar a resposta em voz."

                        })

                    );

                }

            });


            return;

        }

        // ==================================================
        // CONVERSAS
        // ==================================================

        // LISTAR CONVERSAS

        if (
            req.method === "GET" &&
            req.url === "/conversas"
        ) {

            try {

                const [conversas] =
                    await conexao.execute(

                        `SELECT
                            id,
                            titulo,
                            data_criacao,
                            data_atualizacao
                        FROM conversas
                        ORDER BY data_atualizacao DESC`

                    );


                res.writeHead(200, {

                    "Content-Type":
                        "application/json"

                });


                res.end(
                    JSON.stringify(conversas)
                );


            } catch (erro) {

                console.error(
                    "Erro ao buscar conversas:",
                    erro
                );


                res.writeHead(500, {

                    "Content-Type":
                        "application/json"

                });


                res.end(

                    JSON.stringify({

                        erro:
                            "Erro ao buscar conversas."

                    })

                );

            }

            return;

        }


        // ==================================================
        // CRIAR CONVERSA
        // ==================================================

        if (
            req.method === "POST" &&
            req.url === "/conversas"
        ) {

            let corpo = "";


            req.on("data", (parte) => {

                corpo += parte;

            });


            req.on("end", async () => {

                try {

                    const dados =
                        JSON.parse(corpo);


                    const id =
                        dados.id || Date.now();


                    const titulo =
                        dados.titulo ||
                        "Nova conversa";


                    await conexao.execute(

                        `INSERT INTO conversas
                        (id, titulo)
                        VALUES (?, ?)`,

                        [
                            id,
                            titulo
                        ]

                    );


                    res.writeHead(201, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            id: id,

                            titulo: titulo

                        })

                    );


                } catch (erro) {

                    console.error(
                        "Erro ao criar conversa:",
                        erro
                    );


                    res.writeHead(500, {

                        "Content-Type":
                            "application/json"

                    });


                    res.end(

                        JSON.stringify({

                            erro:
                                "Erro ao criar conversa."

                        })

                    );

                }

            });

            return;

        }


        // ==================================================
        // EXCLUIR CONVERSA
        // ==================================================

        if (
            req.method === "DELETE" &&
            req.url.startsWith("/conversas/")
        ) {

            try {

                const id =
                    req.url.split("/")[2];


                await conexao.execute(

                    `DELETE FROM historico
                    WHERE conversa_id = ?`,

                    [
                        id
                    ]

                );


                await conexao.execute(

                    `DELETE FROM conversas
                    WHERE id = ?`,

                    [
                        id
                    ]

                );


                res.writeHead(200, {

                    "Content-Type":
                        "application/json"

                });


                res.end(

                    JSON.stringify({

                        mensagem:
                            "Conversa excluída."

                    })

                );


            } catch (erro) {

                console.error(
                    "Erro ao excluir conversa:",
                    erro
                );


                res.writeHead(500, {

                    "Content-Type":
                        "application/json"

                });


                res.end(

                    JSON.stringify({

                        erro:
                            "Erro ao excluir conversa."

                    })

                );

            }

            return;

        }

        // ==================================================
        // ROTA NÃO ENCONTRADA
        // ==================================================

        res.writeHead(404, {

            "Content-Type":
                "application/json"

        });


        res.end(

            JSON.stringify({

                erro:
                    "Rota não encontrada"

            })

        );

    });

});


servidor.listen(3001, () => {

    console.log(
        "Servidor rodando em http://localhost:3001"
    );

});