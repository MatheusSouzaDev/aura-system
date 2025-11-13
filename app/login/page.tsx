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
    <div className="relative grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-2">
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/login.png"
          alt="Aura System background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-[550px] flex-col justify-center px-6 py-12 sm:px-10">
        <div
          className="rounded-3xl border px-6 py-10 text-white shadow-xl sm:px-10"
          style={{
            background: "rgba(8,42,77,0.45)",
            borderColor: "rgba(8,42,77,0.225)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <Image
            src="/AurianLogoAlternative.svg"
            alt="Aura System logo"
            width={173}
            height={39}
            className="mb-8"
          />
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Bem-vindo</h1>
          <p className="mb-8 text-white/80">
            A Aura System AI é uma plataforma de gestão financeira que utiliza
            IA para monitorar suas movimentações e oferecer insights
            personalizados, facilitando o controle do seu orçamento.
          </p>
          <SignInButton>
            <Button
              variant="outline"
              className="w-full border-white/40 text-white hover:bg-white/10 sm:w-auto"
            >
              <LogInIcon className="mr-2" />
              Fazer login ou criar conta
            </Button>
          </SignInButton>
        </div>
      </div>

      <div className="relative hidden h-full w-full lg:block">
        <Image
          src="/login.png"
          alt="Aura System"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
