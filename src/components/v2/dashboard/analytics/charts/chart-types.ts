export type DeliveryChartData = {
  date: string;
  timestamp: string;
  email: number;
  chat: number;
  call: number;
  inApp: number;
};

export type WorkflowChartData = {
  workflowName: string;
  count: number;
  displayName: string;
  fill: string;
};

export type CountryChartData = {
  country: string;
  main: number;
  spouse: number;
  total: number;
  displayName: string;
  fill: string;
};

export type InteractionChartData = {
  date: string;
  timestamp: string;
  documentsUploaded: number;
  documentsReviewed: number;
  commentsAdded: number;
  qualityChecks: number;
};

export type LodgementChartData = {
  date: string;
  timestamp: string;
  lodgements: number;
  reviews: number;
  total: number;
};

export type ActiveAgentsChartData = {
  date: string;
  count: number;
  timestamp: string;
};
