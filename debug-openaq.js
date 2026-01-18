const url = "https://api.openaq.org/v3/locations?limit=5";

async function test() {
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}

test();
