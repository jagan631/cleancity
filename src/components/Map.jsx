import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map center
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

// Custom marker icons by type
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

const typeColors = {
    'overflowing': '#f97316',
    'illegal-dump': '#ef4444',
    'litter': '#eab308',
    'recycling': '#22c55e'
};

export default function WasteMap({ reports, center = [28.6139, 77.2090] }) {
    return (
        <MapContainer
            center={center}
            zoom={13}
            className="h-[500px] w-full rounded-xl shadow-lg"
        >
            <MapUpdater center={center} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => {
                const lat = Number(report.latitude);
                const lng = Number(report.longitude);

                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                    <CircleMarker
                        key={report.id}
                        center={[lat, lng]}
                        radius={12}
                        pathOptions={{
                            fillColor: typeColors[report.type] || '#808080',
                            fillOpacity: 1,
                            color: 'white',
                            weight: 3,
                        }}
                    >
                        <Popup maxWidth={300}>
                            <div className="p-2 font-sans">
                                <h3 className="font-bold capitalize text-gray-800 mb-2">{report.type.replace('-', ' ')}</h3>

                                {report.image_url && (
                                    <img
                                        src={report.image_url}
                                        alt="Waste report"
                                        className="w-full h-32 object-cover rounded mb-2 cursor-pointer"
                                        onClick={() => window.open(report.image_url, '_blank')}
                                    />
                                )}

                                <p className="text-sm text-gray-600 mb-1">📍 {report.location_name}</p>
                                <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    {report.status}
                                </span>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}