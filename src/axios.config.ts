import { message } from "antd";
import axios from "axios";

//mac dinh host co ban
const ApiAxios = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

//Tu dong gan token
ApiAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

//Token khi het han hoac loi
ApiAxios.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        message.error("Hết hạn đăng nhập vui lòng đăng nhập lại");
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        window.location.href = "/login";
    }
    return Promise.reject(error)
})

export default ApiAxios;
