
export const calculateDuration = (fromDate: string, toDate: string): string => {
  const from = new Date(fromDate + '-01');
  const to = new Date(toDate + '-01');
  
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  } else if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  } else {
    const yearText = years === 1 ? '1 year' : `${years} years`;
    const monthText = months === 1 ? '1 month' : `${months} months`;
    return `${yearText} ${monthText}`;
  }
};

/**
 * Calculate the number of years between two dates in YYYY-MM format
 * Returns a number representing the total years (rounded up)
 */
export const calculateYearsBetween = (fromDate: string, toDate: string): number => {
  const from = new Date(fromDate + '-01');
  const to = new Date(toDate + '-01');
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
};

/**
 * Format a date string (YYYY-MM) to a readable format (Month Year)
 * Example: "2023-01" -> "Jan 2023"
 */
export const formatDateForDisplay = (dateString: string): string => {
  const [year, month] = dateString.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

/**
 * Generate a company description with consistent formatting
 * Example: "From Jan 2023 to Dec 2025 (2 years 11 months)"
 */
export const generateCompanyDescription = (fromDate: string, toDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const toDateFormatted = formatDateForDisplay(toDate);
  const duration = calculateDuration(fromDate, toDate);
  return `From ${fromDateFormatted} to ${toDateFormatted} (${duration})`;
};
