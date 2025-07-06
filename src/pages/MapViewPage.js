import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS

function MapViewPage() {
  const position = [34.0522, -118.2437]; // Default to Los Angeles latitude and longitude
  const zoom = 12;

  return (
    <div className="w-full h-screen flex-grow relative">
      <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Add Markers, Popups, etc. here */}
      </MapContainer>
    </div>
  );
}

export default MapViewPage; 