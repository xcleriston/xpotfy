const sharp = require('sharp');
const Jimp = require('jimp');

class AIAnalyzer {
    constructor() {
        this.objectTypes = {
            'caixa': { color: '#e74c3c', density: 50, fragile: false },
            'cilindro': { color: '#3498db', density: 40, fragile: false },
            'saco': { color: '#f39c12', density: 20, fragile: false },
            'pallet': { color: '#2ecc71', density: 30, fragile: false },
            'encomenda': { color: '#9b59b6', density: 25, fragile: true },
            'garrafa': { color: '#1abc9c', density: 35, fragile: true },
            'caixa_frgil': { color: '#e67e22', density: 15, fragile: true },
            // Novos tipos para cadeiras e estruturas
            'cadeira': { color: '#8e44ad', density: 45, fragile: false },
            'pilha_cadeiras': { color: '#9b59b6', density: 40, fragile: false },
            'pilha_cadeiras_vertical': { color: '#8e44ad', density: 42, fragile: false },
            'estrutura_q30': { color: '#34495e', density: 60, fragile: false },
            'estrutura_metalica': { color: '#7f8c8d', density: 55, fragile: false }
        };
    }

    async analyzeImage(imagePath) {
        try {
            // Processar imagem com Sharp
            const imageInfo = await sharp(imagePath).metadata();
            const processedImage = await sharp(imagePath)
                .resize(800, 600, { fit: 'inside' })
                .normalize()
                .sharpen()
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Detectar objetos usando algoritmos de computer vision
            const detectedObjects = await this.detectObjects(processedImage, imageInfo);
            
            // Calcular dimensões estimadas
            const itemsWithDimensions = await this.calculateDimensions(detectedObjects, imageInfo);
            
            // Estimar volume total
            const totalVolume = this.calculateTotalVolume(itemsWithDimensions);
            
            return {
                success: true,
                items: itemsWithDimensions,
                totalItems: itemsWithDimensions.length,
                estimatedVolume: totalVolume,
                confidence: this.calculateConfidence(itemsWithDimensions),
                imageInfo: {
                    width: imageInfo.width,
                    height: imageInfo.height,
                    format: imageInfo.format
                }
            };
        } catch (error) {
            console.error('Erro na análise de IA:', error);
            return this.getFallbackAnalysis(imagePath);
        }
    }

    async detectObjects(imageData, imageInfo) {
        const objects = [];
        const { data, info } = imageData;
        const width = info.width;
        const height = info.height;

        // Algoritmo simplificado de detecção de contornos
        const regions = this.findRegions(data, width, height);
        
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            
            // Classificar o objeto baseado nas características
            const objectType = this.classifyObject(region, data, width, height);
            
            // Calcular bounding box
            const bbox = this.calculateBoundingBox(region, width, height, imageInfo);
            
            objects.push({
                id: i + 1,
                type: objectType,
                region: region,
                boundingBox: bbox,
                confidence: this.calculateObjectConfidence(region, data, width, height)
            });
        }

        return objects;
    }

    findRegions(data, width, height) {
        const regions = [];
        const visited = new Array(width * height).fill(false);
        
        // Limitar o número de regiões para evitar stack overflow
        let regionCount = 0;
        const maxRegions = 50;
        
        // Múltiplos limiares para detectar diferentes tipos de objetos
        const thresholds = [60, 100, 140, 180];
        
        for (const threshold of thresholds) {
            if (regionCount >= maxRegions) break;
            
            for (let y = 0; y < height && regionCount < maxRegions; y++) {
                for (let x = 0; x < width && regionCount < maxRegions; x++) {
                    const idx = (y * width + x) * 3;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    
                    if (!visited[y * width + x] && brightness < threshold) {
                        const region = this.floodFill(data, width, height, x, y, visited, threshold, 1000);
                        if (region.pixels.length > 30) {
                            regions.push(region);
                            regionCount++;
                        }
                    }
                }
            }
        }
        
        // Detectar regiões muito brancas (cadeiras plásticas)
        if (regionCount < maxRegions) {
            const whiteRegions = this.detectWhiteRegions(data, width, height, visited, maxRegions - regionCount);
            regions.push(...whiteRegions);
        }
        
        // Mesclar regiões sobrepostas
        return this.mergeOverlappingRegions(regions);
    }
    
    detectWhiteRegions(data, width, height, visited, maxRegions = 20) {
        const regions = [];
        const whiteThreshold = 190;
        
        for (let y = 0; y < height && regions.length < maxRegions; y++) {
            for (let x = 0; x < width && regions.length < maxRegions; x++) {
                const idx = (y * width + x) * 3;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                if (!visited[y * width + x] && brightness > whiteThreshold) {
                    const region = this.floodFillWhite(data, width, height, x, y, visited, whiteThreshold, 1000);
                    if (region.pixels.length > 40) {
                        regions.push(region);
                    }
                }
            }
        }
        
        return regions;
    }
    
    floodFillWhite(data, width, height, startX, startY, visited, threshold, maxPixels = 5000) {
        const region = { pixels: [], bounds: { minX: startX, maxX: startX, minY: startY, maxY: startY } };
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0 && region.pixels.length < maxPixels) {
            const { x, y } = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
                continue;
            }
            
            const idx = (y * width + x) * 3;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            if (brightness < threshold) {
                continue;
            }
            
            visited[y * width + x] = true;
            region.pixels.push({ x, y, brightness });
            
            region.bounds.minX = Math.min(region.bounds.minX, x);
            region.bounds.maxX = Math.max(region.bounds.maxX, x);
            region.bounds.minY = Math.min(region.bounds.minY, y);
            region.bounds.maxY = Math.max(region.bounds.maxY, y);
            
            // Adicionar vizinhos
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
        
        return region;
    }
    
    detectEdgesAndContours(data, width, height, visited) {
        const regions = [];
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (visited[y * width + x]) continue;
                
                // Calcular gradiente usando Sobel
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 3;
                        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += brightness * sobelX[kernelIdx];
                        gy += brightness * sobelY[kernelIdx];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                
                // Se for uma borda forte, iniciar detecção de contorno
                if (magnitude > 30) {
                    const contourRegion = this.traceContour(data, width, height, x, y, visited, magnitude);
                    if (contourRegion.pixels.length > 30) {
                        regions.push(contourRegion);
                    }
                }
            }
        }
        
        return regions;
    }
    
    traceContour(data, width, height, startX, startY, visited, initialMagnitude) {
        const region = { pixels: [], bounds: { minX: startX, maxX: startX, minY: startY, maxY: startY } };
        const stack = [{ x: startX, y: startY }];
        const edgeThreshold = 25;
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
                continue;
            }
            
            // Calcular magnitude do gradiente
            let gx = 0, gy = 0;
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
                const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 3;
                        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += brightness * sobelX[kernelIdx];
                        gy += brightness * sobelY[kernelIdx];
                    }
                }
            }
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            
            if (magnitude < edgeThreshold) {
                continue;
            }
            
            visited[y * width + x] = true;
            region.pixels.push({ x, y, brightness: magnitude, isEdge: true });
            
            region.bounds.minX = Math.min(region.bounds.minX, x);
            region.bounds.maxX = Math.max(region.bounds.maxX, x);
            region.bounds.minY = Math.min(region.bounds.minY, y);
            region.bounds.maxY = Math.max(region.bounds.maxY, y);
            
            // Adicionar vizinhos (8-conectividade para contornos)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    stack.push({ x: x + dx, y: y + dy });
                }
            }
        }
        
        return region;
    }
    
    mergeOverlappingRegions(regions) {
        const merged = [];
        const used = new Set();
        
        for (let i = 0; i < regions.length; i++) {
            if (used.has(i)) continue;
            
            let currentRegion = { ...regions[i] };
            used.add(i);
            
            // Tentar mesclar com regiões sobrepostas
            for (let j = i + 1; j < regions.length; j++) {
                if (used.has(j)) continue;
                
                if (this.regionsOverlap(currentRegion, regions[j])) {
                    currentRegion = this.mergeRegions(currentRegion, regions[j]);
                    used.add(j);
                }
            }
            
            merged.push(currentRegion);
        }
        
        return merged;
    }
    
    regionsOverlap(region1, region2) {
        return !(region1.bounds.maxX < region2.bounds.minX ||
                region1.bounds.minX > region2.bounds.maxX ||
                region1.bounds.maxY < region2.bounds.minY ||
                region1.bounds.minY > region2.bounds.maxY);
    }
    
    mergeRegions(region1, region2) {
        const merged = {
            pixels: [...region1.pixels, ...region2.pixels],
            bounds: {
                minX: Math.min(region1.bounds.minX, region2.bounds.minX),
                maxX: Math.max(region1.bounds.maxX, region2.bounds.maxX),
                minY: Math.min(region1.bounds.minY, region2.bounds.minY),
                maxY: Math.max(region1.bounds.maxY, region2.bounds.maxY)
            }
        };
        return merged;
    }

    floodFill(data, width, height, startX, startY, visited, threshold, maxPixels = 5000) {
        const region = { pixels: [], bounds: { minX: startX, maxX: startX, minY: startY, maxY: startY } };
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0 && region.pixels.length < maxPixels) {
            const { x, y } = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
                continue;
            }
            
            const idx = (y * width + x) * 3;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            if (brightness >= threshold) {
                continue;
            }
            
            visited[y * width + x] = true;
            region.pixels.push({ x, y, brightness });
            
            region.bounds.minX = Math.min(region.bounds.minX, x);
            region.bounds.maxX = Math.max(region.bounds.maxX, x);
            region.bounds.minY = Math.min(region.bounds.minY, y);
            region.bounds.maxY = Math.max(region.bounds.maxY, y);
            
            // Adicionar vizinhos
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
        
        return region;
    }

    classifyObject(region, data, width, height) {
        const aspectRatio = (region.bounds.maxX - region.bounds.minX) / (region.bounds.maxY - region.bounds.minY);
        const pixelCount = region.pixels.length;
        const area = (region.bounds.maxX - region.bounds.minX) * (region.bounds.maxY - region.bounds.minY);
        const fillRatio = pixelCount / area;
        
        // Detectar se é uma região de borda (contorno)
        const hasEdges = region.pixels.some(p => p.isEdge);
        const avgBrightness = region.pixels.reduce((sum, p) => sum + (p.brightness || 0), 0) / pixelCount;
        
        // Análise avançada para cadeiras e estruturas
        const complexity = this.analyzeShapeComplexity(region, width, height);
        const stackHeight = this.estimateStackHeight(region, data, width, height);
        
        // PRIORIDADE 1: Detecção de cadeiras brancas empilhadas (como na imagem do usuário)
        if (avgBrightness > 170 && fillRatio > 0.2 && fillRatio < 0.9) {
            // Objetos muito brancos com preenchimento médio (cadeiras plásticas)
            if (stackHeight > 1.0) {
                // Múltiplas camadas = pilha de cadeiras
                if (aspectRatio > 0.7 && aspectRatio < 1.8) {
                    return 'pilha_cadeiras';
                } else {
                    return 'pilha_cadeiras_vertical';
                }
            } else if (aspectRatio > 0.5 && aspectRatio < 2.0) {
                // Cadeira individual
                return 'cadeira';
            }
        }
        
        // PRIORIDADE 2: Estruturas metálicas escuras
        if (avgBrightness < 120 && complexity > 0.3 && hasEdges) {
            // Estruturas escuras e complexas
            if (aspectRatio > 0.4 && aspectRatio < 3.0) {
                return 'estrutura_metalica';
            }
        }
        
        // PRIORIDADE 3: Detecção baseada em padrões de pilha
        if (stackHeight > 1.5 && complexity > 0.4) {
            if (aspectRatio > 1.2) {
                return 'pilha_cadeiras';
            } else {
                return 'pilha_cadeiras_vertical';
            }
        }
        
        // PRIORIDADE 4: Estruturas complexas tipo Q30
        if (complexity > 0.7 && fillRatio < 0.6 && hasEdges) {
            return 'estrutura_q30';
        }
        
        // Classificação tradicional (fallback)
        if (aspectRatio > 0.8 && aspectRatio < 1.2) {
            if (avgBrightness < 80 || hasEdges) {
                return Math.random() > 0.3 ? 'caixa' : 'caixa_frgil';
            } else {
                return 'encomenda';
            }
        } else if (aspectRatio > 2) {
            return 'pallet';
        } else if (aspectRatio < 0.5) {
            return 'cilindro';
        } else if (hasEdges && complexity > 0.5) {
            return 'estrutura_metalica';
        } else {
            return Math.random() > 0.6 ? 'saco' : 'garrafa';
        }
    }
    
    analyzeShapeComplexity(region, width, height) {
        // Calcular complexidade da forma baseada na variância dos pixels
        const pixels = region.pixels;
        if (pixels.length === 0) return 0;
        
        // Calcular centróide
        const centerX = pixels.reduce((sum, p) => sum + p.x, 0) / pixels.length;
        const centerY = pixels.reduce((sum, p) => sum + p.y, 0) / pixels.length;
        
        // Calcular distâncias do centróide
        const distances = pixels.map(p => Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2));
        const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        
        // Calcular variância
        const variance = distances.reduce((sum, d) => sum + (d - avgDistance) ** 2, 0) / distances.length;
        
        // Normalizar para 0-1
        const maxPossibleVariance = (avgDistance ** 2);
        return Math.min(variance / maxPossibleVariance, 1);
    }
    
    estimateStackHeight(region, data, width, height) {
        // Estimar altura da pilha baseada na variação vertical
        const pixels = region.pixels;
        if (pixels.length === 0) return 1;
        
        // Analisar gradientes verticais para detectar camadas
        const yValues = pixels.map(p => p.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const regionHeight = maxY - minY;
        
        // Contar transições de brilho (indicam camadas)
        let transitions = 0;
        const sortedPixels = pixels.sort((a, b) => a.y - b.y);
        
        for (let i = 1; i < sortedPixels.length; i++) {
            const brightnessDiff = Math.abs((sortedPixels[i].brightness || 0) - (sortedPixels[i-1].brightness || 0));
            if (brightnessDiff > 20) {
                transitions++;
            }
        }
        
        // Estimar número de camadas
        const estimatedLayers = Math.max(1, Math.min(5, 1 + transitions / 10));
        
        return estimatedLayers;
    }

    calculateBoundingBox(region, width, height, imageInfo) {
        const scaleX = imageInfo.width / width;
        const scaleY = imageInfo.height / height;
        
        return {
            x: region.bounds.minX * scaleX,
            y: region.bounds.minY * scaleY,
            width: (region.bounds.maxX - region.bounds.minX) * scaleX,
            height: (region.bounds.maxY - region.bounds.minY) * scaleY
        };
    }

    calculateObjectConfidence(region, data, width, height) {
        const pixelCount = region.pixels.length;
        const area = (region.bounds.maxX - region.bounds.minX) * (region.bounds.maxY - region.bounds.minY);
        const fillRatio = pixelCount / area;
        
        // Confiança baseada na densidade de pixels e forma
        let confidence = Math.min(fillRatio * 2, 1) * 0.7;
        
        // Bônus para formas regulares
        const aspectRatio = (region.bounds.maxX - region.bounds.minX) / (region.bounds.maxY - region.bounds.minY);
        if (aspectRatio > 0.5 && aspectRatio < 2) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 0.95);
    }

    async calculateDimensions(detectedObjects, imageInfo) {
        const items = [];
        const referenceSize = 0.5; // 50cm como referência para objetos médios
        
        for (const obj of detectedObjects) {
            const pixelArea = (obj.boundingBox.width * obj.boundingBox.height);
            const imageArea = (imageInfo.width * imageInfo.height);
            const areaRatio = pixelArea / imageArea;
            
            // Estimar dimensões reais baseadas na área na imagem
            const estimatedVolume = Math.sqrt(areaRatio) * 1000; // cm³
            const objectInfo = this.objectTypes[obj.type] || this.objectTypes['caixa'];
            
            // Calcular dimensões baseadas no volume e tipo
            let dimensions = this.estimateDimensionsFromVolume(estimatedVolume, obj.type);
            
            // Ajustar baseado no bounding box
            const aspectRatio = obj.boundingBox.width / obj.boundingBox.height;
            if (aspectRatio > 1.5) {
                dimensions.length *= aspectRatio;
                dimensions.width /= Math.sqrt(aspectRatio);
            } else if (aspectRatio < 0.7) {
                dimensions.width *= (1 / aspectRatio);
                dimensions.length /= Math.sqrt(1 / aspectRatio);
            }
            
            const weight = Math.round(dimensions.length * dimensions.width * dimensions.height * objectInfo.density / 1000);
            
            items.push({
                id: obj.id,
                name: `${obj.type.replace('_', ' ')} ${obj.id}`,
                type: obj.type,
                dimensions: {
                    length: dimensions.length / 100, // Converter para metros
                    width: dimensions.width / 100,
                    height: dimensions.height / 100
                },
                weight: weight,
                color: objectInfo.color,
                fragile: objectInfo.fragile,
                confidence: obj.confidence,
                boundingBox: obj.boundingBox
            });
        }
        
        return items;
    }

    estimateDimensionsFromVolume(volume, type) {
        const typeMultipliers = {
            'caixa': { l: 1.2, w: 0.8, h: 0.6 },
            'cilindro': { l: 1, w: 1, h: 1.5 },
            'saco': { l: 1.5, w: 1, h: 0.4 },
            'pallet': { l: 2, w: 1.5, h: 0.3 },
            'encomenda': { l: 1, w: 0.8, h: 0.5 },
            'garrafa': { l: 0.3, w: 0.3, h: 2 },
            'caixa_frgil': { l: 1, w: 0.8, h: 0.8 },
            // Dimensões realistas para cadeiras e estruturas
            'cadeira': { l: 0.5, w: 0.5, h: 0.8 },
            'pilha_cadeiras': { l: 0.6, w: 0.6, h: 2.5 },
            'pilha_cadeiras_vertical': { l: 0.5, w: 0.5, h: 3.0 },
            'estrutura_q30': { l: 1.2, w: 0.8, h: 1.0 },
            'estrutura_metalica': { l: 1.5, w: 1.0, h: 1.2 }
        };
        
        const multiplier = typeMultipliers[type] || typeMultipliers['caixa'];
        const baseCube = Math.cbrt(volume);
        
        return {
            length: baseCube * multiplier.l,
            width: baseCube * multiplier.w,
            height: baseCube * multiplier.h
        };
    }

    calculateTotalVolume(items) {
        return items.reduce((total, item) => {
            const volume = item.dimensions.length * item.dimensions.width * item.dimensions.height;
            return total + volume;
        }, 0);
    }

    calculateConfidence(items) {
        if (items.length === 0) return 0;
        
        const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
        const objectCountBonus = Math.min(items.length / 10, 0.2); // Bônus por detectar múltiplos objetos
        
        return Math.min(avgConfidence + objectCountBonus, 0.95);
    }

    async getFallbackAnalysis(imagePath) {
        // Análise fallback caso a IA falhe
        const imageInfo = await sharp(imagePath).metadata();
        const baseSize = Math.max(imageInfo.width, imageInfo.height) / 100;
        
        const numberOfItems = Math.floor(Math.random() * 8 + 3);
        const items = [];
        
        for (let i = 0; i < numberOfItems; i++) {
            const types = Object.keys(this.objectTypes);
            const type = types[Math.floor(Math.random() * types.length)];
            const objectInfo = this.objectTypes[type];
            
            items.push({
                id: i + 1,
                name: `${type.replace('_', ' ')} ${i + 1}`,
                type: type,
                dimensions: {
                    length: (Math.random() * 1.5 + 0.3) * baseSize,
                    width: (Math.random() * 1.5 + 0.3) * baseSize,
                    height: (Math.random() * 1 + 0.2) * baseSize
                },
                weight: Math.floor(Math.random() * 50 + 5),
                color: objectInfo.color,
                fragile: objectInfo.fragile,
                confidence: 0.6 // Confiança mais baixa para fallback
            });
        }
        
        return {
            success: false,
            items: items,
            totalItems: items.length,
            estimatedVolume: this.calculateTotalVolume(items),
            confidence: 0.6,
            fallback: true,
            imageInfo: {
                width: imageInfo.width,
                height: imageInfo.height,
                format: imageInfo.format
            }
        };
    }
}

module.exports = AIAnalyzer;
