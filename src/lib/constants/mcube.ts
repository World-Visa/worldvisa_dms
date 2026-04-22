export const MCUBE_WIDGET_AUTH_BASE =
  "https://mcube.vmc.in/common-widget/Phone/auth";

export function buildMcubeWidgetIframeSrc(
  username: string,
  authToken: string,
): string {
  const params = new URLSearchParams({
    username,
    auth_token: authToken,
  });
  return `${MCUBE_WIDGET_AUTH_BASE}?${params.toString()}`;
}
