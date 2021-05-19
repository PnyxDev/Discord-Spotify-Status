const fetch = require("node-fetch");
const cheerio = require("cheerio");

const getSongInfo = (searchTerm) => {
    return new Promise((Resolve) => {
        fetch(`https://genius.com/api/search/multi?q=${encodeURI(searchTerm)}`).then((geniusResponse) => geniusResponse.json().then((responseData) => {
            var possibleMatch = responseData["response"]["sections"][0]["hits"][0] || null;
            if (possibleMatch) {
                if (possibleMatch["result"]["path"] === undefined) {
                    Resolve({
                        "state" : "failure",
                        "message" : `No results were found for search term "${searchTerm}".`
                    });
                } else {
                    fetch(`https://genius.com${possibleMatch["result"]["path"]}`).then((lyricsResponse) => lyricsResponse.text().then((lyricsHTML) => {
                        var lyricsText = cheerio.load(cheerio.load(lyricsHTML)(".SongPageGrid-sc-1vi6xda-0.DGVcp.Lyrics__Root-sc-1ynbvzw-0.kkHBOZ").html().split("<br>").join("\n")).text();
                        var filteredLyrics = "";
                        var hitLimit = 0;
                        lyricsText.split("\n").forEach((lineText) => {
                            if (!(lineText.startsWith("[") && lineText.endsWith("]"))) {
                                if (!(lineText.split("[").length - 1 == 1 && lineText.split("]").length - 1 == 1)) {
                                    if (lineText.length > 5) {
                                        if (lineText.length > 128) hitLimit ++;
                                        filteredLyrics = filteredLyrics + lineText + "\n";
                                    }
                                }
                            }
                        })
                        if (hitLimit <= 3) {
                            Resolve({
                                "state" : "success",
                                "full_title" : possibleMatch["result"]["full_title"],
                                "lyrics" : filteredLyrics
                            });
                        } else {
                            Resolve({
                                "state" : "failure",
                                "message" : `No results were found for search term "${searchTerm}".`
                            });
                        }
                    }));
                }
            } else {
                Resolve({
                    "state" : "failure",
                    "message" : `No results were found for search term "${searchTerm}".`
                });
            }
        }))
    })
}

module.exports = { getSongInfo }