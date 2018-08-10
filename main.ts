//#region #imports
import * as mpvAPI from "node-mpv"
import * as inquirer from "inquirer"
import * as chalk from "chalk"

import { exec } from "child_process"
import * as search from "youtube-search"
import * as notif from "node-notifier"
//#endregion
let g = chalk.default.green
let r = chalk.default.red
let w = chalk.default.white
let y = chalk.default.yellow
let b = chalk.default.blue
let h = chalk.default.hidden
let dim = chalk.default.dim
//#region #configs

let mpv = new mpvAPI({
  audio_only: true
})

let opts: search.YouTubeSearchOptions = {
  maxResults: 25,
  key: "AIzaSyDgyBRk5mimdMBu-7zPdXxmAzoPrbCMzY4"
}
//#endregion
let ui = new inquirer.ui.BottomBar()
let prompt = inquirer.createPromptModule()

function start() {
  exec("pkill mpv")
  console.clear()
  prompt({
    name: "input",
    type: "input",
    message: "search a song"
  }).then(input => {
    search(input["input"], opts, (err, results) => {
      let res: string[] = []
      results.map(song => (!song.link.includes("playlist") ? res.push(`${song.id}  ${song.title}`) : null))

      prompt({
        name: "song",
        type: "list",
        message: "",
        choices: res,
        pageSize: res.length
      }).then(songs => {
        let t: string = res.find(k => k == songs["song"])

        let url: string = "https://youtu.be/" + t
        console.log(url)
        let play = async () => {
          await mpv.start()
          await mpv.load(url)
          return await mpv.getDuration()
        }

        play()
          .then(dur => {
            mpv.on("timeposition", pos => {
              ui.updateBottomBar(
                `${g("playing")}${songs["song"].slice(11)}  ${g(
                  Math.floor(pos / 60)
                    .toString()
                    .padStart(2, "0")
                )}${w(":")}${g(
                  Math.floor(pos % 60)
                    .toString()
                    .padStart(2, "0")
                )} / ${Math.floor((dur % 3600) / 60)}:${Math.floor((dur % 3600) % 60)
                  .toString()
                  .padStart(2, "0")}`
              )
            })
            mpv.on("started", () => {
              notif.notify({
                title: "Now playing",
                message: songs["song"].slice(30)
              })
            })
          })
          .then(() => {
            mpv.on("stopped", () => {
              notif.notify({
                title: "Song ended",
                message: songs["song"].slice(30)
              })
              mpv.quit()
            })
          })
      })
    })
  })
}
start()
