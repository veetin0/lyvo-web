
import { getRequestConfig } from 'next-intl/server';

const locales = ['fi', 'en', 'sv'];
const defaultLocale = 'fi';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is a valid string
  const validLocale = (locale && locales.includes(locale)) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});