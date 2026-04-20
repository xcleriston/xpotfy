// Testar a nova IA V2 com detecção real
const AIAnalyzerV2 = require('./ai-analyzer-v2');

async function testNewAI() {
    console.log('🚀 Testando Nova IA V2 - Detecção Real de Objetos\n');
    
    try {
        const analyzer = new AIAnalyzerV2();
        
        // Testar com a imagem real do usuário
        const testImages = [
            'test-white-chairs-real.jpg',
            // Adicione mais imagens reais aqui se tiver
        ];
        
        for (const imagePath of testImages) {
            console.log(`📸 Analisando imagem: ${imagePath}`);
            
            try {
                const result = await analyzer.analyzeImage(imagePath);
                
                console.log('✅ Análise concluída!');
                console.log(`📊 Resultados:`);
                console.log(`   Sucesso: ${result.success}`);
                console.log(`   Itens detectados: ${result.totalItems}`);
                console.log(`   Confiança geral: ${(result.confidence * 100).toFixed(1)}%`);
                console.log(`   Volume total: ${result.estimatedVolume.toFixed(6)} m³`);
                console.log(`   Peso total: ${result.estimatedWeight} kg\n`);
                
                // Analisar tipos detectados
                const tipos = {};
                result.items.forEach(item => {
                    tipos[item.type] = (tipos[item.type] || 0) + 1;
                });
                
                console.log('🏷️ Tipos detectados:');
                Object.entries(tipos).forEach(([tipo, count]) => {
                    console.log(`   ${tipo}: ${count}`);
                });
                
                // Mostrar detalhes dos primeiros itens
                console.log('\n📋 Primeiros 5 itens:');
                result.items.slice(0, 5).forEach((item, i) => {
                    console.log(`   ${i+1}. ${item.name}:`);
                    console.log(`      Tipo: ${item.type}`);
                    console.log(`      Dimensões: ${item.dimensions.length.toFixed(2)}×${item.dimensions.width.toFixed(2)}×${item.dimensions.height.toFixed(2)}m`);
                    console.log(`      Peso: ${item.weight}kg`);
                    console.log(`      Confiança: ${(item.confidence * 100).toFixed(1)}%`);
                    console.log(`      Bounding box: x=${item.boundingBox.x}, y=${item.boundingBox.y}, w=${item.boundingBox.width}, h=${item.boundingBox.height}`);
                    console.log('');
                });
                
                // Verificar se detectou cadeiras corretamente
                const cadeirasDetectadas = tipos['cadeira'] || 0;
                const pilhasDetectadas = tipos['pilha_cadeiras'] || 0;
                const estruturasDetectadas = tipos['estrutura_metalica'] || 0;
                
                console.log('🎯 Avaliação da detecção:');
                console.log(`   ✅ Cadeiras individuais: ${cadeirasDetectadas}`);
                console.log(`   ✅ Pilhas de cadeiras: ${pilhasDetectadas}`);
                console.log(`   ✅ Estruturas metálicas: ${estruturasDetectadas}`);
                
                if (cadeirasDetectadas > 0 || pilhasDetectadas > 0) {
                    console.log('   🎉 SUCESSO: Detectou cadeiras reais!');
                } else {
                    console.log('   ⚠️ AVISO: Não detectou cadeiras');
                }
                
                console.log('─'.repeat(60) + '\n');
                
            } catch (error) {
                console.error(`❌ Erro ao analisar ${imagePath}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

testNewAI();
