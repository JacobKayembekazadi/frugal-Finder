import React from 'react';

interface SearchComponentProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
  history: string[];
  onHistoryClick: (query: string) => void;
  requestLocation?: () => void;
  locationStatus?: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';
}

export const SearchComponent: React.FC<SearchComponentProps> = ({ query, setQuery, onSearch, loading, history, onHistoryClick, requestLocation, locationStatus }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };
    
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center bg-white rounded-full shadow-lg p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 'cheap gas in Scarborough' or 'organic milk'"
          className="w-full bg-transparent p-3 text-gray-700 focus:outline-none"
          disabled={loading}
        />
        <div className="flex items-center space-x-2">
          {typeof requestLocation === 'function' && (
            <button
              onClick={requestLocation}
              disabled={loading}
              className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-2 hover:bg-gray-50 transition-colors"
              title="Use my current location"
            >
              📍
            </button>
          )}

          <button
            onClick={onSearch}
            disabled={loading}
            className="bg-green-600 text-white rounded-full px-6 py-3 hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 flex items-center justify-center"
          >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Search'
          )}
          </button>
        </div>
      </div>

      {locationStatus && (
        <div className="mt-2 text-center text-xs text-gray-500">
          {locationStatus === 'loading' && 'Locating...'}
          {locationStatus === 'granted' && 'Using your location'}
          {locationStatus === 'denied' && 'Location denied — using manual input'}
          {locationStatus === 'unsupported' && 'Location not supported in this browser'}
        </div>
      )}

      {history && history.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500 mr-2">Recent:</span>
          <div className="inline-flex flex-wrap gap-2 justify-center">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => onHistoryClick(item)}
                className="bg-gray-200 text-gray-700 text-sm rounded-full px-3 py-1 hover:bg-gray-300 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};