const Jimp = require('jimp');

async function createChairTestImage() {
    try {
        // Criar imagem de teste com cadeiras e estruturas Q30
        const image = new Jimp(600, 400, 0xffffff);
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            // Pilha de cadeiras horizontal (3 cadeiras empilhadas)
            if (x >= 50 && x <= 200 && y >= 100 && y <= 180) {
                // Estrutura das cadeiras
                if (x % 40 < 35 && y % 25 < 20) {
                    image.bitmap.data[idx] = 60;      // R
                    image.bitmap.data[idx + 1] = 40;  // G
                    image.bitmap.data[idx + 2] = 80;  // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
            
            // Pilha de cadeiras vertical (2 cadeiras em pé)
            if (x >= 250 && x <= 320 && y >= 50 && y <= 200) {
                if (x % 25 < 20 && y % 60 < 50) {
                    image.bitmap.data[idx] = 70;      // R
                    image.bitmap.data[idx + 1] = 50;  // G
                    image.bitmap.data[idx + 2] = 90;  // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
            
            // Estrutura Q30 complexa
            if (x >= 380 && x <= 550 && y >= 120 && y <= 280) {
                // Estrutura metálica complexa
                const centerX = 465, centerY = 200;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                if (distance < 70) {
                    // Padrão complexo para estrutura Q30
                    const angle = Math.atan2(y - centerY, x - centerX);
                    const pattern = Math.sin(angle * 8) * Math.cos(distance * 0.1);
                    
                    if (pattern > 0.3) {
                        image.bitmap.data[idx] = 40;      // R
                        image.bitmap.data[idx + 1] = 40;  // G
                        image.bitmap.data[idx + 2] = 50;  // B
                        image.bitmap.data[idx + 3] = 255; // A
                    }
                }
            }
            
            // Cadeira individual
            if (x >= 100 && x <= 180 && y >= 250 && y <= 350) {
                if ((x - 140) ** 2 / 40 ** 2 + (y - 300) ** 2 / 50 ** 2 < 1) {
                    image.bitmap.data[idx] = 80;      // R
                    image.bitmap.data[idx + 1] = 60;  // G
                    image.bitmap.data[idx + 2] = 100; // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
        });
        
        // Adicionar algum ruído para tornar mais realista
        for (let i = 0; i < 1000; i++) {
            const x = Math.floor(Math.random() * image.bitmap.width);
            const y = Math.floor(Math.random() * image.bitmap.height);
            const idx = (y * image.bitmap.width + x) * 4;
            
            const noise = Math.random() * 30 - 15;
            image.bitmap.data[idx] = Math.max(0, Math.min(255, image.bitmap.data[idx] + noise));
            image.bitmap.data[idx + 1] = Math.max(0, Math.min(255, image.bitmap.data[idx + 1] + noise));
            image.bitmap.data[idx + 2] = Math.max(0, Math.min(255, image.bitmap.data[idx + 2] + noise));
        }
        
        await image.writeAsync('test-chairs-q30.jpg');
        console.log('Imagem de teste com cadeiras e Q30 criada: test-chairs-q30.jpg');
        
    } catch (error) {
        console.error('Erro ao criar imagem de teste:', error);
    }
}

createChairTestImage();
