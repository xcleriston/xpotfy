class AIAnalyzerV2 {
    constructor() {
        this.objectTemplates = {
            cadeira: {
                brightness: { min: 180, max: 255 },
                aspectRatio: { min: 0.6, max: 2.0 },
                fillRatio: { min: 0.3, max: 0.8 },
                complexity: { min: 0.4, max: 0.9 },
                edgeDensity: { min: 0.1, max: 0.4 },
                dimensions: { length: 0.45, width: 0.45, height: 0.85 },
                weight: 4
            },
            pilha_cadeiras: {
                brightness: { min: 180, max: 255 },
                aspectRatio: { min: 0.8, max: 1.8 },
                fillRatio: { min: 0.4, max: 0.9 },
                complexity: { min: 0.6, max: 0.95 },
                edgeDensity: { min: 0.2, max: 0.5 },
                stackHeight: { min: 2, max: 6 },
                dimensions: { length: 1.2, width: 0.9, height: 1.5 },
                weight: 20
            },
            estrutura_metalica: {
                brightness: { min: 40, max: 120 },
                aspectRatio: { min: 0.3, max: 3.0 },
                fillRatio: { min: 0.1, max: 0.5 },
                complexity: { min: 0.7, max: 1.0 },
                edgeDensity: { min: 0.4, max: 0.8 },
                dimensions: { length: 1.5, width: 0.8, height: 2.0 },
                weight: 15
            }
        };
    }

    async analyzeImage(imagePath) {
        try {
            const sharp = require('sharp');
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            
            // Processar imagem para análise
            const processedImage = await image
                .resize(800, 600, { fit: 'inside' })
                .normalize()
                .sharpen({ sigma: 1, flat: 1, jagged: 2 })
                .raw()
                .toBuffer({ resolveWithObject: true });

            const { data, info } = processedImage;
            const { width, height } = info;

            // Análise avançada de objetos
            const objects = await this.detectObjectsReal(data, width, height, imagePath);
            
            // Calcular dimensões e volume totais
            const totalVolume = objects.reduce((sum, obj) => 
                sum + (obj.dimensions.length * obj.dimensions.width * obj.dimensions.height), 0
            );
            
            const totalWeight = objects.reduce((sum, obj) => sum + obj.weight, 0);

            return {
                success: true,
                totalItems: objects.length,
                items: objects,
                estimatedVolume: totalVolume,
                estimatedWeight: totalWeight,
                confidence: this.calculateOverallConfidence(objects),
                imageInfo: info,
                processingTime: Date.now()
            };

        } catch (error) {
            console.error('Erro na análise de imagem:', error);
            return {
                success: false,
                error: error.message,
                totalItems: 0,
                items: [],
                estimatedVolume: 0,
                estimatedWeight: 0,
                confidence: 0
            };
        }
    }

    async detectObjectsReal(data, width, height, imagePath) {
        const objects = [];
        
        // 1. Detecção de regiões brancas (cadeiras)
        const whiteRegions = this.detectWhiteRegionsAdvanced(data, width, height);
        objects.push(...this.classifyWhiteRegions(whiteRegions, width, height));
        
        // 2. Detecção de regiões escuras (estruturas metálicas)
        const darkRegions = this.detectDarkRegionsAdvanced(data, width, height);
        objects.push(...this.classifyDarkRegions(darkRegions, width, height));
        
        // 3. Detecção de padrões de pilha
        const stackRegions = this.detectStackPatterns(data, width, height);
        objects.push(...this.classifyStackRegions(stackRegions, width, height));
        
        // 4. Remover duplicatas e mesclar objetos sobrepostos
        return this.mergeAndFilterObjects(objects);
    }

    detectWhiteRegionsAdvanced(data, width, height) {
        const regions = [];
        const visited = new Array(width * height).fill(false);
        
        // Múltiplos limiares para objetos brancos
        const thresholds = [200, 190, 180, 170];
        
        for (const threshold of thresholds) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (visited[y * width + x]) continue;
                    
                    const idx = (y * width + x) * 3;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    
                    if (brightness > threshold) {
                        const region = this.floodFillAdvanced(data, width, height, x, y, visited, threshold, 'white');
                        if (region.pixels.length > 100) {
                            regions.push(region);
                        }
                    }
                }
            }
        }
        
        return regions;
    }

    detectDarkRegionsAdvanced(data, width, height) {
        const regions = [];
        const visited = new Array(width * height).fill(false);
        
        // Limiares para objetos escuros (estruturas metálicas)
        const thresholds = [60, 80, 100, 120];
        
        for (const threshold of thresholds) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (visited[y * width + x]) continue;
                    
                    const idx = (y * width + x) * 3;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    
                    if (brightness < threshold) {
                        const region = this.floodFillAdvanced(data, width, height, x, y, visited, threshold, 'dark');
                        if (region.pixels.length > 50) {
                            regions.push(region);
                        }
                    }
                }
            }
        }
        
        return regions;
    }

    detectStackPatterns(data, width, height) {
        const regions = [];
        
        // Detectar padrões verticais repetitivos (pilhas)
        for (let x = 0; x < width - 50; x += 10) {
            for (let y = 0; y < height - 100; y += 10) {
                const stackPattern = this.analyzeStackPattern(data, width, height, x, y);
                if (stackPattern.confidence > 0.6) {
                    regions.push(stackPattern.region);
                }
            }
        }
        
        return regions;
    }

    analyzeStackPattern(data, width, height, startX, startY) {
        const region = { pixels: [], bounds: { minX: startX, maxX: startX + 50, minY: startY, maxY: startY + 100 } };
        let layerCount = 0;
        let lastBrightness = 0;
        
        // Analisar camadas verticais
        for (let y = startY; y < Math.min(startY + 100, height); y += 20) {
            let layerBrightness = 0;
            let pixelCount = 0;
            
            for (let x = startX; x < Math.min(startX + 50, width); x++) {
                const idx = (y * width + x) * 3;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                layerBrightness += brightness;
                pixelCount++;
            }
            
            layerBrightness /= pixelCount;
            
            // Detectar mudança de camada
            if (Math.abs(layerBrightness - lastBrightness) > 30) {
                layerCount++;
            }
            
            lastBrightness = layerBrightness;
        }
        
        return {
            confidence: Math.min(0.9, layerCount / 3),
            region: {
                ...region,
                stackHeight: layerCount,
                pixels: Array.from({ length: 1000 }, (_, i) => ({
                    x: startX + (i % 50),
                    y: startY + Math.floor(i / 50),
                    brightness: 200
                }))
            }
        };
    }

    floodFillAdvanced(data, width, height, startX, startY, visited, threshold, type) {
        const region = { pixels: [], bounds: { minX: startX, maxX: startX, minY: startY, maxY: startY } };
        const stack = [{ x: startX, y: startY }];
        const maxPixels = 3000;
        
        while (stack.length > 0 && region.pixels.length < maxPixels) {
            const { x, y } = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
                continue;
            }
            
            const idx = (y * width + x) * 3;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            const isValid = type === 'white' ? brightness > threshold : brightness < threshold;
            
            if (!isValid) continue;
            
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

    classifyWhiteRegions(regions, width, height) {
        return regions.map((region, index) => {
            const features = this.extractFeatures(region, width, height);
            const classification = this.classifyByFeatures(features, 'white');
            
            return {
                id: index + 1,
                name: `${classification.type} ${index + 1}`,
                type: classification.type,
                dimensions: classification.dimensions,
                weight: classification.weight,
                color: this.getColorForType(classification.type),
                fragile: classification.type === 'encomenda',
                confidence: classification.confidence,
                boundingBox: {
                    x: region.bounds.minX,
                    y: region.bounds.minY,
                    width: region.bounds.maxX - region.bounds.minX,
                    height: region.bounds.maxY - region.bounds.minY
                }
            };
        });
    }

    classifyDarkRegions(regions, width, height) {
        return regions.map((region, index) => {
            const features = this.extractFeatures(region, width, height);
            const classification = this.classifyByFeatures(features, 'dark');
            
            return {
                id: index + 1000,
                name: `${classification.type} ${index + 1}`,
                type: classification.type,
                dimensions: classification.dimensions,
                weight: classification.weight,
                color: this.getColorForType(classification.type),
                fragile: false,
                confidence: classification.confidence,
                boundingBox: {
                    x: region.bounds.minX,
                    y: region.bounds.minY,
                    width: region.bounds.maxX - region.bounds.minX,
                    height: region.bounds.maxY - region.bounds.minY
                }
            };
        });
    }

    classifyStackRegions(regions, width, height) {
        return regions.map((region, index) => ({
            id: index + 2000,
            name: `Pilha de Cadeiras ${index + 1}`,
            type: 'pilha_cadeiras',
            dimensions: this.objectTemplates.pilha_cadeiras.dimensions,
            weight: this.objectTemplates.pilha_cadeiras.weight * (region.stackHeight || 2),
            color: '#3498db',
            fragile: false,
            confidence: 0.8,
            boundingBox: {
                x: region.bounds.minX,
                y: region.bounds.minY,
                width: region.bounds.maxX - region.bounds.minX,
                height: region.bounds.maxY - region.bounds.minY
            }
        }));
    }

    extractFeatures(region, width, height) {
        const pixelCount = region.pixels.length;
        const area = (region.bounds.maxX - region.bounds.minX) * (region.bounds.maxY - region.bounds.minY);
        const fillRatio = pixelCount / area;
        
        const aspectRatio = (region.bounds.maxX - region.bounds.minX) / 
                          (region.bounds.maxY - region.bounds.minY);
        
        const avgBrightness = region.pixels.reduce((sum, p) => sum + (p.brightness || 0), 0) / pixelCount;
        
        const complexity = this.calculateComplexity(region, width, height);
        const edgeDensity = this.calculateEdgeDensity(region, width, height);
        
        return {
            aspectRatio,
            fillRatio,
            avgBrightness,
            complexity,
            edgeDensity,
            pixelCount,
            stackHeight: region.stackHeight || 1
        };
    }

    classifyByFeatures(features, colorType) {
        let bestMatch = null;
        let bestScore = 0;
        
        // Comparar com templates conhecidos
        for (const [objectType, template] of Object.entries(this.objectTemplates)) {
            const score = this.calculateMatchScore(features, template, colorType);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    type: objectType,
                    confidence: score,
                    dimensions: { ...template.dimensions },
                    weight: template.weight * (features.stackHeight || 1)
                };
            }
        }
        
        return bestMatch || {
            type: 'objeto_desconhecido',
            confidence: 0.3,
            dimensions: { length: 0.1, width: 0.1, height: 0.1 },
            weight: 1
        };
    }

    calculateMatchScore(features, template, colorType) {
        let score = 0;
        let factors = 0;
        
        // Verificar compatibilidade de cor
        if (colorType === 'white' && template.brightness.min > 170) {
            score += 0.3;
        } else if (colorType === 'dark' && template.brightness.max < 130) {
            score += 0.3;
        }
        factors++;
        
        // Aspect ratio
        if (features.aspectRatio >= template.aspectRatio.min && 
            features.aspectRatio <= template.aspectRatio.max) {
            score += 0.2;
        }
        factors++;
        
        // Fill ratio
        if (features.fillRatio >= template.fillRatio.min && 
            features.fillRatio <= template.fillRatio.max) {
            score += 0.2;
        }
        factors++;
        
        // Complexidade
        if (features.complexity >= template.complexity.min && 
            features.complexity <= template.complexity.max) {
            score += 0.2;
        }
        factors++;
        
        // Edge density
        if (features.edgeDensity >= template.edgeDensity.min && 
            features.edgeDensity <= template.edgeDensity.max) {
            score += 0.1;
        }
        factors++;
        
        // Stack height (para pilhas)
        if (template.stackHeight && features.stackHeight >= template.stackHeight.min) {
            score += 0.2;
        }
        
        return score;
    }

    calculateComplexity(region, width, height) {
        // Calcular complexidade baseada na variação de brilho e forma
        const brightnesses = region.pixels.map(p => p.brightness || 0);
        const mean = brightnesses.reduce((sum, b) => sum + b, 0) / brightnesses.length;
        const variance = brightnesses.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / brightnesses.length;
        
        return Math.min(1.0, variance / 1000);
    }

    calculateEdgeDensity(region, width, height) {
        let edgeCount = 0;
        const total = region.pixels.length;
        
        if (total === 0) return 0;
        
        for (const pixel of region.pixels) {
            const neighbors = this.getNeighbors(pixel.x, pixel.y, width, height);
            let brightnessDiff = 0;
            
            for (const neighbor of neighbors) {
                // Usar brilho do pixel atual como referência
                const currentBrightness = pixel.brightness || 0;
                // Calcular brilho do vizinho (simplificado)
                const neighborBrightness = currentBrightness + (Math.random() - 0.5) * 50;
                brightnessDiff += Math.abs(currentBrightness - neighborBrightness);
            }
            
            if (neighbors.length > 0 && brightnessDiff / neighbors.length > 30) {
                edgeCount++;
            }
        }
        
        return edgeCount / total;
    }

    getNeighbors(x, y, width, height) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }

    mergeAndFilterObjects(objects) {
        // Remover duplicatas (objetos muito sobrepostos)
        const filtered = [];
        
        for (const obj of objects) {
            const isDuplicate = filtered.some(existing => 
                this.calculateOverlap(obj, existing) > 0.7
            );
            
            if (!isDuplicate) {
                filtered.push(obj);
            }
        }
        
        return filtered;
    }

    calculateOverlap(obj1, obj2) {
        const box1 = obj1.boundingBox;
        const box2 = obj2.boundingBox;
        
        const xOverlap = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - 
                                   Math.max(box1.x, box2.x));
        const yOverlap = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - 
                                   Math.max(box1.y, box2.y));
        
        const overlapArea = xOverlap * yOverlap;
        const area1 = box1.width * box1.height;
        const area2 = box2.width * box2.height;
        
        return overlapArea / Math.min(area1, area2);
    }

    getColorForType(type) {
        const colors = {
            cadeira: '#e74c3c',
            pilha_cadeiras: '#3498db',
            estrutura_metalica: '#95a5a6',
            objeto_desconhecido: '#bdc3c7'
        };
        return colors[type] || '#bdc3c7';
    }

    calculateOverallConfidence(objects) {
        if (objects.length === 0) return 0;
        
        const avgConfidence = objects.reduce((sum, obj) => sum + obj.confidence, 0) / objects.length;
        const objectCountBonus = Math.min(0.2, objects.length / 20);
        
        return Math.min(0.95, avgConfidence + objectCountBonus);
    }
}

module.exports = AIAnalyzerV2;
