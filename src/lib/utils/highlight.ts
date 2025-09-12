
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}


export function highlightText(text: string, query: string): HighlightSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;

  let index = normalizedText.indexOf(normalizedQuery);
  
  while (index !== -1) {
    // Add non-matching text before the match
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        isMatch: false
      });
    }

    // Add the matching text
    segments.push({
      text: text.slice(index, index + query.length),
      isMatch: true
    });

    lastIndex = index + query.length;
    index = normalizedText.indexOf(normalizedQuery, lastIndex);
  }

  // Add remaining non-matching text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isMatch: false
    });
  }

  return segments;
}

export function containsQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

export function filterByQuery<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): T[] {
  if (!query.trim()) return items;
  
  return items.filter(item => 
    containsQuery(getText(item), query)
  );
}

export function getMatchCount(text: string, query: string): number {
  if (!query.trim()) return 0;
  
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  let count = 0;
  let index = 0;
  
  while ((index = normalizedText.indexOf(normalizedQuery, index)) !== -1) {
    count++;
    index += normalizedQuery.length;
  }
  
  return count;
}
