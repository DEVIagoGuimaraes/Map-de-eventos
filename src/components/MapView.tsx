import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Event {
  id: string;
  name: string;
  category: string;
  attractions: string;
  date: string;
  time: string;
  location: string;
  ticketPrice: number;
  coordinates: [number, number];
}

interface MapViewProps {
  events: Event[];
  userLocation?: [number, number];
}

const MapView = ({ events, userLocation }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const routeInfoRef = useRef<HTMLDivElement | null>(null);

  const clearRoute = useCallback(() => {
    if (routingControlRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    if (routeInfoRef.current) {
      routeInfoRef.current.remove();
      routeInfoRef.current = null;
    }
  }, []);

  const traceRoute = useCallback((destination: [number, number], eventName: string) => {
    if (!mapInstanceRef.current || !userLocation) return;
    clearRoute();

    const control = (L as any).Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(destination[0], destination[1]),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,
      lineOptions: {
        styles: [
          { color: 'hsl(185, 72%, 48%)', opacity: 0.85, weight: 5 },
          { color: 'hsl(185, 72%, 68%)', opacity: 0.4, weight: 10 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      router: (L as any).Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
    }).addTo(mapInstanceRef.current);

    control.on('routesfound', (e: any) => {
      const route = e.routes[0];
      const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
      const timeMin = Math.round(route.summary.totalTime / 60);

      // Create route info overlay
      const infoDiv = document.createElement('div');
      infoDiv.className = 'route-info-overlay';
      infoDiv.innerHTML = `
        <div class="route-info-card">
          <div class="route-info-header">
            <span class="route-info-title">Rota para ${eventName}</span>
            <button class="route-info-close" id="close-route">✕</button>
          </div>
          <div class="route-info-stats">
            <div class="route-stat">
              <span class="route-stat-value">${distanceKm} km</span>
              <span class="route-stat-label">Distância</span>
            </div>
            <div class="route-stat">
              <span class="route-stat-value">${timeMin} min</span>
              <span class="route-stat-label">Tempo estimado</span>
            </div>
          </div>
        </div>
      `;
      mapRef.current?.parentElement?.appendChild(infoDiv);
      routeInfoRef.current = infoDiv;

      infoDiv.querySelector('#close-route')?.addEventListener('click', clearRoute);
    });

    routingControlRef.current = control;
  }, [userLocation, clearRoute]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const center: [number, number] = userLocation || [-10.9472, -37.0731];
    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, userLocation ? 14 : 12);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Expose traceRoute globally for popup buttons
    (window as any).__traceRoute = traceRoute;

    return () => {
      clearRoute();
      map.remove();
      delete (window as any).__traceRoute;
    };
  }, [userLocation, traceRoute, clearRoute]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing markers only
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // User avatar marker with Lucide-style icon + ping
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-avatar-marker',
        html: `
          <div class="user-avatar-ping"></div>
          <div class="user-avatar-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21a8 8 0 0 0-16 0"/>
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker(userLocation, { icon: userIcon, interactive: false }).addTo(map);
    }

    // Event markers
    events.forEach((event) => {
      const customIcon = L.divIcon({
        className: 'custom-event-marker',
        html: `
          <div class="event-marker">
            <div class="marker-inner">${getCategoryIcon(event.category)}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const hasUserLocation = !!userLocation;
      const routeButton = hasUserLocation
        ? `<button onclick="window.__traceRoute([${event.coordinates[0]},${event.coordinates[1]}],'${event.name.replace(/'/g, "\\'")}')" class="popup-route-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Como Chegar
          </button>`
        : '';

      const marker = L.marker(event.coordinates, { icon: customIcon, interactive: true }).addTo(map);

      marker.bindPopup(`
        <div class="event-popup">
          <h3 class="event-popup-title">${event.name}</h3>
          <p class="event-popup-category">${event.category}</p>
          <p class="event-popup-info"><strong>Data:</strong> ${new Date(event.date).toLocaleDateString('pt-BR')} às ${event.time}</p>
          <p class="event-popup-info"><strong>Local:</strong> ${event.location}</p>
          <p class="event-popup-price">Entrada: ${event.ticketPrice > 0 ? `R$ ${event.ticketPrice.toFixed(2)}` : 'Gratuita'}</p>
          <div class="event-popup-actions">
            <a href="/evento/${event.id}" class="popup-detail-btn">Ver Detalhes</a>
            ${routeButton}
          </div>
        </div>
      `, { maxWidth: 300, closeButton: true, autoClose: true });
    });
  }, [events, userLocation, traceRoute]);

  // Update traceRoute ref
  useEffect(() => {
    (window as any).__traceRoute = traceRoute;
  }, [traceRoute]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Show': '🎵', 'Teatro': '🎭', 'Dança': '💃', 'Exposição': '🎨',
      'Cinema': '🎬', 'Festival': '🎪', 'Workshop': '🎯', 'Palestra': '🎤',
      'Esporte': '⚽', 'default': '🎫',
    };
    return icons[category] || icons.default;
  };

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo(userLocation, 15, { duration: 1 });
    }
  };

  return (
    <>
      <div ref={mapRef} className="map-container" />
      {userLocation && (
        <button
          onClick={handleCenterOnUser}
          className="center-on-me-btn"
          title="Centralizar em mim"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4"/>
            <path d="M12 18v4"/>
            <path d="M2 12h4"/>
            <path d="M18 12h4"/>
          </svg>
        </button>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        .map-container {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
          pointer-events: auto !important;
        }

        /* User Avatar Marker */
        .user-avatar-marker {
          background: transparent !important;
          border: none !important;
        }
        .user-avatar-icon {
          width: 36px;
          height: 36px;
          background: hsl(185, 72%, 48%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(210, 80%, 98%);
          border: 3px solid hsl(0, 0%, 100%);
          box-shadow: 0 2px 12px hsla(185, 72%, 48%, 0.5);
          position: absolute;
          top: 4px;
          left: 4px;
          z-index: 2;
        }
        .user-avatar-ping {
          position: absolute;
          top: 0;
          left: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: hsla(185, 72%, 48%, 0.3);
          animation: avatar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: 1;
        }
        @keyframes avatar-ping {
          0% { transform: scale(1); opacity: 0.7; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }

        /* Event Markers */
        .custom-event-marker {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
        }
        .event-marker {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, hsl(185, 72%, 48%), hsl(175, 65%, 58%));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px hsla(185, 72%, 48%, 0.4);
          border: 2px solid hsl(220, 15%, 95%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          pointer-events: auto !important;
        }
        .event-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px hsla(185, 72%, 48%, 0.6);
        }
        .marker-inner { font-size: 16px; line-height: 1; }

        /* Event Popup */
        .leaflet-popup-content-wrapper {
          background: hsl(210, 70%, 9%) !important;
          box-shadow: 0 8px 32px hsla(210, 80%, 12%, 0.4) !important;
          border-radius: 14px !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip {
          background: hsl(210, 70%, 9%) !important;
          box-shadow: none !important;
        }
        .event-popup {
          padding: 16px;
          min-width: 240px;
          color: hsl(195, 30%, 92%);
        }
        .event-popup-title {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 700;
          color: hsl(195, 30%, 98%);
        }
        .event-popup-category {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 600;
          color: hsl(185, 72%, 58%);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-popup-info {
          margin: 3px 0;
          font-size: 13px;
          color: hsl(195, 20%, 70%);
        }
        .event-popup-info strong { color: hsl(195, 30%, 85%); }
        .event-popup-price {
          margin: 8px 0 0;
          font-size: 14px;
          font-weight: 700;
          color: hsl(185, 72%, 58%);
        }
        .event-popup-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .popup-detail-btn, .popup-route-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .popup-detail-btn {
          background: hsl(210, 50%, 18%);
          color: hsl(195, 30%, 92%);
        }
        .popup-detail-btn:hover { background: hsl(210, 50%, 22%); }
        .popup-route-btn {
          background: hsl(185, 72%, 48%);
          color: hsl(210, 80%, 98%);
        }
        .popup-route-btn:hover { background: hsl(185, 72%, 42%); }

        /* Center on me button */
        .center-on-me-btn {
          position: absolute;
          bottom: 90px;
          left: 10px;
          z-index: 1000;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: none;
          background: hsl(0, 0%, 100%);
          box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(210, 80%, 12%);
          transition: all 0.2s;
        }
        .center-on-me-btn:hover {
          background: hsl(195, 25%, 95%);
          color: hsl(185, 72%, 42%);
        }

        /* Route info overlay */
        .route-info-overlay {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          animation: fade-in-down 0.3s ease-out;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .route-info-card {
          background: hsl(0, 0%, 100%);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 20px hsla(0, 0%, 0%, 0.15);
          min-width: 260px;
        }
        .route-info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .route-info-title {
          font-size: 13px;
          font-weight: 600;
          color: hsl(210, 80%, 12%);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .route-info-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: hsl(210, 15%, 55%);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .route-info-close:hover { background: hsl(195, 25%, 93%); }
        .route-info-stats {
          display: flex;
          gap: 20px;
        }
        .route-stat { display: flex; flex-direction: column; }
        .route-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: hsl(185, 72%, 42%);
        }
        .route-stat-label {
          font-size: 11px;
          color: hsl(210, 15%, 55%);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Zoom controls */
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px hsla(0,0%,0%,0.15) !important; border-radius: 6px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: hsl(0,0%,100%) !important; color: hsl(210,80%,12%) !important; border: none !important; border-bottom: 1px solid hsl(195,25%,90%) !important; font-size: 16px !important; }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
        .leaflet-control-zoom a:hover { background: hsl(195,25%,95%) !important; }

        /* Hide default routing container */
        .leaflet-routing-container { display: none !important; }
        `
      }} />
    </>
  );
};

export default MapView;
