import { message } from "antd";
import axios from "axios";

// mac dinh host co ban
const ApiAxios = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Tu dong gan token
ApiAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/**
 * Danh sách các mẫu lỗi kỹ thuật tiếng Anh mặc định của HTTP / NestJS / Axios
 */
const TECHNICAL_ERROR_PATTERNS = [
    /internal server error/i,
    /request failed with status code/i,
    /forbidden resource/i,
    /^forbidden$/i,
    /^bad request$/i,
    /^unauthorized$/i,
    /^not found$/i,
    /^cannot (get|post|put|delete|patch)/i,
    /^network error$/i,
];

/**
 * Kiểm tra xem chuỗi lỗi có phải là thông báo kỹ thuật tiếng Anh hay không
 */
export function isTechnicalError(msg: any): boolean {
    if (typeof msg !== 'string') return false;
    const trimmed = msg.trim();
    return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Hàm chuẩn hóa thông báo lỗi sang tiếng Việt thân thiện, dễ hiểu cho người dùng
 * @param error Đối tượng lỗi từ try/catch hoặc Axios
 * @param fallbackMessage Thông điệp dự phòng cụ thể theo ngữ cảnh (ví dụ: 'Không thể tải danh sách đề tài')
 */
export function formatErrorMessage(error: any, fallbackMessage?: string): string {
    if (!error) {
        return fallbackMessage || 'Có lỗi xảy ra, vui lòng thử lại sau.';
    }

    const status = error.response?.status;
    const rawData = error.response?.data;
    let rawMsg = rawData?.message || rawData?.error || error.message;

    if (Array.isArray(rawMsg)) {
        rawMsg = rawMsg.filter(Boolean).join(', ');
    }

    if (typeof rawMsg !== 'string') {
        rawMsg = '';
    }
    rawMsg = rawMsg.trim();

    // 1. Mất kết nối mạng / Server chưa bật
    if (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED' ||
        /network error/i.test(rawMsg) ||
        /failed to fetch/i.test(rawMsg)
    ) {
        return fallbackMessage
            ? `${fallbackMessage} (Không thể kết nối đến máy chủ, vui lòng kiểm tra mạng)`
            : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
    }

    // 2. Quá thời gian phản hồi (Timeout)
    if (error.code === 'ECONNABORTED' || /timeout/i.test(rawMsg) || /timed out/i.test(rawMsg)) {
        return fallbackMessage
            ? `${fallbackMessage} (Hệ thống phản hồi quá lâu, vui lòng thử lại)`
            : 'Quá thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại sau.';
    }

    // 3. Lỗi 500 hoặc máy chủ nội bộ
    if (status >= 500 || /internal server error/i.test(rawMsg)) {
        return fallbackMessage
            ? `${fallbackMessage} (Máy chủ đang gặp sự cố, vui lòng thử lại sau)`
            : 'Máy chủ đang gặp sự cố (Lỗi 500). Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    }

    // 4. Lỗi 403 - Không có quyền
    if (status === 403 || /forbidden/i.test(rawMsg)) {
        return fallbackMessage
            ? `${fallbackMessage} (Bạn không có quyền thực hiện chức năng này)`
            : 'Bạn không có quyền thực hiện thao tác này.';
    }

    // 5. Lỗi 404 - Không tìm thấy dữ liệu / tài nguyên
    if (status === 404 && (/cannot (get|post|put|delete|patch)/i.test(rawMsg) || /not found/i.test(rawMsg))) {
        return fallbackMessage || 'Không tìm thấy dữ liệu hoặc tài nguyên yêu cầu.';
    }

    // 6. Lỗi 429 - Quá nhiều yêu cầu
    if (status === 429) {
        return 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
    }

    // 7. Lỗi 401 - Chưa xác thực / Sai thông tin đăng nhập
    if (status === 401) {
        if (rawMsg && !isTechnicalError(rawMsg)) {
            return rawMsg;
        }
        return fallbackMessage || 'Sai tài khoản hoặc mật khẩu!';
    }

    // 8. Lỗi 400 Bad Request chung chung
    if (/^bad request$/i.test(rawMsg)) {
        return fallbackMessage || 'Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.';
    }

    // 8. Nếu là thông điệp nghiệp vụ cụ thể từ backend (ví dụ tiếng Việt có sẵn)
    if (rawMsg && !isTechnicalError(rawMsg)) {
        return rawMsg;
    }

    return fallbackMessage || 'Có lỗi xảy ra, vui lòng thử lại sau.';
}

// Token khi het han hoac loi - Tu dong chuan hoa thong bao loi
ApiAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            message.error("Hết hạn đăng nhập vui lòng đăng nhập lại");
            localStorage.removeItem('access_token');
            sessionStorage.removeItem('access_token');
            window.location.href = "/login";
            return Promise.reject(error);
        }

        // Tự động chuẩn hóa error.response.data.message
        if (error.response) {
            const status = error.response.status;
            if (!error.response.data || typeof error.response.data !== 'object') {
                error.response.data = {};
            }
            const originalMessage = error.response.data.message;
            let rawMsg = Array.isArray(originalMessage)
                ? originalMessage.filter(Boolean).join(', ')
                : (typeof originalMessage === 'string' ? originalMessage : '');

            if (status >= 500 || /internal server error/i.test(rawMsg)) {
                error.response.data.message = 'Máy chủ đang gặp sự cố (Lỗi 500). Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
            } else if (status === 403 || /forbidden/i.test(rawMsg)) {
                error.response.data.message = 'Bạn không có quyền thực hiện thao tác này.';
            } else if (status === 404 && (/cannot (get|post|put|delete|patch)/i.test(rawMsg) || /not found/i.test(rawMsg))) {
                error.response.data.message = 'Không tìm thấy dữ liệu hoặc tài nguyên yêu cầu.';
            } else if (status === 429) {
                error.response.data.message = 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
            } else if (status === 400 && /^bad request$/i.test(rawMsg)) {
                error.response.data.message = 'Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (Array.isArray(originalMessage)) {
                error.response.data.message = rawMsg;
            }
        } else if (error.code === 'ERR_NETWORK' || /network error/i.test(error.message)) {
            error.message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
            if (!error.response) {
                error.response = { status: 0, data: { message: error.message } };
            }
        } else if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
            error.message = 'Quá thời gian kết nối đến máy chủ. Vui lòng thử lại.';
            if (!error.response) {
                error.response = { status: 408, data: { message: error.message } };
            }
        } else if (/request failed with status code 500/i.test(error.message)) {
            error.message = 'Máy chủ đang gặp sự cố (Lỗi 500). Vui lòng thử lại sau.';
            if (!error.response) {
                error.response = { status: 500, data: { message: error.message } };
            }
        }

        return Promise.reject(error);
    }
);

export default ApiAxios;
