const { getSupabaseClient } = require('./src/lib/supabase/client.ts');

async function testSupabase() {
  try {
    const supabase = getSupabaseClient();
    
    // Testar leitura
    const { data, error } = await supabase
      .from('workers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Erro de leitura:', error.message);
    } else {
      console.log('Leitura bem-sucedida');
    }
    
    // Testar inserção
    const { error: insertError } = await supabase
      .from('workers')
      .insert({
        name: 'Teste',
        role: 'Testador',
        department: 'Testes',
        base_salary: 100000,
        status: 'Ativo',
        type: 'Fixo',
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.log('Erro de inserção:', insertError.message);
    } else {
      console.log('Inserção bem-sucedida');
    }
    
  } catch (err) {
    console.log('Erro geral:', err.message);
  }
}

testSupabase();