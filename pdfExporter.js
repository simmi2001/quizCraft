import jsPDF from 'jspdf'

export class PDFExporter {
  constructor() {
    this.doc = null
    this.pageWidth = 210 // A4 width in mm
    this.pageHeight = 297 // A4 height in mm
    this.margin = 20
    this.currentY = 0
  }

  export(type, content) {
    this.doc = new jsPDF()
    this.currentY = this.margin
    
    // Add header
    this.addHeader(type)
    
    switch (type) {
      case 'mcq':
        this.exportMCQs(content)
        break
      case 'summary':
        this.exportSummary(content)
        break
      case 'blanks':
        this.exportFillBlanks(content)
        break
    }
    
    // Save the PDF
    const filename = `QuizCraft_${type}_${new Date().toISOString().split('T')[0]}.pdf`
    this.doc.save(filename)
  }

  addHeader(type) {
    // Title
    this.doc.setFontSize(24)
    this.doc.setTextColor(59, 130, 246) // Primary blue
    this.doc.text('QuizCraft', this.margin, this.currentY)
    
    // Subtitle
    this.currentY += 10
    this.doc.setFontSize(16)
    this.doc.setTextColor(107, 114, 128) // Gray
    const subtitles = {
      mcq: 'Multiple Choice Questions',
      summary: 'Summary & Key Points',
      blanks: 'Fill in the Blanks Exercises'
    }
    this.doc.text(subtitles[type], this.margin, this.currentY)
    
    // Date
    this.currentY += 8
    this.doc.setFontSize(10)
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.margin, this.currentY)
    
    // Line separator
    this.currentY += 10
    this.doc.setDrawColor(229, 231, 235) // Gray border
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15
  }

  exportMCQs(mcqs) {
    mcqs.forEach((mcq, index) => {
      this.checkPageBreak(50) // Ensure enough space for question
      
      // Question number and text
      this.doc.setFontSize(12)
      this.doc.setTextColor(31, 41, 55) // Dark gray
      this.doc.setFont('helvetica', 'bold')
      
      const questionText = `${index + 1}. ${mcq.question}`
      const questionLines = this.splitText(questionText, this.pageWidth - 2 * this.margin)
      
      questionLines.forEach(line => {
        this.doc.text(line, this.margin, this.currentY)
        this.currentY += 6
      })
      
      this.currentY += 3
      
      // Options
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(10)
      
      mcq.options.forEach((option, optIndex) => {
        this.checkPageBreak(8)
        
        const optionLetter = String.fromCharCode(65 + optIndex)
        const isCorrect = optIndex === mcq.correctAnswer
        
        if (isCorrect) {
          this.doc.setTextColor(16, 185, 129) // Green for correct answer
          this.doc.setFont('helvetica', 'bold')
        } else {
          this.doc.setTextColor(75, 85, 99) // Gray for other options
          this.doc.setFont('helvetica', 'normal')
        }
        
        const optionText = `${optionLetter}. ${option}`
        const optionLines = this.splitText(optionText, this.pageWidth - 2 * this.margin - 10)
        
        optionLines.forEach((line, lineIndex) => {
          const x = lineIndex === 0 ? this.margin + 5 : this.margin + 15
          this.doc.text(line, x, this.currentY)
          this.currentY += 5
        })
      })
      
      this.currentY += 8 // Space between questions
    })
  }

  exportSummary(summaryHTML) {
    // Parse HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = summaryHTML
    
    // Process each element
    const elements = tempDiv.children
    
    for (let element of elements) {
      this.checkPageBreak(20)
      
      if (element.tagName === 'H4') {
        this.doc.setFontSize(14)
        this.doc.setTextColor(59, 130, 246) // Primary blue
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(element.textContent, this.margin, this.currentY)
        this.currentY += 10
      } else if (element.tagName === 'P') {
        this.doc.setFontSize(10)
        this.doc.setTextColor(55, 65, 81) // Dark gray
        this.doc.setFont('helvetica', 'normal')
        
        const lines = this.splitText(element.textContent, this.pageWidth - 2 * this.margin)
        lines.forEach(line => {
          this.checkPageBreak(6)
          this.doc.text(line, this.margin, this.currentY)
          this.currentY += 6
        })
        this.currentY += 5
      } else if (element.tagName === 'UL') {
        const listItems = element.getElementsByTagName('li')
        for (let li of listItems) {
          this.checkPageBreak(8)
          
          this.doc.setFontSize(10)
          this.doc.setTextColor(55, 65, 81)
          this.doc.setFont('helvetica', 'normal')
          
          // Add bullet point
          this.doc.text('•', this.margin + 5, this.currentY)
          
          const itemLines = this.splitText(li.textContent, this.pageWidth - 2 * this.margin - 15)
          itemLines.forEach((line, lineIndex) => {
            const x = this.margin + 12
            this.doc.text(line, x, this.currentY)
            if (lineIndex < itemLines.length - 1) {
              this.currentY += 5
              this.checkPageBreak(5)
            }
          })
          this.currentY += 7
        }
      }
    }
  }

  exportFillBlanks(exercises) {
    exercises.forEach((exercise, index) => {
      this.checkPageBreak(40)
      
      // Exercise title
      this.doc.setFontSize(12)
      this.doc.setTextColor(59, 130, 246) // Primary blue
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Exercise ${index + 1}:`, this.margin, this.currentY)
      this.currentY += 10
      
      // Exercise text (remove HTML tags and replace inputs with blanks)
      let exerciseText = exercise.text
        .replace(/<input[^>]*>/g, '________')
        .replace(/<[^>]*>/g, '')
      
      this.doc.setFontSize(10)
      this.doc.setTextColor(55, 65, 81) // Dark gray
      this.doc.setFont('helvetica', 'normal')
      
      const exerciseLines = this.splitText(exerciseText, this.pageWidth - 2 * this.margin)
      exerciseLines.forEach(line => {
        this.checkPageBreak(6)
        this.doc.text(line, this.margin, this.currentY)
        this.currentY += 6
      })
      
      this.currentY += 5
      
      // Answers
      this.doc.setFontSize(9)
      this.doc.setTextColor(107, 114, 128) // Gray
      this.doc.setFont('helvetica', 'italic')
      this.doc.text(`Answers: ${exercise.answers.join(', ')}`, this.margin, this.currentY)
      this.currentY += 15
    })
  }

  splitText(text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const textWidth = this.doc.getTextWidth(testLine)
      
      if (textWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          lines.push(word) // Word is too long, add it anyway
        }
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }
}