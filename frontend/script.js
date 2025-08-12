document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeModal = document.querySelector('.close-btn');
    const dropZone = document.getElementById('drop-zone');
    const previewArea = document.getElementById('preview-area');
    const photoAnalysis = document.getElementById('photo-analysis');
    
    // State
    let currentPhoto = null;
    let analysisData = null;
    
    // Initialize
    initEventListeners();
    addWelcomeMessage();
    
    function initEventListeners() {
        // Chat functionality
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        
        // File upload functionality
        uploadBtn.addEventListener('click', () => uploadModal.style.display = 'flex');
        closeModal.addEventListener('click', () => uploadModal.style.display = 'none');
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        dropZone.addEventListener('drop', handleDrop, false);
        
        // Quick action buttons
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', function() {
                const scenario = this.getAttribute('data-scenario');
                sendPresetMessage(scenario);
            });
        });
    }
    
    function addWelcomeMessage() {
        const welcomeMsg = `
            <div class="welcome-message">
                <h3>Welcome to Photography Assistant!</h3>
                <p>I can help you with:</p>
                <ul>
                    <li>Camera settings for any scenario</li>
                    <li>Composition and framing advice</li>
                    <li>Lighting analysis</li>
                    <li>Photo editing techniques</li>
                </ul>
                <p>Upload a photo for detailed analysis or ask me anything!</p>
            </div>
        `;
        addMessage(welcomeMsg, false, 'bot');
    }
    
    // Message handling
    function addMessage(content, isUser = false, type = 'text') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (type === 'text') {
            contentDiv.innerHTML = content;
        } else if (type === 'photo') {
            contentDiv.innerHTML = `
                <div class="photo-message">
                    <img src="${content.url}" alt="Uploaded photo">
                    <p>${content.caption || ''}</p>
                </div>
            `;
        } else if (type === 'settings') {
            contentDiv.innerHTML = `
                <div class="settings-message">
                    <h4>${content.scenario} Settings</h4>
                    <ul>
                        <li><strong>Aperture:</strong> ${content.aperture}</li>
                        <li><strong>Shutter Speed:</strong> ${content.shutter}</li>
                        <li><strong>ISO:</strong> ${content.iso}</li>
                    </ul>
                    <p><em>${content.tips}</em></p>
                </div>
            `;
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        chatWindow.appendChild(messageDiv);
        
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    
    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return typingDiv;
    }
    
    function removeTyping(typingElement) {
        if (typingElement && typingElement.parentNode) {
            typingElement.parentNode.removeChild(typingElement);
        }
    }
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        userInput.value = '';
        
        const typingElement = showTyping();
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In a real app, this would be an actual API call
            const response = await simulateApiCall(message);
            
            removeTyping(typingElement);
            
            if (response.type === 'settings') {
                addMessage(response.data, false, 'settings');
            } else {
                addMessage(response.data, false);
            }
        } catch (error) {
            removeTyping(typingElement);
            addMessage("Sorry, I encountered an error. Please try again.", false);
            console.error('Error:', error);
        }
    }
    
    function sendPresetMessage(scenario) {
        const message = `What are the recommended settings for ${scenario} photography?`;
        userInput.value = message;
        sendMessage();
    }
    
    // File upload handling
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropZone.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }
    
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        previewFile(file);
    }
    
    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            previewArea.innerHTML = `
                <img src="${reader.result}" alt="Preview">
                <button class="analyze-btn">Analyze Photo</button>
            `;
            
            currentPhoto = reader.result;
            
            document.querySelector('.analyze-btn').addEventListener('click', analyzePhoto);
        };
    }
    
    async function analyzePhoto() {
        if (!currentPhoto) return;
        
        uploadModal.style.display = 'none';
        addMessage("Analyzing your photo...", true);
        
        const typingElement = showTyping();
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In a real app, this would upload to your backend
            const analysis = await simulatePhotoAnalysis(currentPhoto);
            
            removeTyping(typingElement);
            
            // Add photo to chat
            addMessage({
                url: currentPhoto,
                caption: "Here's the photo I uploaded for analysis"
            }, true, 'photo');
            
            // Add analysis results
            addMessage(analysis.summary, false);
            
            // Show detailed analysis
            showPhotoAnalysis(analysis.details);
        } catch (error) {
            removeTyping(typingElement);
            addMessage("Sorry, I couldn't analyze that photo. Please try another.", false);
            console.error('Error:', error);
        }
    }
    
    function showPhotoAnalysis(details) {
        photoAnalysis.innerHTML = `
            <div class="analysis-card">
                <h4><i class="fas fa-chart-bar"></i> Technical Analysis</h4>
                <div class="analysis-metrics">
                    <div class="metric-item">
                        <div class="metric-label">Brightness</div>
                        <div class="metric-value">${details.brightness}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Contrast</div>
                        <div class="metric-value">${details.contrast}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Sharpness</div>
                        <div class="metric-value">${details.sharpness}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Color Balance</div>
                        <div class="metric-value">${details.colorBalance}</div>
                    </div>
                </div>
                <canvas id="analysis-chart"></canvas>
            </div>
            <div class="analysis-card">
                <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                <ul class="recommendations">
                    ${details.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        
        // Render chart
        const ctx = document.getElementById('analysis-chart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Exposure', 'Contrast', 'Sharpness', 'Color', 'Composition'],
                datasets: [{
                    label: 'Photo Analysis',
                    data: [85, 72, 68, 79, 81],
                    backgroundColor: 'rgba(106, 17, 203, 0.2)',
                    borderColor: 'rgba(106, 17, 203, 1)',
                    pointBackgroundColor: 'rgba(106, 17, 203, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
    
    // Simulation functions (replace with real API calls)
    async function simulateApiCall(message) {
        // This simulates different response types based on message content
        if (message.toLowerCase().includes('setting')) {
            const scenario = message.toLowerCase().includes('portrait') ? 'portrait' : 
                           message.toLowerCase().includes('landscape') ? 'landscape' : 
                           message.toLowerCase().includes('sports') ? 'sports' : 'general';
            
            const settings = {
                portrait: {
                    scenario: "Portrait",
                    aperture: "f/1.8 - f/2.8",
                    shutter: "1/125s or faster",
                    iso: "100-400",
                    tips: "Use single-point AF, focus on eyes, consider reflector for fill light"
                },
                landscape: {
                    scenario: "Landscape",
                    aperture: "f/8 - f/16",
                    shutter: "1/60s or slower (use tripod)",
                    iso: "100-200",
                    tips: "Use manual focus, shoot during golden hour, consider ND filters"
                },
                sports: {
                    scenario: "Sports",
                    aperture: "f/2.8 - f/4",
                    shutter: "1/500s or faster",
                    iso: "400-3200",
                    tips: "Use continuous AF, shutter priority mode, anticipate action"
                },
                general: {
                    scenario: "General",
                    aperture: "f/4 - f/8",
                    shutter: "1/125s - 1/250s",
                    iso: "200-800",
                    tips: "Good starting point for most situations, adjust as needed"
                }
            };
            
            return {
                type: 'settings',
                data: settings[scenario]
            };
        } else {
            const responses = [
                "For that scenario, I'd recommend using a wider aperture to isolate your subject.",
                "The lighting in that situation works best with a slightly higher ISO and faster shutter speed.",
                "Consider using the rule of thirds for better composition in that case.",
                "That's a great question! The optimal settings depend on several factors including available light.",
                "I'd suggest experimenting with different perspectives to make your photo more dynamic."
            ];
            
            return {
                type: 'text',
                data: responses[Math.floor(Math.random() * responses.length)]
            };
        }
    }
    
    async function simulatePhotoAnalysis(imageData) {
        // This simulates a detailed photo analysis
        return {
            summary: "Here's my analysis of your photo:\n\n" +
                    "1. The composition is strong with good use of negative space.\n" +
                    "2. Lighting is slightly uneven - consider using a reflector.\n" +
                    "3. The focus is sharp on the main subject.\n" +
                    "4. Colors could be enhanced slightly in post-processing.",
            details: {
                brightness: "75/100",
                contrast: "68/100",
                sharpness: "82/100",
                colorBalance: "RGB: 72, 65, 78",
                recommendations: [
                    "Try cropping to emphasize the main subject using rule of thirds",
                    "Adjust shadows +0.5 in post-processing",
                    "Consider a warmer white balance (5500K)",
                    "Try a vignette effect to draw attention to the center"
                ]
            }
        };
    }
});