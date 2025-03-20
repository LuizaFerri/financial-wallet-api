# Documentação Técnica - API de Carteira Financeira

## Visão Geral da Arquitetura

A API de Carteira Financeira foi desenvolvida utilizando o framework NestJS, seguindo uma arquitetura modular organizada por domínios de negócio. A aplicação implementa os princípios SOLID e utiliza padrões de design como Injeção de Dependência, Repository Pattern e Service Layer.

### Estrutura de Diretórios

```
src/
├── auth/
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── transactions/
│   ├── dto/
│   ├── entities/
│   ├── transactions.controller.ts
│   ├── transactions.module.ts
│   └── transactions.service.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Banco de Dados

### Modelo de Dados

O sistema utiliza PostgreSQL como banco de dados relacional e TypeORM como ORM para mapeamento objeto-relacional.

#### Entidades Principais:

**User (Usuário)**
- `id`: UUID - Identificador único
- `email`: String - E-mail do usuário (único)
- `name`: String - Nome do usuário
- `password`: String - Senha criptografada
- `balance`: Decimal - Saldo da carteira
- `active`: Boolean - Status do usuário
- `createdAt`: Date - Data de criação
- `updatedAt`: Date - Data de atualização

**Transaction (Transação)**
- `id`: UUID - Identificador único
- `type`: Enum - Tipo da transação (depósito, transferência ou reversão)
- `status`: Enum - Status da transação (pendente, concluída, revertida ou falha)
- `amount`: Decimal - Valor da transação
- `description`: String - Descrição opcional
- `senderId`: UUID - ID do remetente (opcional, relacionamento com User)
- `receiverId`: UUID - ID do destinatário (relacionamento com User)
- `relatedTransactionId`: UUID - ID da transação relacionada (para reversões)
- `createdAt`: Date - Data de criação
- `updatedAt`: Date - Data de atualização

### Relacionamentos:

- Um usuário pode ter múltiplas transações enviadas (OneToMany)
- Um usuário pode ter múltiplas transações recebidas (OneToMany)
- Uma transação tem um remetente opcional (ManyToOne)
- Uma transação tem um destinatário (ManyToOne)

## Módulos Principais

### 1. Módulo de Usuários (Users)

Responsável pelo gerenciamento de usuários, incluindo:
- Registro de novos usuários
- Consulta de informações de usuário
- Atualização de dados de usuário
- Exclusão lógica (soft delete) de usuários
- Gerenciamento de saldo

Serviços principais:
- `create`: Cria um novo usuário com senha criptografada
- `findAll`: Lista todos os usuários ativos
- `findOne`: Busca um usuário por ID
- `findByEmail`: Busca um usuário por e-mail
- `update`: Atualiza informações do usuário
- `updateBalance`: Atualiza o saldo do usuário (validando se o saldo não ficará negativo)
- `remove`: Desativa um usuário (soft delete)

### 2. Módulo de Autenticação (Auth)

Responsável pelo processo de autenticação e autorização:
- Login de usuários
- Geração de tokens JWT
- Validação de tokens
- Estratégias de autenticação

Componentes principais:
- `LocalStrategy`: Estratégia para validação de credenciais (e-mail/senha)
- `JwtStrategy`: Estratégia para validação de tokens JWT
- `JwtAuthGuard`: Guard para proteger rotas que exigem autenticação
- `auth.service`: Serviço para validação de usuários e geração de tokens

### 3. Módulo de Transações (Transactions)

Responsável pelo gerenciamento de transações financeiras:
- Depósitos na carteira
- Transferências entre usuários
- Reversão de transações
- Consulta de histórico de transações

Serviços principais:
- `createDeposit`: Cria um depósito e atualiza o saldo do usuário
- `createTransfer`: Cria uma transferência entre usuários, validando saldo e atualizando os saldos de ambos
- `reverseTransaction`: Reverte uma transação, devolvendo valores e atualizando status
- `findUserTransactions`: Lista transações associadas a um usuário
- `findOne`: Busca detalhes de uma transação específica

## Fluxos de Operações

### Fluxo de Depósito

1. Usuário autenticado envia requisição para `/transactions/deposit` com valor e descrição opcional
2. Sistema inicia uma transação no banco de dados
3. Sistema cria um registro de depósito com status "pendente"
4. Sistema atualiza o saldo do usuário
5. Sistema atualiza o status do depósito para "concluído"
6. Sistema comita a transação do banco de dados
7. Em caso de erro, a transação é revertida

### Fluxo de Transferência

1. Usuário autenticado envia requisição para `/transactions/transfer` com ID do destinatário, valor e descrição opcional
2. Sistema valida se o destinatário existe e se é diferente do remetente
3. Sistema inicia uma transação no banco de dados
4. Sistema verifica se o remetente tem saldo suficiente
5. Sistema cria um registro de transferência com status "pendente"
6. Sistema subtrai o valor do saldo do remetente
7. Sistema adiciona o valor ao saldo do destinatário
8. Sistema atualiza o status da transferência para "concluído"
9. Sistema comita a transação do banco de dados
10. Em caso de erro, a transação é revertida

### Fluxo de Reversão

1. Usuário autenticado envia requisição para `/transactions/reverse` com ID da transação e motivo opcional
2. Sistema verifica se a transação existe e se o usuário está envolvido nela (como remetente ou destinatário)
3. Sistema verifica se a transação está no status "concluído" e não foi revertida anteriormente
4. Sistema inicia uma transação no banco de dados
5. Sistema cria um registro de reversão com status "pendente"
6. Sistema devolve os valores aos saldos originais (remetente recebe de volta, destinatário tem valor subtraído)
7. Sistema marca a transação original como "revertida"
8. Sistema atualiza o status da reversão para "concluído"
9. Sistema comita a transação do banco de dados
10. Em caso de erro, a transação é revertida

## Segurança

### Autenticação e Autorização

- Todas as senhas são armazenadas com hash usando bcrypt
- Autenticação baseada em tokens JWT
- Tokens com tempo de expiração configurável
- Endpoints sensíveis protegidos por JwtAuthGuard

### Validação de Dados

- Validação de todos os dados de entrada usando class-validator
- DTOs específicos para cada operação com regras de validação
- Whitelist para evitar propriedades inesperadas

### Proteção de Dados

- Exclusão de senhas e dados sensíveis das respostas usando class-transformer
- Soft delete para manter histórico sem perder dados
- Validações de negócio para evitar inconsistências (ex: saldo negativo)

## Tratamento de Erros

O sistema implementa um tratamento de erros abrangente:

- Exceções específicas para cada tipo de erro (NotFoundException, BadRequestException, etc.)
- Mensagens de erro claras e informativas
- Transações SQL para garantir atomicidade e consistência
- Rollback automático em caso de falhas

## Configuração e Ambiente

### Variáveis de Ambiente

- `NODE_ENV`: Ambiente de execução (development, production)
- `PORT`: Porta da aplicação
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: Configurações do banco de dados
- `DB_SYNCHRONIZE`: Flag para sincronização automática do esquema (apenas em desenvolvimento)
- `JWT_SECRET`: Chave secreta para tokens JWT
- `JWT_EXPIRATION`: Tempo de expiração dos tokens

### Docker

A aplicação está configurada para execução em contêineres Docker:

- `Dockerfile` para construção da imagem da aplicação
- `docker-compose.yml` para orquestração de múltiplos serviços (app, banco de dados)
- Volumes para persistência de dados
- Network isolada para comunicação entre serviços

## Testes

### Testes Unitários

Testes focados em unidades individuais de código:
- Testes para serviços principais
- Mocking de dependências
- Cobertura de casos de sucesso e erro

### Testes de Integração

Testes que verificam a integração entre componentes:
- Testes e2e para APIs
- Configuração de banco de dados de teste
- Verificação de fluxos completos

## Decisões de Implementação

### Uso de Transações

O sistema utiliza transações SQL para garantir consistência em operações críticas:
- Depósitos
- Transferências
- Reversões

Isso assegura que, em caso de falha, o sistema permaneça em um estado consistente.

### Soft Delete

Optamos por implementar soft delete para usuários, o que permite:
- Manter histórico de transações
- Facilitar auditoria
- Possibilitar recuperação de contas

### Status de Transações

O uso de status claros para transações (pendente, concluído, revertido, falha) permite:
- Rastreamento do ciclo de vida completo
- Facilitação de auditorias
- Prevenção de operações duplicadas ou inválidas

### Validação de Saldo

A validação rigorosa de saldo antes de operações financeiras evita:
- Saldos negativos
- Transferências sem fundos
- Inconsistências financeiras