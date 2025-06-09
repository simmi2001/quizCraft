export class TextProcessor {
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ])
  }

  generateMCQs(text, count = 5) {
    const sentences = this.extractSentences(text)
    const importantSentences = this.findImportantSentences(sentences)
    
    const mcqs = []
    const usedSentences = new Set()
    
    for (let i = 0; i < Math.min(count, importantSentences.length); i++) {
      let sentence = importantSentences[i]
      
      // Skip if already used
      if (usedSentences.has(sentence)) continue
      usedSentences.add(sentence)
      
      const mcq = this.createMCQFromSentence(sentence, text)
      if (mcq) {
        mcqs.push(mcq)
      }
    }
    
    return mcqs
  }

  createMCQFromSentence(sentence, context) {
    // Find key terms in the sentence
    const words = sentence.split(/\s+/)
    const keyTerms = words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      return cleanWord.length > 3 && !this.stopWords.has(cleanWord)
    })
    
    if (keyTerms.length === 0) return null
    
    // Pick a random key term to make the question about
    const targetTerm = keyTerms[Math.floor(Math.random() * keyTerms.length)]
    const cleanTargetTerm = targetTerm.replace(/[^\w]/g, '')
    
    // Create question by replacing the term with a blank
    const question = sentence.replace(new RegExp(`\\b${this.escapeRegex(targetTerm)}\\b`, 'gi'), '______')
    
    // Generate distractors
    const distractors = this.generateDistractors(cleanTargetTerm, context)
    const correctAnswer = cleanTargetTerm
    
    // Mix options
    const options = [correctAnswer, ...distractors].slice(0, 4)
    this.shuffleArray(options)
    
    const correctIndex = options.indexOf(correctAnswer)
    
    return {
      question,
      options,
      correctAnswer: correctIndex
    }
  }

  generateDistractors(correctTerm, context) {
    const words = context.split(/\s+/)
    const candidates = []
    
    // Find words of similar length and characteristics
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      if (cleanWord !== correctTerm.toLowerCase() && 
          cleanWord.length >= 3 && 
          !this.stopWords.has(cleanWord)) {
        candidates.push(cleanWord)
      }
    }
    
    // Remove duplicates and sort by similarity to correct term
    const uniqueCandidates = [...new Set(candidates)]
    
    // If we don't have enough candidates, generate some generic ones
    if (uniqueCandidates.length < 3) {
      const genericDistractors = this.getGenericDistractors(correctTerm)
      uniqueCandidates.push(...genericDistractors)
    }
    
    // Shuffle and take first 3
    this.shuffleArray(uniqueCandidates)
    return uniqueCandidates.slice(0, 3)
  }

  getGenericDistractors(term) {
    const termLower = term.toLowerCase()
    const distractors = []
    
    // Generate variations based on the term
    if (termLower.length > 4) {
      distractors.push(termLower.slice(0, -1) + 'ing')
      distractors.push(termLower + 's')
      distractors.push('non-' + termLower)
    }
    
    // Add some common academic terms
    const commonTerms = ['concept', 'theory', 'principle', 'method', 'process', 'system', 'factor', 'element']
    distractors.push(...commonTerms.filter(t => t !== termLower))
    
    return distractors
  }

  generateSummary(text) {
    const sentences = this.extractSentences(text)
    const importantSentences = this.findImportantSentences(sentences)
    const keyPoints = this.extractKeyPoints(text)
    
    let summary = '<h4>Summary</h4>\n'
    summary += '<p>' + importantSentences.slice(0, 3).join(' ') + '</p>\n'
    
    if (keyPoints.length > 0) {
      summary += '<h4>Key Points</h4>\n<ul>\n'
      keyPoints.forEach(point => {
        summary += `<li>${point}</li>\n`
      })
      summary += '</ul>'
    }
    
    return summary
  }

  extractKeyPoints(text) {
    const sentences = this.extractSentences(text)
    const keyPoints = []
    
    // Look for sentences that start with key indicators
    const keyIndicators = [
      'first', 'second', 'third', 'finally', 'important', 'key', 'main', 'primary',
      'significant', 'crucial', 'essential', 'fundamental', 'basic', 'major'
    ]
    
    sentences.forEach(sentence => {
      const firstWord = sentence.split(' ')[0].toLowerCase()
      if (keyIndicators.some(indicator => firstWord.includes(indicator)) || 
          sentence.includes(':') || 
          sentence.length < 150) { // Shorter sentences are often key points
        keyPoints.push(sentence.trim())
      }
    })
    
    return keyPoints.slice(0, 6) // Limit to 6 key points
  }

  generateFillBlanks(text, count = 4) {
    const sentences = this.extractSentences(text)
    const importantSentences = this.findImportantSentences(sentences)
    
    const exercises = []
    const usedSentences = new Set()
    
    for (let i = 0; i < Math.min(count, importantSentences.length); i++) {
      let sentence = importantSentences[i]
      
      if (usedSentences.has(sentence)) continue
      usedSentences.add(sentence)
      
      const exercise = this.createFillBlankFromSentence(sentence)
      if (exercise) {
        exercises.push(exercise)
      }
    }
    
    return exercises
  }

  createFillBlankFromSentence(sentence) {
    const words = sentence.split(/\s+/)
    const keyTerms = words.filter((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      return cleanWord.length > 3 && 
             !this.stopWords.has(cleanWord) && 
             index > 0 && 
             index < words.length - 1 // Not first or last word
    })
    
    if (keyTerms.length === 0) return null
    
    // Select 1-3 terms to blank out
    const termsToBlank = keyTerms.slice(0, Math.min(3, keyTerms.length))
    let modifiedSentence = sentence
    const answers = []
    
    termsToBlank.forEach((term, index) => {
      const cleanTerm = term.replace(/[^\w]/g, '')
      answers.push(cleanTerm)
      modifiedSentence = modifiedSentence.replace(
        new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'i'),
        `<input type="text" class="blank-input" placeholder="____" data-answer="${cleanTerm}">`
      )
    })
    
    return {
      text: modifiedSentence,
      answers
    }
  }

  extractSentences(text) {
    // Split text into sentences, handling various punctuation
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20) // Filter out very short sentences
  }

  findImportantSentences(sentences) {
    // Score sentences based on various factors
    const scoredSentences = sentences.map(sentence => {
      let score = 0
      
      // Length factor (medium length sentences are often good)
      const length = sentence.length
      if (length > 50 && length < 200) score += 2
      
      // Keyword presence
      const keywords = ['important', 'significant', 'key', 'main', 'primary', 'essential', 'fundamental']
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) score += 3
      })
      
      // Position factor (first few sentences are often important)
      const index = sentences.indexOf(sentence)
      if (index < 3) score += 2
      
      // Complexity factor (sentences with conjunctions might be more informative)
      const conjunctions = ['because', 'therefore', 'however', 'although', 'furthermore']
      conjunctions.forEach(conj => {
        if (sentence.toLowerCase().includes(conj)) score += 1
      })
      
      return { sentence, score }
    })
    
    // Sort by score and return sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .map(item => item.sentence)
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
}