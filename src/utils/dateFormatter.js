export function formatDate(dateString, locale = 'en-IN', options = {}) {
  if (!dateString || dateString === '-') return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      ...options
    });
  } catch {
    return '-';
  }
}