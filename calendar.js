const path = require("path")
const fs = require("fs")

const calendarPath = path.join(
  __dirname,
  "calendar-data",
  "tridentine_1962.json",
)

let calendarData = {}

try {
  calendarData = JSON.parse(fs.readFileSync(calendarPath, "utf8"))
} catch (error) {
  console.error("Could not load 1962 calendar JSON:", error.message)
}

function getFeastForDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  const dateKey = `${year}-${month}-${day}`

  return calendarData[dateKey] || ""
}

module.exports = {
  getFeastForDate,
}
