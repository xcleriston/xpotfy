const Jimp = require('jimp');

async function createWhiteChairsTestImage() {
    try {
        // Criar imagem que simula a cena do usuário: cadeiras brancas empilhadas e estruturas metálicas
        const image = new Jimp(800, 600, 0xf0f0f0); // Fundo claro
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            // Pilha 1: Cadeiras brancas empilhadas (principal)
            if (x >= 100 && x <= 250 && y >= 200 && y <= 400) {
                // Estrutura das cadeiras brancas
                const chairX = (x - 100) / 30; // 5 cadeiras na largura
                const chairY = (y - 200) / 40; // 5 cadeiras na altura
                
                if (chairX >= 0 && chairX < 5 && chairY >= 0 && chairY < 5) {
                    // Padrão de cadeira: branco com algumas áreas mais escuras (estrutura)
                    const pattern = Math.sin(chairX * 3) * Math.cos(chairY * 2);
                    
                    if (pattern > 0.2) {
                        image.bitmap.data[idx] = 240;     // R (branco)
                        image.bitmap.data[idx + 1] = 240; // G (branco)
                        image.bitmap.data[idx + 2] = 245; // B (branco levemente azulado)
                        image.bitmap.data[idx + 3] = 255; // A
                    } else {
                        // Estrutura da cadeira (mais escuro)
                        image.bitmap.data[idx] = 180;     // R
                        image.bitmap.data[idx + 1] = 180; // G
                        image.bitmap.data[idx + 2] = 185; // B
                        image.bitmap.data[idx + 3] = 255; // A
                    }
                }
            }
            
            // Pilha 2: Cadeiras brancas menores
            if (x >= 300 && x <= 420 && y >= 250 && y <= 380) {
                const chairX = (x - 300) / 24; // 5 cadeiras
                const chairY = (y - 250) / 26; // 5 cadeiras
                
                if (chairX >= 0 && chairX < 5 && chairY >= 0 && chairY < 5) {
                    image.bitmap.data[idx] = 235;     // R
                    image.bitmap.data[idx + 1] = 235; // G
                    image.bitmap.data[idx + 2] = 240; // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
            
            // Estrutura metálica escura (tipo andaime/suporte)
            if (x >= 500 && x <= 700 && y >= 150 && y <= 450) {
                // Estrutura metálica vertical
                if ((x - 500) % 40 < 5 || (x - 500) % 40 > 35) {
                    // Colunas verticais
                    image.bitmap.data[idx] = 60;      // R
                    image.bitmap.data[idx + 1] = 60;  // G
                    image.bitmap.data[idx + 2] = 70;  // B
                    image.bitmap.data[idx + 3] = 255; // A
                } else if ((y - 150) % 60 < 3 || (y - 150) % 60 > 57) {
                    // Barras horizontais
                    image.bitmap.data[idx] = 70;      // R
                    image.bitmap.data[idx + 1] = 70;  // G
                    image.bitmap.data[idx + 2] = 80;  // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
            
            // Cadeira individual solta
            if (x >= 150 && x <= 210 && y >= 450 && y <= 520) {
                const chairX = (x - 150) / 12;
                const chairY = (y - 450) / 14;
                
                if (chairX >= 0 && chairX < 5 && chairY >= 0 && chairY < 5) {
                    image.bitmap.data[idx] = 230;     // R
                    image.bitmap.data[idx + 1] = 230; // G
                    image.bitmap.data[idx + 2] = 235; // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
            
            // Estrutura metálica pequena
            if (x >= 550 && x <= 620 && y >= 480 && y <= 550) {
                if ((x - 550) % 14 < 2 || (x - 550) % 14 > 12) {
                    image.bitmap.data[idx] = 80;      // R
                    image.bitmap.data[idx + 1] = 80;  // G
                    image.bitmap.data[idx + 2] = 90;  // B
                    image.bitmap.data[idx + 3] = 255; // A
                }
            }
        });
        
        // Adicionar sombras e texturas para realismo
        for (let i = 0; i < 2000; i++) {
            const x = Math.floor(Math.random() * image.bitmap.width);
            const y = Math.floor(Math.random() * image.bitmap.height);
            const idx = (y * image.bitmap.width + x) * 4;
            
            // Verificar se está em uma área de objeto
            const brightness = (image.bitmap.data[idx] + image.bitmap.data[idx + 1] + image.bitmap.data[idx + 2]) / 3;
            
            if (brightness > 150) { // Área clara (cadeiras)
                const noise = Math.random() * 10 - 5;
                image.bitmap.data[idx] = Math.max(220, Math.min(255, image.bitmap.data[idx] + noise));
                image.bitmap.data[idx + 1] = Math.max(220, Math.min(255, image.bitmap.data[idx + 1] + noise));
                image.bitmap.data[idx + 2] = Math.max(225, Math.min(255, image.bitmap.data[idx + 2] + noise));
            }
        }
        
        await image.writeAsync('test-white-chairs-real.jpg');
        console.log('Imagem realista de cadeiras brancas criada: test-white-chairs-real.jpg');
        
    } catch (error) {
        console.error('Erro ao criar imagem de teste:', error);
    }
}

createWhiteChairsTestImage();
