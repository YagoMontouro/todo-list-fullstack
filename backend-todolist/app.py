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
        return jsonify({"mensagem": "Usuario criado com sucesso!"}), 201
    except mysql.connector.Error as err:
        return jsonify({"erro": "Este email ja esta cadastrado"}), 400
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
    
    return jsonify(tarefas), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)