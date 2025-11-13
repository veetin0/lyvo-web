
import { getRequestConfig } from 'next-intl/server';
// @ts-expect-error – dynamic locale imports
export default getRequestConfig(async ({ locale }) => ({
    messages: (await import(`../messages/${locale}.json`)).default,
}));