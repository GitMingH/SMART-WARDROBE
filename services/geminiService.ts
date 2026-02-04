import { GoogleGenAI } from "@google/genai";
import { ClothingItem, OutfitSuggestion, ShoppingAdvice, WeatherData, UserProfile } from "../types";

// Helper: Extract MIME type and data
const processBase64 = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  // Fallback for raw base64 strings without prefix (assume jpeg)
  return {
    mimeType: 'image/jpeg',
    data: dataUrl.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "")
  };
};

// 辅助函数：清洗 JSON 字符串
const parseGeminiJson = (text: string) => {
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    const cleanText = text.replace(/```json|```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Warning:", e);
    return null; 
  }
};

// --- Custom Proxy Fetcher for China Access ---
// This allows the browser to send requests to our own domain (Vercel),
// which then forwards them to Google.
// const customFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
//     let urlStr = url.toString();
//     // Only intercept Google API calls
//     if (urlStr.includes('generativelanguage.googleapis.com')) {
//         // Replace the Google domain with our local proxy path defined in vercel.json
//         urlStr = urlStr.replace('https://generativelanguage.googleapis.com', '/google-api');
//     }
//     return fetch(urlStr, init);
// };

// const getAiClient = () => {
//   // Inject custom fetch to handle proxying
//   return new GoogleGenAI({ 
//       apiKey: process.env.API_KEY,
//       fetch: customFetch
//   } as any);
// };
const customFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    let urlStr = url.toString();
    // 拦截发往 Google 的 API 请求
    if (urlStr.includes('generativelanguage.googleapis.com')) {
        // 将域名替换为当前环境的相对路径 /google-api
        // Cloudflare Pages 会自动触发我们刚才写的 functions/google-api.js
        urlStr = urlStr.replace('https://generativelanguage.googleapis.com', '/google-api');
    }
    return fetch(urlStr, init);
};

const getAiClient = () => {
  // 优先从 process.env 获取，Vite 编译时会注入
  const apiKey = process.env.GEMINI_API_KEY || '';
  
  return new GoogleGenAI({ 
      apiKey: apiKey,
      fetch: customFetch
  } as any);
};
// --- Retry Logic ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = error?.message || error?.toString() || '';
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 ||
        msg.includes('429') || 
        msg.includes('quota') || 
        msg.includes('RESOURCE_EXHAUSTED');

      if (!isRateLimit || i === retries - 1) {
        throw error;
      }
      console.warn(`API Busy (429). Retrying in ${currentDelay}ms...`);
      await delay(currentDelay);
      currentDelay *= 2; 
    }
  }
  throw new Error("Request failed");
};

// --- STRICT BODY DESCRIPTION LOGIC ---
const generateBodyDescription = (profile?: UserProfile): string => {
  if (!profile) return "a fashion model";
  
  // Use Gender provided by user.
  const genderTerm = profile.gender === 'Female' ? 'Female' : profile.gender === 'Male' ? 'Male' : 'Androgynous';
  
  // Use Stats ONLY if provided. Do not hallucinate.
  const heightStr = profile.height ? `${profile.height}cm` : '';
  const weightStr = profile.weight ? `${profile.weight}kg` : '';
  const bodyStats = (heightStr || weightStr) ? `Body Stats: ${heightStr} ${weightStr}` : 'Average body type';

  return `${genderTerm} model, ${bodyStats}`;
};

// 1. 分析新上传的衣物图片
export const analyzeClothingImage = async (base64Image: string): Promise<Partial<ClothingItem>> => {
  const ai = getAiClient();
  const { mimeType, data } = processBase64(base64Image);

  const prompt = `
    你是一位资深的时尚单品数据录入员。请忽略背景，专注于图片中的**主体衣物**。
    
    重点：请通过衣物的版型（如收腰、肩宽、扣子方向）初步判断其性别倾向（男款/女款/中性），并体现在描述中。

    请严格按照以下 JSON 格式返回分析结果（必须为中文）：
    {
      "category": "String", // 见下方分类列表，只填一个最准确的名词
      "color": "String",    // 具体的视觉颜色，如：藏青、米白、军绿
      "season": "String",   // 选项: 春, 夏, 秋, 冬, 四季通用
      "formality": "String",// 选项: 休闲, 商务休闲, 正式商务, 隆重礼服, 运动户外
      "description": "String" // 重点描述：版型(宽松/修身)、材质、以及性别风格(如: 收腰女款, 廓形男款)
    }

    [分类参考列表]:
    - 上装: T恤, 衬衫, 卫衣, 毛衣, 针织衫, 西装外套, 夹克, 大衣, 羽绒服, 马甲, 吊带
    - 下装: 牛仔裤, 休闲裤, 西装裤, 运动裤, 短裤, 半身裙
    - 全身: 连衣裙, 连体裤
    - 鞋履: 运动鞋, 皮鞋, 靴子, 凉鞋, 休闲鞋
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: data } },
            { text: prompt }
          ]
        },
        config: { responseMimeType: 'application/json' }
      });

      if (!response.text) throw new Error("Empty response");
      const result = parseGeminiJson(response.text);
      if (Array.isArray(result)) return result[0];
      return result || { category: "", color: "" };
    });
  } catch (error) {
    console.warn("Analysis failed", error);
    return { category: "", color: "", season: undefined, formality: undefined, description: "" };
  }
};

// 2. 每日穿搭推荐 (Strict Gender & Stat Logic)
export const suggestOutfit = async (
  inventory: ClothingItem[], 
  weather: WeatherData,
  occasion: string = "日常通勤",
  profile?: UserProfile
): Promise<OutfitSuggestion> => {
  const ai = getAiClient();

  const inventoryList = inventory.map(item => ({
    id: item.id,
    desc: `${item.color} ${item.category} (${item.season}, ${item.description})`,
    tag: item.formality
  }));

  // Construct User Context strictly
  let userContext = "User: Unknown Gender.";
  if (profile) {
      const genderStr = profile.gender === 'Male' ? "Male (Men's Style)" : profile.gender === 'Female' ? "Female (Women's Style)" : "Unisex Style";
      const statsStr = (profile.height && profile.weight) ? `Height: ${profile.height}cm, Weight: ${profile.weight}kg` : "Body stats not provided (Do not hallucinate numbers).";
      userContext = `User Profile: ${genderStr}. ${statsStr}`;
  }

  const prompt = `
    Role: You are a professional Fashion Stylist.
    
    Context:
    - Weather: ${weather.city}, ${weather.temperature}°C (${weather.condition}).
    - Occasion: ${occasion}.
    - ${userContext}
    
    Inventory (JSON): 
    ${JSON.stringify(inventoryList)}

    Task: Create the SINGLE BEST OUTFIT from the inventory.

    **CRITICAL RULES:**
    1. **GENDER & STYLE ACCURACY:** 
       - If User is Female: Focus on feminine silhouettes, layers, and proportions suitable for women unless she has masculine items. Do NOT recommend "Men's 3-piece suit" unless it's a specific style choice.
       - If User is Male: Focus on masculine cuts. Do NOT recommend "Skirts" or "Dresses".
       - **DO NOT HALLUCINATE STATS:** In your reasoning, do NOT say "Since you are 180cm..." if the user did not provide that data. Use generic terms like "Based on your shape..." if data is missing.
    2. **AESTHETICS:** Ensure colors harmony (max 3 main colors).
    3. **PRACTICALITY:** Check temperature.

    Output JSON (Chinese): 
    { 
      "selectedItemIds": ["id1", "id2"...], 
      "reasoning": "Title: [Stylish Name]. \n\nLogic: Explain the style choice based on the user's GENDER and the occasion." 
    }
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return parseGeminiJson(response.text || "") || { selectedItemIds: [], reasoning: "服务繁忙，请稍后重试。" };
    });
  } catch (error) {
    return { selectedItemIds: [], reasoning: "AI 服务暂时不可用。" };
  }
};

// 3. 购物省钱顾问 (Enhanced with Suggestions)
export const evaluatePurchase = async (
  newItemBase64: string,
  inventory: ClothingItem[],
  profile?: UserProfile
): Promise<ShoppingAdvice> => {
  const ai = getAiClient();
  const { mimeType, data } = processBase64(newItemBase64);
  const inventorySummary = inventory.map(item => `[${item.color}${item.category}]`).join(", ");
  
  const genderContext = profile ? `用户性别/风格: ${profile.gender}` : "用户性别未知";

  const prompt = `
    角色: 理性且毒舌的资产管理顾问。
    背景: 用户想买这张图片里的衣服。
    用户库存: ${inventorySummary}。
    ${genderContext}。

    核心原则: "降本增效"。
    1. **查重**: 如果库存里有极为相似的，坚决劝退。
    2. **百搭性**: 如果这件衣服不能和库存里的至少3件单品搭配，判定为“低效资产”。
    3. **审美**: 评价其是否符合长期审美（避免廉价感、过时款）。

    任务: 返回 JSON (中文)。
    { 
      "verdict": "买" 或 "不买", 
      "score": 0-100 (推荐指数), 
      "reasoning": "犀利的点评理由。", 
      "suggestions": "如果Verdict是'不买'，你必须给出建设性建议。例如：'这件印花太乱了，建议买一件纯深蓝色的西装外套，刚好能配你的卡其裤。' 或者 '你缺的是基础款内搭，而不是又一件外套。'"
    }
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: data } },
            { text: prompt }
          ]
        },
        config: { responseMimeType: 'application/json' }
      });
      return parseGeminiJson(response.text || "") || { verdict: "不买", score: 0, reasoning: "分析失败" };
    });
  } catch (e) {
    return { verdict: "不买", score: 0, reasoning: "服务繁忙。" };
  }
};

// 4. AI 聊天
export const chatWithAi = async (message: string, context: string): Promise<string> => {
  const ai = getAiClient();
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个专业的形象顾问。背景信息: ${context}。用户问题: ${message}`,
    });
    return response.text || "我暂时无法回答这个问题。";
  }).catch(() => "网络繁忙。");
}

// 5. 虚拟试穿 (Fix: Force Model Generation)
export const visualizeOutfit = async (
  userPhotoBase64: string | null,
  clothingImagesBase64: string[],
  profile?: UserProfile
): Promise<string> => {
  const ai = getAiClient();
  const parts: any[] = [];
  const bodyDescription = generateBodyDescription(profile);
  const safeClothingImages = clothingImagesBase64.slice(0, 3);
  
  // Logic: 
  // If user provides photo -> Identity Lock.
  // If NO photo -> Generate a model based on GENDER.
  
  if (userPhotoBase64) {
    const { mimeType, data } = processBase64(userPhotoBase64);
    parts.push({ inlineData: { mimeType, data } });
  }
  
  safeClothingImages.forEach(img => {
    const { mimeType, data } = processBase64(img);
    parts.push({ inlineData: { mimeType, data } });
  });

  let promptText = "";
  
  if (userPhotoBase64) {
    promptText = `
      TASK: HIGH-FIDELITY VIRTUAL TRY-ON.
      INPUTS: IMAGE 1 (Reference Person), Other Images (Clothes).
      INSTRUCTIONS:
      1. **IDENTITY LOCK**: Keep the person's face/head from IMAGE 1 exactly as is.
      2. **ACTION**: Dress the person in the provided clothes.
      3. **BODY**: ${bodyDescription}.
      4. **STYLE**: Realistic photography, 8k resolution.
    `;
  } else {
    // FORCE MODEL GENERATION
    promptText = `
      TASK: FASHION CATALOG SHOOT.
      INSTRUCTIONS:
      1. **GENERATE A MODEL**: Create a realistic full-body ${bodyDescription}.
      2. **WEARING**: The model MUST BE WEARING the clothing items provided in the images.
      3. **GENDER SPECIFIC**: Ensure the model's gender matches the description (${profile?.gender || 'Female'}).
      4. **VIEW**: Full body standing pose.
      5. **BACKGROUND**: Clean, neutral studio background.
      
      NEGATIVE PROMPT: Flat lay, clothes only, no human, headless, cartoon, ghost mannequin.
    `;
  }

  parts.push({ text: promptText });

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: parts }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return ""; 
  }, 2, 2000).catch((e) => {
    console.warn("Visualisation error", e);
    return "";
  });
};

// 6. 生成纯搭配图 (Fallback)
export const generateOutfitImage = async (description: string): Promise<string> => {
  const ai = getAiClient();
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Fashion Photography, Flat lay: ${description}. Clean background, aesthetic lighting.` }]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  }, 2, 1000).catch(() => "");
}