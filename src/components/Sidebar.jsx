import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Home, BarChart2, CheckSquare, Book, MessageSquare } from 'lucide-react';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const menuItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: <Home className="h-5 w-5" />
        },
        {
            path: '/analyse',
            label: 'Analyse',
            icon: <BarChart2 className="h-5 w-5" />
        },
        {
            path: '/lkg-compliance',
            label: 'Compliance',
            icon: <CheckSquare className="h-5 w-5" />
        },
        {
            path: '/documents',
            label: 'Dokumente',
            icon: <Book className="h-5 w-5" />
        },
        { path: '/kommunikation', label: 'Kommunikation', icon: <MessageSquare className="h-5 w-5" /> }
    ];
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleMobileSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    return (
        <>
            <button
                className="fixed top-4 left-4 z-30 bg-white/90 backdrop-blur-md text-blue-700 p-2 rounded-full shadow-lg lg:hidden hover:bg-blue-50 transition-all duration-300"
                onClick={toggleMobileSidebar}
                aria-label="Toggle mobile menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
            </button>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                    onClick={toggleMobileSidebar}
                ></div>
            )}

            <div
                className={`fixed z-20 inset-y-0 left-0 transform transition-all duration-300 ease-in-out 
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:translate-x-0 
                    ${isCollapsed ? 'w-16' : 'w-60'} 
                    bg-[#1a2542] text-white flex flex-col shadow-xl overflow-hidden`}
            >
                <div className="relative overflow-hidden bg-[#1a2542] py-4 px-3 border-b border-white/10">
                    <div className={`transition-all duration-300 ${isCollapsed ? 'scale-75 mx-auto' : ''}`}>
                        {!isCollapsed ? (
                            <div className="font-bold text-xl tracking-tight text-white">
                                Chain<span className="text-blue-300">Guard</span>
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-blue-700/30 rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CG</span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className="hidden lg:block absolute right-1 top-14 text-white/50 hover:text-white/80 transition-colors"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar width"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
                    </svg>
                </button>

                <nav className="flex flex-col gap-1 px-2 py-5 flex-grow">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <a
                                key={item.path}
                                href={item.path}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} 
                                    ${isActive
                                        ? 'bg-blue-600/20 text-white'
                                        : 'text-blue-100/70 hover:bg-white/5'} 
                                    rounded-md transition-all duration-200 group
                                    ${isCollapsed ? 'p-3' : 'px-3 py-2.5'}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(item.path);
                                    setIsMobileOpen(false);
                                }}
                            >
                                <div className={`transition-colors duration-200 ${isActive ? 'text-blue-300' : 'text-blue-100/70 group-hover:text-blue-200'}`}>
                                    {item.icon}
                                </div>

                                {!isCollapsed && (
                                    <div className="flex justify-between items-center w-full">
                                        <span className="ml-3 text-sm">{item.label}</span>
                                        {isActive && (
                                            <span className="text-xs py-0.5 px-2 rounded-md bg-blue-500/30 text-blue-200">
                                                Aktiv
                                            </span>
                                        )}
                                    </div>
                                )}

                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </a>
                        );
                    })}
                </nav>

                {!isCollapsed && (
                    <div className="px-3 py-2 text-xs text-blue-200/70">
                        <div>{formattedDate}</div>
                        <div>{formattedTime}</div>
                    </div>
                )}

                <div className="mt-auto border-t border-white/10">
                    <div className={`px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-700/30 flex items-center justify-center text-blue-100 font-medium shadow-sm">
                            U
                        </div>
                        {!isCollapsed && (
                            <div className="flex-grow">
                                <div className="text-sm font-medium text-white">User</div>
                                <div className="text-xs text-blue-200/70">ChainGuard Pro</div>
                            </div>
                        )}
                    </div>

                    <button
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} 
                            px-3 py-3 text-blue-100 hover:bg-blue-700/20 transition-colors duration-200 text-sm`}
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/');
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>
        </>
    );
}