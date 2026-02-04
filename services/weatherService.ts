import { WeatherData } from '../types';

const DEFAULT_WEATHER: WeatherData = {
  city: '北京',
  temperature: 20,
  condition: '晴',
  description: '暂无法获取实时天气，请检查网络连接。'
};

// WMO Weather Codes mapping
const mapWmoCodeToCondition = (code: number): '晴' | '多云' | '雨' | '雪' | '大风' | '阴' => {
  if (code === 0) return '晴';
  if (code >= 1 && code <= 3) return '多云';
  if (code === 45 || code === 48) return '阴';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '雨';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '雪';
  if (code >= 95 && code <= 99) return '雨'; 
  return '多云';
};

const generateDescription = (temp: number, condition: string, wmoCode: number): string => {
  if (wmoCode >= 95) return '有雷暴天气，请注意安全，尽量待在室内。';
  if (condition === '雨') return '出门记得带伞，建议穿防水鞋履。';
  if (condition === '雪') return '路面湿滑，建议穿着防滑保暖的靴子。';
  if (temp <= 5) return '寒潮来袭，请务必穿着厚羽绒或大衣保暖。';
  if (temp <= 12) return '天气较冷，建议“洋葱式”穿衣，搭配毛衣外套。';
  if (temp <= 20) return '体感舒适，早晚可能有温差，备一件薄外套。';
  if (temp <= 28) return '温暖舒适，适合衬衫、T恤等轻薄衣物。';
  return '天气炎热，建议穿着透气排汗的棉麻衣物。';
};

// Retry helper
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (e) {
            if (i === retries) throw e;
            await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
        }
    }
    throw new Error("Fetch failed");
};

// 1. 根据经纬度获取天气 (Core Function)
export const getWeatherByLocation = async (latitude: number, longitude: number, cityName: string): Promise<WeatherData> => {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
        const weatherRes = await fetchWithRetry(weatherUrl);
        
        const weatherData = await weatherRes.json();
        
        if (!weatherData.current_weather) throw new Error("Weather data incomplete");

        const wmoCode = weatherData.current_weather.weathercode;
        const temp = weatherData.current_weather.temperature;
        const condition = mapWmoCodeToCondition(wmoCode);

        return {
            city: cityName,
            temperature: Math.round(temp),
            condition: condition,
            description: generateDescription(temp, condition, wmoCode)
        };
    } catch (e) {
        console.warn("Fetch weather failed, using fallback.", e);
        // Fallback gracefully instead of throwing
        return {
            ...DEFAULT_WEATHER,
            city: cityName || DEFAULT_WEATHER.city,
            description: "获取天气失败，已显示默认数据。"
        };
    }
};

// 2. 城市搜索 (Geocoding API)
export const searchCity = async (query: string): Promise<{name: string, lat: number, lon: number, admin: string} | null> => {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=zh&format=json`;
        const res = await fetchWithRetry(url);
        
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                name: result.name,
                lat: result.latitude,
                lon: result.longitude,
                admin: result.admin1 || result.country || ''
            };
        }
        return null;
    } catch (e) {
        console.error("City search failed", e);
        return null;
    }
}

// 3. 获取当前定位天气 (Default)
export const getLocalWeather = async (): Promise<WeatherData> => {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Browser does not support geolocation'));
            return;
        }
        // Reduced timeout to 3 seconds to fail faster to default
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
    });

    const { latitude, longitude } = position.coords;
    
    // 反向地理编码获取当前城市名
    let city = "本地";
    try {
        const cityUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh-CN`;
        // Removed custom User-Agent to avoid CORS preflight issues in browsers
        const cityRes = await fetchWithRetry(cityUrl); 
        const cityData = await cityRes.json();
        city = cityData.address?.city || cityData.address?.district || cityData.address?.town || "当前位置";
        city = city.replace(/市|区/g, ''); 
    } catch (e) {
        console.warn("City reverse lookup failed, continuing with default name.", e);
    }

    return await getWeatherByLocation(latitude, longitude, city);

  } catch (error) {
    console.warn("Geolocation failed or timed out, falling back to default Beijing");
    // Fallback: Default to Beijing coordinates if location fails
    return await getWeatherByLocation(39.9042, 116.4074, "北京");
  }
};