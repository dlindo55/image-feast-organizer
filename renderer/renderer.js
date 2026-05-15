let inputFolder = ""
let outputFolder = ""

const selectInputButton = document.getElementById("selectInput")
const selectOutputButton = document.getElementById("selectOutput")
const organizeButton = document.getElementById("organize")

const inputPath = document.getElementById("inputPath")
const outputPath = document.getElementById("outputPath")
const statusBox = document.getElementById("status")

selectInputButton.addEventListener("click", async () => {
  const folder = await window.imageOrganizer.selectFolder()

  if (folder) {
    inputFolder = folder
    inputPath.textContent = folder
  }
})

selectOutputButton.addEventListener("click", async () => {
  const folder = await window.imageOrganizer.selectFolder()

  if (folder) {
    outputFolder = folder
    outputPath.textContent = folder
  }
})

organizeButton.addEventListener("click", async () => {
  if (!inputFolder || !outputFolder) {
    statusBox.textContent =
      "Please select both an input folder and an output folder."
    return
  }

  statusBox.textContent = "Working..."

  try {
    const result = await window.imageOrganizer.organizeImages({
      inputFolder,
      outputFolder,
    })

    statusBox.textContent = `Done.

Images found: ${result.totalImagesFound}
Images copied: ${result.copied}
Images skipped, no date found: ${result.skipped}
Errors: ${result.errors.length}

${result.errors.length ? JSON.stringify(result.errors, null, 2) : ""}`
  } catch (error) {
    statusBox.textContent = `Error: ${error.message}`
  }
})
