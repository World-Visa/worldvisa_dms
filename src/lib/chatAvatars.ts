// Available avatar indices in public/avatars/
const AVAILABLE_AVATARS = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

export function getDefaultAvatarSrc(userId: string | null | undefined): string {
  if (!userId) {
    return `/avatars/${AVAILABLE_AVATARS[0]}.png`;
  }

  const parsed = parseInt(userId.slice(-4), 16);
  const index = isNaN(parsed) ? 0 : parsed % AVAILABLE_AVATARS.length;
  return `/avatars/${AVAILABLE_AVATARS[index]}.png`;
}
