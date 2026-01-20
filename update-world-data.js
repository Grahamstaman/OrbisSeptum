// update-world-data.js
// Run with: node update-world-data.js
import fs from 'fs/promises';
import { countryData as existingData } from './src/data/mockData.js';

// --- CONFIGURATION ---
const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
const WB_BASE = "https://api.worldbank.org/v2/country";

// 1. Fetch Global Data for an Indicator
async function fetchGlobalIndicator(indicatorCode) {
    // per_page=500 is usually enough for all countries + aggregates (approx 218 countries + groups)
    const url = `${WB_BASE}/all/indicator/${indicatorCode}?format=json&per_page=500&mrnev=1`;
    console.log(`   Fetching ${indicatorCode}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        const text = await res.text();

        try {
            if (text.trim().startsWith('<')) {
                throw new Error(`Received XML instead of JSON: ${text.substring(0, 50)}...`);
            }
            const data = JSON.parse(text);

            if (!data || !data[1]) {
                console.warn(`⚠️  No data returned for ${indicatorCode}`);
                return {};
            }

            // Map: ISO3 -> Value
            const map = {};
            for (const item of data[1]) {
                if (item.countryiso3code && item.value !== null) {
                    map[item.countryiso3code] = item.value;
                }
            }
            return map;

        } catch (parseError) {
            throw new Error(`Parse failed: ${parseError.message} | Response slice: ${text.substring(0, 100)}`);
        }

    } catch (e) {
        console.warn(`⚠️  Failed to fetch ${indicatorCode}:`, e.message);
        return {};
    }
}

function generateIntelligence(countryName, stats) {
    // Calculates Risk based on Real GDP Growth Stability
    // < 0% = High Risk, 0-2% = Medium, > 2% = Low (Simplified Heuristic)
    let risk = "Medium";
    if (stats.growthRaw < 0) risk = "High";
    if (stats.growthRaw > 2.0 && stats.gdpRaw > 1e11) risk = "Low";

    // Calculate raw user count (approx 1% of population)
    const rawUsers = (stats.popRaw || 0) * 0.01;

    let activeUsersStr;
    if (rawUsers >= 1000000) {
        activeUsersStr = (rawUsers / 1000000).toFixed(1) + "M";
    } else if (rawUsers >= 1000) {
        activeUsersStr = (rawUsers / 1000).toFixed(1) + "K";
    } else {
        activeUsersStr = Math.floor(rawUsers) + "";
    }

    return {
        activeUsers: activeUsersStr, // Simulating app users
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
    console.log("🔵 ORBIS DATA ENGINE: INITIALIZING REAL-TIME FETCH (BULK MODE)...");

    // 1. Get GeoJSON for correct naming
    console.log("Loading GeoJSON...");
    const geoRes = await fetch(GEOJSON_URL);
    const geoData = await geoRes.json();

    // 2. Fetch Global Indicators (Sequential to avoid rate limiting)
    console.log("📡 Fetching World Bank Indicators (bulk)...");

    // Helper for sequential execution with delay
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const gdpMap = await fetchGlobalIndicator('NY.GDP.MKTP.CD');
    await wait(1000);

    const popMap = await fetchGlobalIndicator('SP.POP.TOTL');
    await wait(1000);

    const growthMap = await fetchGlobalIndicator('NY.GDP.MKTP.KD.ZG');
    await wait(1000);

    const agMap = await fetchGlobalIndicator('NV.AGR.TOTL.ZS');
    await wait(1000);

    const indMap = await fetchGlobalIndicator('NV.IND.TOTL.ZS');
    await wait(1000);

    const servMap = await fetchGlobalIndicator('NV.SRV.TOTL.ZS');

    // Parallelize non-WB sources
    const [nasaEvents, seismicData] = await Promise.all([
        fetchNasaEvents(),
        fetchSeismicData()
    ]);

    console.log(`✅ Data Ingestion Complete.`);
    console.log(`   NASA Events: ${nasaEvents.length} | Quakes: ${seismicData.length}`);

    const outputData = {};
    let count = 0;
    let missingCount = 0;

    for (const feature of geoData.features) {
        const name = feature.properties.NAME;
        let iso3 = feature.properties.ISO_A3;
        let iso2 = feature.properties.ISO_A2;

        // Manual Fixes for known GeoJSON issues
        if (name === "France" || iso3 === "FRA" || iso3 === "-99") {
            if (name === "France") { iso2 = "FR"; iso3 = "FRA"; }
        }
        if (name === "Norway" || iso3 === "NOR" || iso3 === "-99") {
            if (name === "Norway") { iso2 = "NO"; iso3 = "NOR"; }
        }

        const gdp = gdpMap[iso3] || 0;
        const pop = popMap[iso3] || 0;
        const growth = growthMap[iso3] || 0;
        const ag = agMap[iso3] || 0;
        const ind = indMap[iso3] || 0;
        const serv = servMap[iso3] || 0;

        // Check if we have enough valid data to create a record
        const existingEntry = existingData[name] || {};
        const hasNewData = (gdp || pop); // Simplified check: if we found GDP or Population

        if (hasNewData) {
            const intelligence = generateIntelligence(name, { growthRaw: growth, popRaw: pop, gdpRaw: gdp });

            outputData[name] = {
                name: name,
                code: iso2,
                gdp: gdp > 1e12 ? `$${(gdp / 1e12).toFixed(1)}T` : `$${(gdp / 1e9).toFixed(1)}B`,
                population: pop > 1e9 ? `${(pop / 1e9).toFixed(2)}B` : `${(pop / 1e6).toFixed(1)}M`,
                growth: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
                segments: [
                    { name: "Services", value: Math.round(serv) },
                    { name: "Industry", value: Math.round(ind) },
                    { name: "Agriculture", value: Math.round(ag) }
                ].sort((a, b) => b.value - a.value),
                ...intelligence,
                // PRESERVE CUSTOM FIELDS:
                demographics: existingEntry.demographics || undefined,
                dataYear: existingEntry.dataYear || undefined
            };
            count++;
        } else {
            // Fallback
            if (existingEntry.name) {
                outputData[name] = existingEntry;
            } else {
                // No data at all?
                missingCount++;
            }
        }
    }

    // 3. Write to File
    const fileContent = `// AUTO-GENERATED BY ORBIS DATA ENGINE
// DO NOT EDIT MANUALLY
// LAST UPDATED: ${new Date().toISOString()}
export const countryData = ${JSON.stringify(outputData, null, 4)};

export const globalEvents = ${JSON.stringify(nasaEvents, null, 4)};

export const seismicData = ${JSON.stringify(seismicData, null, 4)};
`;

    await fs.writeFile('./src/data/mockData.js', fileContent);

    console.log("\n🟢 SEQUENCE COMPLETE.");
    console.log(`   Updated records for ${count} countries.`);
    console.log(`   Missing data for ${missingCount} countries (used fallback or omitted).`);
    console.log("   Target: src/data/mockData.js");
}

main();