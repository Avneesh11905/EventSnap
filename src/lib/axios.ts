import axios, { AxiosError, AxiosResponse } from 'axios';

// Create a generic axios instance
export const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor for global error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    (error: AxiosError) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        const data = error.response?.data as any;
        const message = data?.err || data?.error || data?.detail || error.message || 'An unexpected error occurred';
                
        // Attach the extracted message to the error object so catch blocks can easily access it
        error.message = message;
        return Promise.reject(error);
    }
);
