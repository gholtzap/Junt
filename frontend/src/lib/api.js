const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return response.json();
};

export const api = {
  async register(email, username, password) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async searchAlbums(query) {
    const response = await fetch(`${API_BASE}/album/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search albums');
    }
    return response.json();
  },

  async getAlbumDetails(mbid) {
    const response = await fetch(`${API_BASE}/album/${mbid}`);
    if (!response.ok) {
      throw new Error('Failed to get album details');
    }
    return response.json();
  },

  async createMontage(mbid, duration) {
    const response = await fetch(`${API_BASE}/montage/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mbid, duration }),
    });
    return handleResponse(response);
  },

  async getJobStatus(jobId) {
    const response = await fetch(`${API_BASE}/montage/${jobId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }
    return response.json();
  },

  getDownloadUrl(jobId) {
    return `${API_BASE}/montage/${jobId}/download`;
  },

  async saveMontage(jobId, album, durationType) {
    const response = await fetch(`${API_BASE}/library/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        job_id: jobId,
        album: album,
        duration_type: durationType,
      }),
    });
    return handleResponse(response);
  },

  async getLibrary() {
    const response = await fetch(`${API_BASE}/library`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLibraryStreamUrl(montageId) {
    const token = localStorage.getItem('token');
    return `${API_BASE}/library/${montageId}/stream?token=${token}`;
  },

  async deleteMontage(montageId) {
    const response = await fetch(`${API_BASE}/library/${montageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
