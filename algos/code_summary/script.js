// script.js
document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    const executeBtn = document.getElementById('executeBtn');
    const consoleOutput = document.getElementById('consoleOutput');
    const notesArea = document.getElementById('notesArea');
    const spinner = executeBtn.querySelector('.spinner');
    const btnText = executeBtn.querySelector('.btn-text');
  
    const G_API = "AIzaSyBaVRAhmgszP27nG1NsYgPAuG7Xq41_w5s";
  
    // Update line numbers in the editor
    function updateLineNumbers() {
      const lines = codeEditor.value.split('\n').length;
      lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1)
        .map(num => `<div class="line-number">${num}</div>`)
        .join('');
    }
  
    // Handle Tab key for indentation in the editor
    codeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value =
          codeEditor.value.substring(0, start) + '    ' +
          codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
      }
    });
  
    // Sync scroll position between the editor and line numbers
    codeEditor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = codeEditor.scrollTop;
    });
  
    // Update line numbers on input
    codeEditor.addEventListener('input', updateLineNumbers);
    updateLineNumbers();
  
    // Helper function to format the summary text
    function formatSummary(text) {
      const paragraphs = text.split(/\n\s*\n/);
      let formattedText = 'Code Analysis\n=============\n\n';
  
      paragraphs.forEach((para) => {
        const cleanPara = para.trim()
          .replace(/\s+/g, ' ')
          .replace(/\(\s+/g, '(')
          .replace(/\s+\)/g, ')');
        formattedText += cleanPara + '\n\n';
      });
  
      if (text.includes('time complexity') || text.includes('O(')) {
        formattedText += 'Key Points\n==========\n\n';
        const points = [];
        if (text.includes('time complexity')) {
          points.push('• Time Complexity: ' + (text.match(/[OΘΩ]\([^)]+\)/)?.[0] || 'mentioned in description'));
        }
        if (text.includes('sorted')) {
          points.push('• Requirement: Input array must be sorted');
        }
        points.forEach(point => {
          formattedText += point + '\n';
        });
      }
  
      return formattedText;
    }
  
    // Execute code using the Gemini API
    async function executeCode() {
      const code = codeEditor.value;
      if (!code.trim()) return;
  
      // Update timestamp at execution time
      const timestamp = new Date().toLocaleTimeString();
  
      // Show loading state
      executeBtn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = 'Executing...';
  
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${G_API}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${code},
  give code summary and explain step by step and console output.
  Output should be:
  [
  long paragraphed summary
  ]
  [
  array_of_items that are in console
  ]
  Response should only contain two arrays that start with [ and end with ].`
              }]
            }]
          })
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const geminiResult = await response.json();
        let analysisText = geminiResult.candidates[0].content.parts[0].text;
  
        // Remove any markdown formatting if present
        analysisText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
        console.log('Raw Gemini Response:', analysisText);
  
        // Use regex to extract the two arrays (summary and console output)
        const matches = analysisText.match(/(\[[\s\S]*?\])[\s\S]*?(\[[\s\S]*?\])/);
        if (matches && matches.length >= 3) {
          // Remove the enclosing brackets and trim whitespace
          const summaryText = matches[1].slice(1, -1).trim();
          const consoleText = matches[2].slice(1, -1).trim();
          const formattedSummary = formatSummary(summaryText);
  
          // Update the UI:
          // Summary goes into the notesArea textarea
          notesArea.value = formattedSummary;
          // Console output goes into the consoleOutput element
          consoleOutput.textContent = `[${timestamp}] Console Output:\n\n${consoleText}`;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        consoleOutput.textContent = `[${timestamp}] Error: ${error.message}`;
        notesArea.value = 'Error occurred during execution';
        console.error('Execution error:', error);
      } finally {
        // Reset button state
        executeBtn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Execute Code';
      }
    }
  
    // Add click handler for the execute button
    executeBtn.addEventListener('click', executeCode);
  });
  