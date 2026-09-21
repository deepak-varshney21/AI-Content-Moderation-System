/**
 * Frontend API Service for Content Moderation Backend Communication.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected network error occurred';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      } else if (errorData.errors) {
        errorDetail = errorData.errors.join('; ');
      }
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  /**
   * Health check and model status
   */
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(res);
  },

  /**
   * Dry-run comment prediction
   */
  async predictComment(comment, customThreshold = null) {
    const payload = { comment };
    if (customThreshold !== null && customThreshold !== undefined) {
      payload.custom_threshold = customThreshold;
    }
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Full moderation workflow with database persistence
   */
  async moderateComment(comment, customThreshold = null) {
    const payload = { comment };
    if (customThreshold !== null && customThreshold !== undefined) {
      payload.custom_threshold = customThreshold;
    }
    const res = await fetch(`${API_BASE_URL}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Retrieve moderation history
   */
  async getHistory({ skip = 0, limit = 50, severity = '', action = '', search = '' } = {}) {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (severity) params.append('severity', severity);
    if (action) params.append('action', action);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`);
    return handleResponse(res);
  },

  /**
   * Get single history item detail
   */
  async getHistoryDetail(recordId) {
    const res = await fetch(`${API_BASE_URL}/history/${recordId}`);
    return handleResponse(res);
  },

  /**
   * Delete single history record
   */
  async deleteHistoryRecord(recordId) {
    const res = await fetch(`${API_BASE_URL}/history/${recordId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  /**
   * Fetch aggregate statistics & label distributions
   */
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`);
    return handleResponse(res);
  },
};
