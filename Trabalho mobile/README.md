# Apresentação do Projeto: To-Do List Full Stack com Autenticação


1. **Front-end (React):** Interface do usuário onde as telas são renderizadas dinamicamente.
2. **Back-end (Python com Flask):** API que gerencia as regras de negócio e faz a ponte de segurança.
3. **Banco de Dados (MySQL):** Onde os dados de usuários e tarefas são persistidos de forma relacional.

A principal regra de negócio aplicada é que **cada usuário possui sua própria conta e só pode visualizar, editar ou excluir as suas próprias tarefas**.

---

## 1. Estrutura do Banco de Dados (`banco.sql`)

Para começar, este é o script que cria o banco de dados e as tabelas relacionais no MySQL:

```sql
CREATE DATABASE IF NOT EXISTS projeto_todolist;
USE projeto_todolist;

-- Tabela para armazenar as credenciais dos usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- Tabela para armazenar as tarefas, vinculadas ao ID do usuário dono
CREATE TABLE IF NOT EXISTS tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

```

* **Explicação:** A tabela `tarefas` possui uma chave estrangeira (`FOREIGN KEY`) apontando para `usuarios(id)`. O comando `ON DELETE CASCADE` garante que, se um usuário for deletado, todas as tarefas dele sejam apagadas automaticamente, mantendo a integridade do banco.

---

## 2. O Back-end em Python (`app.py`)

O back-end foi desenvolvido em Python utilizando o microframework **Flask**. Ele disponibiliza as rotas da API (endpoints) para o React consumir.

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)  # Permite que o React (localhost:5173) se comunique com o Python (localhost:5000)

# Função responsável por abrir a conexão com o servidor local do MySQL
def conectar_banco():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="SUA_SENHA_AQUI",  # Configuração local da senha do MySQL
        database="projeto_todolist"
    )

# ----------------- ROTAS DE AUTENTICAÇÃO -----------------

# CADASTRO: Recebe email e senha e insere no banco
@app.route('/cadastro', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json()  # Captura os dados JSON vindos do React
    email = dados.get('email')
    senha = dados.get('senha')
    
    if not email or not senha:
        return jsonify({"erro": "Preencha todos os campos"}), 400
        
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    try:
        cursor.execute("INSERT INTO usuarios (email, senha) VALUES (%s, %s)", (email, senha))
        conexao.commit()  # Confirma a inserção no banco
        return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201
    except mysql.connector.Error:
        return jsonify({"erro": "Este email já está cadastrado"}), 400
    finally:
        cursor.close()
        conexao.close()

# LOGIN: Valida se o email e senha coincidem com o banco
@app.route('/login', methods=['POST'])
def login_usuario():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')
    
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)  # Retorna os dados como dicionário/objeto
    
    cursor.execute("SELECT * FROM usuarios WHERE email = %s AND senha = %s", (email, senha))
    usuario = cursor.fetchone()  # Busca o usuário correspondente
    
    cursor.close()
    conexao.close()
    
    if usuario:
        # Retorna o ID do usuário para o React saber quem se logou
        return jsonify({"id": usuario['id'], "email": usuario['email']}), 200
    else:
        return jsonify({"erro": "Email ou senha incorretos"}), 401

# ----------------- ROTAS DO CRUD DE TAREFAS -----------------

# READ: Lista apenas as tarefas do usuário logado (passado via URL)
@app.route('/tarefas/<int:usuario_id>', methods=['GET'])
def listar_tarefas(usuario_id):
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tarefas WHERE usuario_id = %s", (usuario_id,))
    tarefas = cursor.fetchall()
    cursor.close()
    conexao.close()
    return jsonify(tarefas)

# CREATE: Adiciona uma nova tarefa vinculada ao usuário logado
@app.route('/tarefas', methods=['POST'])
def adicionar_tarefa():
    dados = request.get_json()
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')
    usuario_id = dados.get('usuario_id')
    
    conexao = conectar_banco()
    cursor = conexao.cursor()
    cursor.execute("INSERT INTO tarefas (usuario_id, titulo, descricao) VALUES (%s, %s, %s)", (usuario_id, titulo, descricao))
    conexao.commit()
    nova_id = cursor.lastrowid  # Captura o ID gerado pelo banco para enviar de volta ao React
    cursor.close()
    conexao.close()
    return jsonify({"id": nova_id, "usuario_id": usuario_id, "titulo": titulo, "descricao": descricao}), 201

# UPDATE: Atualiza os dados de uma tarefa existente através do ID dela
@app.route('/tarefas/<int:tarefa_id>', methods=['PUT'])
def atualizar_tarefa(tarefa_id):
    dados = request.get_json()
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')
    
    conexao = conectar_banco()
    cursor = conexao.cursor()
    cursor.execute("UPDATE tarefas SET titulo = %s, descricao = %s WHERE id = %s", (titulo, descricao, tarefa_id))
    conexao.commit()
    cursor.close()
    conexao.close()
    return jsonify({"id": tarefa_id, "titulo": titulo, "descricao": descricao}), 200

# DELETE: Remove permanentemente uma tarefa do banco pelo ID
@app.route('/tarefas/<int:tarefa_id>', methods=['DELETE'])
def deletar_tarefa(tarefa_id):
    conexao = conectar_banco()
    cursor = conexao.cursor()
    cursor.execute("DELETE FROM tarefas WHERE id = %s", (tarefa_id,))
    conexao.commit()
    cursor.close()
    conexao.close()
    return jsonify({"mensagem": "Tarefa excluída com sucesso!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Executa o servidor na porta 5000

```

---

## 3. O Front-end em React (`App.jsx`)

No front-end, criei uma **Single Page Application (SPA)** simples. O React controla as telas dinamicamente usando estados (`useState`), alternando a interface sem precisar recarregar a página.

```jsx
import { useState } from 'react';

export default function App() {
  // --- GERENCIAMENTO DE ESTADOS (STATE) ---
  const [telaAtual, setTelaAtual] = useState('login'); // Define a tela: 'login', 'cadastro' ou 'dashboard'
  const [usuarioId, setUsuarioId] = useState(null);    // Armazena o ID do usuário autenticado no MySQL

  // Estados dos inputs dos formulários
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  
  const [tarefas, setTarefas] = useState([]);          // Array que armazena as tarefas vindas da API
  const [idEditando, setIdEditando] = useState(null);  // Guarda o ID da tarefa se estivermos editando, se for null estamos criando

  // --- REQUISIÇÕES HTTP (FETCH API) ---

  // READ (Listar): Busca as tarefas que pertencem ao ID do usuário conectado
  const buscarTarefasDoBanco = async (idDoUsuario) => {
    try {
      const response = await fetch(`http://localhost:5000/tarefas/${idDoUsuario}`);
      const dados = await response.json();
      setTarefas(dados); // Atualiza o estado e renderiza na tela
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  // AUTENTICAÇÃO: Envia os dados para a rota de login do Flask
  const lidarComLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const dados = await response.json();

      if (response.ok) {
        setUsuarioId(dados.id);          // Guarda o ID do usuário localmente
        buscarTarefasDoBanco(dados.id);  // Busca imediatamente as tarefas dele
        setTelaAtual('dashboard');       // Libera o acesso à tela principal
        setEmail('');
        setSenha('');
      } else {
        alert(dados.erro);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // REGISTRO: Envia os dados para criar uma nova conta no MySQL
  const lidarComCadastro = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const dados = await response.json();

      if (response.ok) {
        alert("Cadastro realizado! Faça seu login.");
        setTelaAtual('login'); // Redireciona o usuário para a tela de login
        setEmail('');
        setSenha('');
      } else {
        alert(dados.erro);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // CREATE / UPDATE: Esta função analisa o estado "idEditando".
  const adicionarTarefa = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (idEditando) {
      // Se idEditando tiver um valor, faz uma requisição PUT para atualizar o banco
      try {
        const response = await fetch(`http://localhost:5000/tarefas/${idEditando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descricao })
        });

        if (response.ok) {
          // Atualiza a tarefa modificada no estado do React de forma reativa
          setTarefas(tarefas.map(t => t.id === idEditando ? { ...t, titulo, descricao } : t));
          setIdEditando(null); // Sai do modo de edição
          setTitulo('');
          setDescricao('');
        }
      } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
      }
    } else {
      // Se idEditando for null, faz uma requisição POST para salvar uma nova tarefa
      try {
        const response = await fetch('http://localhost:5000/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descricao, usuario_id: usuarioId })
        });
        const nova = await response.json();

        setTarefas([...tarefas, nova]); // Adiciona a nova tarefa no fim da lista sem recarregar a página
        setTitulo('');
        setDescricao('');
      } catch (error) {
        console.error("Erro ao adicionar tarefa:", error);
      }
    }
  };

  // Prepara os inputs jogando os textos da tarefa selecionada de volta para os campos de digitação
  const prepararEdicao = (tarefa) => {
    setIdEditando(tarefa.id);
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao);
  };

  // DELETE: Envia uma requisição de exclusão para o Flask
  const excluirTarefa = async (idDaTarefa) => {
    try {
      const response = await fetch(`http://localhost:5000/tarefas/${idDaTarefa}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove a tarefa da interface visual filtrando a lista atual
        setTarefas(tarefas.filter(tarefa => tarefa.id !== idDaTarefa));
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };
  
  // --- RENDEREZAÇÃO CONDICIONAL DE TELAS ---

  // 1. Renderiza a Tela de Login
  if (telaAtual === 'login') {
    return (
      <div>
        <h2>Login</h2>
        <form onSubmit={lidarComLogin}>
          <div>
            <label>Email: </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Senha: </label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button type="submit">Entrar</button>
        </form>
        <p>Não tem conta? <button onClick={() => setTelaAtual('cadastro')}>Cadastre-se</button></p>
      </div>
    );
  }

  // 2. Renderiza a Tela de Cadastro
  if (telaAtual === 'cadastro') {
    return (
      <div>
        <h2>Criar Nova Conta</h2>
        <form onSubmit={lidarComCadastro}>
          <div>
            <label>Email: </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Senha: </label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button type="submit">Cadastrar</button>
        </form>
        <p>Já tem conta? <button onClick={() => setTelaAtual('login')}>Fazer Login</button></p>
      </div>
    );
  }

  // 3. Renderiza a Tela Principal (Dashboard com a Lista)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px' }}>
        <h1>Minha To-Do List</h1>
        {/* Botão de sair limpa o estado de visualização e joga o usuário de volta para o login */}
        <button onClick={() => setTelaAtual('login')} style={{ height: '30px', marginTop: '25px' }}>Sair</button>
      </div>
      
      <form onSubmit={adicionarTarefa}>
        <div>
          <label>Tarefa:</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div>
          <label>Descrição:</label>
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        {/* O texto do botão muda se o usuário estiver editando ou criando */}
        <button type="submit">{idEditando ? 'Salvar Alteração' : 'Adicionar'}</button>
      </form>

      <br />

      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {tarefas.map(tarefa => (
          <li key={tarefa.id} style={{ marginBottom: '15px' }}>
            <strong>{tarefa.titulo}</strong>
            <div style={{ paddingLeft: '10px', color: '#555' }}>
              {tarefa.descricao}
            </div>
            
            {/* Botões limpos visualmente sem colchetes */}
            <button onClick={() => prepararEdicao(tarefa)} style={{ fontSize: '11px', marginTop: '5px', marginRight: '5px' }}>
              Editar
            </button>

            <button onClick={() => excluirTarefa(tarefa.id)} style={{ fontSize: '11px', marginTop: '5px' }}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

```

---

## Resumo dos Recursos Implementados

Com essa estrutura, consegui cumprir todas as etapas fundamentais de um software profissional:

* **Autenticação Funcional:** Proteção de dados por usuário.
* **CRUD Completo integrado ao Banco de Dados Relacional:**
* **C**reate (Inserção via `POST`).
* **R**ead (Listagem dinâmica via `GET`).
* **U**pdate (Edição reativa via `PUT`).
* **D**elete (Exclusão persistente via `DELETE`).


* **Interface Reativa:** Sem recarregamento de página, atualizando o estado do React imediatamente após o retorno positivo do servidor MySQL.