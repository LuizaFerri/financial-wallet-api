// Configurar PostgreSQL para testes
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'carteira_financeira_test';
process.env.DB_SYNCHRONIZE = 'true';

// Imprimir configuração para diagnóstico
console.log('Configuração do banco de dados para testes:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Username: ${process.env.DB_USERNAME}`);
console.log(`Database: ${process.env.DB_DATABASE}`); 