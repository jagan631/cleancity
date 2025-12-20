import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => (
                <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={createCustomIcon(typeColors[report.type])}
                >
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-bold capitalize">{report.type.replace('-', ' ')}</h3>
                            <p className="text-sm text-gray-600">{report.location_name}</p>
                            <p className="text-sm mt-1">{report.description}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                {report.status}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}