import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sentinel-nav border-t border-indigo-900 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    to="/"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-red-500' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Home" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                </Link>

                <Link
                    to="/add"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/add') ? 'text-red-500' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Unit</span>
                </Link>

                <Link
                    to="/report"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/report') ? 'text-red-500' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Report</span>
                </Link>
            </div>
        </nav>
    );
}
