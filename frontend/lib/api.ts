import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkHealth = async () => {
  const res = await api.get('/health')
  return res.data
}

export const submitComplaint = async (data: object) => {
  const res = await api.post('/api/complaints', data)
  return res.data
}

export const getComplaints = async () => {
  const res = await api.get('/api/complaints')
  return res.data
}

export const detectPothole = async (formData: FormData) => {
  const res = await api.post('/api/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const getTrafficForecast = async (zone: string) => {
  const res = await api.get(`/api/traffic/forecast?zone=${zone}`)
  return res.data
}

export default api