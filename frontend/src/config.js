// src/config.js

import axios from "axios";

// Automatically use the Render environment variable if present
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Create an Axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE,
});

export default api;
