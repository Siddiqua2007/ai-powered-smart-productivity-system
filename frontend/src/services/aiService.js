import API from './api';

export const getAIRecommendation = async () => {
  const response = await API.post('/ai/recommend');
  return response.data;
};

export const getAIInsights = async () => {
  const response = await API.post('/ai/insights');
  return response.data;
};

export const getTodaysPlan = async () => {
  const response = await API.post('/ai/today-plan');
  return response.data;
};

export const getProductivityScore = async () => {
  const response = await API.post('/ai/productivity-score');
  return response.data;
};