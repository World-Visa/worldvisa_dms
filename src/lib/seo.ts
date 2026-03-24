type MetaProps = {
  title?: string;
  description?: string;
  noIndex?: boolean;
};

export function createMeta({
  title,
  description,
  noIndex = false,
}: MetaProps = {}) {
  const defaultDescription =
    'WorldVisa DMS enables visa agencies to securely manage client documents, track application progress, and streamline workflows.';

  const pageTitle = title
    ? `${title} | WorldVisa DMS`
    : 'WorldVisa DMS';

  const pageDescription = description || defaultDescription;

  return {
    title: pageTitle,
    description: pageDescription,

    openGraph: {
      title: pageTitle,
      description: pageDescription,
      siteName: 'WorldVisa DMS',
      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },

    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}