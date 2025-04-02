import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";

const Home = async ({ searchParams }: { searchParams: { month?: string } }) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const currentMonth = searchParams.month || String(new Date().getMonth() + 1); // Define o mês atual como padrão se não houver na URL

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <TimeSelect month={currentMonth} />{" "}
          {/* Passando o mês para TimeSelect */}
        </div>
        <SummaryCards month={currentMonth} />{" "}
        {/* Garantindo que SummaryCards receba o mês correto */}
      </div>
    </>
  );
};

export default Home;
