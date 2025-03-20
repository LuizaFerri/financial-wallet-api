# API de Carteira Financeira

API RESTful para um sistema de carteira financeira, permitindo que os usuários gerenciem seus saldos fazendo depósitos e transferências.

## Funcionalidades

- Registro e autenticação de usuários
- Depósito de dinheiro na carteira
- Transferência de dinheiro entre usuários
- Reversão de transações
- Visualização de histórico de transações

## Tecnologias

- Node.js
- NestJS
- TypeORM
- PostgreSQL
- JWT para autenticação
- Docker e Docker Compose
- Testes unitários com Jest

## Pré-requisitos

- Node.js v18+
- Docker e Docker Compose
- PostgreSQL (opcional, pode usar via Docker)

## Instalação e Execução

### Usando Docker (recomendado)

1. Clone o repositório:
```bash
git clone https://github.com/LuizaFerri/carteira-financeira.git
cd carteira-financeira
```

2. Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base):
```bash
cp .env.example .env
```

3. Inicie a aplicação com Docker Compose:
```bash
docker-compose up -d
```

4. A API estará disponível em http://localhost:3000/api

### Instalação manual

1. Clone o repositório:
```bash
git clone https://github.com/LuizaFerri/carteira-financeira.git
cd carteira-financeira
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base):
```bash
cp .env.example .env
```

4. Configure seu banco de dados PostgreSQL e atualize o arquivo `.env`

5. Inicie a aplicação:
```bash
npm run start:dev
```

6. A API estará disponível em http://localhost:3000/api

## Documentação da API

A documentação completa da API está disponível através do Swagger UI em http://localhost:3000/api quando a aplicação estiver rodando.

### Endpoints principais

#### Autenticação
- `POST /auth/login` - Fazer login e obter token JWT
- `GET /auth/perfil` - Obter dados do usuário autenticado

#### Usuários
- `POST /users` - Registrar novo usuário
- `GET /users` - Listar todos os usuários (autenticado)
- `GET /users/:id` - Obter um usuário específico (autenticado)
- `PATCH /users/:id` - Atualizar usuário (autenticado)
- `DELETE /users/:id` - Remover usuário (soft delete, autenticado)

#### Transações
- `POST /transactions/deposit` - Fazer um depósito (autenticado)
- `POST /transactions/transfer` - Fazer uma transferência (autenticado)
- `POST /transactions/reverse` - Reverter uma transação (autenticado)
- `GET /transactions` - Listar transações do usuário logado (autenticado)
- `GET /transactions/:id` - Obter detalhes de uma transação (autenticado)

## Testes

### Executando testes unitários
```bash
npm run test
```

### Executando testes e2e
```bash
npm run test:e2e
```

### Verificando cobertura de testes
```bash
npm run test:cov
```

## Arquitetura

O projeto segue a arquitetura modular do NestJS e implementa os princípios SOLID:

- **Módulos**: Auth, Users, Transactions
- **Entidades**: User, Transaction
- **Validações**: Class-validator para validação de DTOs
- **Transações de banco de dados**: Uso de transações TypeORM para garantir consistência
- **Segurança**: Armazenamento seguro de senhas com bcrypt e autenticação JWT

## Observabilidade

- Logs detalhados para operações críticas
- Tratamento adequado de erros
- Validação de dados de entrada
