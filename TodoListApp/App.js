import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert 
} from 'react-native';

// Atualizado com o IP correto do seu computador na rede local
const API_URL = 'http://192.168.3.156:5000'; 

export default function App() {
  // Estados de Controle de Tela e Usuario
  const [usuarioLogado, setUsuarioLogado] = useState(null); // Guarda { id, email }
  const [isCadastro, setIsCadastro] = useState(false); // Alterna entre tela de Login e Cadastro

  // Estados dos Inputs de Autenticacao
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Estados do CRUD de Tarefas
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // Carrega as tarefas sempre que o usuario logar com sucesso
  useEffect(() => {
    if (usuarioLogado) {
      carregarTarefas();
    }
  }, [usuarioLogado]);

  // ==========================================
  // METODOS DE AUTENTICACAO (LOGIN / CADASTRO)
  // ==========================================
  const handleAutenticacao = async () => {
    if (!email.trim() || !senha.trim()) {
      return Alert.alert("Erro", "Preencha todos os campos!");
    }

    const rota = isCadastro ? '/cadastro' : '/login';
    
    try {
      const response = await fetch(`${API_URL}${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await response.json();

      if (response.ok) {
        if (isCadastro) {
          Alert.alert("Sucesso", "Conta criada com sucesso. Realize o login.");
          setIsCadastro(false);
        } else {
          setUsuarioLogado(dados); // Salva o ID e Email retornados pelo Flask
        }
        setSenha('');
      } else {
        Alert.alert("Erro", dados.erro || "Ocorreu um erro na autenticacao.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexao", "Não foi possível alcancar o servidor Flask.");
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setTarefas([]);
    setEmail('');
    setSenha('');
  };

  // ==========================================
  // METODOS DO CRUD DE TAREFAS
  // ==========================================
  
  // 1. READ
  const carregarTarefas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tarefas/${usuarioLogado.id}`);
      const dados = await response.json();
      setTarefas(dados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. CREATE
  const adicionarTarefa = async () => {
    if (!titulo.trim()) return Alert.alert("Aviso", "A tarefa precisa de um título!");

    try {
      const response = await fetch(`${API_URL}/tarefas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo, 
          descricao, 
          usuario_id: usuarioLogado.id 
        })
      });

      if (response.ok) {
        limparFormulario();
        carregarTarefas();
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar tarefa.");
    }
  };

  const iniciarEdicao = (tarefa) => {
    setEditandoId(tarefa.id);
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao || '');
  };

  // 3. UPDATE
  const salvarEdicao = async () => {
    if (!titulo.trim()) return Alert.alert("Aviso", "O título não pode ser vazio!");

    try {
      const response = await fetch(`${API_URL}/tarefas/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao })
      });

      if (response.ok) {
        limparFormulario();
        carregarTarefas();
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao editar tarefa.");
    }
  };

  // 4. DELETE
  const deletarTarefa = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tarefas/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        carregarTarefas();
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao apagar tarefa.");
    }
  };

  const limparFormulario = () => {
    setTitulo('');
    setDescricao('');
    setEditandoId(null);
  };

  // ==========================================
  // RENDERIZACAO DE TELAS
  // ==========================================

  // TELA A: Autenticacao (Se o usuario NAO estiver logado)
  if (!usuarioLogado) {
    return (
      <View style={styles.containerAuth}>
        <Text style={styles.authTitle}>{isCadastro ? "Criar Conta" : "Autenticacao"}</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="E-mail" 
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Senha" 
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={styles.authButton} onPress={handleAutenticacao}>
          <Text style={styles.buttonText}>{isCadastro ? "Cadastrar" : "Entrar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsCadastro(!isCadastro); setSenha(''); }}>
          <Text style={styles.switchText}>
            {isCadastro ? "Ja possui uma conta? Acesse o Login" : "Nao possui uma conta? Cadastre-se"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA B: Painel de Tarefas (Se o usuario ESTIVER logado)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Usuario: {usuarioLogado.email}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Lista de Tarefas</Text>

      {/* Formulario de Cadastro/Edicao de Tarefa */}
      <View style={styles.form}>
        <TextInput 
          style={styles.input}
          placeholder="Título da tarefa..."
          value={titulo}
          onChangeText={setTitulo}
        />
        <TextInput 
          style={styles.input}
          placeholder="Descrição (opcional)..."
          value={descricao}
          onChangeText={setDescricao}
        />
        
        <View style={styles.rowButtons}>
          <TouchableOpacity 
            style={[styles.button, editandoId ? styles.btnEdit : styles.btnAdd]} 
            onPress={editandoId ? salvarEdicao : adicionarTarefa}
          >
            <Text style={styles.buttonText}>{editandoId ? "Salvar" : "Adicionar"}</Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity style={[styles.button, styles.btnCancel]} onPress={limparFormulario}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Tarefas vinculadas ao usuario_id */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList 
          data={tarefas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <View style={styles.todoContent}>
                <Text style={styles.todoTitle}>{item.titulo}</Text>
                {item.descricao ? <Text style={styles.todoDesc}>{item.descricao}</Text> : null}
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionTextButton} onPress={() => iniciarEdicao(item)}>
                  <Text style={styles.actionBtnEdit}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionTextButton} onPress={() => deletarTarefa(item.id)}>
                  <Text style={styles.actionBtnDelete}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa cadastrada.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos da Autenticacao
  containerAuth: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 30 },
  authTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  authButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  switchText: { textAlign: 'center', color: '#007bff', marginTop: 25, fontSize: 15 },
  
  // Estilos Gerais do Painel de Tarefas
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 14, color: '#666', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  form: { marginBottom: 25 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  rowButtons: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnAdd: { backgroundColor: '#28a745' },
  btnEdit: { backgroundColor: '#007bff' },
  btnCancel: { backgroundColor: '#6c757d' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  todoItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  todoContent: { flex: 1, paddingRight: 10 },
  todoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  todoDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 15 },
  actionTextButton: { padding: 4 },
  actionBtnEdit: { fontSize: 16, color: '#007bff', fontWeight: '600' },
  actionBtnDelete: { fontSize: 16, color: '#dc3545', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 }
});