export function openDocumentInSizedWindow(url: string) {
  if (typeof window === "undefined" || !url) return;
  const width = 800;
  const height = 600;
  const top = (window.screen.height - height) / 2;
  const left = (window.screen.width - width) / 2;
  window.open(
    url,
    "_blank",
    `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
  );
}

export function isZohoHostedDocumentUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("zoho") || host.includes("workdrive");
  } catch {
    return false;
  }
}
