import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

const GlobeComponent = ({ onCountryClick, isRotationPaused }) => {
    const globeEl = useRef();
    const [countries, setCountries] = useState({ features: [] });
    const [hoverD, setHoverD] = useState(null);

    useEffect(() => {
        // Load country polygons
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries);
    }, []);

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = !isRotationPaused;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, [isRotationPaused]);

    return (
        <div className="absolute inset-0 z-0">
            <Globe
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                polygonsData={countries.features}
                polygonAltitude={d => d === hoverD ? 0.12 : 0.06}
                polygonCapColor={d => d === hoverD ? 'rgba(56, 189, 248, 0.3)' : 'rgba(20, 20, 35, 0.4)'}
                polygonSideColor={() => 'rgba(100, 200, 255, 0.05)'}
                polygonStrokeColor={() => '#111'}
                polygonLabel={({ properties: d }) => `
          <div class="px-2 py-1 bg-gray-900/90 text-white text-xs rounded border border-cyan-500 shadow-xl font-mono">
            ${d.NAME} (${d.ISO_A2})
          </div>
        `}
                onPolygonHover={setHoverD}
                onPolygonClick={(d) => {
                    if (globeEl.current) {
                        // Calculate centroid for camera target
                        const getGeoCenter = (geometry) => {
                            if (!geometry) return null;
                            const coords = geometry.type === 'MultiPolygon'
                                ? geometry.coordinates.flat(2)
                                : geometry.coordinates.flat(1);

                            if (!coords.length) return null;

                            let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
                            coords.forEach(p => {
                                const [lng, lat] = p;
                                if (lng < minLng) minLng = lng;
                                if (lng > maxLng) maxLng = lng;
                                if (lat < minLat) minLat = lat;
                                if (lat > maxLat) maxLat = lat;
                            });

                            return {
                                lat: (minLat + maxLat) / 2,
                                lng: (minLng + maxLng) / 2
                            };
                        };

                        const center = getGeoCenter(d.geometry);
                        if (center) {
                            globeEl.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.8 }, 1000);
                        }
                    }
                    onCountryClick(d.properties);
                }}
                atmosphereColor="#3a228a"
                atmosphereAltitude={0.2}
            />
        </div>
    );
};

export default GlobeComponent;
