// Web Worker for heavy data processing operations
// This runs in a separate thread to avoid blocking the main UI

interface ProcessApplicationsDataMessage {
  type: "PROCESS_APPLICATIONS";
  data: any[];
  filters: {
    search?: string;
    searchType?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  };
}

interface ProcessCategoriesDataMessage {
  type: "PROCESS_CATEGORIES";
  data: any[];
  companies: any[];
  isClientView: boolean;
  checklistState: string;
}

type WorkerMessage =
  | ProcessApplicationsDataMessage
  | ProcessCategoriesDataMessage;

// Heavy data processing functions
function processApplicationsData(data: any[], filters: any) {
  const startTime = performance.now();

  let filteredData = [...data];

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    const searchType = filters.searchType || "name";

    filteredData = filteredData.filter((item) => {
      const fieldValue = item[searchType]?.toLowerCase() || "";
      return fieldValue.includes(searchTerm);
    });
  }

  // Apply date range filter
  if (filters.dateRange?.start && filters.dateRange?.end) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);

    filteredData = filteredData.filter((item) => {
      const itemDate = new Date(item.Created_Time);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  // Sort by creation time (newest first)
  filteredData.sort(
    (a, b) =>
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime(),
  );

  const processingTime = performance.now() - startTime;

  return {
    data: filteredData,
    processingTime,
    originalCount: data.length,
    filteredCount: filteredData.length,
  };
}

function processCategoriesData(
  data: any[],
  companies: any[],
  isClientView: boolean,
  checklistState: string,
) {
  const startTime = performance.now();

  // Generate categories based on data
  const categories = [];

  // Add basic categories
  categories.push({
    id: "all",
    label: "All Documents",
    count: data.length,
  });

  // Add company-specific categories
  companies.forEach((company) => {
    const companyDocs = data.filter((doc) =>
      doc.document_category?.toLowerCase().includes(company.name.toLowerCase()),
    );

    if (companyDocs.length > 0) {
      categories.push({
        id: `company-${company.name.toLowerCase()}`,
        label: `${company.name} Company Documents`,
        count: companyDocs.length,
        fromDate: company.fromDate,
        toDate: company.toDate,
      });
    }
  });

  const processingTime = performance.now() - startTime;

  return {
    categories,
    processingTime,
    totalCompanies: companies.length,
    totalDocuments: data.length,
  };
}

// Handle messages from main thread
self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const { type, ...payload } = event.data;

  try {
    let result;

    switch (type) {
      case "PROCESS_APPLICATIONS":
        result = processApplicationsData(payload.data, payload.filters);
        break;

      case "PROCESS_CATEGORIES":
        result = processCategoriesData(
          payload.data,
          payload.companies,
          payload.isClientView,
          payload.checklistState,
        );
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send result back to main thread
    self.postMessage({
      type: "SUCCESS",
      payload: result,
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Handle errors
self.addEventListener("error", (error) => {
  self.postMessage({
    type: "ERROR",
    error: error.message,
  });
});

export {}; // Make this a module
