export function getProfileImageUrl(
  image: string | null | undefined,
): string | null {
  if (!image?.trim()) return null;

  const url = image.trim();

  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/person-yth/")) return url;

  return `/person-yth/${url.replace(/^\/+/, "")}`;
}
