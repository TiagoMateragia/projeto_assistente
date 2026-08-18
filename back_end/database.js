import mysql from "mysql2/promise";

const conexao = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "aga_assistente"
});

console.log("MySQL conectado!");

export default conexao;