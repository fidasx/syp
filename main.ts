//#region #imports
import * as chalk from "chalk"
import * as inquirer from "inquirer"
import * as mpvAPI from "node-mpv"
import * as notif from "node-notifier"
import * as search from "youtube-search"

//#endregion

let g = chalk.default.green
let r = chalk.default.red
let w = chalk.default.white
let y = chalk.default.yellow
let b = chalk.default.blue
let h = chalk.default.hidden
let dim = chalk.default.dim
//#region #configs

let mpv = new mpvAPI({ audio_only: true })

let opts: search.YouTubeSearchOptions = {
	maxResults: 25,
	key: "AIzaSyDgyBRk5mimdMBu-7zPdXxmAzoPrbCMzY4"
}
//#endregion
let ui = new inquirer.ui.BottomBar()
let prompt = inquirer.createPromptModule()

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
					message: "",
					choices: results
						.map(
							song =>
								!song.link.includes("playlist")
									? `${song.title.toLowerCase().replace(/[\u1000-\uFFFF]+/g, "")} ${h(song.id)}`
									: dim("playlists not supported")
						)
						.sort(),
					pageSize: results.length
				}).then(songs => {
					let songId: string = `https://youtu.be/${songs["song"].slice(-16)}`

					let songName: string = songs["song"]
					console.log(songId)
					let play = async () => {
						await mpv.start()
						await mpv.load(songId)
						return await mpv.getDuration()
					}

					play()
						.then(dur => {
							mpv.on("timeposition", pos => {
								ui.updateBottomBar(
									`${g("playing ")}${songName}  ${g(
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
									message: songName
								})
							})
						})
						.then(() => {
							mpv.on("stopped", () => {
								notif.notify({
									title: "Song ended",
									message: songName
								})
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
