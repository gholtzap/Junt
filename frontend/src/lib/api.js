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

  async saveMontage(jobId, album, durationType, tracks) {
    const response = await fetch(`${API_BASE}/library/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId,
        album: album,
        duration_type: durationType,
        tracks: tracks,
      }),
    });
    return handleResponse(response);
  },

  async getLibrary(page = 1, pageSize = 50) {
    const response = await fetch(`${API_BASE}/library?page=${page}&page_size=${pageSize}`);
    return handleResponse(response);
  },

  getLibraryStreamUrl(montageId) {
    return `${API_BASE}/library/${montageId}/stream`;
  },

  getTrackStreamUrl(montageId, trackNumber) {
    return `${API_BASE}/library/${montageId}/tracks/${trackNumber}/stream`;
  },

  async deleteMontage(montageId) {
    const response = await fetch(`${API_BASE}/library/${montageId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  async getPlaylists(page = 1, pageSize = 50) {
    const response = await fetch(`${API_BASE}/playlists?page=${page}&page_size=${pageSize}`);
    return handleResponse(response);
  },

  async createPlaylist(name, description) {
    const response = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    return handleResponse(response);
  },

  async getPlaylist(playlistId) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}`);
    return handleResponse(response);
  },

  async updatePlaylist(playlistId, name, description) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    return handleResponse(response);
  },

  async deletePlaylist(playlistId) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  async addTrackToPlaylist(playlistId, juntId, trackNumber) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}/items/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ junt_id: juntId, track_number: trackNumber }),
    });
    return handleResponse(response);
  },

  async addJuntToPlaylist(playlistId, juntId) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}/items/junt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ junt_id: juntId }),
    });
    return handleResponse(response);
  },

  async removeItemFromPlaylist(playlistId, itemId) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}/items/${itemId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  async reorderPlaylistItems(playlistId, itemIds) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}/items/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item_ids: itemIds }),
    });
    return handleResponse(response);
  },

  async getPlaylistTracks(playlistId) {
    const response = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`);
    return handleResponse(response);
  },
};
