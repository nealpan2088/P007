// API错误处理工具 - 规范化错误处理
// 统一处理所有API调用错误，避免控制台污染

/**
 * API错误类型定义
 */
export type ApiError = {
  type: 'NETWORK' | 'SERVER' | 'CLIENT' | 'UNKNOWN';
  message: string;
  status?: number;
  timestamp: string;
};

/**
 * 规范化API错误处理
 * @param error 原始错误
 * @param endpoint API端点
 * @returns 规范化错误对象
 */
export function normalizeApiError(error: unknown, endpoint: string): ApiError {
  const timestamp = new Date().toISOString();
  
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return {
      type: 'NETWORK',
      message: `网络连接失败: ${endpoint}`,
      timestamp
    };
  }
  
  if (error instanceof Response) {
    return {
      type: 'SERVER',
      message: `服务器错误 (${error.status}): ${endpoint}`,
      status: error.status,
      timestamp
    };
  }
  
  if (error instanceof Error) {
    return {
      type: 'CLIENT',
      message: `客户端错误: ${error.message}`,
      timestamp
    };
  }
  
  return {
    type: 'UNKNOWN',
    message: `未知错误: ${String(error)}`,
    timestamp
  };
}

/**
 * 安全API调用包装器
 * @param fetchPromise fetch Promise
 * @param endpoint API端点
 * @returns 规范化响应或错误
 */
export async function safeApiCall<T>(
  fetchPromise: Promise<Response>,
  endpoint: string
): Promise<{ data?: T; error?: ApiError; response?: Response }> {
  try {
    const response = await fetchPromise;
    
    if (!response.ok) {
      const error = normalizeApiError(response, endpoint);
      console.warn(`API调用失败: ${endpoint}`, error);
      return { error, response };
    }
    
    const data = await response.json();
    return { data, response };
    
  } catch (error) {
    const normalizedError = normalizeApiError(error, endpoint);
    console.warn(`API调用异常: ${endpoint}`, normalizedError);
    return { error: normalizedError };
  }
}

/**
 * 重试机制
 * @param fn 需要重试的函数
 * @param maxRetries 最大重试次数
 * @param delayMs 重试延迟(ms)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`重试 ${attempt}/${maxRetries}:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * 防抖API调用
 */
export function debounceApiCall<T>(
  fn: (...args: any[]) => Promise<T>,
  delayMs = 300
): (...args: any[]) => Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}