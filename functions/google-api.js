// 这个脚本会截获所有发往 /google-api/* 的请求并转发给 Google
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 1. 提取匹配路径（去掉开头的 /google-api）
  const path = url.pathname.replace('/google-api', '');
  const searchParams = url.search;
  
  // 2. 构建目标 Google API 地址
  const targetUrl = `https://generativelanguage.googleapis.com${path}${searchParams}`;
  
  // 3. 克隆原始请求的 Headers，避免 CORS 问题
  const newRequest = new Request(targetUrl, context.request);
  
  // 4. 发送请求到 Google 并返回结果
  return fetch(newRequest);
}