// Teste visual completo do sistema
const fs = require('fs');
const path = require('path');

async function runVisualTests() {
    console.log('🚀 Iniciando Testes Visuais Completos...\n');
    
    const tests = [
        {
            name: 'Teste 1: Upload e Análise de Imagem',
            endpoint: '/api/upload',
            method: 'POST',
            file: 'test-chairs-q30.jpg',
            description: 'Testar upload da imagem de cadeiras Q30'
        },
        {
            name: 'Teste 2: Verificar Cargas Existentes',
            endpoint: '/api/cargos',
            method: 'GET',
            description: 'Listar todas as cargas analisadas'
        },
        {
            name: 'Teste 3: Otimização com Caminhão Pequeno',
            endpoint: '/api/optimize',
            method: 'POST',
            data: { cargoId: 1, vehicleId: 1 },
            description: 'Testar otimização com caminhão pequeno'
        },
        {
            name: 'Teste 4: Otimização com Van Média',
            endpoint: '/api/optimize',
            method: 'POST',
            data: { cargoId: 1, vehicleId: 2 },
            description: 'Testar otimização com van média'
        },
        {
            name: 'Teste 5: Otimização com Caminhão Grande',
            endpoint: '/api/optimize',
            method: 'POST',
            data: { cargoId: 1, vehicleId: 3 },
            description: 'Testar otimização com caminhão grande'
        }
    ];
    
    for (const test of tests) {
        console.log(`📋 ${test.name}`);
        console.log(`📝 ${test.description}`);
        
        try {
            let result;
            
            if (test.method === 'POST' && test.file) {
                // Teste de upload
                const FormData = require('form-data');
                const form = new FormData();
                form.append('image', fs.createReadStream(test.file));
                form.append('name', 'Teste Visual Completo');
                
                result = await makeRequest('POST', `http://localhost:5000${test.endpoint}`, form, form.getHeaders());
            } else if (test.method === 'POST' && test.data) {
                // Teste de otimização
                result = await makeRequest('POST', `http://localhost:5000${test.endpoint}`, test.data, {
                    'Content-Type': 'application/json'
                });
            } else {
                // Teste GET
                result = await makeRequest('GET', `http://localhost:5000${test.endpoint}`);
            }
            
            console.log('✅ Sucesso!');
            
            if (test.endpoint === '/api/upload') {
                const cargo = JSON.parse(result);
                console.log(`📦 Itens detectados: ${cargo.items}`);
                console.log(`🎯 Confiança: ${(cargo.aiAnalysis.confidence * 100).toFixed(1)}%`);
                console.log(`📏 Volume: ${cargo.estimatedVolume.toFixed(3)} m³`);
                console.log(`⚖️ Peso: ${cargo.estimatedWeight} kg`);
                
                // Analisar tipos de objetos
                const tipos = {};
                cargo.individualItems.forEach(item => {
                    tipos[item.type] = (tipos[item.type] || 0) + 1;
                });
                console.log('🏷️ Tipos detectados:');
                Object.entries(tipos).forEach(([tipo, count]) => {
                    console.log(`   ${tipo}: ${count}`);
                });
            }
            
            if (test.endpoint === '/api/optimize') {
                const optimization = JSON.parse(result);
                console.log(`🚚 Cabe no veículo: ${optimization.fits ? 'SIM' : 'NÃO'}`);
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
            }
            
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
        
        console.log('─'.repeat(50) + '\n');
    }
    
    console.log('🎉 Testes visuais concluídos!');
    console.log('🌐 Acesse http://localhost:5000 para testar a interface visual');
}

async function makeRequest(method, url, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const https = require('https');
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: headers
        };
        
        const req = client.request(options, (res) => {
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
            if (typeof data === 'string') {
                req.write(data);
            } else {
                req.write(JSON.stringify(data));
            }
        }
        
        req.end();
    });
}

// Executar testes
runVisualTests().catch(console.error);
