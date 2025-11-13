"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkItem {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  {
    href: "/",
    label: "Dashboard",
  },
  {
    href: "/transactions",
    label: "Transações",
  },
  {
    href: "/subscription",
    label: "Assinatura",
  },
];

const Navbar = () => {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2 border-b border-solid px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      {/* Top row (mobile): logo left, user button right */}
      <div className="flex items-center justify-between">
        <Image
          src="/AurianLogoAlternative.svg"
          width={173}
          height={39}
          alt="Aura System Finance AI logo"
        />
        <div className="sm:hidden">
          <UserButton />
        </div>
      </div>

      {/* Links row (mobile below, desktop inline on the left) */}
      <div className="flex min-w-0 items-center gap-4 overflow-x-auto sm:gap-8">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={
                isActive ? "font-bold text-primary" : "text-muted-foreground"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right (desktop): user with name */}
      <div className="hidden sm:block">
        <UserButton showName />
      </div>
    </nav>
  );
};

export default Navbar;
