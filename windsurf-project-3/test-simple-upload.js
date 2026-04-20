const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🚀 Testando Upload de Imagem...\n');
    
    try {
        // Ler a imagem como buffer
        const imageBuffer = fs.readFileSync('test-chairs-q30.jpg');
        console.log(`📷 Imagem lida: ${imageBuffer.length} bytes`);
        
        // Criar FormData manual
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
        const formData = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="image"; filename="test-chairs-q30.jpg"',
            'Content-Type: image/jpeg',
            '',
            imageBuffer.toString('binary'),
            `--${boundary}`,
            'Content-Disposition: form-data; name="name"',
            '',
            'Teste Upload Simples',
            `--${boundary}--`
        ].join('\r\n');
        
        console.log('📦 Enviando requisição...');
        
        const result = await makeRequest('POST', 'http://localhost:5000/api/upload', formData, {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData, 'binary')
        });
        
        console.log('✅ Upload realizado com sucesso!');
        
        const cargo = JSON.parse(result);
        console.log(`📦 Itens detectados: ${cargo.items || 0}`);
        console.log(`🎯 Confiança: ${((cargo.aiAnalysis?.confidence || 0) * 100).toFixed(1)}%`);
        console.log(`📏 Volume: ${(cargo.estimatedVolume || 0).toFixed(3)} m³`);
        console.log(`⚖️ Peso: ${cargo.estimatedWeight || 0} kg`);
        
        // Analisar tipos de objetos
        if (cargo.individualItems && cargo.individualItems.length > 0) {
            const tipos = {};
            cargo.individualItems.forEach(item => {
                tipos[item.type] = (tipos[item.type] || 0) + 1;
            });
            console.log('🏷️ Tipos detectados:');
            Object.entries(tipos).forEach(([tipo, count]) => {
                console.log(`   ${tipo}: ${count}`);
            });
            
            // Mostrar alguns itens detalhados
            console.log('\n📋 Primeiros 5 itens:');
            cargo.individualItems.slice(0, 5).forEach((item, i) => {
                console.log(`   ${i+1}. ${item.name}: ${(item.dimensions?.length || 0).toFixed(2)}×${(item.dimensions?.width || 0).toFixed(2)}×${(item.dimensions?.height || 0).toFixed(2)}m (${item.weight || 0}kg)`);
            });
        } else {
            console.log('⚠️ Nenhum item individual detectado');
        }
        
        return cargo;
        
    } catch (error) {
        console.error('❌ Erro no upload:', error.message);
        return null;
    }
}

async function makeRequest(method, url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: headers
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(data, 'binary');
        }
        
        req.end();
    });
}

async function testOptimization(cargoId, vehicleId, vehicleName) {
    console.log(`\n🚚 Testando Otimização com ${vehicleName}...`);
    
    try {
        const result = await makeRequest('POST', 'http://localhost:5000/api/optimize', 
            JSON.stringify({ cargoId, vehicleId }), 
            { 'Content-Type': 'application/json' }
        );
        
        const optimization = JSON.parse(result);
        console.log(`✅ Cabe no veículo: ${optimization.fits ? 'SIM' : 'NÃO'}`);
        console.log(`📊 Utilização volume: ${optimization.utilization.volume}%`);
        console.log(`⚖️ Utilização peso: ${optimization.utilization.weight}%`);
        
        if (optimization.packingResult) {
            console.log(`📦 Itens empacotados: ${optimization.packingResult.totalItems}`);
            console.log(`🎯 Eficiência: ${optimization.packingResult.efficiency}%`);
        }
        
        if (optimization.suggestions && optimization.suggestions.length > 0) {
            console.log('💡 Sugestões:');
            optimization.suggestions.forEach((suggestion, i) => {
                console.log(`   ${i + 1}. ${suggestion}`);
            });
        }
        
        return optimization;
        
    } catch (error) {
        console.error(`❌ Erro na otimização:`, error.message);
        return null;
    }
}

// Executar testes
async function runTests() {
    console.log('🎯 Iniciando Testes Visuais Completos do Sistema\n');
    
    // Testar upload
    const cargo = await testUpload();
    
    if (cargo) {
        // Testar otimizações com diferentes veículos
        await testOptimization(cargo.id, 1, 'Caminhão Pequeno');
        await testOptimization(cargo.id, 2, 'Van Média');
        await testOptimization(cargo.id, 3, 'Caminhão Grande');
    }
    
    console.log('\n🎉 Testes concluídos!');
    console.log('🌐 Acesse http://localhost:5000 para testar a interface visual');
}

runTests().catch(console.error);
