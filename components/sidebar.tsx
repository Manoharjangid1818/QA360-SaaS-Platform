'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Bug,
  Sparkles,
  PlayCircle,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  FileJson,
  Code2,
  CalendarClock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Test Suite', href: '/test-cases', icon: ClipboardList },
  { label: 'Defect Tracker', href: '/bugs', icon: Bug },
  { label: 'AI Test Writer', href: '/ai-generator', icon: Sparkles },
  { label: 'Test Scheduler', href: '/schedules', icon: CalendarClock },
  {
    label: 'Automation',
    href: '/playwright',
    icon: PlayCircle,
    children: [
      { label: 'Report Analyzer', href: '/playwright', icon: FileJson },
      { label: 'Code Generator', href: '/codegen', icon: Code2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Auto-expand Automation group when on a child route
  const automationPaths = ['/playwright', '/codegen'];
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(automationPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ? ['/playwright'] : []),
  );

  // Keep expanded in sync when route changes
  useEffect(() => {
    if (automationPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      setExpanded((prev) => new Set([...prev, '/playwright']));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase?.auth.signOut();
    }
    router.push('/login');
  };

  const toggleExpand = (href: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center px-6 py-5 border-b border-gray-700">
        <div className="bg-blue-600 p-2 rounded-lg mr-3">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">QA360</span>
          <p className="text-xs text-gray-400">Test Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, children }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const isChildActive = children?.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + '/'),
          );
          const isOpen = expanded.has(href);

          if (children) {
            return (
              <div key={href}>
                {/* Parent row — toggles the group open/closed */}
                <button
                  onClick={() => toggleExpand(href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors',
                    isChildActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>

                {/* Children */}
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
                    {children.map((child) => {
                      const childActive = pathname === child.href;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            childActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                          {childActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular item
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
