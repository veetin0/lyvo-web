import LoginPageContent from "@/components/auth/LoginPageContent";

interface LoginPageProps {
  params: Promise<{
    locale?: string;
  }>;
}

export default async function LocaleLoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  return <LoginPageContent locale={locale} />;
}
