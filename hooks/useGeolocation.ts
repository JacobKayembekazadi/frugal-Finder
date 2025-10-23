import { useEffect, useRef, useState, useCallback } from 'react';

type Location = { lat: number; lng: number } | null;
type PermissionState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

export function useGeolocation(initial?: Location) {
  const [location, setLocation] = useState<Location>(initial ?? null);
  const [status, setStatus] = useState<PermissionState>(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return 'unsupported';
    return 'idle';
  });
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser.');
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        setError(err.message || 'Unable to retrieve location');
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser.');
      setStatus('unsupported');
      return;
    }

    if (watchId.current != null) return; // already watching

    setStatus('loading');
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        setError(err.message || 'Unable to watch location');
        setStatus('denied');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setStatus((s) => (s === 'granted' ? 'idle' : s));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current != null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return { location, status, error, requestLocation, startWatching, stopWatching } as const;
}

export default useGeolocation;
