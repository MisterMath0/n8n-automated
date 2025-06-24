"use client";

import Link from 'next/link';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const menu = [
  { label: 'Generate Workflow', href: '/dashboard' },
  { label: 'My Workflows', href: '/dashboard/workflows' },
  { label: 'Account', href: '/dashboard/account' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-screen w-64 bg-black border-r border-white/10 flex flex-col py-6 px-4 fixed left-0 top-0 z-20">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image 
          src="/logo.png"
          alt="Autokraft Logo"
          width={32} 
          height={32}
          className="drop-shadow-lg"
        />
        <span className="text-2xl font-bold text-white">Autokraft</span>
      </Link>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={`w-full justify-start ${pathname === item.href ? 'bg-primary text-white' : 'text-white'}`}
                >
                  {item.label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
} 