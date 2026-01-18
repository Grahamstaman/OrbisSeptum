// update-world-data.js
// Run with: node update-world-data.js
import fs from 'fs/promises';
import { countryData as existingData } from './src/data/mockData.js';

// --- CONFIGURATION ---
const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
const WB_BASE = "http://api.worldbank.org/v2/country";

// Defines which countries to fetch. Remove this list to run the WHOLE WORLD.
const TARGET_ISO_CODES = ["USA", "CHN", "IND", "DEU", "BRA", "JPN", "GBR", "FRA", "RUS", "CAN", "AUS"];

async function fetchCountryStats(iso3) {
    const format = "format=json&per_page=1&mrnev=1";

    // Indicators:
    // GDP (NY.GDP.MKTP.CD)
    // Population (SP.POP.TOTL)
    // Growth (NY.GDP.MKTP.KD.ZG)
    // Agriculture % (NV.AGR.TOTL.ZS)
    // Industry % (NV.IND.TOTL.ZS)
    // Services % (NV.SRV.TOTL.ZS)

    try {
        // Fetch all 6 indicators in parallel
        const results = await Promise.all([
            fetch(`${WB_BASE}/${iso3}/indicator/NY.GDP.MKTP.CD?${format}`).then(r => r.json()),
            fetch(`${WB_BASE}/${iso3}/indicator/SP.POP.TOTL?${format}`).then(r => r.json()),
            fetch(`${WB_BASE}/${iso3}/indicator/NY.GDP.MKTP.KD.ZG?${format}`).then(r => r.json()),
            fetch(`${WB_BASE}/${iso3}/indicator/NV.AGR.TOTL.ZS?${format}`).then(r => r.json()), // Ag
            fetch(`${WB_BASE}/${iso3}/indicator/NV.IND.TOTL.ZS?${format}`).then(r => r.json()), // Ind
            fetch(`${WB_BASE}/${iso3}/indicator/NV.SRV.TOTL.ZS?${format}`).then(r => r.json())  // Serv
        ]);

        const getVal = (res) => res[1]?.[0]?.value || 0;

        const gdp = getVal(results[0]);
        const pop = getVal(results[1]);
        const growth = getVal(results[2]);
        const ag = getVal(results[3]);
        const ind = getVal(results[4]);
        const serv = getVal(results[5]);

        return {
            gdpRaw: gdp,
            popRaw: pop,
            growthRaw: growth,
            formatted: {
                gdp: gdp > 1e12 ? `$${(gdp / 1e12).toFixed(1)}T` : `$${(gdp / 1e9).toFixed(1)}B`,
                population: pop > 1e9 ? `${(pop / 1e9).toFixed(2)}B` : `${(pop / 1e6).toFixed(1)}M`,
                growth: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
                // These map to your 'segments' in the dashboard
                segments: [
                    { name: "Services", value: Math.round(serv) },
                    { name: "Industry", value: Math.round(ind) },
                    { name: "Agriculture", value: Math.round(ag) }
                ].sort((a, b) => b.value - a.value) // Sort highest first
            }
        };

    } catch (e) {
        console.warn(`⚠️ Failed to fetch WB data for ${iso3}:`, e.message);
        return null;
    }
}

function generateIntelligence(countryName, stats) {
    // Calculates Risk based on Real GDP Growth Stability
    // < 0% = High Risk, 0-2% = Medium, > 2% = Low (Simplified Heuristic)
    let risk = "Medium";
    if (stats.growthRaw < 0) risk = "High";
    if (stats.growthRaw > 2.0 && stats.gdpRaw > 1e11) risk = "Low";

    return {
        activeUsers: (stats.popRaw * 0.01 / 1000000).toFixed(1) + "M", // Simulating app users
        risk: risk
    };
}

// 3. Fetch NASA EONET Events (Planetary Status)
async function fetchNasaEvents() {
    console.log("📡 Scanning Planetary Surface (NASA EONET)...");
    const url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20";

    try {
        const res = await fetch(url);
        const data = await res.json();

        return data.events.map(event => ({
            id: event.id,
            title: event.title,
            type: event.categories[0]?.title || "Unknown",
            lat: event.geometry[0].coordinates[1],
            lng: event.geometry[0].coordinates[0],
            date: event.geometry[0].date
        }));
    } catch (e) {
        console.warn("⚠️ Failed to fetch NASA EONET data:", e.message);
        return [];
    }
}

// 4. Fetch USGS Seismic Data (Lithosphere Status)
async function fetchSeismicData() {
    console.log("📡 Scanning Lithosphere (USGS API)...");
    try {
        // Fetches all 2.5+ magnitude earthquakes from the last 24 hours
        const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const data = await res.json();

        // Transform into a lightweight format for the Globe
        const hazards = data.features.map(f => ({
            id: f.id,
            type: "Seismic",
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            val: f.properties.mag, // Magnitude determines dot size
            location: f.properties.place,
            timestamp: f.properties.time,
            title: `M ${f.properties.mag} Earthquake` // Consistent title for UI
        }));

        console.log(`✅ Lithosphere Scan Complete. Detected ${hazards.length} Seismic Events.`);
        return hazards;

    } catch (e) {
        console.warn("⚠️ USGS Uplink Failed:", e.message);
        return [];
    }
}

async function main() {
    console.log("🔵 ORBIS DATA ENGINE: INITIALIZING REAL-TIME FETCH...");

    // 1. Get GeoJSON for correct naming
    const geoRes = await fetch(GEOJSON_URL);
    const geoData = await geoRes.json();

    // Parallelize Global Scans
    const [nasaEvents, seismicData] = await Promise.all([
        fetchNasaEvents(),
        fetchSeismicData()
    ]);

    console.log(`✅ Global Intelligence Report: ${nasaEvents.length} NASA Events & ${seismicData.length} Seismic Activities.`);

    const outputData = {};
    let count = 0;

    for (const feature of geoData.features) {
        const name = feature.properties.NAME;
        const iso3 = feature.properties.ISO_A3;
        const iso2 = feature.properties.ISO_A2;

        // if (!TARGET_ISO_CODES.includes(iso3)) continue;

        process.stdout.write(`   Processing ${name} (${iso3})... `);

        const wbStats = await fetchCountryStats(iso3);

        if (wbStats) {
            const intelligence = generateIntelligence(name, wbStats);

            // Check if this country already exists in your file and has custom fields
            const existingEntry = existingData[name] || {};

            outputData[name] = {
                name: name,
                code: iso2,
                ...wbStats.formatted,
                ...intelligence,
                // PRESERVE CUSTOM FIELDS:
                demographics: existingEntry.demographics || undefined,
                dataYear: existingEntry.dataYear || undefined
            };
            console.log("OK");
            count++;
        } else {
            console.log("FAILED - PRESERVING EXISTING DATA");
            // If fetch fails, keep existing data if present
            if (existingData[name]) {
                outputData[name] = existingData[name];
            }
        }
    }

    // 3. Write to File
    const fileContent = `// AUTO-GENERATED BY ORBIS DATA ENGINE
// DO NOT EDIT MANUALLY
export const countryData = ${JSON.stringify(outputData, null, 4)};

export const globalEvents = ${JSON.stringify(nasaEvents, null, 4)};

export const seismicData = ${JSON.stringify(seismicData, null, 4)};
`;

    await fs.writeFile('./src/data/mockData.js', fileContent);

    console.log("\n🟢 SEQUENCE COMPLETE.");
    console.log(`   Updated records for ${count} sectors.`);
    console.log(`   Events: ${nasaEvents.length} | Quakes: ${seismicData.length}`);
    console.log("   Target: src/data/mockData.js");
}

main();