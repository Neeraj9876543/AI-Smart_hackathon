// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  VERIFY: `${API_BASE_URL}/api/auth/verify`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google`,
  
  // Document endpoints
  DOCUMENTS_STUDENT: `${API_BASE_URL}/api/documents/student`,
  DOCUMENTS_FILE: (filename) => `${API_BASE_URL}/api/documents/file/${filename}`,
  
  // Achievement endpoints
  ACHIEVEMENTS_STUDENT: `${API_BASE_URL}/api/achievements/student`,
  
  // Project endpoints
  PROJECTS_STUDENT: `${API_BASE_URL}/api/projects/student`,
  
  // Resume endpoints
  RESUME: `${API_BASE_URL}/api/resume`,
  
  // Admin endpoints
  ADMIN_STUDENT: (studentId) => `${API_BASE_URL}/api/admin/student/${studentId}`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;
