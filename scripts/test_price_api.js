const https = require('https');

function getBNBPrice() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT', (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log("Binance API Price:", json.price);
                    resolve(json.price);
                } catch (e) { reject(e); }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function main() {
    console.log("Fetching BNB Price from API...");
    try {
        const price = await getBNBPrice();
        console.log("Success:", price);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
