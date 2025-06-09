import './style.css'
import { TextProcessor } from './textProcessor.js'
import { PDFExporter } from './pdfExporter.js'

class QuizCraft {
  constructor() {
    this.textProcessor = new TextProcessor()
    this.pdfExporter = new PDFExporter()
    this.currentText = ''
    this.generatedContent = {
      mcqs: [],
      summary: '',
      blanks: []
    }
    
    this.initializeApp()
  }

  initializeApp() {
    this.setupEventListeners()
    this.updateUI()
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Input method switching
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchInputMethod(e.target.dataset.method)
      })
    })

    // Text input
    const articleInput = document.getElementById('article-input')
    articleInput.addEventListener('input', (e) => {
      this.currentText = e.target.value
      this.updateWordCount()
      this.updateGenerateButton()
    })

    // File upload
    const fileInput = document.getElementById('file-input')
    const uploadZone = document.getElementById('upload-zone')
    
    fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files[0])
    })

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('dragover')
    })

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover')
    })

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.classList.remove('dragover')
      this.handleFileSelect(e.dataTransfer.files[0])
    })

    // Action buttons
    document.getElementById('generate-btn').addEventListener('click', () => {
      this.generateAllContent()
    })

    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearContent()
    })

    // Export buttons
    document.getElementById('export-mcq').addEventListener('click', () => {
      this.exportToPDF('mcq')
    })

    document.getElementById('export-summary').addEventListener('click', () => {
      this.exportToPDF('summary')
    })

    document.getElementById('export-blanks').addEventListener('click', () => {
      this.exportToPDF('blanks')
    })

    // Regenerate buttons
    document.getElementById('regenerate-mcq').addEventListener('click', () => {
      this.regenerateContent('mcq')
    })

    document.getElementById('regenerate-summary').addEventListener('click', () => {
      this.regenerateContent('summary')
    })

    document.getElementById('regenerate-blanks').addEventListener('click', () => {
      this.regenerateContent('blanks')
    })
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active')
    })
    document.getElementById(`${tabName}-section`).classList.add('active')
  }

  switchInputMethod(method) {
    // Update method buttons
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-method="${method}"]`).classList.add('active')

    // Update input areas
    document.querySelectorAll('.input-area').forEach(area => {
      area.classList.add('hidden')
    })
    document.getElementById(`${method}-area`).classList.remove('hidden')
  }

  updateWordCount() {
    const charCount = this.currentText.length
    const wordCount = this.currentText.trim() ? this.currentText.trim().split(/\s+/).length : 0
    
    document.getElementById('char-count').textContent = `${charCount} characters`
    document.getElementById('word-count').textContent = `${wordCount} words`
  }

  updateGenerateButton() {
    const generateBtn = document.getElementById('generate-btn')
    const minWords = 50
    const wordCount = this.currentText.trim() ? this.currentText.trim().split(/\s+/).length : 0
    
    generateBtn.disabled = wordCount < minWords
    
    if (wordCount < minWords) {
      generateBtn.innerHTML = `<i class="fas fa-rocket"></i> Need at least ${minWords} words`
    } else {
      generateBtn.innerHTML = `<i class="fas fa-rocket"></i> Generate Content`
    }
  }

  async handleFileSelect(file) {
    if (!file) return

    if (!file.name.match(/\.(txt|md)$/i)) {
      this.showToast('Please select a .txt or .md file', 'error')
      return
    }

    try {
      const text = await file.text()
      this.currentText = text
      document.getElementById('article-input').value = text
      this.updateWordCount()
      this.updateGenerateButton()
      this.showToast('File loaded successfully!', 'success')
      
      // Switch to paste view to show the content
      this.switchInputMethod('paste')
    } catch (error) {
      this.showToast('Error reading file', 'error')
    }
  }

  async generateAllContent() {
    if (!this.currentText.trim()) return

    this.showLoading(true)

    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Generate MCQs
      this.generatedContent.mcqs = this.textProcessor.generateMCQs(this.currentText)
      this.displayMCQs()

      // Generate Summary
      this.generatedContent.summary = this.textProcessor.generateSummary(this.currentText)
      this.displaySummary()

      // Generate Fill-in-the-blanks
      this.generatedContent.blanks = this.textProcessor.generateFillBlanks(this.currentText)
      this.displayFillBlanks()

      this.showToast('Content generated successfully!', 'success')
      this.switchTab('mcq')
      
    } catch (error) {
      this.showToast('Error generating content', 'error')
    } finally {
      this.showLoading(false)
    }
  }

  async regenerateContent(type) {
    this.showLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      switch (type) {
        case 'mcq':
          this.generatedContent.mcqs = this.textProcessor.generateMCQs(this.currentText)
          this.displayMCQs()
          break
        case 'summary':
          this.generatedContent.summary = this.textProcessor.generateSummary(this.currentText)
          this.displaySummary()
          break
        case 'blanks':
          this.generatedContent.blanks = this.textProcessor.generateFillBlanks(this.currentText)
          this.displayFillBlanks()
          break
      }
      
      this.showToast(`${type.toUpperCase()} regenerated successfully!`, 'success')
    } catch (error) {
      this.showToast('Error regenerating content', 'error')
    } finally {
      this.showLoading(false)
    }
  }

  displayMCQs() {
    const container = document.getElementById('mcq-content')
    
    if (this.generatedContent.mcqs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-question-circle empty-icon"></i>
          <p>No MCQs could be generated from this text</p>
        </div>
      `
      return
    }

    container.innerHTML = this.generatedContent.mcqs.map((mcq, index) => `
      <div class="mcq-item">
        <div class="mcq-question">${index + 1}. ${mcq.question}</div>
        <ul class="mcq-options">
          ${mcq.options.map((option, optIndex) => `
            <li class="${optIndex === mcq.correctAnswer ? 'correct' : ''}" 
                data-option="${optIndex}">
              ${String.fromCharCode(65 + optIndex)}. ${option}
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('')

    // Add click handlers for options
    container.querySelectorAll('.mcq-options li').forEach(option => {
      option.addEventListener('click', () => {
        const siblings = option.parentNode.querySelectorAll('li')
        siblings.forEach(s => s.style.background = '')
        option.style.background = 'var(--primary-100)'
      })
    })
  }

  displaySummary() {
    const container = document.getElementById('summary-content')
    
    if (!this.generatedContent.summary) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list empty-icon"></i>
          <p>No summary could be generated from this text</p>
        </div>
      `
      return
    }

    container.innerHTML = `<div class="summary-content">${this.generatedContent.summary}</div>`
  }

  displayFillBlanks() {
    const container = document.getElementById('blanks-content')
    
    if (this.generatedContent.blanks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-pen-alt empty-icon"></i>
          <p>No fill-in-the-blanks exercises could be generated from this text</p>
        </div>
      `
      return
    }

    container.innerHTML = this.generatedContent.blanks.map((exercise, index) => `
      <div class="blank-exercise">
        <h4>Exercise ${index + 1}:</h4>
        <p>${exercise.text}</p>
        <div style="margin-top: 16px; font-size: 14px; color: var(--gray-600);">
          <strong>Answers:</strong> ${exercise.answers.join(', ')}
        </div>
      </div>
    `).join('')
  }

  exportToPDF(type) {
    const content = this.generatedContent[type]
    if (!content || (Array.isArray(content) && content.length === 0)) {
      this.showToast('No content to export', 'error')
      return
    }

    this.pdfExporter.export(type, content)
    this.showToast('PDF exported successfully!', 'success')
  }

  clearContent() {
    this.currentText = ''
    document.getElementById('article-input').value = ''
    document.getElementById('file-input').value = ''
    this.updateWordCount()
    this.updateGenerateButton()
    
    // Clear generated content
    this.generatedContent = { mcqs: [], summary: '', blanks: [] }
    
    // Reset displays
    document.getElementById('mcq-content').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-question-circle empty-icon"></i>
        <p>Generate content first to see MCQs here</p>
      </div>
    `
    
    document.getElementById('summary-content').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list empty-icon"></i>
        <p>Generate content first to see summary here</p>
      </div>
    `
    
    document.getElementById('blanks-content').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-pen-alt empty-icon"></i>
        <p>Generate content first to see fill-in-the-blanks here</p>
      </div>
    `
    
    this.showToast('Content cleared', 'success')
    this.switchTab('input')
  }

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay')
    if (show) {
      overlay.classList.remove('hidden')
    } else {
      overlay.classList.add('hidden')
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container')
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.textContent = message
    
    container.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  updateUI() {
    this.updateWordCount()
    this.updateGenerateButton()
  }
}

// Initialize the app
new QuizCraft()