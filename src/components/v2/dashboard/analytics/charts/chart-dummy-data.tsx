import type {
  ActiveAgentsChartData,
  CountryChartData,
  DeliveryChartData,
  InteractionChartData,
  LodgementChartData,
  WorkflowChartData,
} from './chart-types';

function pastDays(count: number): Date[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return d;
  });
}

export function generateDummyDeliveryData(): DeliveryChartData[] {
  return pastDays(12).map((d) => ({
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: d.toISOString(),
    email: Math.floor(Math.random() * 120) + 30,
    chat: Math.floor(Math.random() * 60) + 10,
    call: Math.floor(Math.random() * 25) + 5,
    inApp: Math.floor(Math.random() * 80) + 20,
  }));
}

export function generateDummyWorkflowData(): WorkflowChartData[] {
  const items = [
    { label: 'All Lodgements', color: '#818cf8' },
    { label: 'Approaching', color: '#22d3ee' },
    { label: 'Overdue', color: '#fb923c' },
    { label: 'Future', color: '#34d399' },
    { label: 'No Deadline', color: '#9ca3af' },
  ];

  return items.map((item) => ({
    workflowName: item.label,
    count: Math.floor(Math.random() * 80) + 10,
    displayName: item.label,
    fill: item.color,
  }));
}

export function generateDummyProviderData(): CountryChartData[] {
  return [
    { country: 'Australia', main: 65, spouse: 18, total: 83, displayName: 'Australia', fill: '#818cf8' },
    { country: 'Canada', main: 32, spouse: 0, total: 32, displayName: 'Canada', fill: '#22d3ee' },
  ];
}

export function generateDummyInteractionData(): InteractionChartData[] {
  return pastDays(14).map((d) => {
    const uploaded = Math.floor(Math.random() * 30) + 5;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: d.toISOString(),
      documentsUploaded: uploaded,
      documentsReviewed: Math.floor(uploaded * 0.7),
      commentsAdded: Math.floor(Math.random() * 12) + 2,
      qualityChecks: Math.floor(Math.random() * 5),
    };
  });
}

export function generateDummyWorkflowRunsData(): LodgementChartData[] {
  return pastDays(14).map((d) => {
    const lodgements = Math.floor(Math.random() * 8) + 1;
    const reviews = Math.floor(Math.random() * 20) + 5;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: d.toISOString(),
      lodgements,
      reviews,
      total: lodgements + reviews,
    };
  });
}

export function generateDummyActiveSubscribersData(): ActiveAgentsChartData[] {
  return pastDays(14).map((d) => ({
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: Math.floor(Math.random() * 8) + 2,
    timestamp: d.toISOString(),
  }));
}
