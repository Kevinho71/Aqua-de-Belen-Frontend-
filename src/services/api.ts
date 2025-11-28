import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://aquadebelen.prod.dtt.tja.ucb.edu.bo/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
