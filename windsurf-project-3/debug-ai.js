// Script para debugar a análise de IA
const AIAnalyzer = require('./ai-analyzer');
const sharp = require('sharp');

async function debugAI() {
    console.log('🔍 Debugando Análise de IA...\n');
    
    try {
        const analyzer = new AIAnalyzer();
        const imagePath = 'test-white-chairs-real.jpg';
        
        // Obter informações da imagem
        const imageInfo = await sharp(imagePath).metadata();
        console.log('📷 Informações da imagem:');
        console.log(`   Dimensões: ${imageInfo.width}×${imageInfo.height}`);
        console.log(`   Formato: ${imageInfo.format}`);
        console.log(`   Espaço de cor: ${imageInfo.space}\n`);
        
        // Processar imagem
        console.log('⚙️ Processando imagem...');
        const processedImage = await sharp(imagePath)
            .resize(800, 600, { fit: 'inside' })
            .normalize()
            .sharpen()
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        console.log(`   Processado: ${processedImage.info.width}×${processedImage.info.height}`);
        console.log(`   Buffer size: ${processedImage.data.length} bytes\n`);
        
        // Analisar com IA
        console.log('🤖 Analisando com IA...');
        const result = await analyzer.analyzeImage(imagePath);
        
        console.log('📊 Resultados da análise:');
        console.log(`   Sucesso: ${result.success}`);
        console.log(`   Itens detectados: ${result.totalItems}`);
        console.log(`   Confiança: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Volume estimado: ${result.estimatedVolume?.toFixed(6) || 'N/A'} m³\n`);
        
        // Analisar cada item
        console.log('📋 Detalhes dos itens:');
        result.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name}:`);
            console.log(`      Tipo: ${item.type}`);
            console.log(`      Dimensões: ${item.dimensions.length.toFixed(3)}×${item.dimensions.width.toFixed(3)}×${item.dimensions.height.toFixed(3)}m`);
            console.log(`      Peso: ${item.weight}kg`);
            console.log(`      Confiança: ${(item.confidence * 100).toFixed(1)}%`);
            console.log(`      Cor: ${item.color}`);
            console.log(`      Bounding box: x=${item.boundingBox.x}, y=${item.boundingBox.y}, w=${item.boundingBox.width}, h=${item.boundingBox.height}`);
            console.log('');
        });
        
        // Analisar tipos detectados
        const tipos = {};
        result.items.forEach(item => {
            tipos[item.type] = (tipos[item.type] || 0) + 1;
        });
        
        console.log('🏷️ Resumo por tipo:');
        Object.entries(tipos).forEach(([tipo, count]) => {
            console.log(`   ${tipo}: ${count}`);
        });
        
        // Calcular volume total
        const totalVolume = result.items.reduce((sum, item) => {
            return sum + (item.dimensions.length * item.dimensions.width * item.dimensions.height);
        }, 0);
        
        console.log(`\n📏 Volume total calculado: ${totalVolume.toFixed(6)} m³`);
        console.log(`📏 Volume estimado pela IA: ${result.estimatedVolume?.toFixed(6) || 'N/A'} m³`);
        
        if (result.estimatedVolume && Math.abs(totalVolume - result.estimatedVolume) > 0.0001) {
            console.log('⚠️ Diferença detectada no cálculo de volume!');
        }
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

debugAI();
