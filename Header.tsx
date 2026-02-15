import { Search, Menu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
    onDemoClick: () => void;
}

export const Header = ({ onDemoClick }: HeaderProps) => (
    <header className="glass sticky top-0 z-50 py-4 px-4 sm:px-8 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F95700] to-[#ff6b1a] rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-[#F95700] to-[#ff6b1a] p-2 rounded-xl text-black transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                        <Sparkles size={24} strokeWidth={2.5} className="animate-pulse-slow" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight text-black text-shadow">
                        Semantic <span className="bg-gradient-to-r from-[#F95700] to-[#ff6b1a] bg-clip-text text-transparent">NLP</span>
                    </span>
                    <span className="text-xs text-black/70 font-medium">Intelligent Search</span>
                </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-black/80">
                <Link
                    to="/about"
                    className="hover:text-black transition-all duration-300 relative group px-2 py-1"
                >
                    <span className="relative z-10">About</span>
                    <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                </Link>
                <Link
                    to="/services"
                    className="hover:text-black transition-all duration-300 relative group px-2 py-1"
                >
                    <span className="relative z-10">Services</span>
                    <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                </Link>
                <Link
                    to="/pricing"
                    className="hover:text-black transition-all duration-300 relative group px-2 py-1"
                >
                    <span className="relative z-10">Pricing</span>
                    <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                </Link>
                <Link
                    to="/api"
                    className="hover:text-black transition-all duration-300 relative group px-2 py-1"
                >
                    <span className="relative z-10">API</span>
                    <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                </Link>
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
                <button
                    onClick={onDemoClick}
                    className="relative group overflow-hidden bg-gradient-to-r from-[#F95700] to-[#ff6b1a] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                    <span className="relative z-10 flex items-center gap-2 text-black">
                        <Search size={16} />
                        GET STARTED
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b1a] to-[#F95700] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button className="text-black/80 font-semibold text-sm hover:text-black flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300">
                    LOGIN
                </button>
            </div>

            {/* Mobile Menu */}
            <button className="md:hidden text-black p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu size={28} />
            </button>
        </div>
    </header>
);
