
export const calculateDuration = (fromDate: string, toDate: string): string => {
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


export const calculateYearsBetween = (fromDate: string, toDate: string): number => {
  const from = new Date(fromDate.includes('-') && fromDate.split('-').length === 2 ? fromDate + '-01' : fromDate);
  const to = new Date(toDate.includes('-') && toDate.split('-').length === 2 ? toDate + '-01' : toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
};


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
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  } else {
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
};


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


export const generateCurrentEmploymentDescription = (companyName: string, fromDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const duration = calculateDurationToPresent(fromDate);
  return `Working at ${companyName} since ${fromDateFormatted} (${duration})`;
};


export const generatePastEmploymentDescription = (companyName: string, fromDate: string, toDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const toDateFormatted = formatDateForDisplay(toDate);
  const duration = calculateDuration(fromDate, toDate);
  return `Worked at ${companyName} from ${fromDateFormatted} to ${toDateFormatted} (${duration})`;
};


export const generateCompanyDescription = (fromDate: string, toDate: string): string => {
  const fromDateFormatted = formatDateForDisplay(fromDate);
  const toDateFormatted = formatDateForDisplay(toDate);
  const duration = calculateDuration(fromDate, toDate);
  return `From ${fromDateFormatted} to ${toDateFormatted} (${duration})`;
};
