import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';

interface LocationPickerMapProps {
    lat: number;
    lon: number;
    onLocationChange: (lat: number, lon: number) => void;
    initialZoom?: number;
    className?: string;
}

// Component to handle map center updates when props change externally
function MapController({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    const lastPropsRef = useRef({ lat, lon });

    useEffect(() => {
        // Only fly to new position if props changed (not from map drag)
        if (lastPropsRef.current.lat !== lat || lastPropsRef.current.lon !== lon) {
            lastPropsRef.current = { lat, lon };
            map.flyTo([lat, lon], map.getZoom(), {
                duration: 1
            });
        }
    }, [lat, lon, map]);

    return null;
}

// Component to handle map drag and update coordinates from center
function MapCenterTracker({ onLocationChange }: { onLocationChange: (lat: number, lon: number) => void }) {
    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            onLocationChange(center.lat, center.lng);
        },
    });
    return null;
}

export function LocationPickerMap({
    lat,
    lon,
    onLocationChange,
    initialZoom = 13,
    className = "h-full w-full"
}: LocationPickerMapProps) {
    return (
        <div className={`relative ${className}`} data-vaul-no-drag>
            {/* Fixed centered pin overlay */}
            <div className="absolute inset-0 pointer-events-none z-[500] flex items-center justify-center">
                <div className="marker-reticle">
                    <div className="marker-center"></div>
                    <div className="marker-ring"></div>
                </div>
            </div>

            {/* Map */}
            <MapContainer
                center={[lat, lon]}
                zoom={initialZoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                attributionControl={false}
            >
                {/* Esri World Imagery (Satellite) */}
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />

                {/* Labels Overlay */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />

                <MapController lat={lat} lon={lon} />
                <MapCenterTracker onLocationChange={onLocationChange} />
            </MapContainer>
        </div>
    );
}
