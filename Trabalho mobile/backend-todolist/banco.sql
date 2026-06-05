create database if not exists projeto_todolist;
USE projeto_todolist;

create table if not exists usuarios (
	id INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, 
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);