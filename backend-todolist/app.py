from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app) 
def conectar_banco():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="@Mello2026", 
        database="projeto_todolist"
    )

@app.route('/cadastro', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha') 
    
    if not email or not senha:
        return jsonify({"erro": "Preencha todos os campos"}), 400
        
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    try:
        cursor.execute("INSERT INTO usuarios (email, senha) VALUES (%s, %s)", (email, senha))
        conexao.commit()
        return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201
    except mysql.connector.Error as err:
        return jsonify({"erro": "Este email já está cadastrado"}), 400
    finally:
        cursor.close()
        conexao.close()

@app.route('/login', methods=['POST'])
def login_usuario():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')
    
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM usuarios WHERE email = %s AND senha = %s", (email, senha))
    usuario = cursor.fetchone()
    
    cursor.close()
    conexao.close()
    
    if usuario:
        return jsonify({"id": usuario['id'], "email": usuario['email']}), 200
    else:
        return jsonify({"erro": "Email ou senha incorretos"}), 401


# ==========================================
# ROTAS DO CRUD DE TAREFAS
# ==========================================

# 1. READ (Listar tarefas de um usuário específico)
@app.route('/tarefas/<int:usuario_id>', methods=['GET'])
def listar_tarefas(usuario_id):
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM tarefas WHERE usuario_id = %s", (usuario_id,))
    tarefas = cursor.fetchall()
    
    cursor.close()
    conexao.close()
    
    return jsonify(tarefas), 200

# 2. CREATE (Adicionar uma nova tarefa)
@app.route('/tarefas', methods=['POST'])
def adicionar_tarefa():
    dados = request.get_json()
    usuario_id = dados.get('usuario_id')
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')

    if not titulo or not usuario_id:
        return jsonify({"erro": "Título e ID do usuário são obrigatórios"}), 400

    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    cursor.execute(
        "INSERT INTO tarefas (usuario_id, titulo, descricao) VALUES (%s, %s, %s)",
        (usuario_id, titulo, descricao)
    )
    conexao.commit()
    
    cursor.close()
    conexao.close()
    return jsonify({"mensagem": "Tarefa adicionada com sucesso!"}), 201

# 3. UPDATE (Editar uma tarefa existente)
@app.route('/tarefas/<int:tarefa_id>', methods=['PUT'])
def editar_tarefa(tarefa_id):
    dados = request.get_json()
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')

    if not titulo:
        return jsonify({"erro": "O título não pode ser vazio"}), 400

    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    cursor.execute(
        "UPDATE tarefas SET titulo = %s, descricao = %s WHERE id = %s",
        (titulo, descricao, tarefa_id)
    )
    conexao.commit()
    
    cursor.close()
    conexao.close()
    return jsonify({"mensagem": "Tarefa atualizada com sucesso!"}), 200

# DELETE (Excluir uma tarefa)
@app.route('/tarefas/<int:tarefa_id>', methods=['DELETE'])
def deletar_tarefa(tarefa_id):
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    cursor.execute("DELETE FROM tarefas WHERE id = %s", (tarefa_id,))
    conexao.commit()
    
    cursor.close()
    conexao.close()
    return jsonify({"mensagem": "Tarefa deletada com sucesso!"}), 200


if __name__ == '__main__':
    # host="0.0.0.0" garante que o Flask responda ao IP 172.30.192.1 da sua rede externa
    app.run(host="0.0.0.0", port=5000, debug=True)