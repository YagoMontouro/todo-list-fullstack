import { useState, useEffect } from 'react';

export default function App() {
  // Estados de Controle de Tela: 'login', 'cadastro' ou 'dashboard'
  const [telaAtual, setTelaAtual] = useState('login');
  
  // Estado do usuário logado (guarda o ID vindo do MySQL)
  const [usuarioId, setUsuarioId] = useState(null);

  // Estados dos formulários de Login/Cadastro
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Estados da Lista de Tarefas
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [idEditando, setIdEditando] = useState(null);

  // Função para buscar as tarefas do banco de dados baseando-se no Usuário Logado
  const buscarTarefasDoBanco = async (idDoUsuario) => {
    try {
      const response = await fetch(`http://localhost:5000/tarefas/${idDoUsuario}`);
      const dados = await response.json();
      setTarefas(dados);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  // Ação de Login
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
        setUsuarioId(dados.id); // Salva o ID do usuário logado
        buscarTarefasDoBanco(dados.id); // Busca só as tarefas dele
        setTelaAtual('dashboard'); // Vai para a lista
        setEmail('');
        setSenha('');
      } else {
        alert(dados.erro);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Ação de Cadastro
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
        setTelaAtual('login');
        setEmail('');
        setSenha('');
      } else {
        alert(dados.erro);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Ação de Adicionar ou Atualizar Tarefa
  const adicionarTarefa = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (idEditando) {
      // Se tem um ID guardado, estamos EDITANDO (PUT)
      try {
        const response = await fetch(`http://localhost:5000/tarefas/${idEditando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descricao })
        });

        if (response.ok) {
          // Atualiza a tarefa alterada na lista da tela
          setTarefas(tarefas.map(t => t.id === idEditando ? { ...t, titulo, descricao } : t));
          setIdEditando(null); // Limpa o modo de edição
          setTitulo('');
          setDescricao('');
        }
      } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
      }
    } else {
      // Se não tem ID guardado, cria uma NOVA tarefa (POST)
      try {
        const response = await fetch('http://localhost:5000/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descricao, usuario_id: usuarioId })
        });
        const nova = await response.json();

        setTarefas([...tarefas, nova]);
        setTitulo('');
        setDescricao('');
      } catch (error) {
        console.error("Erro ao adicionar tarefa:", error);
      }
    }
  };

  // Função para jogar os dados da tarefa de volta para os inputs lá de cima
  const prepararEdicao = (tarefa) => {
    setIdEditando(tarefa.id);
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao);
  };

  // Ação de Excluir Tarefa no Banco e na Tela
  const excluirTarefa = async (idDaTarefa) => {
    try {
      const response = await fetch(`http://localhost:5000/tarefas/${idDaTarefa}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove a tarefa da tela após apagar do banco
        setTarefas(tarefas.filter(tarefa => tarefa.id !== idDaTarefa));
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };
  
  // TELA DE LOGIN
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

  // TELA DE CADASTRO
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

  // TELA PRINCIPAL (DASHBOARD COM A TO-DO LIST)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px' }}>
        <h1>To-Do List</h1>
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
        {/* O texto do botão muda dinamicamente aqui */}
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
            
            {/* Botão de Editar Adicionado */}
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