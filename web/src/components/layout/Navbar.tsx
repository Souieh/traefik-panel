import logo from '@/assets/tp-logo.svg';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import {
  Activity,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Server,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/routers', label: 'Routers', icon: Route },
    { href: '/services', label: 'Services', icon: Server },
    { href: '/middlewares', label: 'Middlewares', icon: Layers },
    { href: '/status', label: 'Status', icon: Activity },
    {
      href: '/certificates-resolvers',
      label: 'Cert Resolvers',
      icon: ShieldCheck,
    },
    { href: '/users', label: 'Users', icon: Users },
  ];

  const activeTab =
    navItems.find((item) =>
      item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
    )?.href || (pathname.startsWith('/settings') ? '/settings' : '/dashboard');

  return (
    <header
      className={
        'sticky w-full pa  top-0 z-30 block   gap-8 border-b bg-white   shadow-sm shadow-gray-100 hover:shadow-lg '
      }
    >
      {/* Top Bar: Allegedly the main navigation area */}
      <div className='flex-1 border-b'>
        <div className='  max-w-7xl mx-auto  flex flex-wrap flex-row items-center py-4 px-4 sm:px-6 lg:px-8'>
          <div className='md:hidden mr-2 flex items-center'>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left'>
                <SheetHeader>
                  <SheetTitle>Traefik Panel</SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-4 mt-4'>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                          ? 'text-primary font-bold flex items-center gap-2'
                          : 'text-muted-foreground transition-colors hover:text-primary flex items-center gap-2'
                      }
                    >
                      <item.icon className='h-4 w-4' />
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to='/settings'
                    onClick={() => setIsOpen(false)}
                    className={
                      pathname === '/settings'
                        ? 'text-primary font-bold flex items-center gap-2'
                        : 'text-muted-foreground transition-colors hover:text-primary flex items-center gap-2'
                    }
                  >
                    <Settings className='h-4 w-4' />
                    Settings
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className='flex items-center gap-2 font-semibold'>
            <img src={logo} alt='Logo' className='h-8 w-8' />
            <span className='hidden md:inline-block'>Traefik Panel</span>
          </div>
          <div className=' ml-auto flex items-center gap-4'>
            {user && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <UserIcon className='h-4 w-4' />
                <span className='hidden md:inline-block'>{user.username}</span>
              </div>
            )}
            <Button variant='ghost' size='icon' onClick={handleLogout} title='Logout'>
              <LogOut className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </div>
      {/* Desktop Nav: Supposedly visible on larger screens */}
      <div className='hidden md:block  max-w-7xl mx-auto '>
        <Tabs value={activeTab} className='w-full'>
          <TabsList className='w-full justify-start h-auto p-0 bg-transparent overflow-x-auto'>
            {navItems.map((item) => (
              <TabsTrigger
                key={item.href}
                value={item.href}
                asChild
                className='data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none py-4 px-4 text-muted-foreground data-[state=active]:text-primary'
              >
                <Link to={item.href}>
                  <item.icon className='mr-2 h-4 w-4' />
                  {item.label}
                </Link>
              </TabsTrigger>
            ))}
            <TabsTrigger
              value='/settings'
              asChild
              className='ml-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none py-4 px-4 text-muted-foreground data-[state=active]:text-primary'
            >
              <Link to='/settings'>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
