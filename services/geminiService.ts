import { GoogleGenAI } from "@google/genai";
import { Place } from '../types';

// Only initialize GoogleGenAI if API key is available
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY as string }) : null;

const normalizeCategory = (category: string | undefined): string => {
    if (!category) return 'other';
    const lowerCategory = category.toLowerCase().trim();

    if (['gas', 'fuel', 'petrol', 'station'].some(keyword => lowerCategory.includes(keyword))) {
        return 'gas';
    }
    if (['grocery', 'supermarket', 'food'].some(keyword => lowerCategory.includes(keyword))) {
        return 'groceries';
    }
    if (['clothing', 'apparel', 'fashion'].some(keyword => lowerCategory.includes(keyword))) {
        return 'clothing';
    }
    
    return 'other';
};

const MOCK_PLACES: Place[] = [
    {
      title: "No Frills",
      summary: "A budget-friendly supermarket in Toronto with great weekly deals.",
      product: "Organic Milk",
      price: "$4.50/carton",
      category: "groceries",
      location: { latitude: 43.6532, longitude: -79.3832 },
      uri: "https://maps.google.com/?q=No+Frills+Toronto"
    },
    {
      title: "Loblaws City Market",
      summary: "Premium grocery store with organic selection and prepared foods.",
      product: "Organic Bread",
      price: "$3.99/loaf",
      category: "groceries",
      location: { latitude: 43.6485, longitude: -79.3894 },
      uri: "https://maps.google.com/?q=Loblaws+Toronto"
    },
    {
      title: "Petro-Canada",
      summary: "Gas station with competitive fuel prices and convenience store.",
      product: "Regular Gas",
      price: "$1.45/L",
      category: "gas",
      location: { latitude: 43.6571, longitude: -79.3778 },
      uri: "https://maps.google.com/?q=Petro+Canada+Toronto"
    }
];

export const findPlaces = async (query: string, location: { lat: number; lng: number } | string): Promise<Place[]> => {
    if (!ai || !process.env.API_KEY) {
        console.warn("Using mock data. API_KEY not found or Gemini AI not initialized.");
        const center = typeof location === 'object' ? location : { lat: 43.6532, lng: -79.3832 };
        const updatedMockPlaces = MOCK_PLACES.map(place => ({
            ...place,
            location: {
                latitude: center.lat + (Math.random() - 0.5) * 0.05,
                longitude: center.lng + (Math.random() - 0.5) * 0.05,
            }
        }));
        return new Promise(resolve => setTimeout(() => resolve(updatedMockPlaces), 1000));
    }

    try {
        if (typeof location === 'object') {
            // Geolocation is available, use grounding
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Find cheap alternatives for "${query}" in Toronto. Based on the map search results, generate a JSON array of objects. Each object should correspond to a place found and contain these keys: "summary", "product", "price", and "category". For the "category" key, use one of the following values: "groceries", "clothing", "gas", or "other". Do not add any text before or after the JSON array. Make sure the order of items in your response matches the order of places in the search results.`,
                config: { tools: [{ googleMaps: {} }] },
                toolConfig: { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } }
            });
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            if (groundingChunks.length === 0) return [];

            const responseText = response.text.trim();
            const cleanJson = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            const modelData = JSON.parse(cleanJson);
            
            if (!Array.isArray(modelData)) throw new Error("AI response was not in the expected format (array).");

            return groundingChunks.map((chunk, index) => {
                const placeDetails = modelData[index];
                const mapData = chunk.maps;
                if (!mapData || !placeDetails || mapData.latLng?.latitude == null || mapData.latLng?.longitude == null) return null;
                return {
                    title: mapData.title || "Untitled Place",
                    summary: placeDetails.summary || "No summary available.",
                    product: placeDetails.product || "N/A",
                    price: placeDetails.price || "N/A",
                    category: normalizeCategory(placeDetails.category),
                    location: { latitude: mapData.latLng.latitude, longitude: mapData.latLng.longitude },
                    uri: mapData.uri || "#"
                };
            }).filter((place): place is Place => place !== null);

        } else {
            // Manual location string, use standard generation
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Find cheap alternatives for "${query}" near "${location}" (which should be in or near Toronto, Canada). Generate a JSON array of objects. Each object should correspond to a place and contain these keys: "title", "summary", "product", "price", "category", "uri" (a google maps link), and "location" (with "latitude" and "longitude" sub-keys). For "category", use: "groceries", "clothing", "gas", or "other". Respond with only the JSON array.`,
                config: { responseMimeType: "application/json" },
            });

            const responseText = response.text.trim();
            const modelData = JSON.parse(responseText);
            if (!Array.isArray(modelData)) throw new Error("AI response was not in the expected format (array).");

            return modelData.map((placeData: any) => {
                if (placeData?.location?.latitude == null || placeData?.location?.longitude == null) return null;
                return {
                    title: placeData.title || "Untitled Place",
                    summary: placeData.summary || "No summary available.",
                    product: placeData.product || "N/A",
                    price: placeData.price || "N/A",
                    category: normalizeCategory(placeData.category),
                    location: { latitude: placeData.location.latitude, longitude: placeData.location.longitude },
                    uri: placeData.uri || "#"
                };
            }).filter((place): place is Place => place !== null);
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && (error.message.includes("AI response") || error.message.includes("JSON"))) {
            throw error;
        }
        throw new Error("Failed to fetch places from Gemini API.");
    }
};