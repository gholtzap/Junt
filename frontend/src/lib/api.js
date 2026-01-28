const API_BASE = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return response.json();
};

export const api = {
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId,
        album: album,
        duration_type: durationType,
      }),
    });
    return handleResponse(response);
  },

  async getLibrary() {
    const response = await fetch(`${API_BASE}/library`);
    return handleResponse(response);
  },

  getLibraryStreamUrl(montageId) {
    return `${API_BASE}/library/${montageId}/stream`;
  },

  async deleteMontage(montageId) {
    const response = await fetch(`${API_BASE}/library/${montageId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
