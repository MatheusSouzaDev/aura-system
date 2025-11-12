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
    <nav className="flex justify-between border-b border-solid px-4 py-3 sm:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-4 overflow-x-auto sm:gap-10">
        <Image
          src="/logo.svg"
          width={173}
          height={39}
          alt="Aura System Finance AI logo"
        />
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
      <div className="flex items-center">
        <div className="sm:hidden">
          <UserButton />
        </div>
        <div className="hidden sm:block">
          <UserButton showName />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
