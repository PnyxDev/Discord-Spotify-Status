const { listOpenWindows } = require("@josephuspaye/list-open-windows");
const fetch = require("node-fetch");
const scraper = require("./module.js");
const funcs = {
    "updateStatus": async function(token, status, key) {
        return new Promise(Resolve => {
            if (key) { if(!lyricLoops[key]) { Resolve(false); } }
            fetch("https://discordapp.com/api/v6/users/@me/settings", {
                method: "PATCH",
                headers: {
                    "authorization": token,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    "custom_status": {
                        "text": status
                    }
                })
            }).finally(() => {
                if (key) if (!lyricLoops[key]) Resolve(false); else Resolve(true); 
            })
        })
    },
    "wait": async function(int) {
        return new Promise(Resolve => {
            setTimeout(() => {
                Resolve()
            }, int)
        })
    },
    "forEach": async (array, callback, key) => {
        for (let index = 0; index < array.length; index++) {
            if (key) if (!lyricLoops[key]) break;
            await callback(array[index], index, array);
        }
    },
    "getSong": () => {
        return new Promise((Resolve) => {
            listOpenWindows().forEach((window) => {
                if (window.processPath.endsWith("Spotify.exe") && !window.caption.startsWith("Spotify") && window.caption.indexOf("-") != -1) {
                    Resolve(window.caption);
                }
            })
            Resolve(null);
        })
    }
}

var settings = {
    "token": "",
    "delay": 3500,
    "timeout": 2000,
    "lyrics": ""
}
var currentSong = "";
var lyricIntervals = [];
var lyricLoops = {};

console.clear();

var playSong = (lyrics, settings) => {
    Object.keys(lyricLoops).forEach((Key) => { lyricLoops[Key] = false; });
    setTimeout(() => {
        let newRand = Math.random();
        funcs.forEach(lyrics, async (line) => {
            if (!lyricLoops[newRand]) return;
            var StatusRequest = await funcs.updateStatus(settings.token, line, newRand.toString());
            if (StatusRequest) {
                console.info("Updated status to: " + line);
            }
            await funcs.wait(settings.delay);
        })
        lyricLoops[newRand.toString()] = true;

        lyricIntervals.push(setInterval(() => {
            console.warn("Restarting song...");
            let newRand = Math.random();
            lyricLoops[newRand.toString()] = true;
            funcs.forEach(lyrics, async (line) => {
                if (!lyricLoops[newRand]) return;
                var StatusRequest = await funcs.updateStatus(settings.token, line, newRand.toString());
                if (StatusRequest) console.info("Updated status to: " + line);
                await funcs.wait(settings.delay);
            })
        }, (lyrics.length * settings.delay) + settings.timeout))
    }, 3000)
}

setInterval(() => {
    funcs.getSong().then((Song) => {
        if (Song) {
            if (Song.indexOf("feat") !== -1) Song = Song.slice(0, Song.indexOf("feat") - 1);
            settings.lyrics = Song.lyrics;
            if (currentSong !== "") {
                if (Song != currentSong) {
                    lyricIntervals.forEach((interval) => { clearInterval(interval) });
                    scraper.getSongInfo(Song).then((songInfo) => {
                        if (songInfo.state == "success") {
                            console.log(`Listening to ${Song}.`);
                            funcs.updateStatus(settings.token, `[Now Playing] - ${Song}`)
                            setTimeout(() => {
                                Object.keys(lyricLoops).forEach((Key) => { lyricLoops[Key] = false; });
                                playSong(songInfo.lyrics.split("\n"), settings)
                            }, settings.delay);
                        }
                    })
                    currentSong = Song;
                }
            } else {
                lyricIntervals.forEach((interval) => { clearInterval(interval) });
                scraper.getSongInfo(Song).then((songInfo) => {
                    if (songInfo.state == "success") {
                        console.log(`Listening to ${Song}.`);
                        funcs.updateStatus(settings.token, `[Now Playing] - ${Song}`)
                        setTimeout(() => {
                            Object.keys(lyricLoops).forEach((Key) => { lyricLoops[Key] = false; });
                            playSong(songInfo.lyrics.split("\n"), settings)
                        }, settings.delay);
                    }
                })
                currentSong = Song;
            }
        } else {
            if (currentSong !== "") {
                lyricIntervals.forEach((interval) => { clearInterval(interval) });
                Object.keys(lyricLoops).forEach((Key) => { lyricLoops[Key] = false; });
                console.log("No song playing.");
                currentSong = "";
            }
        }
    });
}, 100);