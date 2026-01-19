import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="bg-sentinel-nav text-white shadow-xl border-b border-indigo-900 sticky top-0 z-50">
            <div className="container mx-auto p-4 flex justify-between items-center">
                {/* LOGO */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded flex items-center justify-center shadow-lg transform -skew-x-12">
                        <span className="font-black text-xl italic transform skew-x-12">S</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest uppercase leading-none">Sentinel</h1>
                        <p className="text-[10px] text-gray-400 tracking-wider">FLEET COMMAND</p>
                    </div>
                </div>

                {/* LINKS - Hidden on Mobile, shown on Desktop */}
                <div className="hidden md:flex gap-4">
                    <Link to="/" className="text-sm font-mono hover:text-red-400 transition-colors py-2">STATUS</Link>
                    <Link to="/add" className="text-sm font-mono bg-white text-sentinel-bg px-4 py-2 rounded font-bold hover:bg-red-600 hover:text-white transition-all shadow-lg">
                        + NEW UNIT
                    </Link>
                </div>
            </div>
        </nav>
    );
}
