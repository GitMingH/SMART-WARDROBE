import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { useWardrobe } from '../context/WardrobeContext';
import { evaluatePurchase } from '../services/geminiService';
import { ShoppingAdvice } from '../types';

const Shopping: React.FC = () => {
  const { items, profile } = useWardrobe();
  const [analyzing, setAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<ShoppingAdvice | null>(null);

  const handleImage = async (base64: string) => {
    setAnalyzing(true);
    setAdvice(null);
    try {
      // Pass profile to ensure gender-appropriate advice
      const result = await evaluatePurchase(base64, items, profile);
      setAdvice(result);
    } catch (e) {
      alert("分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-5 md:p-10 pb-24 md:pb-10 min-h-screen max-w-4xl mx-auto">
      <div className="text-center md:text-left mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 pt-2">购物决策官</h1>
        <p className="text-slate-500 text-sm">让 AI 帮你判断这件衣服值不值得买，并提供更优替代方案。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <ImageUploader onImageSelected={handleImage} label="拍吊牌 / 拍商品" />
            </div>

            {analyzing && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm">
                <span className="text-4xl mb-3">🤔</span>
                <p className="font-medium">正在计算性价比与搭配率...</p>
            </div>
            )}
        </div>

        {advice ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Verdict Card */}
            <div className={`p-6 md:p-8 rounded-3xl shadow-xl text-center border-4 relative overflow-hidden transition-all duration-500 transform ${
                advice.verdict === '买' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
                <div className={`absolute top-0 left-0 w-full h-3 ${advice.verdict === '买' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                
                <span className="text-7xl md:text-8xl block mb-4 mt-2">
                    {advice.verdict === '买' ? '🙋' : '🙅'}
                </span>
                
                <h2 className={`text-4xl md:text-5xl font-black mb-2 tracking-tight ${
                    advice.verdict === '买' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {advice.verdict === '买' ? '买买买！' : '快放下！'}
                </h2>
                
                <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white font-mono font-bold text-sm md:text-base mb-8 border border-slate-200 shadow-sm">
                    推荐指数: {advice.score}/100
                </div>
                
                <div className="bg-white/60 p-5 rounded-2xl backdrop-blur-sm text-left shadow-inner">
                    <p className="text-slate-700 font-medium leading-relaxed">
                        <span className="mr-2 text-xl align-middle">💬</span>
                        {advice.reasoning}
                    </p>
                </div>
            </div>

            {/* Suggestions Card - Only show if provided (usually for 'No Buy') */}
            {advice.suggestions && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💡</div>
                    <h3 className="text-amber-800 font-bold text-lg mb-2 flex items-center gap-2">
                        <span>💡</span> 更好的选择
                    </h3>
                    <p className="text-amber-900/80 leading-relaxed font-medium">
                        {advice.suggestions}
                    </p>
                </div>
            )}
          </div>
        ) : (
             !analyzing && (
                 <div className="hidden md:flex flex-col items-center justify-center h-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    <span className="text-4xl mb-2">🛍️</span>
                    <p>上传图片后在此查看分析结果</p>
                 </div>
             )
        )}
      </div>
    </div>
  );
};

export default Shopping;