//#region #imports
import * as chalk from "chalk"
import * as inquirer from "inquirer"
import * as mpvAPI from "node-mpv"
import * as notif from "node-notifier"
import * as search from "youtube-search"

//#endregion

let g = chalk.default.green
let w = chalk.default.white
let h = chalk.default.hidden

//#region #configs

let mpv = new mpvAPI({ audio_only: true })

let opts: search.YouTubeSearchOptions = {
	maxResults: 30,
	key: "AIzaSyDgyBRk5mimdMBu-7zPdXxmAzoPrbCMzY4",
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
			.replace(/\W/g, "")
			.charAt(0)
			.toUpperCase() +
		str
			.replace(/\W/g, " ")
			.replace("24 7", "24/7")
			.replace(/\s\s+/g, " ")
			.replace(/[\u1000-\uFFFF]+/g, "")
			.substr(1)

			.trim()
	)
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
					choices: results.map(song => `${filterstr(song.title)} ${h(song.id)}`),
					pageSize: results.length
				}).then(songs => {
					let songId: string = `https://youtu.be/${songs["song"].slice(-16)}`
					let songName: string = songs["song"]

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
								notifs("Now playing", songName)
							})
						})
						.then(() => {
							mpv.on("stopped", () => {
								notifs("Song Ended", songName)
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
