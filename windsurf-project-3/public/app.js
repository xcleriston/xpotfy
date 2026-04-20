class CargoOptimizer {
    constructor() {
        this.vehicles = [];
        this.cargos = [];
        this.selectedVehicle = null;
        this.currentCargo = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadVehicles();
    }
    
    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const optimizeBtn = document.getElementById('optimizeBtn');
        const saveVehicleBtn = document.getElementById('saveVehicleBtn');
        
        // Upload events
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Button events
        analyzeBtn.addEventListener('click', this.analyzeCargo.bind(this));
        optimizeBtn.addEventListener('click', this.optimizeCargo.bind(this));
        saveVehicleBtn.addEventListener('click', this.saveVehicle.bind(this));
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showAlert('Por favor, selecione uma imagem válida.', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showAlert('O arquivo deve ter menos de 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayImagePreview(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }
    
    displayImagePreview(imageSrc, file) {
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        previewImg.src = imageSrc;
        preview.style.display = 'block';
        analyzeBtn.disabled = false;
        
        // Store file for upload
        this.currentFile = file;
    }
    
    async analyzeCargo() {
        const cargoName = document.getElementById('cargoName').value || `Carga ${this.cargos.length + 1}`;
        const startTime = Date.now();
        
        // Mostrar seção de IA
        document.getElementById('aiResultsSection').style.display = 'block';
        this.updateAIStatus('processando');
        
        const formData = new FormData();
        formData.append('image', this.currentFile);
        formData.append('name', cargoName);
        
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Erro ao analisar carga');
            }
            
            const cargo = await response.json();
            this.currentCargo = cargo;
            this.cargos.push(cargo);
            
            const processingTime = Date.now() - startTime;
            this.displayAIResults(cargo, processingTime);
            
            this.showAlert('Carga analisada com sucesso!', 'success');
            this.checkOptimizationReady();
            
        } catch (error) {
            console.error('Erro:', error);
            this.showAlert('Erro ao analisar a carga. Tente novamente.', 'error');
            this.updateAIStatus('erro');
        } finally {
            this.showLoading(false);
        }
    }
    
    updateAIStatus(status) {
        const confidenceBar = document.getElementById('aiConfidenceBar');
        const itemsDetectedBadge = document.getElementById('itemsDetectedBadge');
        const estimatedVolume = document.getElementById('estimatedVolume');
        const analysisTypeBadge = document.getElementById('analysisTypeBadge');
        const imageResolution = document.getElementById('imageResolution');
        const processingTime = document.getElementById('processingTime');
        const aiWarnings = document.getElementById('aiWarnings');
        
        switch(status) {
            case 'processando':
                confidenceBar.style.width = '0%';
                confidenceBar.textContent = 'Processando...';
                confidenceBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
                itemsDetectedBadge.textContent = 'Analisando...';
                estimatedVolume.textContent = '-';
                analysisTypeBadge.textContent = 'Processando...';
                analysisTypeBadge.className = 'badge bg-secondary';
                imageResolution.textContent = '-';
                processingTime.textContent = '-';
                aiWarnings.style.display = 'none';
                break;
                
            case 'erro':
                confidenceBar.style.width = '0%';
                confidenceBar.textContent = 'Erro';
                confidenceBar.className = 'progress-bar bg-danger';
                itemsDetectedBadge.textContent = '0';
                analysisTypeBadge.textContent = 'Erro';
                analysisTypeBadge.className = 'badge bg-danger';
                break;
        }
    }
    
    displayAIResults(cargo, processingTime) {
        const confidenceBar = document.getElementById('aiConfidenceBar');
        const itemsDetectedBadge = document.getElementById('itemsDetectedBadge');
        const estimatedVolume = document.getElementById('estimatedVolume');
        const analysisTypeBadge = document.getElementById('analysisTypeBadge');
        const imageResolution = document.getElementById('imageResolution');
        const processingTimeEl = document.getElementById('processingTime');
        const aiWarnings = document.getElementById('aiWarnings');
        
        // Atualizar confiança
        const confidence = cargo.aiAnalysis ? cargo.aiAnalysis.confidence : 0.6;
        confidenceBar.style.width = `${confidence * 100}%`;
        confidenceBar.textContent = `${Math.round(confidence * 100)}%`;
        
        // Definir cor baseada na confiança
        if (confidence >= 0.8) {
            confidenceBar.className = 'progress-bar ai-confidence-high';
        } else if (confidence >= 0.6) {
            confidenceBar.className = 'progress-bar ai-confidence-medium';
        } else {
            confidenceBar.className = 'progress-bar ai-confidence-low';
        }
        
        // Atualizar outras informações
        itemsDetectedBadge.textContent = cargo.items || 0;
        estimatedVolume.textContent = `${cargo.estimatedVolume ? cargo.estimatedVolume.toFixed(3) : '0.000'} m³`;
        
        // Tipo de análise
        if (cargo.aiAnalysis) {
            if (cargo.aiAnalysis.success && !cargo.aiAnalysis.fallback) {
                analysisTypeBadge.textContent = 'IA Real';
                analysisTypeBadge.className = 'badge bg-success';
            } else if (cargo.aiAnalysis.fallback) {
                analysisTypeBadge.textContent = 'Simulação';
                analysisTypeBadge.className = 'badge bg-warning';
                aiWarnings.style.display = 'block';
                document.getElementById('aiWarningText').textContent = 
                    'A análise usou simulação devido a limitações na imagem. Para melhores resultados, use imagens com melhor contraste e objetos bem definidos.';
            } else {
                analysisTypeBadge.textContent = 'IA Parcial';
                analysisTypeBadge.className = 'badge bg-info';
            }
        } else {
            analysisTypeBadge.textContent = 'Legado';
            analysisTypeBadge.className = 'badge bg-secondary';
        }
        
        // Resolução da imagem
        if (cargo.aiAnalysis && cargo.aiAnalysis.imageInfo) {
            imageResolution.textContent = `${cargo.aiAnalysis.imageInfo.width} × ${cargo.aiAnalysis.imageInfo.height}px (${cargo.aiAnalysis.imageInfo.format})`;
        }
        
        // Tempo de processamento
        processingTimeEl.textContent = `${processingTime}ms`;
        
        // Mostrar tipos de objetos detectados
        if (cargo.individualItems && cargo.individualItems.length > 0) {
            this.displayObjectTypes(cargo.individualItems);
        }
    }
    
    displayObjectTypes(items) {
        const objectTypes = {};
        
        items.forEach(item => {
            if (!objectTypes[item.type]) {
                objectTypes[item.type] = { count: 0, color: item.color };
            }
            objectTypes[item.type].count++;
        });
        
        // Criar badges para cada tipo
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'mt-2';
        
        Object.entries(objectTypes).forEach(([type, info]) => {
            const badge = document.createElement('span');
            badge.className = 'object-type-badge';
            badge.style.backgroundColor = info.color;
            badge.style.color = 'white';
            badge.textContent = `${type.replace('_', ' ')} (${info.count})`;
            badgesContainer.appendChild(badge);
        });
        
        // Adicionar após o volume estimado
        const volumeElement = document.getElementById('estimatedVolume');
        volumeElement.parentNode.appendChild(badgesContainer);
    }
    
    async loadVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            this.vehicles = await response.json();
            this.renderVehicles();
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
        }
    }
    
    renderVehicles() {
        const vehicleList = document.getElementById('vehicleList');
        vehicleList.innerHTML = '';
        
        this.vehicles.forEach(vehicle => {
            const vehicleCard = this.createVehicleCard(vehicle);
            vehicleList.appendChild(vehicleCard);
        });
    }
    
    createVehicleCard(vehicle) {
        const col = document.createElement('div');
        col.className = 'col-12';
        
        const card = document.createElement('div');
        card.className = 'card vehicle-card';
        card.dataset.vehicleId = vehicle.id;
        
        const icon = this.getVehicleIcon(vehicle.type);
        
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title mb-1">
                            <i class="${icon}"></i> ${vehicle.name}
                        </h6>
                        <small class="text-muted">
                            ${vehicle.dimensions.length}m × ${vehicle.dimensions.width}m × ${vehicle.dimensions.height}m
                        </small>
                        <br>
                        <small class="text-primary">
                            Capacidade: ${vehicle.capacity}kg
                        </small>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="vehicle" value="${vehicle.id}">
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.selectVehicle(vehicle));
        
        col.appendChild(card);
        return col;
    }
    
    getVehicleIcon(type) {
        const icons = {
            truck: 'fas fa-truck',
            van: 'fas fa-shuttle-van',
            car: 'fas fa-car',
            motorcycle: 'fas fa-motorcycle'
        };
        return icons[type] || 'fas fa-truck';
    }
    
    selectVehicle(vehicle) {
        // Remove previous selection
        document.querySelectorAll('.vehicle-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-vehicle-id="${vehicle.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const radioInput = selectedCard.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
            }
        }
        
        this.selectedVehicle = vehicle;
        console.log('Veículo selecionado:', vehicle);
        this.checkOptimizationReady();
    }
    
    checkOptimizationReady() {
        const optimizeBtn = document.getElementById('optimizeBtn');
        const isReady = this.currentCargo && this.selectedVehicle;
        
        console.log('Verificação de otimização:', {
            hasCargo: !!this.currentCargo,
            hasVehicle: !!this.selectedVehicle,
            isReady: isReady
        });
        
        if (optimizeBtn) {
            optimizeBtn.disabled = !isReady;
            
            if (isReady) {
                optimizeBtn.textContent = 'Otimizar Carregamento';
                optimizeBtn.classList.remove('btn-secondary');
                optimizeBtn.classList.add('btn-primary');
            } else {
                optimizeBtn.textContent = 'Selecione veículo';
                optimizeBtn.classList.remove('btn-primary');
                optimizeBtn.classList.add('btn-secondary');
            }
        }
    }
    
    async optimizeCargo() {
        console.log('Iniciando otimização...');
        console.log('Cargo:', this.currentCargo);
        console.log('Veículo:', this.selectedVehicle);
        
        if (!this.currentCargo || !this.selectedVehicle) {
            console.error('Faltando dados:', {
                cargo: this.currentCargo,
                vehicle: this.selectedVehicle
            });
            this.showAlert('Selecione uma carga e um veículo.', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const requestData = {
                cargoId: this.currentCargo.id,
                vehicleId: this.selectedVehicle.id
            };
            
            console.log('Enviando requisição:', requestData);
            
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('Status da resposta:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Resultado da otimização:', result);
            
            this.displayResults(result);
            this.showAlert('Otimização concluída com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro completo:', error);
            this.showAlert(`Erro na otimização: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const optimizationResults = document.getElementById('optimizationResults');
        
        resultsSection.style.display = 'block';
        
        const resultClass = result.fits ? 'success-result' : 'error-result';
        const icon = result.fits ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        const title = result.fits ? 'Carga Acomodada com Sucesso!' : 'Carga Não Cabe no Veículo';
        
        optimizationResults.innerHTML = `
            <div class="result-card ${resultClass}">
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="${icon}"></i> ${title}
                    </h5>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <h6>Utilização do Volume</h6>
                            <div class="utilization-bar">
                                <div class="utilization-fill" style="width: ${result.utilization.volume}%">
                                    ${result.utilization.volume}%
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Utilização do Peso</h6>
                            <div class="utilization-bar">
                                <div class="utilization-fill" style="width: ${result.utilization.weight}%">
                                    ${result.utilization.weight}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${result.arrangement ? `
                        <div class="mt-3">
                            <h6>Posicionamento Sugerido:</h6>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-arrows-alt"></i> Posição: X=${result.arrangement.position.x}m, Y=${result.arrangement.position.y}m, Z=${result.arrangement.position.z}m</li>
                                <li><i class="fas fa-sync-alt"></i> Rotação: ${result.arrangement.rotation}°</li>
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${result.suggestions && result.suggestions.length > 0 ? `
                        <div class="mt-3">
                            <h6><i class="fas fa-lightbulb"></i> Sugestões:</h6>
                            <ul>
                                ${result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Show 3D visualization
        this.displayVisualization(result);
    }
    
    displayVisualization(result) {
        const visualizationSection = document.getElementById('visualizationSection');
        const vehicleSpace = document.getElementById('vehicleSpace');
        const scene = document.getElementById('scene');
        const itemsListCard = document.getElementById('itemsListCard');
        const itemsList = document.getElementById('itemsList');
        
        visualizationSection.style.display = 'block';
        
        // Clear previous visualization
        vehicleSpace.innerHTML = '';
        itemsList.innerHTML = '';
        
        // Setup 3D controls
        this.setup3DControls();
        
        // Scale factor for visualization
        const scale = 40;
        
        // Create vehicle container
        const vehicleBox = document.createElement('div');
        vehicleBox.className = 'vehicle-box';
        vehicleBox.style.width = `${this.selectedVehicle.dimensions.length * scale}px`;
        vehicleBox.style.height = `${this.selectedVehicle.dimensions.width * scale}px`;
        vehicleBox.style.transform = `translateZ(${-this.selectedVehicle.dimensions.height * scale / 2}px) translateY(${-this.selectedVehicle.dimensions.width * scale / 2}px) translateX(${-this.selectedVehicle.dimensions.length * scale / 2}px)`;
        
        // Add grid floor
        const gridFloor = document.createElement('div');
        gridFloor.className = 'grid-floor';
        gridFloor.style.width = `${this.selectedVehicle.dimensions.length * scale}px`;
        gridFloor.style.height = `${this.selectedVehicle.dimensions.width * scale}px`;
        gridFloor.style.transform = `translateZ(${-this.selectedVehicle.dimensions.height * scale / 2}px)`;
        vehicleBox.appendChild(gridFloor);
        
        // Add axis helpers
        const axisHelper = document.createElement('div');
        axisHelper.className = 'axis-helper';
        axisHelper.innerHTML = `
            <div class="axis-x"></div>
            <div class="axis-y"></div>
            <div class="axis-z"></div>
        `;
        vehicleBox.appendChild(axisHelper);
        
        // Create cargo items if packing result exists
        if (result.packingResult && result.packingResult.packedItems) {
            itemsListCard.style.display = 'block';
            
            result.packingResult.packedItems.forEach((item, index) => {
                // Create 3D item
                const cargoItem = document.createElement('div');
                cargoItem.className = 'cargo-item';
                cargoItem.style.width = `${item.dimensions.length * scale}px`;
                cargoItem.style.height = `${item.dimensions.width * scale}px`;
                cargoItem.style.background = item.color || '#e74c3c';
                cargoItem.style.opacity = '0.8';
                
                // Position the item
                const xPos = item.position.x * scale;
                const yPos = item.position.y * scale;
                const zPos = item.position.z * scale;
                
                cargoItem.style.transform = `
                    translateX(${xPos - this.selectedVehicle.dimensions.length * scale / 2}px)
                    translateY(${yPos - this.selectedVehicle.dimensions.width * scale / 2}px)
                    translateZ(${zPos - this.selectedVehicle.dimensions.height * scale / 2}px)
                `;
                
                // Add label
                const label = document.createElement('div');
                label.className = 'cargo-item-label';
                label.textContent = item.name || `Item ${index + 1}`;
                cargoItem.appendChild(label);
                
                // Add hover info
                cargoItem.addEventListener('mouseenter', () => {
                    this.showItemTooltip(item, cargoItem);
                });
                
                vehicleBox.appendChild(cargoItem);
                
                // Add to items list
                const itemCard = document.createElement('div');
                itemCard.className = 'col-md-3 mb-2';
                itemCard.innerHTML = `
                    <div class="card h-100 border-2" style="border-color: ${item.color || '#e74c3c'}">
                        <div class="card-body p-2">
                            <h6 class="card-title mb-1">${item.name || `Item ${index + 1}`}</h6>
                            <small class="text-muted">
                                ${item.dimensions.length.toFixed(2)} × ${item.dimensions.width.toFixed(2)} × ${item.dimensions.height.toFixed(2)}m
                            </small>
                            <br>
                            <small>Peso: ${item.weight}kg</small>
                            ${item.fragile ? '<br><span class="badge bg-warning">Fragile</span>' : ''}
                        </div>
                    </div>
                `;
                itemsList.appendChild(itemCard);
            });
        } else if (result.fits && this.currentCargo) {
            // Single cargo visualization (fallback)
            const cargoItem = document.createElement('div');
            cargoItem.className = 'cargo-item';
            cargoItem.style.width = `${this.currentCargo.dimensions.length * scale}px`;
            cargoItem.style.height = `${this.currentCargo.dimensions.width * scale}px`;
            cargoItem.style.background = '#e74c3c';
            cargoItem.style.opacity = '0.8';
            cargoItem.style.transform = `translateZ(${-this.currentCargo.dimensions.height * scale / 2}px)`;
            
            vehicleBox.appendChild(cargoItem);
        }
        
        vehicleSpace.appendChild(vehicleBox);
        
        // Store for animation
        this.currentVisualization = {
            vehicleSpace,
            scene,
            scale,
            result
        };
    }
    
    setup3DControls() {
        const rotationX = document.getElementById('rotationX');
        const rotationY = document.getElementById('rotationY');
        const zoom = document.getElementById('zoom');
        const resetView = document.getElementById('resetView');
        const animatePacking = document.getElementById('animatePacking');
        const scene = document.getElementById('scene');
        
        // Remove existing listeners
        const newRotationX = rotationX.cloneNode(true);
        const newRotationY = rotationY.cloneNode(true);
        const newZoom = zoom.cloneNode(true);
        const newResetView = resetView.cloneNode(true);
        const newAnimatePacking = animatePacking.cloneNode(true);
        
        rotationX.parentNode.replaceChild(newRotationX, rotationX);
        rotationY.parentNode.replaceChild(newRotationY, rotationY);
        zoom.parentNode.replaceChild(newZoom, zoom);
        resetView.parentNode.replaceChild(newResetView, resetView);
        animatePacking.parentNode.replaceChild(newAnimatePacking, animatePacking);
        
        // Add new listeners
        newRotationX.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('rotationXValue').textContent = `${value}°`;
            this.updateSceneTransform();
        });
        
        newRotationY.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('rotationYValue').textContent = `${value}°`;
            this.updateSceneTransform();
        });
        
        newZoom.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('zoomValue').textContent = `${value}%`;
            this.updateSceneTransform();
        });
        
        newResetView.addEventListener('click', () => {
            newRotationX.value = -20;
            newRotationY.value = 30;
            newZoom.value = 100;
            document.getElementById('rotationXValue').textContent = '-20°';
            document.getElementById('rotationYValue').textContent = '30°';
            document.getElementById('zoomValue').textContent = '100%';
            this.updateSceneTransform();
        });
        
        newAnimatePacking.addEventListener('click', () => {
            this.animatePackingProcess();
        });
        
        // Initial transform
        this.updateSceneTransform();
    }
    
    updateSceneTransform() {
        const scene = document.getElementById('scene');
        const rotationX = document.getElementById('rotationX').value;
        const rotationY = document.getElementById('rotationY').value;
        const zoom = document.getElementById('zoom').value / 100;
        
        scene.style.transform = `
            rotateX(${rotationX}deg)
            rotateY(${rotationY}deg)
            scale(${zoom})
        `;
    }
    
    animatePackingProcess() {
        if (!this.currentVisualization || !this.currentVisualization.result.packingResult) {
            this.showAlert('Nenhum processo de empacotamento para animar', 'warning');
            return;
        }
        
        const items = document.querySelectorAll('.cargo-item');
        const animateBtn = document.getElementById('animatePacking');
        
        // Disable button during animation
        animateBtn.disabled = true;
        animateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Animando...';
        
        // Hide all items initially
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = item.style.transform + ' scale(0)';
        });
        
        // Animate items one by one
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '0.8';
                item.style.transform = item.style.transform.replace('scale(0)', 'scale(1)');
                
                // Re-enable button after last animation
                if (index === items.length - 1) {
                    setTimeout(() => {
                        animateBtn.disabled = false;
                        animateBtn.innerHTML = '<i class="fas fa-play"></i> Animar';
                    }, 500);
                }
            }, index * 300);
        });
    }
    
    showItemTooltip(item, element) {
        // Create or update tooltip
        let tooltip = document.getElementById('itemTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'itemTooltip';
            tooltip.className = 'position-absolute bg-dark text-white p-2 rounded';
            tooltip.style.zIndex = '9999';
            tooltip.style.fontSize = '12px';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <strong>${item.name || 'Item'}</strong><br>
            Dimensões: ${item.dimensions.length.toFixed(2)} × ${item.dimensions.width.toFixed(2)} × ${item.dimensions.height.toFixed(2)}m<br>
            Peso: ${item.weight}kg<br>
            Posição: X=${item.position.x.toFixed(2)}, Y=${item.position.y.toFixed(2)}, Z=${item.position.z.toFixed(2)}
        `;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.display = 'block';
        
        // Hide tooltip on mouse leave
        element.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        }, { once: true });
    }
    
    async saveVehicle() {
        const name = document.getElementById('vehicleName').value;
        const type = document.getElementById('vehicleType').value;
        const length = parseFloat(document.getElementById('vehicleLength').value);
        const width = parseFloat(document.getElementById('vehicleWidth').value);
        const height = parseFloat(document.getElementById('vehicleHeight').value);
        const capacity = parseInt(document.getElementById('vehicleCapacity').value);
        
        if (!name || !length || !width || !height || !capacity) {
            this.showAlert('Preencha todos os campos.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    type,
                    dimensions: { length, width, height },
                    capacity
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar veículo');
            }
            
            const newVehicle = await response.json();
            this.vehicles.push(newVehicle);
            this.renderVehicles();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newVehicleModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('newVehicleForm').reset();
            
            this.showAlert('Veículo adicionado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro:', error);
            this.showAlert('Erro ao salvar veículo. Tente novamente.', 'error');
        }
    }
    
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }
    
    showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CargoOptimizer();
});
