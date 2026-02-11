import LoginPageContent from "@/components/auth/LoginPageContent";

interface LoginPageProps {
  params: {
    locale?: string;
  };
}

export default function LocaleLoginPage({ params }: LoginPageProps) {
  return <LoginPageContent locale={params.locale} />;
}
