import { prompt } from "enquirer"
import { exec } from "child_process"
import * as ytps from "yt-search"
let pad = 5
function filterstr(str: string, pad: number) {
	return str
		?.toLocaleLowerCase()
		.replace(/[^A-Za-z0-9\s!?\u0000-\u0080\u0082]/g, "")
		.trim()
		.padStart(str.length + pad)
}

async function start() {
	console.clear()

	try {
		let input = await prompt({ name: "input", type: "text", message: "Search for a song" })
		const yt = await ytps({ query: input["input"] && input["input"] })
		let titles = yt.videos.map((i, index) => String(index) + filterstr(i.title, index > 9 ? (pad = 4) : 5))

		let combinedVideos = yt.videos.map((i, index) => {
			return { title: String(index) + filterstr(i.title, index > 9 ? (pad = 4) : 5), url: i.url }
		})

		let songList = await prompt({
			type: "autocomplete",
			message: "results",
			name: "song",
			choices: titles,
			sort: false,
			align: "left",
		})
		let song = combinedVideos.find(item => item.title === songList["song"])
		let mpv = exec(`mpv --no-config --no-video  ${song.url} `)

		mpv.stdout.on("data", data => {
			console.log(data)
		})
	} catch (error) {
		console.log(error.response.data.message)
	}
}
start()
