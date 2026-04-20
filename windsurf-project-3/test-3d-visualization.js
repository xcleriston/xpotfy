// Teste específico para visualização 3D
const puppeteer = require('puppeteer');

async function test3DVisualization() {
    console.log('🎬 Iniciando Teste de Visualização 3D...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Acessar a aplicação
        console.log('🌐 Acessando http://localhost:5000...');
        await page.goto('http://localhost:5000');
        
        // Esperar carregar a página
        await page.waitForSelector('#uploadArea');
        console.log('✅ Página carregada com sucesso!');
        
        // Fazer upload da imagem de teste
        console.log('📤 Fazendo upload da imagem de teste...');
        const fileInput = await page.$('#fileInput');
        await fileInput.uploadFile('test-chairs-q30.jpg');
        
        // Esperar preview da imagem
        await page.waitForSelector('#imagePreview', { visible: true });
        console.log('✅ Preview da imagem carregado!');
        
        // Preencher nome da carga
        await page.type('#cargoName', 'Teste Visualização 3D');
        
        // Clicar em analisar
        console.log('🔍 Analisando carga com IA...');
        await page.click('#analyzeBtn');
        
        // Esperar resultados da IA
        await page.waitForSelector('#aiResultsSection', { visible: true });
        await page.waitForTimeout(2000);
        
        // Verificar resultados da IA
        const confidenceText = await page.$eval('#aiConfidenceBar', el => el.textContent);
        const itemsCount = await page.$eval('#itemsDetectedBadge', el => el.textContent);
        const volumeText = await page.$eval('#estimatedVolume', el => el.textContent);
        
        console.log(`📊 Resultados da IA:`);
        console.log(`   Confiança: ${confidenceText}`);
        console.log(`   Itens: ${itemsCount}`);
        console.log(`   Volume: ${volumeText}`);
        
        // Selecionar primeiro veículo
        console.log('🚚 Selecionando veículo...');
        await page.waitForSelector('.vehicle-card');
        await page.click('.vehicle-card');
        
        // Esperar botão de otimização ficar habilitado
        await page.waitForFunction(() => !document.querySelector('#optimizeBtn').disabled);
        
        // Clicar em otimizar
        console.log('⚡ Otimizando carregamento...');
        await page.click('#optimizeBtn');
        
        // Esperar resultados da otimização
        await page.waitForSelector('#resultsSection', { visible: true });
        await page.waitForTimeout(1000);
        
        // Verificar se a visualização 3D apareceu
        const visualizationVisible = await page.$eval('#visualizationSection', el => el.style.display !== 'none');
        
        if (visualizationVisible) {
            console.log('✅ Visualização 3D carregada com sucesso!');
            
            // Testar controles 3D
            console.log('🎮 Testando controles 3D...');
            
            // Testar rotação X
            await page.focus('#rotationX');
            await page.keyboard.type('ArrowRight');
            await page.keyboard.type('ArrowRight');
            await page.waitForTimeout(500);
            
            // Testar rotação Y
            await page.focus('#rotationY');
            await page.keyboard.type('ArrowLeft');
            await page.keyboard.type('ArrowLeft');
            await page.waitForTimeout(500);
            
            // Testar zoom
            await page.focus('#zoom');
            await page.keyboard.type('ArrowUp');
            await page.waitForTimeout(500);
            
            console.log('✅ Controles 3D testados!');
            
            // Testar animação
            console.log('🎬 Testando animação...');
            await page.click('#animatePacking');
            await page.waitForTimeout(3000);
            console.log('✅ Animação executada!');
            
            // Testar reset
            console.log('🔄 Testando reset da visualização...');
            await page.click('#resetView');
            await page.waitForTimeout(1000);
            console.log('✅ Reset testado!');
            
            // Verificar itens na visualização
            const cargoItems = await page.$$('.cargo-item');
            console.log(`📦 Itens renderizados em 3D: ${cargoItems.length}`);
            
            // Verificar lista de itens
            const itemsCards = await page.$$('#itemsList .card');
            console.log(`📋 Cards de itens: ${itemsCards.length}`);
            
            // Tirar screenshot da visualização
            await page.screenshot({ path: 'test-3d-visualization.png', fullPage: true });
            console.log('📸 Screenshot salvo como test-3d-visualization.png');
            
        } else {
            console.log('❌ Visualização 3D não apareceu');
        }
        
        console.log('\n🎉 Teste de visualização 3D concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Verificar se Puppeteer está disponível
try {
    require('puppeteer');
    test3DVisualization().catch(console.error);
} catch (error) {
    console.log('⚠️ Puppeteer não encontrado. Teste manual necessário.');
    console.log('🌐 Acesse http://localhost:5000 e teste manualmente:');
    console.log('   1. Faça upload da imagem test-chairs-q30.jpg');
    console.log('   2. Aguarde a análise da IA');
    console.log('   3. Selecione um veículo');
    console.log('   4. Clique em Otimizar Carregamento');
    console.log('   5. Use os controles 3D para visualizar');
    console.log('   6. Teste a animação e o reset');
}
