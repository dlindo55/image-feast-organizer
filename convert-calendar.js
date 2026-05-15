const fs = require("fs")
const ical = require("node-ical")

const inputFile = "calendar-data/tridentine_1962.ics"
const outputFile = "calendar-data/tridentine_1962.json"

const events = ical.sync.parseFile(inputFile)
const calendar = {}

for (const key in events) {
  const event = events[key]

  if (event.type !== "VEVENT") continue
  if (!event.start || !event.summary) continue

  const year = event.start.getFullYear()
  const month = String(event.start.getMonth() + 1).padStart(2, "0")
  const day = String(event.start.getDate()).padStart(2, "0")

  const dateKey = `${year}-${month}-${day}`

  calendar[dateKey] = event.summary
}

fs.writeFileSync(outputFile, JSON.stringify(calendar, null, 2))

console.log(`Created ${outputFile}`)
console.log(`Total dates: ${Object.keys(calendar).length}`)
