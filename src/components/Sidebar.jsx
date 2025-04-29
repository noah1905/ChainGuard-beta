import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/supabaseClient';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <>
            <button
                className="absolute top-0 left-4 z-10 bg-blue-900 text-white p-2 rounded-md md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                ☰
            </button>

            <div className={`fixed z-10 inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-blue-900 text-white flex flex-col pt-2 pb-4 px-4`}>
                <div className="flex items-center justify-center mt-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="810" height="600" viewBox="0 0 810 400" className="h-36 w-auto"><path fill="#0097b2" d="M215 395c-9-10-24-10-34 0l-13 13a30 30 0 0 1 13 1l7-7a14 14 0 0 1 20 0 14 14 0 0 1 0 19l-15 15c-3 3-6 4-10 4a14 14 0 0 1-13-8l-4 2-4 4 4 6c10 9 25 9 34 0l15-15c10-10 10-25 0-34Zm0 0" /><path fill="#0097b2" d="m183 458-10-2-7 8a14 14 0 0 1-20 0 14 14 0 0 1 0-20l15-15a14 14 0 0 1 20 0l3 5 4-3 4-4a24 24 0 0 0-38-5l-15 15a24 24 0 1 0 34 34l13-13h-3Zm0 0" /><path fill="#fff" d="M277 459h11v10l-1 1h-9l-10-1-9-2-9-5-5-9a35 35 0 0 1 0-26 23 23 0 0 1 14-14l9-3h19l1 1v23h-11v-13l-12 1-8 6c-2 3-3 7-3 12l1 9 5 6 6 3 6 1h5ZM302 436h-12v-25l1-1h10l1 1Zm33-26 1 1v58l-1 1h-10v-11h-23v10l-1 1h-10l-1-1v-22h35v-37ZM385 469v1h-11v-1l-12-33-12 33-1 1h-10l-1-1 23-59h2ZM412 460h1v9l-1 1h-23l-1-1v-9h7v-50h11v50ZM464 410l1 1v58l-1 1h-10l-28-40v25h-12v-44l1-1h11l28 40v-40ZM513 421h-16l-6 1-6 3c-2 1-3 3-4 6l-2 9c0 5 1 8 3 11s5 5 8 6c3 2 7 2 12 2v-15h-12v-12h23v37l-1 1h-9l-10-1-9-2-8-5c-3-2-5-5-6-9-2-3-3-8-3-13s1-10 3-13c1-4 3-7 6-9l8-5 9-2 10-1h9l1 1ZM560 410l1 1v39c0 4-1 8-3 11s-5 5-9 7l-11 2c-4 0-8-1-11-3-4-1-6-3-8-6s-3-7-3-11v-29h11v29c0 3 1 5 4 7l7 2 5-1 5-3 1-5v-39l1-1ZM610 469v1h-11l-1-1-12-33-11 33-1 1h-11v-1l23-59h1ZM653 469v1h-11l-1-1-11-23h-6v23l-1 1h-10l-1-1v-34h20l3-1h3l2-2 1-4-1-4-2-2-3-1h-23v-10l1-1h23l5 1 6 3 4 5 2 9-2 7-4 6-5 3a602 602 0 0 0 11 25ZM666 410h9l10 3 8 5 6 8 2 14-2 13-6 9-8 5-10 2-9 1h-10l-1-1v-23h12v13h5l6-1 6-3 4-6 2-9c0-5-1-9-3-12l-8-6-12-1v13h-12v-23l1-1Zm0 0" /></svg>
                </div>
                <nav className="flex flex-col gap-6">
                    <a
                        href="/dashboard"
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 ${location.pathname === '/dashboard'
                            ? 'bg-blue-700 text-blue-100 font-bold'
                            : 'hover:bg-blue-800/40 hover:text-white'
                            }`}
                        onClick={() => setIsOpen(false)}
                    >
                        Dashboard
                    </a>
                    <a
                        href="/suppliers"
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 ${location.pathname === '/suppliers'
                            ? 'bg-blue-700 text-blue-100 font-bold'
                            : 'hover:bg-blue-800/40 hover:text-white'
                            }`}
                        onClick={() => setIsOpen(false)}
                    >
                        Lieferanten
                    </a>
                    <a
                        href="/audit"
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 ${location.pathname === '/audit'
                            ? 'bg-blue-700 text-blue-100 font-bold'
                            : 'hover:bg-blue-800/40 hover:text-white'
                            }`}
                        onClick={() => setIsOpen(false)}
                    >
                        Audit Log
                    </a>
                    <a
                        href="/whistleblower"
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 ${location.pathname === '/whistleblower'
                            ? 'bg-blue-700 text-blue-100 font-bold'
                            : 'hover:bg-blue-800/40 hover:text-white'
                            }`}
                        onClick={() => setIsOpen(false)}
                    >
                        Whistleblower
                    </a>
                </nav>
                <button
                    className="mt-auto mb-2 flex items-center gap-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/');
                    }}
                >
                    Logout
                </button>
            </div>
        </>
    );
}