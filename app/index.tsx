import React, { useState, useEffect } from "react";
import { MaskedTextInput } from "react-native-mask-text";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";


import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Importação condicional do SQLite
let SQLite: any = null;
if (Platform.OS !== "web") {
  SQLite = require("expo-sqlite");
}

type Screen =
  | "login"
  | "home"
  | "categories"
  | "addExpense"
  | "reports"
  | "profile"
  | "signup";

type Expense = {
  id: number;
  valor: number;
  categoria: string;
  descricao?: string;
  usuario_id: number;
  data: string;
};

type Usuario = { 
  id: number; 
  nome: string; 
  email: string; 
  senha: string 
};

type Category = {
  id: number;
  nome: string;
  usuario_id: number;
};

let db: SQLite.SQLiteDatabase | null = null;

// Componente TabBar fixo
function TabBar({ setScreen, confirmarSair }: any) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabButton} onPress={() => setScreen("home")}>
        <Ionicons name="home" size={26} color={colors.lightBlue} />
        <Text style={styles.tabText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => setScreen("categories")}>
        <Ionicons name="list" size={26} color={colors.lightBlue} />
        <Text style={styles.tabText}>Categorias</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => setScreen("addExpense")}>
        <Ionicons name="add-circle" size={26} color={colors.lightBlue} />
        <Text style={styles.tabText}>Gastos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => setScreen("reports")}>
        <Ionicons name="bar-chart" size={26} color={colors.lightBlue} />
        <Text style={styles.tabText}>Relatórios</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => setScreen("profile")}>
        <Ionicons name="person" size={26} color={colors.lightBlue} />
        <Text style={styles.tabText}>Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={confirmarSair}>
        <Ionicons name="log-out" size={26} color="#ef4444" />
        <Text style={[styles.tabText, { color: "#ef4444" }]}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");

  // Login / Cadastro
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);

  // Gastos
  const [gastos, setGastos] = useState<Expense[]>([]);
const [valor, setValor] = useState<string>("0");
  const [descricao, setDescricao] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [data, setData] = useState("");

  // Categorias
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
// DropDownPicker do AddExpense
const [openAdd, setOpenAdd] = useState(false);
const [valueAdd, setValueAdd] = useState<string | null>(null);
const [itemsAdd, setItemsAdd] = useState(
  categorias.map((c) => ({ label: c.nome, value: c.nome }))
);

useEffect(() => {
  setItemsAdd(categorias.map((c) => ({ label: c.nome, value: c.nome })));
}, [categorias]);

// DropDownPicker dos Reports
const [openRep, setOpenRep] = useState(false);
const [valueRep, setValueRep] = useState<string | null>(null);
const [itemsRep, setItemsRep] = useState(
  categorias.map((c) => ({ label: c.nome, value: c.nome }))
);

useEffect(() => {
  setItemsRep(categorias.map((c) => ({ label: c.nome, value: c.nome })));
}, [categorias]);


  // Filtros de Relatório
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  // Verificar se é Web
  if (Platform.OS === "web") {
    return (
      <View style={styles.webWarningContainer}>
        <Ionicons name="phone-portrait" size={80} color={colors.lightBlue} />
        <Text style={styles.webWarningTitle}>Dinheirudo App</Text>
        <Text style={styles.webWarningText}>
          Este aplicativo utiliza SQLite e funciona apenas em dispositivos móveis.
        </Text>
        <Text style={styles.webWarningSubtext}>
          Para usar o Dinheirudo:
        </Text>
        <View style={styles.webWarningSteps}>
          <Text style={styles.webWarningStep}>1. Instale o app Expo Go no seu celular</Text>
          <Text style={styles.webWarningStep}>2. Escaneie o QR code abaixo</Text>
          <Text style={styles.webWarningStep}>3. Aproveite o Dinheirudo!</Text>
        </View>
      </View>
    );
  }

  // Inicializar banco de dados
  useEffect(() => {
    const initDb = async () => {
      try {
        db = await SQLite.openDatabaseAsync("dinheirudo.db");

        // Criar tabela de usuários
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL
          );
        `);

        // Criar tabela de categorias
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            usuario_id INTEGER NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          );
        `);

        // Criar tabela de gastos
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            valor REAL NOT NULL,
            categoria TEXT NOT NULL,
            descricao TEXT,
            data TEXT NOT NULL,
            usuario_id INTEGER NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          );
        `);

        console.log("✅ Banco de dados inicializado com sucesso!");
        setReady(true);
      } catch (error) {
        console.error("❌ Erro ao inicializar banco:", error);
        Alert.alert("Erro", "Falha ao inicializar o banco de dados");
      }
    };

    initDb();
  }, []);

  // Cadastrar usuário
  const cadastrarUsuario = async (nome: string, email: string, senha: string) => {
    if (!db) return;
    try {
      await db.runAsync(
        "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?);",
        [nome.trim(), email.trim().toLowerCase(), senha.trim()]
      );
      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setSenha("");
      setScreen("login");
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
      Alert.alert("Erro", "Email já cadastrado ou erro no banco de dados!");
    }
  };

  // Login usuário
  const loginUsuario = async (email: string, senha: string) => {
    if (!db) return;
    try {
      const rows: any = await db.getAllAsync(
        "SELECT * FROM usuarios WHERE email = ? AND senha = ?;",
        [email.trim().toLowerCase(), senha.trim()]
      );

      if (rows.length > 0) {
        setUsuarioAtual(rows[0]);
        await carregarCategorias(rows[0].id);
        await carregarGastos(rows[0].id);
        setEmail("");
        setSenha("");
        setScreen("home");
      } else {
        Alert.alert("Erro", "Email ou senha incorretos!");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      Alert.alert("Erro", "Falha ao fazer login");
    }
  };

  // Adicionar categoria
  const adicionarCategoria = async (nome: string) => {
    if (!db || !usuarioAtual) return;
    try {
      await db.runAsync(
        "INSERT INTO categorias (nome, usuario_id) VALUES (?, ?);",
        [nome.trim(), usuarioAtual.id]
      );
      setNovaCategoria("");
      await carregarCategorias(usuarioAtual.id);
      Alert.alert("Sucesso", "Categoria adicionada!");
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err);
      Alert.alert("Erro", "Falha ao adicionar categoria!");
    }
  };

  // Carregar categorias
  const carregarCategorias = async (usuarioId?: number) => {
    if (!db) return;
    const id = usuarioId || usuarioAtual?.id;
    if (!id) return;
    
    try {
      const rows: any = await db.getAllAsync(
        "SELECT * FROM categorias WHERE usuario_id = ?;",
        [id]
      );
      setCategorias(rows);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  // Adicionar gasto
  const adicionarGasto = async (
    valor: number,
    categoria: string,
    descricao?: string,
    dataGasto?: string
  ) => {
    if (!db || !usuarioAtual) return;
    const dataFinal = dataGasto || new Date().toISOString().slice(0, 10);
    
    try {
      await db.runAsync(
        "INSERT INTO gastos (valor, categoria, descricao, data, usuario_id) VALUES (?, ?, ?, ?, ?);",
        [valor, categoria, descricao || "", dataFinal, usuarioAtual.id]
      );
      await carregarGastos(usuarioAtual.id);
      setValor("0");
      setDescricao("");
      setCategoriaSelecionada("");
      setData("");
      Alert.alert("Sucesso", "Gasto adicionado!");
      setScreen("home");
    } catch (error) {
      console.error("Erro ao adicionar gasto:", error);
      Alert.alert("Erro", "Falha ao adicionar gasto!");
    }
  };

  // Carregar gastos
  const carregarGastos = async (usuarioId?: number) => {
    if (!db) return;
    const id = usuarioId || usuarioAtual?.id;
    if (!id) return;
    
    try {
      const rows: any = await db.getAllAsync(
        "SELECT * FROM gastos WHERE usuario_id = ? ORDER BY data DESC;",
        [id]
      );
      setGastos(rows);
    } catch (error) {
      console.error("Erro ao carregar gastos:", error);
    }
  };

  // Formatar dinheiro
  const formatMoney = (v: number) => {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const formatDate = (isoDate: string) => {
  if (!isoDate.includes("-")) return isoDate; // já vem formatada
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
  };


  // Confirmar logout
  const confirmarSair = () => {
    Alert.alert(
      "Sair",
      "Deseja realmente sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          onPress: () => {
            setUsuarioAtual(null);
            setGastos([]);
            setCategorias([]);
            setScreen("login");
          },
        },
      ]
    );
  };


  // Filtrar gastos
  const filtrarGastos = () => {
    let gastosFiltrados = [...gastos];
    
if (dataInicio) {
  const [dia, mes, ano] = dataInicio.split("/");
  const inicioISO = `${ano}-${mes}-${dia}`;
  gastosFiltrados = gastosFiltrados.filter(g => g.data >= inicioISO);
}
    
if (dataFim) {
  const [dia, mes, ano] = dataFim.split("/");
  const fimISO = `${ano}-${mes}-${dia}`;
  gastosFiltrados = gastosFiltrados.filter(g => g.data <= fimISO);
}
    
    if (categoriaFiltro) {
      gastosFiltrados = gastosFiltrados.filter(g => g.categoria === categoriaFiltro);
    }
    
    return gastosFiltrados;
  };

  // Banco ainda não carregado
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="wallet" size={64} color={colors.lightBlue} />
        <Text style={styles.loadingText}>Carregando Dinheirudo...</Text>
      </View>
    );
  }

  // TELA DE LOGIN
  if (screen === "login") {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet" size={56} color={colors.lightBlue} />
            </View>
            <Text style={styles.loginTitle}>Dinheirudo</Text>
            <Text style={styles.loginSubtitle}>
              Organize suas finanças com estilo
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>Entrar na conta</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={colors.darkBlue} style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                style={styles.inputField}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={colors.darkBlue} style={styles.inputIcon} />
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#94a3b8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                style={styles.inputField}
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                if (!email || !senha) {
                  Alert.alert("Atenção", "Preencha email e senha");
                  return;
                }
                loginUsuario(email, senha);
              }}
            >
              <Text style={styles.loginButtonText}>Entrar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen("signup")} style={styles.signupLink}>
              <Text style={styles.signupText}>
                Não tem conta? <Text style={styles.signupTextBold}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // TELA DE CADASTRO
  if (screen === "signup") {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen("login")}>
            <Ionicons name="arrow-back" size={28} color={colors.lightBlue} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Ionicons name="person-add" size={48} color={colors.lightBlue} />
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          <View style={styles.card3D}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={colors.darkBlue} style={styles.inputIcon} />
              <TextInput
                placeholder="Nome completo"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
                style={styles.inputField}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={colors.darkBlue} style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                style={styles.inputField}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={colors.darkBlue} style={styles.inputIcon} />
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#94a3b8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                style={styles.inputField}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (!nome || !email || !senha) {
                  Alert.alert("Atenção", "Preencha todos os campos");
                  return;
                }
                cadastrarUsuario(nome, email, senha);
              }}
            >
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // TELA DE CATEGORIAS
  if (screen === "categories") {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
<ScrollView nestedScrollEnabled contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerSection}>
              <Ionicons name="list" size={48} color={colors.lightBlue} />
              <Text style={styles.title}>Categorias</Text>
              <Text style={styles.subtitle}>Organize seus gastos por categoria</Text>
            </View>

            <View style={styles.card3D}>
              <Text style={styles.cardTitle}>Nova Categoria</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                <TextInput
                  placeholder="Nome da categoria"
                  placeholderTextColor="#94a3b8"
                  value={novaCategoria}
                  onChangeText={setNovaCategoria}
                  style={styles.inputField}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (!novaCategoria) {
                    Alert.alert("Atenção", "Digite um nome para a categoria");
                    return;
                  }
                  adicionarCategoria(novaCategoria);
                }}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Adicionar Categoria</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card3D}>
              <Text style={styles.cardTitle}>Minhas Categorias</Text>
              {categorias.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-open-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyText}>Nenhuma categoria cadastrada</Text>
                </View>
              ) : (
                categorias.map((c) => (
                  <View key={c.id} style={styles.categoryItem}>
                    <Ionicons name="pricetag" size={20} color={colors.lightBlue} />
                    <Text style={styles.categoryName}>{c.nome}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <TabBar setScreen={setScreen} confirmarSair={confirmarSair} />
      </View>
    );
  }

  // TELA ADICIONAR GASTO
  if (screen === "addExpense") {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
<ScrollView nestedScrollEnabled contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerSection}>
              <Ionicons name="add-circle" size={48} color={colors.lightBlue} />
              <Text style={styles.title}>Novo Gasto</Text>
              <Text style={styles.subtitle}>Registre seus gastos aqui</Text>
            </View>

            <View style={styles.card3D}>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                <Text style={styles.inputPrefix}>R$</Text>
<MaskedTextInput
  type="currency"
  options={{
    prefix: "",
    decimalSeparator: ",",
    groupSeparator: ".",
    precision: 2,
  }}
  value={valor}                // aqui vai o valor CRU (ex: "113")
  onChangeText={(text, rawText) => {
    // text  -> "1,13"
    // rawText -> "113"
    setValor(rawText || "0");  // sempre guardamos o raw (sem máscara)
  }}
  keyboardType="numeric"
  style={styles.inputField}
/>



              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="document-text" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                <TextInput
                  placeholder="Descrição (opcional)"
                  placeholderTextColor="#94a3b8"
                  value={descricao}
                  onChangeText={setDescricao}
                  style={styles.inputField}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                  <MaskedTextInput
                    mask="99/99/9999"
                    placeholder="Data (DD/MM/AAAA) - Opcional"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={data}
                    onChangeText={(text) => setData(text)}
                    style={styles.inputField}
                  />
              </View>


              <View style={{ marginBottom: 16, zIndex: 1000 }}>
<DropDownPicker
  open={openAdd}
  value={valueAdd}
  items={itemsAdd}
  setOpen={setOpenAdd}
  setValue={(cb) => {
    const v = cb(valueAdd);
    setValueAdd(v);
    setCategoriaSelecionada(v as string);
  }}
  setItems={setItemsAdd}
  placeholder="Selecione uma categoria"
  listMode="SCROLLVIEW"
  style={{
    backgroundColor: colors.darkBlue,
    borderColor: "transparent",
    borderRadius: 16,
  }}
  dropDownContainerStyle={{
    backgroundColor: colors.card,
    borderColor: colors.darkBlue,
  }}
  textStyle={{
    color: colors.text,
  }}
/>


              </View>


              {categorias.length === 0 && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    Você precisa criar categorias primeiro!
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, categorias.length === 0 && styles.buttonDisabled]}
                disabled={categorias.length === 0}
                onPress={() => {
                  if (!valor || !categoriaSelecionada) {
                    Alert.alert("Atenção", "Preencha o valor e selecione uma categoria");
                    return;
                  }

                  if (data && !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
                    Alert.alert("Erro", "Data inválida. Use o formato DD/MM/AAAA");
                    return;
                  }

                  // Converter para AAAA-MM-DD antes de salvar no banco
                  let dataFinal = "";
                  if (data) {
                    const [dia, mes, ano] = data.split("/");
                    dataFinal = `${ano}-${mes}-${dia}`;
                  }
const valorNumerico = Number(valor) / 100;


                  adicionarGasto(
                    valorNumerico,
                    categoriaSelecionada,
                    descricao,
                    dataFinal || undefined
                  );

                }}

              >

                <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Salvar Gasto</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <TabBar setScreen={setScreen} confirmarSair={confirmarSair} />
      </View>
    );
  }

  // TELA DE RELATÓRIOS
  if (screen === "reports") {
    const gastosFiltrados = filtrarGastos();
    
    const gastosPorMes: Record<string, number> = {};
    const gastosPorCategoria: Record<string, number> = {};
    let total = 0;

    gastosFiltrados.forEach((g) => {
      total += g.valor;
      const mes = g.data?.slice(0, 7); // AAAA-MM
      gastosPorMes[mes] = (gastosPorMes[mes] || 0) + g.valor;
      gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.valor;
    });

    return (
      <View style={{ flex: 1 }}>
<ScrollView nestedScrollEnabled contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <Ionicons name="bar-chart" size={48} color={colors.lightBlue} />
            <Text style={styles.title}>Relatórios</Text>
            <Text style={styles.subtitle}>Análise dos seus gastos</Text>
          </View>

          {/* Filtros Rápidos */}

          {/* Filtros Personalizados */}
          <View style={styles.card3D}>
            <Text style={styles.cardTitle}>Filtros Personalizados</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="calendar" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                <MaskedTextInput
                  mask="99/99/9999"
                  placeholder="Data Início (DD/MM/AAAA)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={dataInicio}
                  onChangeText={(text) => setDataInicio(text)}
                  style={styles.inputField}
                />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="calendar" size={20} color={colors.darkBlue} style={styles.inputIcon} />
                <MaskedTextInput
                  mask="99/99/9999"
                  placeholder="Data Fim (DD/MM/AAAA)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={dataFim}
                  onChangeText={(text) => setDataFim(text)}
                  style={styles.inputField}
                />
            </View>

            <View style={{ marginBottom: 16, zIndex: 1000 }}>
<DropDownPicker
  open={openRep}
  value={valueRep}
  items={itemsRep}
  setOpen={setOpenRep}
  setValue={(cb) => {
    const v = cb(valueRep);
    setValueRep(v);
    setCategoriaFiltro(v as string);
  }}
  setItems={setItemsRep}
  placeholder="Todas as categorias"
  listMode="SCROLLVIEW"
  style={{
    backgroundColor: colors.darkBlue,
    borderColor: "transparent",
    borderRadius: 16,
  }}
  dropDownContainerStyle={{
    backgroundColor: colors.card,
    borderColor: colors.darkBlue,
  }}
  textStyle={{
    color: colors.text,
  }}
/>

            </View>


            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setDataInicio("");
                setDataFim("");
                setCategoriaFiltro("");
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.lightBlue} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Total Geral */}
          <View style={[styles.card3D, styles.totalCard]}>
            <Ionicons name="wallet" size={32} color="#fff" />
            <Text style={styles.totalLabel}>Total Geral</Text>
            <Text style={styles.totalValue}>R$ {formatMoney(total)}</Text>
            <Text style={styles.totalSubtext}>
              {gastosFiltrados.length} {gastosFiltrados.length === 1 ? "gasto" : "gastos"}
            </Text>
          </View>

          {/* Gastos por Mês */}
          <View style={styles.card3D}>
            <View style={styles.reportHeader}>
              <Ionicons name="calendar" size={24} color={colors.lightBlue} />
              <Text style={styles.cardTitle}>Gastos por Mês</Text>
            </View>
            {Object.keys(gastosPorMes).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>Nenhum gasto encontrado</Text>
              </View>
            ) : (
              Object.entries(gastosPorMes)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([mes, valor]) => (
                  <View key={mes} style={styles.reportItem}>
                    <Text style={styles.reportLabel}>{mes}</Text>
                    <Text style={styles.reportValue}>R$ {formatMoney(valor)}</Text>
                  </View>
                ))
            )}
          </View>

          {/* Gastos por Categoria */}
          <View style={styles.card3D}>
            <View style={styles.reportHeader}>
              <Ionicons name="pie-chart" size={24} color={colors.lightBlue} />
              <Text style={styles.cardTitle}>Gastos por Categoria</Text>
            </View>
            {Object.keys(gastosPorCategoria).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>Nenhum gasto encontrado</Text>
              </View>
            ) : (
              Object.entries(gastosPorCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, valor]) => {
                  const percentual = ((valor / total) * 100).toFixed(1);
                  return (
                    <View key={cat} style={styles.reportItem}>
                      <View style={styles.reportLabelContainer}>
                        <Text style={styles.reportLabel}>{cat}</Text>
                        <Text style={styles.reportPercentage}>{percentual}%</Text>
                      </View>
                      <Text style={styles.reportValue}>R$ {formatMoney(valor)}</Text>
                    </View>
                  );
                })
            )}
          </View>
        </ScrollView>

        <TabBar setScreen={setScreen} confirmarSair={confirmarSair} />
      </View>
    );
  }

  // TELA DE PERFIL
  if (screen === "profile" && usuarioAtual) {
    const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
    const totalCategorias = categorias.length;
    const quantidadeGastos = gastos.length;

    return (
      <View style={{ flex: 1 }}>
<ScrollView nestedScrollEnabled contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {usuarioAtual.nome.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{usuarioAtual.nome}</Text>
            <Text style={styles.profileEmail}>{usuarioAtual.email}</Text>
          </View>

          <View style={styles.card3D}>
            <Text style={styles.cardTitle}>Estatísticas</Text>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash" size={24} color={colors.lightBlue} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Gasto</Text>
                <Text style={styles.statValue}>R$ {formatMoney(totalGastos)}</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="receipt" size={24} color={colors.lightBlue} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Quantidade de Gastos</Text>
                <Text style={styles.statValue}>{quantidadeGastos}</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="pricetags" size={24} color={colors.lightBlue} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Categorias Criadas</Text>
                <Text style={styles.statValue}>{totalCategorias}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card3D}>
            <Text style={styles.cardTitle}>Informações da Conta</Text>
            <View style={styles.infoItem}>
              <Ionicons name="person" size={20} color={colors.darkBlue} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{usuarioAtual.nome}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="mail" size={20} color={colors.darkBlue} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{usuarioAtual.email}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <TabBar setScreen={setScreen} confirmarSair={confirmarSair} />
      </View>
    );
  }

  // TELA HOME
  if (screen === "home") {
    const somaCategorias: Record<string, number> = {};
    let total = 0;
    gastos.forEach((g) => {
      somaCategorias[g.categoria] = (somaCategorias[g.categoria] || 0) + g.valor;
      total += g.valor;
    });

    const ultimosGastos = gastos.slice(0, 10);

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={ultimosGastos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.homeContent}
          ListHeaderComponent={
            <View>
              <View style={styles.homeHeader}>
                <View>
                  <Text style={styles.homeGreeting}>Olá,</Text>
                  <Text style={styles.homeUserName}>
                    {usuarioAtual ? usuarioAtual.nome : ""}
                  </Text>
                </View>
                <View style={styles.homeIconCircle}>
                  <Ionicons name="wallet" size={32} color={colors.lightBlue} />
                </View>
              </View>

              <View style={[styles.card3D, styles.totalHomeCard]}>
                <Text style={styles.totalHomeLabel}>Gasto Total</Text>
                <Text style={styles.totalHomeValue}>R$ {formatMoney(total)}</Text>
                <View style={styles.totalHomeStats}>
                  <View style={styles.totalHomeStat}>
                    <Ionicons name="receipt" size={16} color="#fff" />
                    <Text style={styles.totalHomeStatText}>{gastos.length} gastos</Text>
                  </View>
                  <View style={styles.totalHomeStat}>
                    <Ionicons name="pricetag" size={16} color="#fff" />
                    <Text style={styles.totalHomeStatText}>
                      {Object.keys(somaCategorias).length} categorias
                    </Text>
                  </View>
                </View>
              </View>

              {Object.keys(somaCategorias).length > 0 && (
                <View style={styles.card3D}>
                  <Text style={styles.cardTitle}>Gastos por Categoria</Text>
                  {Object.entries(somaCategorias)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, valor]) => (
                      <View key={cat} style={styles.categoryHomeItem}>
                        <View style={styles.categoryHomeIcon}>
                          <Ionicons name="pricetag" size={16} color={colors.lightBlue} />
                        </View>
                        <Text style={styles.categoryHomeName}>{cat}</Text>
                        <Text style={styles.categoryHomeValue}>R$ {formatMoney(valor)}</Text>
                      </View>
                    ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>Últimos Gastos</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseIconCircle}>
                <Ionicons name="cash" size={20} color={colors.lightBlue} />
              </View>
              <View style={styles.expenseContent}>
                <Text style={styles.expenseCategory}>{item.categoria}</Text>
                {item.descricao && (
                  <Text style={styles.expenseDescription}>{item.descricao}</Text>
                )}
                <Text style={styles.expenseDate}>
                  {item.data ? formatDate(item.data) : ""}
                </Text>
              </View>
              <Text style={styles.expenseValue}>R$ {formatMoney(item.valor)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyText}>Nenhum gasto cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Comece adicionando seus gastos na aba "Gastos"
              </Text>
            </View>
          }
        />

        <TabBar setScreen={setScreen} confirmarSair={confirmarSair} />
      </View>
    );
  }

  return null;
}

// Cores do tema
const colors = {
  darkBlue: "#0f172a",
  mediumBlue: "#1e293b",
  lightBlue: "#3b82f6",
  accentBlue: "#60a5fa",
  background: "#0f172a",
  card: "#1e293b",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  white: "#ffffff",
  black: "#000000",
};

// Estilos
const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.text,
    fontWeight: "600",
  },

  // Web Warning
  webWarningContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    padding: 24,
  },
  webWarningTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.lightBlue,
    marginTop: 24,
    marginBottom: 16,
  },
  webWarningText: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 28,
  },
  webWarningSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 12,
    fontWeight: "600",
  },
  webWarningSteps: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  webWarningStep: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },

  // Login
  loginContainer: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.mediumBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.lightBlue,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loginCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputIcon: {
    marginRight: 12,
  },
  inputPrefix: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: colors.lightBlue,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  signupLink: {
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  signupTextBold: {
    color: colors.lightBlue,
    fontWeight: "700",
  },

  // Container Geral
  container: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },

  // Header Section
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.lightBlue,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Card 3D
  card3D: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Botões
  primaryButton: {
    flexDirection: "row",
    backgroundColor: colors.lightBlue,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.lightBlue,
  },
  secondaryButtonText: {
    color: colors.lightBlue,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },

  // Picker
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  picker: {
    flex: 1,
    height: 56,
    color: colors.text,
  },

  // Categorias
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Warning
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#92400e",
    flex: 1,
  },

  // Filtros Rápidos
  quickFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // Relatórios
  totalCard: {
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    paddingVertical: 28,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.white,
    marginTop: 12,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.white,
    marginTop: 8,
  },
  totalSubtext: {
    fontSize: 14,
    color: colors.white,
    marginTop: 8,
    opacity: 0.9,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reportItem: {
    backgroundColor: colors.darkBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 18,
    color: colors.lightBlue,
    fontWeight: "700",
  },
  reportLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reportPercentage: {
    fontSize: 14,
    color: colors.accentBlue,
    fontWeight: "600",
  },

  // Perfil
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.lightBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    color: colors.white,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },

  // Home
  homeContent: {
    padding: 20,
    paddingBottom: 100,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  homeGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  homeUserName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  homeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  totalHomeCard: {
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    paddingVertical: 24,
  },
  totalHomeLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
    opacity: 0.9,
  },
  totalHomeValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.white,
    marginTop: 8,
  },
  totalHomeStats: {
    flexDirection: "row",
    marginTop: 16,
    gap: 20,
  },
  totalHomeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalHomeStatText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "600",
  },
  categoryHomeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlue,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  categoryHomeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryHomeName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  categoryHomeValue: {
    fontSize: 16,
    color: colors.lightBlue,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.darkBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseContent: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  expenseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.lightBlue,
  },

  // TabBar
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.darkBlue,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 10,
    marginTop: 4,
  },
});
