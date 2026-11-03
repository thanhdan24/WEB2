import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5080/api', timeout: 10000 });
export const productApi = {
  getAll: () => api.get('/products'),
  getById: id => api.get(`/products/${id}`),
  create: data => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: id => api.delete(`/products/${id}`)
};
export function errorText(error) {
  if (!error.response) return 'Không kết nối được API. Kiểm tra backend và kết nối mạng.';
  const data = error.response.data;
  return data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Yêu cầu không thành công. Vui lòng thử lại.';
}
