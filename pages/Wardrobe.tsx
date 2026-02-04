import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';

type FilterType = '全部' | '上装' | '下装' | '鞋履' | '其它';

const Wardrobe: React.FC = () => {
  const { items, deleteItem } = useWardrobe();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 3秒后自动取消确认状态
  useEffect(() => {
    if (confirmId) {
      const timer = setTimeout(() => setConfirmId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmId]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (confirmId === id) {
      deleteItem(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  // 简单的分类映射逻辑
  const getCategoryGroup = (category: string): FilterType => {
    if (['T恤', '衬衫', '卫衣', '毛衣', '针织衫', '外套', '夹克', '大衣', '羽绒服', '马甲', '吊带', '西装外套'].some(k => category.includes(k))) return '上装';
    if (['裤', '裙'].some(k => category.includes(k))) return '下装';
    if (['鞋', '靴'].some(k => category.includes(k))) return '鞋履';
    return '其它';
  };

  const filteredItems = items.filter(item => {
    // 1. Category Filter
    if (filterType !== '全部') {
      const group = getCategoryGroup(item.category);
      // 特殊处理连体衣等
      if (filterType === '上装' && (item.category.includes('连体') || item.category.includes('裙'))) {
          // Keep dresses in both or specific logic? Let's simplify: Dresses are usually Full Body, maybe put in Bottoms or Tops? 
          // Let's put Dresses in "其它" or make a "全身" tab. 
          // For now, simple grouping.
      }
      if (group !== filterType && !(filterType === '其它' && group === '其它')) return false;
    }
    
    // 2. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-5 md:p-10 pb-24 md:pb-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-8 pt-2 gap-4">
         <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">我的衣橱</h1>
            <div className="text-sm text-slate-400 font-medium mt-1">共 {items.length} 件单品 · 资产利用率 {Math.round(items.filter(i => (i.wearCount || 0) > 0).length / items.length * 100 || 0)}%</div>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             {/* Search Input */}
             <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                 <input 
                    type="text" 
                    placeholder="搜索颜色、款式..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                 />
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {(['全部', '上装', '下装', '鞋履', '其它'] as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    filterType === type 
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-105' 
                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                }`}
              >
                  {type}
              </button>
          ))}
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-4 opacity-50">🧺</div>
          <p className="text-lg font-medium">没有找到相关衣物</p>
          {items.length === 0 && <p className="text-sm mt-2">快去点击“入库”添加你的第一件衣服吧</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all group relative flex flex-col select-none">
              <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden">
                <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                {/* Delete Button */}
                <button 
                  type="button"
                  onClick={(e) => handleDeleteClick(e, item.id)}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-20 ${
                    confirmId === item.id 
                      ? 'bg-red-500 text-white scale-110' 
                      : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  {confirmId === item.id ? (
                    <span className="text-[10px] font-bold">删</span>
                  ) : (
                    <span className="text-sm">✕</span>
                  )}
                </button>

                {/* Wear Count Badge (New) */}
                <div className="absolute top-2 left-2 z-10">
                     <span className={`text-[10px] px-2 py-1 backdrop-blur-md rounded-lg font-bold border ${
                         (item.wearCount || 0) > 10 ? 'bg-amber-100/80 text-amber-700 border-amber-200' : 
                         (item.wearCount || 0) === 0 ? 'bg-slate-100/80 text-slate-500 border-slate-200' :
                         'bg-blue-100/80 text-blue-700 border-blue-200'
                     }`}>
                        {item.wearCount || 0}次穿着
                    </span>
                </div>

                <div className="absolute bottom-2 left-2 pointer-events-none">
                     <span className="text-[10px] px-2 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg">
                        {item.season}
                    </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base truncate" title={`${item.color} ${item.category}`}>{item.color} {item.category}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2.5em]">{item.description || '暂无描述'}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded">
                        {item.formality}
                    </span>
                    {item.lastWorn && (
                        <span className="text-[9px] text-slate-300">
                           {Math.floor((Date.now() - item.lastWorn) / (1000 * 60 * 60 * 24))}天前穿过
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wardrobe;