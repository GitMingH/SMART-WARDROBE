import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { getLocalWeather } from '../services/weatherService';
import { suggestOutfit, generateOutfitImage, visualizeOutfit } from '../services/geminiService';
import { WeatherData, ClothingItem } from '../types';
import ImageUploader from '../components/ImageUploader';
import { Link } from 'react-router-dom';

const OOTD: React.FC = () => {
  const { items, tryOnPhoto, setTryOnPhoto, profile, updateProfile, markAsWorn } = useWardrobe();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{items: ClothingItem[], reasoning: string} | null>(null);
  const [occasion, setOccasion] = useState("日常通勤");
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [isWornConfirmed, setIsWornConfirmed] = useState(false);

  // Model Mode State: 'photo' | 'avatar' | 'ai'
  const [modelMode, setModelMode] = useState<'photo' | 'avatar' | 'ai'>('ai');

  // Local state for editing height/weight directly in OOTD
  const [editHeight, setEditHeight] = useState(profile.height || '');
  const [editWeight, setEditWeight] = useState(profile.weight || '');

  useEffect(() => {
    getLocalWeather().then(setWeather);
  }, []);
  
  useEffect(() => {
      // Sync initial state, but don't overwrite user edits unless profile drastically changes (e.g. initial load)
      if (!editHeight) setEditHeight(profile.height || '');
      if (!editWeight) setEditWeight(profile.weight || '');
      
      // Auto-determine mode based on available data
      if (tryOnPhoto) setModelMode('photo');
      else if (profile.avatar) setModelMode('avatar');
      else setModelMode('ai');
  }, [profile, tryOnPhoto]);

  const generateOutfit = async () => {
    if (!weather || items.length === 0) return;
    setLoading(true);
    setSuggestion(null);
    setTryOnImage(null);
    setIsWornConfirmed(false);

    try {
      const result = await suggestOutfit(items, weather, occasion, profile);
      const selectedItems = items.filter(item => result.selectedItemIds.includes(item.id));
      
      if (selectedItems.length === 0) {
        setSuggestion({
            items: [],
            reasoning: result.reasoning || "抱歉，库存中没有找到符合当前天气和场合的完整搭配。"
        });
      } else {
        setSuggestion({
            items: selectedItems,
            reasoning: result.reasoning
        });
      }

    } catch (error) {
      console.error(error);
      alert("无法生成搭配，请检查网络或库存。");
    } finally {
      setLoading(false);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!suggestion || suggestion.items.length === 0) {
        alert("没有有效的衣物可供试穿");
        return;
    }

    setGeneratingImg(true);
    
    // Determine the source image based on explicitly selected mode
    let effectiveImage: string | null = null;
    if (modelMode === 'photo') effectiveImage = tryOnPhoto;
    if (modelMode === 'avatar') effectiveImage = profile.avatar;
    
    // Temporary profile for generation
    const currentProfile = { ...profile, height: editHeight, weight: editWeight };

    try {
        const clothingImages = suggestion.items.map(i => i.imageUrl);
        const img = await visualizeOutfit(effectiveImage, clothingImages, currentProfile);

        if (img) {
            setTryOnImage(img);
        } else {
            const itemDesc = suggestion.items.map(i => `${i.color} ${i.category}`).join(' + ');
            const fallbackImg = await generateOutfitImage(itemDesc);
            if(fallbackImg) setTryOnImage(fallbackImg);
            else alert("AI 生成图片服务暂时繁忙，请稍后再试。");
        }
    } catch (e) {
        console.error(e);
        alert("生成失败");
    }
    
    setGeneratingImg(false);
  };

  const handleConfirmWear = () => {
    if (suggestion && suggestion.items.length > 0) {
        markAsWorn(suggestion.items.map(i => i.id));
        setIsWornConfirmed(true);
    }
  };

  return (
    <div className="p-5 md:p-10 pb-24 md:pb-10 min-h-screen max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8 pt-2">每日穿搭</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Weather Context */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between shadow-sm">
                {weather ? (
                <>
                    <div>
                    <p className="font-bold text-slate-700 text-lg">{weather.city} {weather.condition} <span className="font-normal text-slate-400">|</span> {weather.temperature}°C</p>
                    <p className="text-xs text-slate-400 mt-1">{weather.description}</p>
                    </div>
                    <div className="text-4xl">
                    {weather.condition === '雨' ? '☔' : '🌤️'}
                    </div>
                </>
                ) : <p className="text-sm text-slate-400">正在获取天气...</p>}
            </div>

            {/* Inputs */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-5">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">今日场合</label>
                    <div className="relative">
                        <select 
                            value={occasion} 
                            onChange={(e) => setOccasion(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-800 appearance-none font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                        >
                            <option>日常通勤</option>
                            <option>浪漫约会</option>
                            <option>周末休闲</option>
                            <option>商务会议</option>
                            <option>健身运动</option>
                        </select>
                        <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">▼</div>
                    </div>
                </div>

                <button 
                onClick={generateOutfit}
                disabled={loading || items.length === 0}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-700"
                >
                {loading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                    <><span>✨</span> 生成今日搭配</>
                )}
                </button>
            </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-8 space-y-6">
            {suggestion ? (
                <div className="animate-fade-in-up space-y-6">
                    {/* Reasoning Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <div className="flex items-start gap-4 mb-6 mt-2">
                            <span className="text-3xl mt-1">💡</span>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800">搭配思路</h3>
                                <p className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">
                                    {suggestion.reasoning}
                                </p>
                            </div>
                        </div>
                        
                        {suggestion.items.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                    {suggestion.items.map(item => (
                                        <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                            <img src={item.imageUrl} alt={item.category} className="w-full aspect-[3/4] object-cover bg-slate-50" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-white/50">
                                                <p className="text-sm font-bold text-slate-800 truncate">{item.category}</p>
                                                <p className="text-xs text-slate-500 truncate">{item.color}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    <div className="text-xs text-slate-400">
                                        {isWornConfirmed 
                                            ? "✅ 已记录资产使用数据" 
                                            : "满意这套搭配吗？点击确认以更新衣橱数据。"}
                                    </div>
                                    <button 
                                        onClick={handleConfirmWear}
                                        disabled={isWornConfirmed}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                            isWornConfirmed 
                                            ? 'bg-green-100 text-green-700 cursor-default' 
                                            : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                                        }`}
                                    >
                                        {isWornConfirmed ? '已打卡' : '今天就穿这一套'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-2xl border border-yellow-100 text-sm">
                                ⚠️ 看起来你的衣橱里缺少必要的单品来组成这套搭配。快去【录入新衣】添加一些上装或下装吧！
                            </div>
                        )}
                    </div>

                    {/* Virtual Try-On Section */}
                    {suggestion.items.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-6 rounded-3xl shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg mb-4">
                                <span>💃</span> AI 虚拟试穿 <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">BETA</span>
                            </h3>

                            {/* Mode Selection Tabs (Fixes "Preview Device" issue) */}
                            <div className="flex bg-white p-1 rounded-xl mb-4 shadow-sm border border-purple-100">
                                <button 
                                    onClick={() => setModelMode('ai')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${modelMode === 'ai' ? 'bg-purple-100 text-purple-800' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    🤖 AI 模特
                                </button>
                                <button 
                                    onClick={() => setModelMode('avatar')}
                                    disabled={!profile.avatar}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${modelMode === 'avatar' ? 'bg-purple-100 text-purple-800' : 'text-slate-500 hover:bg-slate-50'} ${!profile.avatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    👤 使用头像
                                </button>
                                <button 
                                    onClick={() => setModelMode('photo')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${modelMode === 'photo' ? 'bg-purple-100 text-purple-800' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    📷 上传照片
                                </button>
                            </div>

                            {/* Mode Specific Inputs */}
                            <div className="space-y-4 mb-6">
                                {/* Photo Upload Logic */}
                                {modelMode === 'photo' && (
                                    <div className="bg-white p-4 rounded-2xl border border-purple-100">
                                        {!tryOnPhoto ? (
                                            <ImageUploader onImageSelected={(b64) => setTryOnPhoto(b64)} label="上传全身照" />
                                        ) : (
                                            <div className="relative">
                                                <img src={tryOnPhoto} className="h-32 w-auto rounded-lg mx-auto object-cover border border-slate-100" />
                                                <button 
                                                    onClick={() => setTryOnPhoto(null)} 
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Body Stats (Always Visible & Editable now) */}
                                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-purple-100 text-xl">
                                        📏
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700 mb-1">模特参数设置 (可调整)</p>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="number" 
                                                    placeholder="身高" 
                                                    value={editHeight}
                                                    onChange={(e) => setEditHeight(e.target.value)}
                                                    className="w-full bg-slate-50 border-b-2 border-slate-200 text-sm py-1 px-1 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                                                />
                                                <span className="absolute right-0 top-1 text-xs text-slate-400 pointer-events-none">cm</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input 
                                                    type="number" 
                                                    placeholder="体重" 
                                                    value={editWeight}
                                                    onChange={(e) => setEditWeight(e.target.value)}
                                                    className="w-full bg-slate-50 border-b-2 border-slate-200 text-sm py-1 px-1 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                                                />
                                                <span className="absolute right-0 top-1 text-xs text-slate-400 pointer-events-none">kg</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {tryOnImage ? (
                                <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white animate-fade-in-up">
                                    <img src={tryOnImage} alt="Virtual Try On" className="w-full h-auto" />
                                    <div className="bg-white p-3 text-center flex justify-between items-center px-6">
                                        <span className="text-xs font-bold text-purple-900">✨ 生成完毕</span>
                                        <button onClick={() => setTryOnImage(null)} className="text-xs text-slate-400 hover:text-slate-600 underline">重新生成</button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleVirtualTryOn}
                                    disabled={generatingImg || (modelMode === 'photo' && !tryOnPhoto)}
                                    className="w-full py-4 bg-white border-2 border-purple-200 text-purple-700 font-bold rounded-2xl shadow-sm hover:bg-purple-50 hover:border-purple-300 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingImg ? (
                                        <>
                                            <span className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></span>
                                            <span>正在绘制 ({editHeight}cm/{editWeight}kg)...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🎨</span>
                                            {modelMode === 'photo' && !tryOnPhoto ? '请先上传照片' : '开始虚拟试穿'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                 <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    <span className="text-6xl mb-4 opacity-50">✨</span>
                    <p>点击左侧按钮生成搭配</p>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OOTD;