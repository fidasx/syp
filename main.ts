//#region #imports
import * as chalk from "chalk"
import * as inquirer from "inquirer"
import * as mpvAPI from "node-mpv"
import * as notif from "node-notifier"
import * as search from "youtube-search"

//#endregion

let b = chalk.cyan
let w = chalk.white
let h = chalk.hidden
let y = chalk.yellow
let num: number = 0
//#region #configs

let mpv = new mpvAPI({ audio_only: true }, ["--no-config", "--load-scripts=no"])

let opts: search.YouTubeSearchOptions = {
    maxResults: 30,
    key: "YOUR_KEY",
    type: "video"
}
//#endregion
let ui = new inquirer.ui.BottomBar()
let prompt = inquirer.createPromptModule()

function notifs(title: string, message: string) {
    return notif.notify({
        title: title,
        message: message
    })
}

function filterstr(str: string) {
    return (
        str
            .toLowerCase()
            //.replace(/\W/g, " ")
            .replace("24 7", "24/7")
            .replace(/\s\s+/g, "")
            .replace(/[\u1000-\uFFFF]+/g, "")
    )
}
let play = async (songId: string) => {
    await mpv.start()
    await mpv.load(songId)
    return await mpv.getDuration()
}

function start() {
    console.clear()
    prompt({
        name: "input",
        type: "input",
        message: "search a song"
    }).then(input => {
        search(input["input"], opts, (err, results) => {
            if (!err) {
                prompt({
                    name: "song",
                    type: "list",
                    message: "results",
                    choices: results.map(song => `${b(`${num++}`)} ${filterstr(song.title)} ${h(song.id)}`),
                    pageSize: results.length
                }).then(songs => {
                    console.log("----------------------------------------------------")
                    let songId: string = `https://youtu.be/${songs["song"].slice(-16)}`
                    let songName: string = songs["song"].slice(13, -18)

                    play(songId)
                        .then(dur => {
                            mpv.on("timeposition", pos => {
                                ui.updateBottomBar(
                                    `${b("playing ")}${filterstr(songName)} ${b(
                                        Math.floor(pos / 60)
                                            .toString()
                                            .padStart(2, "0")
                                    )}${w(":")}${b(
                                        Math.floor(pos % 60)
                                            .toString()
                                            .padStart(2, "0")
                                    )} - ${Math.floor((dur % 3600) / 60)}:${Math.floor((dur % 3600) % 60)
                                        .toString()
                                        .padStart(2, "0")}`
                                )
                            })
                            mpv.on("started", () => {
                                notifs("Now playing", filterstr(songName))
                            })
                        })
                        .then(() => {
                            mpv.on("stopped", () => {
                                notifs("Song Ended", filterstr(songName))
                                mpv.quit()
                            })
                        })
                        .catch(err => console.log(err))
                })
            }
            console.log(err.message)
        })
    })
}
start()
