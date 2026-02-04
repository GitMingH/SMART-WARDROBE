import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  // Mobile Bottom Link Styles
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${
      isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
    }`;

  // Desktop Sidebar Link Styles
  const desktopLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-4 px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-blue-50 text-blue-700 shadow-sm' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {/* ================= Mobile Bottom Navigation (< md) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full h-[60px] bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] pb-safe">
        <div className="flex h-full max-w-md mx-auto">
          <NavLink to="/" className={mobileLinkClass}>
            <span className="text-xl mb-0.5">🏠</span>
            首页
          </NavLink>
          <NavLink to="/wardrobe" className={mobileLinkClass}>
            <span className="text-xl mb-0.5">👔</span>
            衣橱
          </NavLink>
          <NavLink to="/add" className={mobileLinkClass}>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center -mt-4 shadow-lg border-2 border-white text-white">
              <span className="text-xl font-light">+</span>
            </div>
            <span className="mt-1">入库</span>
          </NavLink>
          <NavLink to="/ootd" className={mobileLinkClass}>
            <span className="text-xl mb-0.5">✨</span>
            搭配
          </NavLink>
          <NavLink to="/shop" className={mobileLinkClass}>
            <span className="text-xl mb-0.5">⚖️</span>
            决策
          </NavLink>
        </div>
      </nav>

      {/* ================= Desktop Sidebar Navigation (>= md) ================= */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex-col shadow-sm">
        <div className="p-6 pb-8 border-b border-slate-50">
           <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
             智能衣橱
           </h1>
           <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">SMART WARDROBE</p>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2">
          <NavLink to="/" className={desktopLinkClass}>
            <span className="text-xl w-6 text-center">🏠</span>
            仪表盘
          </NavLink>
          <NavLink to="/wardrobe" className={desktopLinkClass}>
            <span className="text-xl w-6 text-center">👔</span>
            我的衣橱
          </NavLink>
          <NavLink to="/ootd" className={desktopLinkClass}>
            <span className="text-xl w-6 text-center">✨</span>
            每日穿搭
          </NavLink>
          <NavLink to="/shop" className={desktopLinkClass}>
            <span className="text-xl w-6 text-center">⚖️</span>
            购物决策
          </NavLink>
        </div>

        <div className="p-4 border-t border-slate-100">
           <NavLink to="/add" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
              <span className="text-lg">+</span> 录入新衣
           </NavLink>
        </div>
      </nav>
    </>
  );
};

export default Navbar;