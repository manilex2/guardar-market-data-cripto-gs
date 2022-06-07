require("dotenv").config();;
const mysql = require("mysql2");
const { google } = require("googleapis");
const { database } = require("./keys");
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});
const spreadsheetId = process.env.SPREADSHEET_ID;

exports.handler = async function (event) {
    const promise = new Promise(async function () {
        var arreglo = [];
        const conexion = mysql.createConnection({
            host: database.host,
            user: database.user,
            password: database.password,
            port: database.port,
            database: database.db
        });
        const client = await auth.getClient();
        const googleSheet = google.sheets({ version: 'v4', auth: client });
        await googleSheet.spreadsheets.values.clear({
            auth,
            spreadsheetId,
            range: `${process.env.ID_HOJA_RANGO}`
        });
        var sql = `SELECT name FROM ${process.env.TABLE_CRIPTO}`;
        conexion.query(sql, async (err, respCriptoList) => {
            if (err) {
                console.error(err);
            } else {
                var contador = 0;
                for (let i = 0; i < respCriptoList.length; i++) {
                    const element = respCriptoList[i].name;
                    var sql2 = `SELECT * FROM marketdata WHERE name="${element}" GROUP BY market_name ORDER BY volume DESC LIMIT 10`;
                    conexion.query(sql2, async (err, respMarketData) => {
                        if (err) {
                            console.error(err);
                        } else {
                            for (let i = 0; i < respMarketData.length; i++) {
                                if (respMarketData[i]) {
                                    arreglo.push([
                                        respMarketData[i].id,
                                        respMarketData[i].symbol,
                                        respMarketData[i].name,
                                        respMarketData[i].description_en,
                                        respMarketData[i].description_es,
                                        respMarketData[i].homepage,
                                        respMarketData[i].blockchain_site,
                                        respMarketData[i].twitter_screenname,
                                        respMarketData[i].image_thumb,
                                        respMarketData[i].image_small,
                                        respMarketData[i].image_large,
                                        respMarketData[i].sentiment_votes_up_percentage,
                                        respMarketData[i].sentiment_votes_down_percentage,
                                        respMarketData[i].coingecko_rank,
                                        respMarketData[i].coingecko_score,
                                        respMarketData[i].developer_score,
                                        respMarketData[i].community_score,
                                        respMarketData[i].liquidity_score,
                                        respMarketData[i].public_interest_score,
                                        respMarketData[i].ath_change_percentage,
                                        respMarketData[i].ath_date,
                                        respMarketData[i].market_cap,
                                        respMarketData[i].market_cap_rank,
                                        respMarketData[i].total_volume,
                                        respMarketData[i].price_change_percentage_24h,
                                        respMarketData[i].price_change_percentage_7d,
                                        respMarketData[i].price_change_percentage_30d,
                                        respMarketData[i].price_change_percentage_200d,
                                        respMarketData[i].price_change_percentage_1y,
                                        respMarketData[i].total_supply,
                                        respMarketData[i].max_supply,
                                        respMarketData[i].circulating_supply,
                                        respMarketData[i].last_updated,
                                        respMarketData[i].twitter_followers,
                                        respMarketData[i].market_name,
                                        respMarketData[i].base,
                                        respMarketData[i].target,
                                        respMarketData[i].volume,
                                        respMarketData[i].converted_volume,
                                        respMarketData[i].trust_score,
                                        respMarketData[i].trade_url,
                                        respMarketData[i].token_info_url
                                    ]);
                                } else {
                                    return;
                                }
                            }
                        }
                    });
                }; 
                setTimeout(() => {
                    guardarDatos(arreglo);
                }, 20000);               
                await finalizarEjecucion();
            }
        });

        async function guardarDatos(arreglo) {
            try {
                await googleSheet.spreadsheets.values.append({
                    auth,
                    spreadsheetId,
                    range: `${process.env.ID_HOJA_RANGO}`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        "values": arreglo
                    }
                });
                console.log("Datos guardados correctamente");
            } catch (error) {
                console.error(error);
            }
            
        }

        async function finalizarEjecucion() {
            conexion.end();
        }
    });
    return promise;
};