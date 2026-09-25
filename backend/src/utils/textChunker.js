/**
 * Chunks raw document text into readable overlapping segments with section detection
 */
export function chunkDocumentText(rawText, numPages = 1, options = {}) {
  const { chunkSizeWords = 600, overlapWords = 100 } = options;

  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  // Common academic section headings regex
  const sectionRegex = /(?:^|\n\n)(?:[0-9]+\.?\s+)?(abstract|introduction|background|related\s+work|methodology|methods|system\s+design|architecture|experimental\s+setup|experiments|results|discussion|findings|limitations|conclusion|conclusions|future\s+work|references)\b/i;

  // Split into paragraphs / lines
  const words = rawText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords <= chunkSizeWords) {
    const match = rawText.match(sectionRegex);
    const sectionName = match ? match[1].toUpperCase() : 'General Document';
    return [{
      chunkIndex: 0,
      content: words.join(' '),
      pageNumber: 1,
      sectionName
    }];
  }

  const chunks = [];
  let currentWordIdx = 0;
  let chunkIndex = 0;

  while (currentWordIdx < totalWords) {
    const endIdx = Math.min(currentWordIdx + chunkSizeWords, totalWords);
    const chunkWords = words.slice(currentWordIdx, endIdx);
    const chunkContent = chunkWords.join(' ');

    // Calculate approximate page number
    const progress = currentWordIdx / totalWords;
    const estimatedPage = Math.min(Math.max(1, Math.floor(progress * numPages) + 1), numPages);

    // Detect section name in this chunk
    const match = chunkContent.match(sectionRegex);
    const sectionName = match ? match[1].toUpperCase() : (chunks.length > 0 ? chunks[chunks.length - 1].sectionName : 'Introduction');

    chunks.push({
      chunkIndex,
      content: chunkContent,
      pageNumber: estimatedPage,
      sectionName
    });

    chunkIndex++;
    if (endIdx >= totalWords) break;
    currentWordIdx += (chunkSizeWords - overlapWords);
  }

  return chunks;
}
