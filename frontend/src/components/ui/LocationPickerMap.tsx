import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';

// Removed default icon imports as we are using custom DivIcon

interface LocationPickerMapProps {
    lat: number;
    lon: number;
    onLocationChange: (lat: number, lon: number) => void;
    initialZoom?: number;
    className?: string;
}

// Custom Marker Icon - simple dot with ring
const customMarkerIcon = new L.DivIcon({
    className: 'custom-map-marker',
    html: `
    <div class="marker-reticle">
      <div class="marker-center"></div>
      <div class="marker-ring"></div>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// Component to handle map center updates when props change
function MapController({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], map.getZoom(), {
            duration: 1.5
        });
    }, [lat, lon, map]);
    return null;
}

// Draggable marker component
function DraggableMarker({
    position,
    onDragEnd
}: {
    position: [number, number];
    onDragEnd: (lat: number, lon: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onDragEnd(lat, lng);
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={customMarkerIcon}
        />
    );
}

export function LocationPickerMap({
    lat,
    lon,
    onLocationChange,
    initialZoom = 13,
    className = "h-full w-full"
}: LocationPickerMapProps) {
    return (
        <div className={`relative ${className}`}>
            <MapContainer
                center={[lat, lon]}
                zoom={initialZoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
            >
                {/* CartoDB Dark Matter Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapController lat={lat} lon={lon} />
                <DraggableMarker
                    position={[lat, lon]}
                    onDragEnd={onLocationChange}
                />
            </MapContainer>
        </div>
    );
}
