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
  console.log(`${MCUBE_WIDGET_AUTH_BASE}?${params.toString()}`);
  return `${MCUBE_WIDGET_AUTH_BASE}?${params.toString()}`;
}


// https://mcube.vmc.in/common-widget/Phone/auth?username=pavithra@worldvisa.in&auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJUSEVfQ0xBSU0iLCJhdWQiOiJUSEVfQVVESUVOQ0UiLCJpYXQiOjE3NzMxMTkyNDMsImV4cF9kYXRhIjoxODA0NjU1MjQzLCJkYXRhIjp7ImJpZCI6IjY0NTcifX0.b_uWec8rw5pGGVlavpZ86OJIJPLu79fheMLNL0Z3Yzs