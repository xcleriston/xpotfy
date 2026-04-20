const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const AIAnalyzer = require('./ai-analyzer-v2');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar analisador de IA V2
const analyzer = new AIAnalyzer();

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Dados em memória para veículos e cargas
let vehicles = [
  {
    id: 1,
    name: "Caminhão Pequeno",
    type: "truck",
    dimensions: { length: 4, width: 2, height: 2.5 },
    capacity: 3000
  },
  {
    id: 2,
    name: "Van Média",
    type: "van",
    dimensions: { length: 3, width: 1.8, height: 2 },
    capacity: 1500
  },
  {
    id: 3,
    name: "Caminhão Grande",
    type: "truck",
    dimensions: { length: 8, width: 2.5, height: 3 },
    capacity: 8000
  }
];

let cargos = [];

// Rotas
app.get('/api/vehicles', (req, res) => {
  res.json(vehicles);
});

app.post('/api/vehicles', (req, res) => {
  const newVehicle = {
    id: vehicles.length + 1,
    ...req.body
  };
  vehicles.push(newVehicle);
  res.json(newVehicle);
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    console.log('Iniciando análise com IA...');
    
    // Usar IA V2 para análise real
    const aiAnalysis = await analyzer.analyzeImage(req.file.path);
    
    console.log('Análise concluída:', {
      success: aiAnalysis.success,
      itemsDetected: aiAnalysis.totalItems,
      confidence: aiAnalysis.confidence,
      tipos: aiAnalysis.items ? aiAnalysis.items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}) : {}
    });
    
    const cargo = {
      id: cargos.length + 1,
      name: req.body.name || `Carga ${cargos.length + 1}`,
      imagePath: req.file.path,
      dimensions: calculateOverallDimensions(aiAnalysis.items),
      estimatedWeight: aiAnalysis.items.reduce((sum, item) => sum + item.weight, 0),
      items: aiAnalysis.totalItems,
      individualItems: aiAnalysis.items,
      aiAnalysis: {
        success: aiAnalysis.success,
        confidence: aiAnalysis.confidence,
        fallback: aiAnalysis.fallback || false,
        imageInfo: aiAnalysis.imageInfo
      },
      uploadDate: new Date()
    };
    
    cargos.push(cargo);
    res.json(cargo);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar imagem' });
  }
});

app.post('/api/optimize', (req, res) => {
  const { cargoId, vehicleId } = req.body;
  
  const cargo = cargos.find(c => c.id === cargoId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  if (!cargo || !vehicle) {
    return res.status(404).json({ error: 'Carga ou veículo não encontrado' });
  }
  
  const optimization = optimizeCargo(cargo, vehicle);
  res.json(optimization);
});

app.get('/api/cargos', (req, res) => {
  res.json(cargos);
});

function calculateOverallDimensions(items) {
  if (items.length === 0) {
    return { length: 0, width: 0, height: 0 };
  }
  
  // Calcular dimensões aproximadas baseadas nos itens detectados
  const totalVolume = items.reduce((sum, item) => 
    sum + (item.dimensions.length * item.dimensions.width * item.dimensions.height), 0
  );
  
  // Se volume for muito pequeno, usar dimensões mínimas realistas
  if (totalVolume < 0.001) {
    // Para cadeiras e estruturas reais
    const avgItemVolume = totalVolume / items.length;
    const estimatedItemSize = Math.cbrt(avgItemVolume) * 2; // Multiplicar para compensar
    
    // Calcular baseado no número de itens
    const itemsPerRow = Math.ceil(Math.sqrt(items.length));
    const itemsPerCol = Math.ceil(items.length / itemsPerRow);
    
    return {
      length: estimatedItemSize * itemsPerRow,
      width: estimatedItemSize * itemsPerCol, 
      height: estimatedItemSize * 1.5 // Altura média
    };
  }
  
  // Estimar dimensões do container baseado no volume total
  const cubeRoot = Math.cbrt(totalVolume);
  const packingEfficiency = 0.7; // Eficiência média de empacotamento
  
  return {
    length: cubeRoot * 1.2 / Math.sqrt(packingEfficiency),
    width: cubeRoot / Math.sqrt(packingEfficiency),
    height: cubeRoot * 0.8 / Math.sqrt(packingEfficiency)
  };
}

// Função de análise de carga (legado - mantida para compatibilidade)
function analyzeCargo(imageInfo, formData) {
  // Simulação - em um app real usaria computer vision
  const baseSize = Math.max(imageInfo.width, imageInfo.height) / 100;
  
  // Gerar múltiplos itens para simulação mais realista
  const numberOfItems = Math.floor(Math.random() * 15 + 3);
  const items = [];
  
  for (let i = 0; i < numberOfItems; i++) {
    const itemTypes = ['caixa', 'cilindro', 'saco', 'pallet', 'encomenda'];
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    items.push({
      id: i + 1,
      name: `${type} ${i + 1}`,
      type: type,
      dimensions: {
        length: (Math.random() * 1.5 + 0.3) * baseSize,
        width: (Math.random() * 1.5 + 0.3) * baseSize,
        height: (Math.random() * 1 + 0.2) * baseSize
      },
      weight: Math.floor(Math.random() * 50 + 5),
      color: getRandomColor(),
      fragile: Math.random() > 0.7
    });
  }
  
  return {
    dimensions: {
      length: Math.max(...items.map(i => i.dimensions.length)),
      width: Math.max(...items.map(i => i.dimensions.width)),
      height: Math.max(...items.map(i => i.dimensions.height))
    },
    weight: items.reduce((sum, item) => sum + item.weight, 0),
    items: numberOfItems,
    individualItems: items
  };
}

function getRandomColor() {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Função de otimização de carga
function optimizeCargo(cargo, vehicle) {
  const cargoVolume = cargo.dimensions.length * cargo.dimensions.width * cargo.dimensions.height;
  const vehicleVolume = vehicle.dimensions.length * vehicle.dimensions.width * vehicle.dimensions.height;
  
  const volumeUtilization = (cargoVolume / vehicleVolume) * 100;
  const weightUtilization = (cargo.estimatedWeight / vehicle.capacity) * 100;
  
  // Verificar se a carga total cabe
  const totalFits = cargo.dimensions.length <= vehicle.dimensions.length &&
                   cargo.dimensions.width <= vehicle.dimensions.width &&
                   cargo.dimensions.height <= vehicle.dimensions.height &&
                   cargo.estimatedWeight <= vehicle.capacity;
  
  let arrangement = null;
  let suggestions = [];
  let packingResult = null;
  
  if (totalFits && cargo.individualItems) {
    // Tentar empacotar os itens individuais
    packingResult = packItems3D(cargo.individualItems, vehicle.dimensions);
    
    if (packingResult.success) {
      arrangement = {
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        utilization: {
          volume: volumeUtilization.toFixed(2),
          weight: weightUtilization.toFixed(2)
        },
        packedItems: packingResult.packedItems,
        packingEfficiency: packingResult.efficiency
      };
    } else {
      suggestions = packingResult.suggestions;
    }
  } else if (!totalFits) {
    suggestions = generateSuggestions(cargo, vehicle);
  }
  
  return {
    fits: totalFits && (packingResult ? packingResult.success : true),
    arrangement,
    suggestions,
    utilization: {
      volume: volumeUtilization.toFixed(2),
      weight: weightUtilization.toFixed(2)
    },
    packingResult
  };
}

function generateSuggestions(cargo, vehicle) {
  const suggestions = [];
  
  if (cargo.dimensions.length > vehicle.dimensions.length) {
    suggestions.push("Reduza o comprimento da carga ou use um veículo maior");
  }
  if (cargo.dimensions.width > vehicle.dimensions.width) {
    suggestions.push("Reduza a largura da carga ou organize em múltiplas camadas");
  }
  if (cargo.dimensions.height > vehicle.dimensions.height) {
    suggestions.push("Reduza a altura da carga ou transporte em partes");
  }
  if (cargo.estimatedWeight > vehicle.capacity) {
    suggestions.push("Reduza o peso da carga ou use um veículo com maior capacidade");
  }
  
  // Sugerir veículos alternativos
  const suitableVehicles = vehicles.filter(v => 
    cargo.dimensions.length <= v.dimensions.length &&
    cargo.dimensions.width <= v.dimensions.width &&
    cargo.dimensions.height <= v.dimensions.height &&
    cargo.estimatedWeight <= v.capacity &&
    v.id !== vehicle.id
  );
  
  if (suitableVehicles.length > 0) {
    suggestions.push(`Veículos alternativos disponíveis: ${suitableVehicles.map(v => v.name).join(', ')}`);
  } else {
    suggestions.push("Nenhum veículo disponível acomoda esta carga. Considere dividir a carga.");
  }
  
  return suggestions;
}

// Algoritmo de empacotamento 3D
function packItems3D(items, containerDimensions) {
  const container = {
    length: containerDimensions.length,
    width: containerDimensions.width,
    height: containerDimensions.height
  };
  
  // Ordenar itens por volume (maior primeiro)
  const sortedItems = items.sort((a, b) => {
    const volumeA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
    const volumeB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
    return volumeB - volumeA;
  });
  
  const packedItems = [];
  const occupiedSpaces = [];
  
  for (const item of sortedItems) {
    let bestPosition = null;
    let bestHeight = Infinity;
    
    // Tentar encontrar a melhor posição
    for (let x = 0; x <= container.length - item.dimensions.length; x += 0.1) {
      for (let y = 0; y <= container.width - item.dimensions.width; y += 0.1) {
        for (let z = 0; z <= container.height - item.dimensions.height; z += 0.1) {
          // Verificar se a posição está livre
          if (isPositionFree(x, y, z, item.dimensions, occupiedSpaces)) {
            if (z < bestHeight) {
              bestHeight = z;
              bestPosition = { x, y, z };
            }
          }
        }
      }
    }
    
    if (bestPosition) {
      packedItems.push({
        ...item,
        position: bestPosition,
        rotation: 0
      });
      
      occupiedSpaces.push({
        position: bestPosition,
        dimensions: item.dimensions
      });
    } else {
      // Item não coube
      return {
        success: false,
        suggestions: [
          `Item ${item.name} não coube no espaço disponível`,
          'Tente reorganizar os itens manualmente',
          'Considere usar um veículo maior'
        ],
        packedItems,
        unpackedItems: [item]
      };
    }
  }
  
  // Calcular eficiência
  const totalItemVolume = items.reduce((sum, item) => 
    sum + (item.dimensions.length * item.dimensions.width * item.dimensions.height), 0
  );
  const containerVolume = container.length * container.width * container.height;
  const efficiency = (totalItemVolume / containerVolume) * 100;
  
  return {
    success: true,
    packedItems,
    efficiency: efficiency.toFixed(2),
    totalItems: items.length,
    containerUtilization: {
      volume: efficiency.toFixed(2),
      itemsPacked: packedItems.length
    }
  };
}

function isPositionFree(x, y, z, dimensions, occupiedSpaces) {
  for (const space of occupiedSpaces) {
    if (x < space.position.x + space.dimensions.length &&
        x + dimensions.length > space.position.x &&
        y < space.position.y + space.dimensions.width &&
        y + dimensions.width > space.position.y &&
        z < space.position.z + space.dimensions.height &&
        z + dimensions.height > space.position.z) {
      return false;
    }
  }
  return true;
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
