from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def conectar_banco():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="@Yago0921", 
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

@app.route('/tarefas/<int:usuario_id>', methods=['GET'])
def listar_tarefas(usuario_id):
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tarefas WHERE usuario_id = %s", (usuario_id,))
    tarefas = cursor.fetchall()
    cursor.close()
    conexao.close()
    return jsonify(tarefas)

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
    nova_id = cursor.lastrowid
    cursor.close()
    conexao.close()
    return jsonify({"id": nova_id, "usuario_id": usuario_id, "titulo": titulo, "descricao": descricao}), 201

# ROTA 4: Atualizar uma tarefa no banco (UPDATE)
@app.route('/tarefas/<int:tarefa_id>', methods=['PUT'])
def atualizar_tarefa(tarefa_id):
    dados = request.get_json()
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')
    
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    comando = "UPDATE tarefas SET titulo = %s, descricao = %s WHERE id = %s"
    cursor.execute(comando, (titulo, descricao, tarefa_id))
    conexao.commit()
    
    cursor.close()
    conexao.close()
    return jsonify({"id": tarefa_id, "titulo": titulo, "descricao": descricao}), 200

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
    app.run(debug=True, port=5000)