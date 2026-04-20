// Debug do servidor para verificar se IA V2 está sendo usada
const AIAnalyzerV2 = require('./ai-analyzer-v2');

async function debugServer() {
    console.log('🔍 Debugando integração da IA V2 no servidor...\n');
    
    try {
        const analyzer = new AIAnalyzerV2();
        console.log('✅ IA V2 instanciada com sucesso');
        
        // Testar análise direta
        const result = await analyzer.analyzeImage('test-white-chairs-real.jpg');
        
        console.log('📊 Resultado direto da IA V2:');
        console.log(`   Sucesso: ${result.success}`);
        console.log(`   Itens: ${result.totalItems}`);
        console.log(`   Confiança: ${(result.confidence * 100).toFixed(1)}%`);
        
        if (result.success && result.items.length > 0) {
            const tipos = {};
            result.items.forEach(item => {
                tipos[item.type] = (tipos[item.type] || 0) + 1;
            });
            
            console.log('🏷️ Tipos detectados:');
            Object.entries(tipos).forEach(([tipo, count]) => {
                console.log(`   ${tipo}: ${count}`);
            });
            
            // Verificar se detectou os tipos corretos
            const temCadeiras = (tipos['cadeira'] || 0) > 0;
            const temPilhas = (tipos['pilha_cadeiras'] || 0) > 0;
            const temEstruturas = (tipos['estrutura_metalica'] || 0) > 0;
            
            console.log('\n🎯 Avaliação:');
            console.log(`   ✅ Cadeiras detectadas: ${temCadeiras}`);
            console.log(`   ✅ Pilhas detectadas: ${temPilhas}`);
            console.log(`   ✅ Estruturas detectadas: ${temEstruturas}`);
            
            if (temCadeiras || temPilhas) {
                console.log('   🎉 IA V2 está funcionando corretamente!');
            } else {
                console.log('   ❌ IA V2 não está detectando os objetos esperados');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

debugServer();
