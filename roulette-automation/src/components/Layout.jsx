import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ClockIcon, 
  Cog6ToothIcon, 
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, current: true },
  { name: 'Game', href: '/game', icon: CurrencyDollarIcon, current: false },
  { name: 'History', href: '/history', icon: ClockIcon, current: false },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, current: true },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon, current: false },
  { name: 'Bets', href: '/admin/bets', icon: ChartBarIcon, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ isAdmin = false }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentNav, setCurrentNav] = useState(isAdmin ? adminNavigation : navigation);

  // Update navigation active state based on current route
  useEffect(() => {
    const nav = isAdmin ? [...adminNavigation] : [...navigation];
    const updatedNav = nav.map(item => ({
      ...item,
      current: location.pathname === item.href
    }));
    setCurrentNav(updatedNav);
  }, [location.pathname, isAdmin]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-indigo-600 p-4">
          <div className="flex items-center">
            <button
              type="button"
              className="text-white focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-white">
              {isAdmin ? 'Admin Panel' : 'Roulette Auto'}
            </h1>
          </div>
          <div className="flex items-center">
            <span className="text-white mr-4">
              {user?.balance?.toFixed(2)} credits
            </span>
            <Menu as="div" className="relative">
              <Menu.Button className="flex rounded-full bg-indigo-700 text-sm focus:outline-none">
                <span className="sr-only">Open user menu</span>
                <UserCircleIcon className="h-8 w-8 text-white" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block w-full text-left px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-indigo-700">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-2xl font-bold text-white">
                {isAdmin ? 'Admin Panel' : 'Roulette Auto'}
              </h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {currentNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-75',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      item.current ? 'text-indigo-300' : 'text-indigo-200',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 bg-indigo-600 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <UserCircleIcon className="h-9 w-9 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs font-medium text-indigo-200">
                    {user?.balance?.toFixed(2)} credits
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={handleLogout}
                    className="text-indigo-200 hover:text-white"
                    title="Sign out"
                  >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
      </div>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex h-full flex-col bg-indigo-700">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-2xl font-bold text-white">
                {isAdmin ? 'Admin Panel' : 'Roulette Auto'}
              </h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {currentNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-75',
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={classNames(
                      item.current ? 'text-indigo-300' : 'text-indigo-200',
                      'mr-4 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 bg-indigo-600 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <UserCircleIcon className="h-9 w-9 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs font-medium text-indigo-200">
                    {user?.balance?.toFixed(2)} credits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
