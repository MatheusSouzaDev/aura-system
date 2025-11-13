import Image from "next/image";
import { Button } from "../_components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background lg:flex-row">
      <Image
        src="/login.svg"
        alt="Aura System background"
        fill
        priority
        className="object-cover object-top"
      />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-6 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-0">
        <div
          className="w-full max-w-[780px] rounded-[32px] border px-6 py-10 text-white shadow-2xl sm:px-12 sm:py-12"
          style={{
            background: "rgba(8,42,77,0.45)",
            borderColor: "rgba(8,42,77,0.225)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <Image
              src="/AurianLogoAlternative.svg"
              alt="Aurian logo"
              width={360}
              height={140}
              priority
            />
          </div>
          <h1 className="mb-6 text-3xl font-bold sm:text-[40px] sm:leading-tight">
            Bem-vindo
          </h1>
          <p className="mb-10 text-base text-white/80 sm:text-lg">
            A Aura System AI é uma plataforma inteligente de gestão financeira
            que acompanha suas movimentações em tempo real, identifica padrões e
            oferece insights personalizados para melhorar suas decisões, com
            análises automatizadas e uma experiência simples e intuitiva,
            transformando seus dados financeiros em controle real do seu
            orçamento.
          </p>
          <SignInButton>
            <Button
              variant="ghost"
              className="w-full border border-[#2c5c87] bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              <LogInIcon className="mr-2" />
              Fazer login ou criar conta
            </Button>
          </SignInButton>
        </div>
      </div>

      <div className="relative z-10 hidden w-full flex-1 items-center justify-center px-12 lg:flex">
        <Image
          src="/AurianLogoAlternative.svg"
          alt="Aurian logo"
          width={600}
          height={200}
          className="w-full max-w-3xl"
          priority
        />
      </div>
    </div>
  );
};

export default LoginPage;
