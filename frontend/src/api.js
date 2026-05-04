import axios from "axios";

const API = "http://127.0.0.1:8000";

export const signup = (data) => axios.post(`${API}/signup`, data);
export const login = (data) => axios.post(`${API}/login`, data);
export const chat = (userId, data) => axios.post(`${API}/chat/${userId}`, data);
export const history = (userId) => axios.get(`${API}/history/${userId}`);