import axios from 'axios';

const AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

// Si on envoie un FormData (image), laisser le navigateur
// définir lui-même le Content-Type avec le bon boundary
AxiosInstance.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    }
    // ✅ sessionStorage : vidé automatiquement à la fermeture du navigateur
    const token = sessionStorage.getItem('knox_token')
    if (token) {
        config.headers.Authorization = `Token ${token}`
    }
    return config
})

// Intercepteur de réponse : normalise les erreurs backend
AxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const detail = error.response?.data
        if (error.response?.status === 401) {
            sessionStorage.removeItem('knox_token')
            sessionStorage.removeItem('knox_user')
            window.location.href = '/login'
        }
        return Promise.reject(detail || error)
    }
)

export default AxiosInstance