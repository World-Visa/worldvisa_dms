
export const calculateDuration = (fromDate: string, toDate: string): string => {
  // Handle both YYYY-MM and YYYY-MM-DD formats
  const from = new Date(fromDate.includes('-') && fromDate.split('-').length === 2 ? fromDate + '-01' : fromDate);
  const to = new Date(toDate.includes('-') && toDate.split('-').length === 2 ? toDate + '-01' : toDate);
  
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
 * Calculate the number of years between two dates in YYYY-MM or YYYY-MM-DD format
 * Returns a number representing the total years (rounded up)
 */
export const calculateYearsBetween = (fromDate: string, toDate: string): number => {
  // Handle both YYYY-MM and YYYY-MM-DD formats
  const from = new Date(fromDate.includes('-') && fromDate.split('-').length === 2 ? fromDate + '-01' : fromDate);
  const to = new Date(toDate.includes('-') && toDate.split('-').length === 2 ? toDate + '-01' : toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
};

/**
 * Format a date string (YYYY-MM or YYYY-MM-DD) to a readable format (Month Year or Month Day, Year)
 * Example: "2023-01" -> "Jan 2023", "2023-01-15" -> "Jan 15, 2023"
 */
export const formatDateForDisplay = (dateString: string): string => {
  const parts = dateString.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  if (day) {
    // YYYY-MM-DD format
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  } else {
    // YYYY-MM format
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
};

/**
 * Calculate duration from start date to present (for current employment)
 * Example: "2 years 1 month"
 */
export const calculateDurationToPresent = (fromDate: string): string => {
  const from = new Date(fromDate.includes('-') && fromDate.split('-').length === 2 ? fromDate + '-01' : fromDate);
  const to = new Date(); // Current date
  
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
 * Generate description for current employment
 * Example: "Working at Google since Jul 04, 2023 (2 years 1 month)"
 */
export const generateCurrentEmploymentDescription = (companyName: string, fromDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const duration = calculateDurationToPresent(fromDate);
  return `Working at ${companyName} since ${fromDateFormatted} (${duration})`;
};

/**
 * Generate description for past employment
 * Example: "Worked at Google from Jul 04, 2023 to Aug 26, 2025 (2 years 1 month)"
 */
export const generatePastEmploymentDescription = (companyName: string, fromDate: string, toDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const toDateFormatted = formatDateForDisplay(toDate);
  const duration = calculateDuration(fromDate, toDate);
  return `Worked at ${companyName} from ${fromDateFormatted} to ${toDateFormatted} (${duration})`;
};

/**
 * Generate a company description with consistent formatting
 * Example: "From Jan 15, 2023 to Dec 20, 2025 (2 years 11 months)"
 * @deprecated Use generateCurrentEmploymentDescription or generatePastEmploymentDescription instead
 */
export const generateCompanyDescription = (fromDate: string, toDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const toDateFormatted = formatDateForDisplay(toDate);
  const duration = calculateDuration(fromDate, toDate);
  return `From ${fromDateFormatted} to ${toDateFormatted} (${duration})`;
};
