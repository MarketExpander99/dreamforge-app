'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/user-context';
import { usePathname } from 'next/navigation';

export default function PublicLegalHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const backHref = user ? '/discover' : '/';
  const backLabel = user ? 'Back to app' : 'Back to homepage';

  const links = [
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/refund', label: 'Refund' },
    { href: '/delivery', label: 'Delivery' },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="Skill Gain" className="h-8 w-auto" />
          <span className="font-semibold text-xl tracking-tight group-hover:text-blue-600 transition-colors">
            Skill Gain
          </span>
        </Link>
        <Link 
          href={backHref} 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← {backLabel}
        </Link>
      </div>

      {/* Quick access to all legal pages */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-6 text-muted-foreground border-b pb-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={isActive ? 'text-foreground font-medium' : 'hover:text-foreground transition-colors'}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
