// API 客户端封装
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = {
  async getUsers() {
    const response = await fetch(`${API_BASE}/api/v1/users`);
    return response.json();
  },
  
  async createOrder(data: any) {
    const response = await fetch(`${API_BASE}/api/v1/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};
