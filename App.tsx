import React, { useState, useCallback } from 'react';
import { Place } from './types';
import { findPlaces } from './services/geminiService';
import { MapComponent } from './components/MapComponent';
import { SearchComponent } from './components/SearchComponent';
import { ResultsComponent } from './components/ResultsComponent';
import { useSearchHistory } from './hooks/useSearchHistory';
import useGeolocation from './hooks/useGeolocation';

interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose }) => {
  const categoryBgColors: { [key: string]: string } = {
    groceries: 'bg-blue-500',
    clothing: 'bg-purple-500',
    gas: 'bg-orange-500',
    other: 'bg-gray-500',
  };
  const categoryColor = categoryBgColors[place.category.toLowerCase()] || categoryBgColors.other;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md relative transform transition-all duration-300 z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="flex items-center mb-3">
            <div className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${categoryColor}`}></div>
            <h2 className="text-2xl font-bold text-gray-800">{place.title}</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="text-sm font-semibold text-green-700 bg-green-100 inline-block px-3 py-1 rounded-full">{place.product} - {place.price}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600 text-sm mb-1">Summary</h3>
              <p className="text-base">{place.summary}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <a href={place.uri} target="_blank" rel="noopener noreferrer" className="w-full text-center block bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-300 font-semibold">
            View on Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [history, addHistoryItem] = useSearchHistory();

  const [manualLocationQuery, setManualLocationQuery] = useState('Toronto');
  const { location: currentLocation, status: locationState, error: locationError, requestLocation } = useGeolocation();

  // surface geolocation errors into the app's error banner
  React.useEffect(() => {
    if (locationError) setError(locationError);
  }, [locationError]);

  const handleSearch = useCallback(async () => {
  const locationForSearch = locationState === 'granted' ? currentLocation : manualLocationQuery;
    
    if (!locationForSearch) {
      setError('Please provide a location to search.');
      return;
    }
    if (!query) {
      setError('Please enter something to search for.');
      return;
    }

    setLoading(true);
    setError(null);
    setPlaces([]);
    setSelectedPlace(null);
    addHistoryItem(query);

    try {
      const results = await findPlaces(query, locationForSearch);
      setPlaces(results);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query, addHistoryItem, locationState, currentLocation, manualLocationQuery]);

  const handleHistorySearch = (term: string) => {
    setQuery(term);
  };

  const handlePinClick = (place: Place) => {
    console.log('Pin clicked:', place.title);
    setSelectedPlace(place);
  };
  
  const mapCenter = currentLocation || { lat: 43.6532, lng: -79.3832 }; // Default to center of Toronto

  if (locationState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-gray-600 font-semibold">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800">Frugal Finder</h1>
          <p className="text-center text-gray-500">Find the best prices in Toronto</p>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {locationState === 'denied' && (
            <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-md">
              <p className="font-semibold mb-2">Location Access Denied</p>
              <p className="text-sm mb-3">To find deals near you, please enable location services. Otherwise, we'll search based on your manual input (defaulting to Toronto).</p>
              <input
                type="text"
                value={manualLocationQuery}
                onChange={(e) => setManualLocationQuery(e.target.value)}
                placeholder="Enter a city, address, or zip code"
                className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          )}

          <SearchComponent 
            query={query} 
            setQuery={setQuery} 
            onSearch={handleSearch} 
            loading={loading}
            history={history}
            onHistoryClick={handleHistorySearch}
            requestLocation={requestLocation}
            locationStatus={locationState}
          />
          
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <MapComponent 
              center={mapCenter} 
              places={places} 
              onPinClick={handlePinClick} 
              selectedPlace={selectedPlace}
              userLocationAvailable={locationState === 'granted'}
            />
            <ResultsComponent 
              places={places} 
              loading={loading}
              selectedPlace={selectedPlace}
              onPlaceSelect={setSelectedPlace}
            />
          </div>
        </div>
      </main>

      {selectedPlace && <PlaceDetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
    </div>
  );
};

export default App;