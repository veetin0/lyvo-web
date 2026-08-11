import RegisterPageContent from "@/components/auth/RegisterPageContent";

interface RegisterPageProps {
  params: Promise<{
    locale?: string;
  }>;
}

export default async function LocaleRegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  return <RegisterPageContent locale={locale} />;
}
