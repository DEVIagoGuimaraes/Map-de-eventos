import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  granted: boolean;
}

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permissão de localização negada. Ative nas configurações do navegador.';
    case error.POSITION_UNAVAILABLE:
      return 'Localização indisponível no momento. Tente novamente.';
    case error.TIMEOUT:
      return 'Tempo esgotado ao buscar sua localização. Tente novamente.';
    default:
      return 'Não foi possível obter sua localização.';
  }
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
    granted: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, loading: false, error: 'Geolocalização não suportada neste dispositivo.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
          granted: true,
        });
      },
      (error) => {
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                loading: false,
                error: null,
                granted: true,
              });
            },
            (retryError) => {
              setState(prev => ({
                ...prev,
                loading: false,
                error: getGeolocationErrorMessage(retryError),
                granted: false,
              }));
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
          return;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: getGeolocationErrorMessage(error),
          granted: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return state;
};
