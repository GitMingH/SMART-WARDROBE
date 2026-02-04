import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import { analyzeClothingImage } from '../services/geminiService';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem, Season, Formality } from '../types';

const AddItem: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useWardrobe();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<Partial<ClothingItem> | null>(null);

  const handleImageSelect = async (base64: string) => {
    setImage(base64);
    setAnalyzing(true);
    setAnalysisData(null);

    try {
      const data = await analyzeClothingImage(base64);
      
      // If data comes back empty (graceful failure), still allow user to proceed
      if (!data || (!data.category && !data.color)) {
         setAnalysisData({
             category: '',
             color: '',
             season: Season.All,
             formality: Formality.Casual,
             description: ''
         });
         // Optional: Toast notification here instead of alert
      } else {
         setAnalysisData(data);
      }
    } catch (error: any) {
      console.error("Critical error in AddItem", error);
      // Fallback manual entry
      setAnalysisData({
         category: '',
         color: '',
         season: Season.All,
         formality: Formality.Casual,
         description: ''
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (image && analysisData) {
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        imageUrl: image,
        category: analysisData.category || '未命名',
        color: analysisData.color || '无色',
        season: (analysisData.season as Season) || Season.All,
        formality: (analysisData.formality as Formality) || Formality.Casual,
        description: analysisData.description || '',
        dateAdded: Date.now()
      };
      addItem(newItem);
      navigate('/wardrobe');
    }
  };

  return (
    <div className="p-5 pb-24 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 pt-2">录入新衣</h1>
      
      <div className="space-y-6">
        <ImageUploader onImageSelected={handleImageSelect} label="拍摄或上传衣物" />

        {analyzing && (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 animate-pulse">
            <span className="text-3xl mb-2">🧠</span>
            <p className="text-sm">AI 正在识别材质与风格...</p>
          </div>
        )}

        {analysisData && (
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <h2 className="font-bold text-lg text-slate-800">识别结果</h2>
                 {analysisData.category ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">AI 已填充</span>
                 ) : (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">请手动填写</span>
                 )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">类别</label>
                <input 
                  type="text" 
                  value={analysisData.category} 
                  placeholder="如: T恤"
                  onChange={(e) => setAnalysisData({...analysisData, category: e.target.value})}
                  className="w-full border-b border-slate-200 py-2 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">颜色</label>
                <input 
                  type="text" 
                  value={analysisData.color} 
                  placeholder="如: 白色"
                  onChange={(e) => setAnalysisData({...analysisData, color: e.target.value})}
                  className="w-full border-b border-slate-200 py-2 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">适用季节</label>
                <select 
                  value={analysisData.season} 
                  onChange={(e) => setAnalysisData({...analysisData, season: e.target.value as Season})}
                  className="w-full border-b border-slate-200 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 appearance-none"
                >
                  {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">场景风格</label>
                <select 
                  value={analysisData.formality} 
                  onChange={(e) => setAnalysisData({...analysisData, formality: e.target.value as Formality})}
                  className="w-full border-b border-slate-200 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 appearance-none"
                >
                  {Object.values(Formality).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">描述备注</label>
                 <input 
                  type="text" 
                  value={analysisData.description} 
                  placeholder="补充更多细节..."
                  onChange={(e) => setAnalysisData({...analysisData, description: e.target.value})}
                  className="w-full border-b border-slate-200 py-2 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
                />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-3.5 mt-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
            >
              确认并保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddItem;