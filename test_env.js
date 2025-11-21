// Teste simples de configuração do Supabase
console.log('🔍 Testando configuração do Supabase...');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('\nVariáveis de ambiente necessárias:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Definida' : '❌ Ausente'}`);
  if (value) {
    console.log(`  Valor: ${value.substring(0, 20)}...`);
  }
});

// Verificar se as variáveis estão disponíveis
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Variáveis de ambiente ausentes:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.log('\nPor favor, configure as variáveis de ambiente no seu arquivo .env.local');
  console.log('Exemplo de .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima');
} else {
  console.log('\n✅ Todas as variáveis de ambiente estão definidas');
}

console.log('\n🔍 Teste concluído');