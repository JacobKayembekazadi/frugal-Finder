import React, { useEffect, useRef } from 'react';
import { Place } from '../types';

declare const L: any; // Declare Leaflet for TypeScript

interface MapComponentProps {
  center: { lat: number; lng: number };
  places: Place[];
  onPinClick: (place: Place) => void;
  selectedPlace: Place | null;
  userLocationAvailable: boolean;
}

const categoryColors: { [key: string]: { base: string; pulse: string; hex: string } } = {
  groceries: { base: 'bg-blue-500', pulse: 'bg-blue-400', hex: '#3B82F6' },
  clothing: { base: 'bg-purple-500', pulse: 'bg-purple-400', hex: '#8B5CF6' },
  gas: { base: 'bg-orange-500', pulse: 'bg-orange-400', hex: '#F97316' },
  other: { base: 'bg-gray-500', pulse: 'bg-gray-400', hex: '#6B7280' },
};

export const MapComponent: React.FC<MapComponentProps> = ({ center, places, onPinClick, selectedPlace, userLocationAvailable }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: userLocationAvailable ? 13 : 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
    }
  }, [center, userLocationAvailable]);

  // Update markers and view
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    const allMarkers = [];

    // Add user marker
    if(userLocationAvailable) {
      const userIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                 <div class="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const userMarker = L.marker([center.lat, center.lng], { icon: userIcon, zIndexOffset: -100 }).addTo(map);
      markersRef.current.push(userMarker);
      allMarkers.push(userMarker);
    }

    // Add place markers
    places.forEach(place => {
      const isSelected = selectedPlace?.uri === place.uri;
      const categoryColor = categoryColors[place.category.toLowerCase() as keyof typeof categoryColors] || categoryColors.other;

      const pinHtml = `
        <div class="custom-pin ${isSelected ? 'selected' : ''}" style="width: 24px; height: 34px;">
          <div class="pin-body relative w-6 h-6 rounded-full border-2 border-white shadow-md ${categoryColor.base}">
            ${isSelected ? `<div class="absolute inset-0 rounded-full animate-ping ${categoryColor.pulse}"></div>` : ''}
          </div>
          <div class="absolute bottom-0 left-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] -translate-x-1/2" style="border-top-color: ${categoryColor.hex};"></div>
        </div>`;

      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html: pinHtml,
        iconSize: [24, 34],
        iconAnchor: [12, 34],
      });

      const marker = L.marker([place.location.latitude, place.location.longitude], { 
        icon,
        zIndexOffset: isSelected ? 1000 : 0
      })
        .addTo(map)
        .on('click', () => onPinClick(place));
      
      markersRef.current.push(marker);
      allMarkers.push(marker);
    });

    if (allMarkers.length > 0) {
      const featureGroup = L.featureGroup(allMarkers);
      map.fitBounds(featureGroup.getBounds().pad(0.2));
    } else if (userLocationAvailable) {
      map.setView([center.lat, center.lng], 13);
    }
  }, [places, center, selectedPlace, onPinClick, userLocationAvailable]);
  
  const handleRecenter = () => {
    if (mapRef.current && userLocationAvailable) {
      mapRef.current.setView([center.lat, center.lng], 13);
    }
  };

  return (
    <div className="relative w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {userLocationAvailable && (
        <div className="absolute top-2.5 right-[11px] flex flex-col space-y-2 z-[1000]">
          <button onClick={handleRecenter} className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition leaflet-bar" title="Recenter">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-3 rounded-lg shadow-md z-[1000]">
        <h4 className="font-semibold text-sm mb-2 text-gray-700">Legend</h4>
        <div className="flex flex-col space-y-1">
          {Object.entries(categoryColors).map(([name, color]) => (
            <div key={name} className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${color.base}`}></div>
              <span className="text-xs text-gray-600 capitalize">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
