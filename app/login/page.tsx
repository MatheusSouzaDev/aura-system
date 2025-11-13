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
    <div className="grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-2">
      <div className="mx-auto flex h-full w-full max-w-[550px] flex-col justify-center px-6 py-12 sm:px-10">
        <Image
          src="/AurianLogo.svg"
          alt="login"
          width={173}
          height={39}
          className="mb-8"
        />
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Bem-vindo</h1>
        <p className="mb-8 text-muted-foreground">
          A Aura System AI é uma plataforma de gestão financeira que utiliza IA
          para monitorar suas movimentações, e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>
        <SignInButton>
          <Button variant="outline" className="w-full sm:w-auto">
            <LogInIcon className="mr-2" />
            Fazer login ou criar conta
          </Button>
        </SignInButton>
      </div>
      <div className="relative hidden h-full w-full lg:block">
        <Image
          src="/login.png"
          alt="Aura System"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
