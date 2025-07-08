import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet'; // Import useMap
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS

const cityCoordinates = {
  "Los Angeles": [34.0522, -118.2437],
  "New York": [40.7128, -74.0060],
  "Philadelphia": [39.9526, -75.1652],
};

// New component to handle map view changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]); // Dependencies: re-run when center, zoom, or map instance changes
  return null; // This component doesn't render anything visible
}

function MapViewPage() {
  const [selectedCity, setSelectedCity] = useState("Los Angeles");

  const currentPosition = useMemo(() => {
    return cityCoordinates[selectedCity] || cityCoordinates["Los Angeles"];
  }, [selectedCity]);

  const zoom = 12;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="p-4 bg-white shadow-md w-full text-center z-10">
        <label htmlFor="city-select" className="block text-lg font-medium text-gray-700 mb-2">
          Select a City:
        </label>
        <select
          id="city-select"
          className="mt-1 block w-full md:w-auto mx-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          {Object.keys(cityCoordinates).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      
      <MapContainer center={currentPosition} zoom={zoom} scrollWheelZoom={true} className="w-[90%] h-[650px] relative z-0 rounded-xl shadow-lg mt-6">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={currentPosition} zoom={zoom} /> {/* Add this component */} 
      </MapContainer>
    </div>
  );
}

export default MapViewPage; 