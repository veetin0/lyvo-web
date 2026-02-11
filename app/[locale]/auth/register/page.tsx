import RegisterPageContent from "@/components/auth/RegisterPageContent";

interface RegisterPageProps {
  params: {
    locale?: string;
  };
}

export default function LocaleRegisterPage({ params }: RegisterPageProps) {
  return <RegisterPageContent locale={params.locale} />;
}
