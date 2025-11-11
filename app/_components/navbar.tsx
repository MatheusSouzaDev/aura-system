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
    <nav className="flex justify-between border-b border-solid px-8 py-4">
      <div className="flex items-center gap-10">
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
      <UserButton showName />
    </nav>
  );
};

export default Navbar;
