/**
 * Formats a date string from YYYY-MM-DD format to a more readable format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string): string {
  try {
    // Handle different date formats
    let date: Date;
    
    if (dateString.includes('-')) {
      // YYYY-MM-DD format - parse as UTC to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Other formats - use the original parsing
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if formatting fails
  }
}

/**
 * Formats a date range from two date strings
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 * @returns Formatted date range string (e.g., "Jan 15, 2024 - Feb 20, 2025")
 */
export function formatDateRange(fromDate: string, toDate: string): string {
  try {
    const formattedFrom = formatDate(fromDate);
    const formattedTo = formatDate(toDate);
    return `${formattedFrom} - ${formattedTo}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return `${fromDate} - ${toDate}`; // Return original strings if formatting fails
  }
}
