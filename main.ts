import * as inquirer from "inquirer"
import { b, g, y, w, r, opts, h, mpv } from "./config"
import { exec } from "child_process"
import * as search from "youtube-search"
import * as notif from "node-notifier"
let ui = new inquirer.ui.BottomBar()
let prompt = inquirer.createPromptModule()

function start() {
  console.clear()
  let songsArray: any[] = []
  exec("pkill mpv")
  prompt({
    name: "input",
    type: "input",
    message: "search a song"
  }).then(input => {
    search(input["input"], opts, (err, results) => {
      if (!err) {
        for (let song of results) {
          songsArray.push(`${song.link.replace("https://www.youtube.com/watch?v=", "")} ${g("->")} ${w(song.title)}`)
        }
        prompt({
          name: "song",
          type: "list",
          message: "",
          choices: songsArray,
          pageSize: songsArray.length
        }).then(songs => {
          let song = songs
          let url: string = "https://youtu.be/" + song["song"]

          let play = async () => {
            await mpv.start()
            await mpv.load(url)
            return await mpv.getDuration()
          }
          play()
            .then(dur => {
              mpv.on("timeposition", pos => {
                ui.updateBottomBar(
                  `${g("playing")} ${song["song"].slice(30)} ${g(
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
                  message: song["song"].slice(30)
                })
              })
            })
            .then(() => {
              mpv.on("stopped", () => {
                notif.notify({
                  title: "Song ended",
                  message: song["song"].slice(30)
                })
                mpv.quit()
              })
            })
        })
      } else {
        console.log(r(err.message))
      }
    })
  })
}
start()
