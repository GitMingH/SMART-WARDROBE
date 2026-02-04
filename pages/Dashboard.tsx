import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { getLocalWeather, searchCity, getWeatherByLocation } from '../services/weatherService';
import { WeatherData, UserProfile } from '../types';
import { Link } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';

const Dashboard: React.FC = () => {
  const { items, profile, updateProfile } = useWardrobe();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  
  // Weather Search State
  const [cityQuery, setCityQuery] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    loadWeather();
  }, []);

  useEffect(() => {
    setTempProfile(profile);
  }, [profile]);

  const loadWeather = () => {
    getLocalWeather().then(setWeather);
  }

  const handleCitySearch = async () => {
      if (!cityQuery.trim()) return;
      setSearchingCity(true);
      setSearchError('');
      
      try {
          const cityData = await searchCity(cityQuery);
          if (cityData) {
              const newWeather = await getWeatherByLocation(cityData.lat, cityData.lon, cityData.name);
              setWeather(newWeather);
              setShowWeatherModal(false);
              setCityQuery('');
          } else {
              setSearchError('未找到该城市，请尝试输入全名（如：London 或 上海）。');
          }
      } catch (e) {
          setSearchError('网络请求失败，请稍后重试。');
      } finally {
          setSearchingCity(false);
      }
  };

  const handleSaveProfile = () => {
    updateProfile(tempProfile);
    setShowProfileModal(false);
  };

  return (
    <div className="p-5 md:p-10 space-y-8 pb-24 md:pb-10 max-w-6xl mx-auto">
      <header className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">早安，{profile.name}</h1>
          <p className="text-slate-500 text-sm mt-1">今天也要穿得得体又舒适。</p>
        </div>
        <div 
          onClick={() => setShowProfileModal(true)}
          className="h-10 w-10 md:h-12 md:w-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 overflow-hidden relative"
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weather Card (Clickable) */}
        <div 
            onClick={() => setShowWeatherModal(true)}
            className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer group"
        >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
            {weather ? (
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl font-medium opacity-90">{weather.city}</span>
                            <span className="text-xs opacity-60 bg-white/20 px-2 py-0.5 rounded-full border border-white/10">点击切换</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-6xl md:text-7xl font-bold tracking-tighter">{weather.temperature}°</span>
                        </div>
                    </div>
                    <span className="text-6xl md:text-8xl opacity-80">
                        {weather.condition === '雨' ? '🌧️' : weather.condition === '晴' ? '☀️' : weather.condition === '雪' ? '❄️' : '☁️'}
                    </span>
                </div>
                <div className="mt-4">
                    <p className="font-medium text-xl md:text-2xl mb-2">{weather.condition}</p>
                    <p className="text-blue-100 text-sm md:text-base bg-white/10 p-3 rounded-xl backdrop-blur-sm inline-block border border-white/10">
                    💡 {weather.description}
                    </p>
                </div>
            </div>
            ) : (
            <div className="animate-pulse flex items-center h-full">
                <span className="text-lg">正在定位并获取实时天气...</span>
            </div>
            )}
        </div>

        {/* Quick Stats Column */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6 h-full">
            <Link to="/wardrobe" className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👕</div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">库存总量</p>
            </div>
            <p className="text-3xl md:text-4xl font-black text-slate-800">{items.length}<span className="text-sm font-normal text-slate-400 ml-1">件单品</span></p>
            </Link>

            <Link to="/wardrobe" className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🆕</div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">最新入库</p>
            </div>
            <p className="text-sm md:text-base font-bold text-slate-800 truncate">
                {items[0] ? `${items[0].color}${items[0].category}` : '暂无数据'}
            </p>
            <p className="text-xs text-slate-400 mt-1">刚刚添加</p>
            </Link>
        </div>
      </div>

      {/* Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">常用功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/ootd" className="flex items-center justify-between bg-slate-800 text-white p-5 md:p-6 rounded-3xl font-medium shadow-xl shadow-slate-300 hover:bg-slate-700 hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
                <div className="text-3xl">✨</div>
                <div className="text-left">
                    <div className="text-base md:text-lg font-bold">今天穿什么</div>
                    <div className="text-xs md:text-sm text-slate-400 mt-0.5">AI 智能推荐 + 虚拟试穿</div>
                </div>
            </div>
            <span className="text-slate-400 text-xl">→</span>
          </Link>
          
          <Link to="/add" className="flex items-center justify-between bg-white text-slate-700 border border-slate-100 p-5 md:p-6 rounded-3xl font-medium hover:border-blue-200 hover:shadow-md transition-all">
             <div className="flex items-center gap-4">
                <div className="text-3xl">📷</div>
                <div className="text-left">
                    <div className="text-base md:text-lg font-bold">录入新衣</div>
                    <div className="text-xs md:text-sm text-slate-400 mt-0.5">拍照识别材质与风格</div>
                </div>
            </div>
            <span className="text-slate-300 text-xl">→</span>
          </Link>

          <Link to="/shop" className="flex items-center justify-between bg-white text-slate-700 border border-slate-100 p-5 md:p-6 rounded-3xl font-medium hover:border-red-200 hover:shadow-md transition-all">
             <div className="flex items-center gap-4">
                <div className="text-3xl">⚖️</div>
                <div className="text-left">
                    <div className="text-base md:text-lg font-bold">购物决策</div>
                    <div className="text-xs md:text-sm text-slate-400 mt-0.5">理性消费，拒绝浪费</div>
                </div>
            </div>
            <span className="text-slate-300 text-xl">→</span>
          </Link>
        </div>
      </div>

      {/* Weather Modal (Real Search) */}
      {showWeatherModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowWeatherModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">切换城市</h3>
                    <button onClick={() => setShowWeatherModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">×</button>
                </div>
                
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        输入城市名称（中文或英文），系统将实时获取当地气象数据。
                    </p>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="如: 上海, Tokyo, London..." 
                            value={cityQuery}
                            onChange={(e) => setCityQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                        <button 
                            onClick={handleCitySearch}
                            disabled={searchingCity || !cityQuery.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300"
                        >
                            {searchingCity ? <span className="block w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : '🔍'}
                        </button>
                    </div>

                    {searchError && (
                        <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                            <span>⚠️</span> {searchError}
                        </p>
                    )}

                    <div className="pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">或者</p>
                        <button 
                            onClick={() => {
                                loadWeather(); // Reload local
                                setShowWeatherModal(false);
                            }}
                            className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>📍</span> 使用当前定位
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowProfileModal(false)}>
             <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center">
                     <h3 className="text-xl font-bold text-slate-800">个人档案</h3>
                     <button onClick={() => setShowProfileModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">×</button>
                 </div>
                 
                 <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100">
                        {tempProfile.avatar ? (
                            <img src={tempProfile.avatar} className="w-full h-full object-cover" onClick={() => setTempProfile({...tempProfile, avatar: null})} />
                        ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-3xl">👤</div>
                        )}
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">更换头像</label>
                        <ImageUploader onImageSelected={(b64) => setTempProfile({...tempProfile, avatar: b64})} label="点击上传头像" />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-400 uppercase">昵称</label>
                         <input 
                            type="text" 
                            value={tempProfile.name}
                            onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                            className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-blue-500"
                         />
                     </div>
                     
                     {/* Gender Selector (New) */}
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">性别与穿衣偏好</label>
                        <select
                           value={tempProfile.gender}
                           onChange={(e) => setTempProfile({...tempProfile, gender: e.target.value as any})}
                           className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="Female">女装 / Female</option>
                            <option value="Male">男装 / Male</option>
                            <option value="Unisex">中性 / Unisex</option>
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">身高 (cm)</label>
                            <input 
                                type="number" 
                                value={tempProfile.height}
                                onChange={(e) => setTempProfile({...tempProfile, height: e.target.value})}
                                className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="如: 165"
                            />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">体重 (kg)</label>
                            <input 
                                type="number" 
                                value={tempProfile.weight}
                                onChange={(e) => setTempProfile({...tempProfile, weight: e.target.value})}
                                className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="如: 50"
                            />
                         </div>
                     </div>
                 </div>
                 
                 <button 
                    onClick={handleSaveProfile}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl mt-4"
                 >
                     保存档案
                 </button>
             </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;