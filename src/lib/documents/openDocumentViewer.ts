import { toast } from "sonner";

function getSizedWindowFeatures(): string {
  const width = 800;
  const height = 600;
  const top = (window.screen.height - height) / 2;
  const left = (window.screen.width - width) / 2;
  return `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`;
}

export function openDocumentInSizedWindow(url: string) {
  if (typeof window === "undefined" || !url) return;
  window.open(url, "_blank", getSizedWindowFeatures());
}

export function openBlankDocumentWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window.open("about:blank", "_blank", getSizedWindowFeatures());
}

export function navigateDocumentWindow(popup: Window | null, url: string) {
  if (!url) return;

  if (popup && !popup.closed) {
    popup.location.href = url;
    return;
  }

  toast.error("Allow popups to open this file");
}

export function isZohoHostedDocumentUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("zoho") || host.includes("workdrive");
  } catch {
    return false;
  }
}
