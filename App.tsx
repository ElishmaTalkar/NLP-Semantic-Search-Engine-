import { useRef } from 'react';
import { Routes, Route, Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Pricing } from './pages/Pricing';
import { ApiAccess } from './pages/ApiAccess';

const Layout = () => {
    // Mechanism to trigger the Demo function inside Home from the Header
    const demoHandlerRef = useRef<(() => Promise<void>) | null>(null);

    const registerDemoHandler = (handler: () => Promise<void>) => {
        demoHandlerRef.current = handler;
    };

    const handleDemoClick = () => {
        if (demoHandlerRef.current) {
            demoHandlerRef.current();
        } else {
            // If not on Home page, go there? 
            // For now, simpler to just alert or do nothing if not on Home.
            // Ideally should navigate to '/' and then trigger.
            window.location.href = '/?demo=true';
        }
    };

    // Note: Handling query param for demo when landing would be robust but skipping for simplicity now.

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            <Header onDemoClick={handleDemoClick} />
            <div className="flex-grow">
                <Outlet context={{ registerDemoHandler }} />
            </div>

            {/* Footer */}
            <footer className="w-full glass mt-auto py-12 border-t border-white/20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-2 text-shadow">Semantic NLP Search - Intelligent Document Analysis</h3>
                    <p className="text-white/70 text-sm">Upload your documents and perform advanced semantic searches using natural language processing to find relevant content instantly.</p>
                </div>
            </footer>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="services" element={<Services />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="api" element={<ApiAccess />} />
            </Route>
        </Routes>
    );
}

export default App;
