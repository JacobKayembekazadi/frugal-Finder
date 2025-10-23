import React from 'react';
import { Place } from '../types';

interface ResultsComponentProps {
  places: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
}

const categoryBgColors: { [key: string]: string } = {
  groceries: 'bg-blue-500',
  clothing: 'bg-purple-500',
  gas: 'bg-orange-500',
  other: 'bg-gray-500',
};

const ResultCard: React.FC<{ place: Place; isSelected: boolean; onSelect: () => void; }> = ({ place, isSelected, onSelect }) => {
    const categoryColor = categoryBgColors[place.category.toLowerCase()] || categoryBgColors.other;

    return (
        <div
            onClick={onSelect}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-green-50 border-green-400 shadow-md' : 'bg-white hover:shadow-lg hover:border-gray-300 border-gray-200'}`}
        >
            <div className="flex items-center mb-1">
              <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${categoryColor}`}></div>
              <h3 className="font-bold text-gray-800 truncate">{place.title}</h3>
            </div>
            <p className="text-sm text-green-600 font-semibold">{place.product} - {place.price}</p>
            <p className="text-sm text-gray-600 mt-1">{place.summary}</p>
            <a href={place.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                View on Map
            </a>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="p-4 rounded-lg bg-white border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-full mt-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4 mt-3"></div>
    </div>
);


export const ResultsComponent: React.FC<ResultsComponentProps> = ({ places, loading, selectedPlace, onPlaceSelect }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg h-full max-h-[500px] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Results</h2>
      <div className="space-y-4">
        {loading && (
            <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </>
        )}
        {!loading && places.length === 0 && (
          <p className="text-gray-500">No results yet. Try a search!</p>
        )}
        {!loading && places.map((place, index) => (
          <ResultCard
            key={`${place.uri}-${index}`}
            place={place}
            isSelected={selectedPlace?.uri === place.uri}
            onSelect={() => onPlaceSelect(place)}
          />
        ))}
      </div>
    </div>
  );
};
