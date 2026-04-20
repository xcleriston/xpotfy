const Jimp = require('jimp');
const fs = require('fs');

async function createTestImage() {
    try {
        // Criar uma imagem de teste com formas geométricas
        const image = new Jimp(400, 300, 0xffffff);
        
        // Adicionar algumas "caixas" (retângulos)
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            // Caixa 1 - grande e escura
            if (x >= 50 && x <= 150 && y >= 50 && y <= 150) {
                image.bitmap.data[idx] = 100;     // R
                image.bitmap.data[idx + 1] = 50;  // G
                image.bitmap.data[idx + 2] = 50;  // B
                image.bitmap.data[idx + 3] = 255; // A
            }
            
            // Caixa 2 - média e média
            if (x >= 200 && x <= 280 && y >= 80 && y <= 160) {
                image.bitmap.data[idx] = 50;      // R
                image.bitmap.data[idx + 1] = 100; // G
                image.bitmap.data[idx + 2] = 50;  // B
                image.bitmap.data[idx + 3] = 255; // A
            }
            
            // Caixa 3 - pequena e clara
            if (x >= 320 && x <= 370 && y >= 200 && y <= 250) {
                image.bitmap.data[idx] = 150;     // R
                image.bitmap.data[idx + 1] = 150; // G
                image.bitmap.data[idx + 2] = 100; // B
                image.bitmap.data[idx + 3] = 255; // A
            }
            
            // Círculo (aproximado)
            const centerX = 100, centerY = 220, radius = 30;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distance <= radius) {
                image.bitmap.data[idx] = 80;      // R
                image.bitmap.data[idx + 1] = 80;  // G
                image.bitmap.data[idx + 2] = 150; // B
                image.bitmap.data[idx + 3] = 255; // A
            }
        });
        
        // Salvar a imagem
        await image.writeAsync('test-cargo.jpg');
        console.log('Imagem de teste criada: test-cargo.jpg');
        
    } catch (error) {
        console.error('Erro ao criar imagem de teste:', error);
    }
}

createTestImage();
