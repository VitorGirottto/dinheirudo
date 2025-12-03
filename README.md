# 💸 Dinheirudo  
Aplicativo mobile desenvolvido com **React Native + Expo** para controle financeiro pessoal.  
O Dinheirudo permite registrar gastos, criar categorias, gerar relatórios filtrados e acompanhar estatísticas diretamente no celular, utilizando banco de dados **SQLite local**.

---

## 🚀 Tecnologias utilizadas

- **React Native (Expo)**
- **TypeScript**
- **SQLite (expo-sqlite)**
- **DropDownPicker**
- **MaskedTextInput**
- **Expo Icons (Ionicons)**
- **React Hooks**

---

## 📂 Estrutura do Projeto

dinheirudo/
│

├── app/

│ ├── index.tsx # App completo (login, categorias, gastos, relatórios e perfil)

│ ├── (tabs)/ # Navegação em abas

│

├── components/ # UI Components reutilizáveis

├── assets/ # Imagens, banco local, ícones

│ └── db.db # Banco SQLite

│

├── package.json

├── tsconfig.json

├── expo-env.d.ts

├── eslint.config.js

└── .gitignore


---

## 📱 Funcionalidades

### 🔐 **Autenticação**
- Cadastro de usuário  
- Login por email e senha  
- Validação básica dos campos  

### 🧾 **Gastos**
- Registrar valor, categoria, descrição e data  
- Conversão automática do valor com máscara de moeda  
- Armazenamento local no SQLite  

### 🏷 **Categorias**
- Criar categorias personalizadas  
- Cada usuário possui suas próprias categorias  

### 📊 **Relatórios**
- Filtro por:
  - Data inicial  
  - Data final  
  - Categoria  
- Listagem de:
  - Gastos por mês  
  - Gastos por categoria com porcentagem  
  - Total geral  

### 👤 **Perfil**
- Mostra nome, email, quantidade de gastos, total gasto e número de categorias  

### 🏠 **Home**
- Saudações  
- Painel de gasto total  
- Top categorias  
- Lista dos últimos gastos  

---

## 💾 Banco de Dados (SQLite)

O app cria automaticamente as seguintes tabelas:

usuarios(id, nome, email, senha)
categorias(id, nome, usuario_id)
gastos(id, valor, categoria, descricao, data, usuario_id)


Cada ação (cadastro, login, gasto, categoria) interage com o banco usando:

```ts
db.runAsync()
db.getAllAsync()
db.execAsync()
