export const slugify = (value = '') => value
  .toString()
  .toLowerCase()
  .trim()
  .replace(/["']/g, '')
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

export const buildSightseeingUrl = (sightseeing) => {
  const country = sightseeing?.country || '';
  const city = sightseeing?.city || '';
  const slug = slugify(sightseeing?.name || 'details');

  if (!country || !city) {
    // Fallback for incomplete data
    return `/sightseeing/${sightseeing?._id}/${slug}`;
  }

  return `/sightseeing/${encodeURIComponent(country)}/${encodeURIComponent(city)}/${encodeURIComponent(slug)}`;
};
