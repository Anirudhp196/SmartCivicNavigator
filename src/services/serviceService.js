const API_URL = 'http://localhost:5001/api/services'; // Adjust if your backend runs on a different port/URL

const getServicesByCoordinates = async (lat, lng, radius = 10000) => {
  try {
    const response = await fetch(`${API_URL}?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch services');
    }
    const data = await response.json();
    return data.data; // Backend sends { success: true, data: services[] }

  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

const serviceService = {
  getServicesByCoordinates,
};

export default serviceService; 