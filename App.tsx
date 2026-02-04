import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Wardrobe from './pages/Wardrobe';
import AddItem from './pages/AddItem';
import OOTD from './pages/OOTD';
import Shopping from './pages/Shopping';
import ChatAssistant from './components/ChatAssistant';
import { WardrobeProvider } from './context/WardrobeContext';

function App() {
  return (
    <WardrobeProvider>
      <HashRouter>
        <div className="font-sans antialiased text-slate-900 bg-gray-50 min-h-screen flex flex-col md:flex-row">
            {/* Navigation (Handles both Mobile Bottom and Desktop Side) */}
            <Navbar />

            {/* Main Content Area */}
            {/* Mobile: padding-bottom for nav. Desktop: padding-left for sidebar. */}
            <main className="flex-1 w-full min-h-screen relative pb-20 md:pb-0 md:pl-64 transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full h-full">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/wardrobe" element={<Wardrobe />} />
                    <Route path="/add" element={<AddItem />} />
                    <Route path="/ootd" element={<OOTD />} />
                    <Route path="/shop" element={<Shopping />} />
                  </Routes>
                </div>

                {/* Global Chat Button */}
                <ChatAssistant />
            </main>
        </div>
      </HashRouter>
    </WardrobeProvider>
  );
}

export default App;