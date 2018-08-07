import * as chalk from "chalk"
import * as mpvAPI from "node-mpv"
export let mpv = new mpvAPI({
  audio_only: true
})
export let g = chalk.default.green
export let r = chalk.default.red
export let w = chalk.default.white
export let y = chalk.default.yellow
export let b = chalk.default.blue
export let h = chalk.default.hidden
import * as search from "youtube-search"

export let opts: search.YouTubeSearchOptions = {
  maxResults: 15,
  key: "AIzaSyA1t4IEyc6xdYX1cE7ZWt9We2x62C9yMSU"
}
