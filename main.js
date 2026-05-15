const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs/promises")
const exifr = require("exifr")
const { getFeastForDate } = require("./calendar")

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".tif",
  ".tiff",
  ".webp",
]

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  win.loadFile(path.join(__dirname, "renderer", "index.html"))
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle(
  "organize-images",
  async (event, { inputFolder, outputFolder }) => {
    if (!inputFolder || !outputFolder) {
      throw new Error("Input folder and output folder are required.")
    }

    const files = await getAllImageFiles(inputFolder)

    let copied = 0
    let skipped = 0
    let errors = []

    for (const file of files) {
      try {
        const photoDate = await getImageDate(file)

        if (!photoDate) {
          skipped++
          continue
        }

        const folderName = buildFolderName(photoDate)
        const destinationFolder = path.join(outputFolder, folderName)

        await fs.mkdir(destinationFolder, { recursive: true })

        const destinationFile = await getUniqueDestinationPath(
          destinationFolder,
          path.basename(file),
        )

        const originalStats = await fs.stat(file)

        await fs.copyFile(file, destinationFile)

        await fs.utimes(
          destinationFile,
          originalStats.atime,
          originalStats.mtime,
        )
        copied++
      } catch (error) {
        errors.push({
          file,
          error: error.message,
        })
      }
    }

    return {
      totalImagesFound: files.length,
      copied,
      skipped,
      errors,
    }
  },
)

async function getAllImageFiles(folder) {
  let results = []

  const entries = await fs.readdir(folder, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name)

    if (entry.isDirectory()) {
      const nestedFiles = await getAllImageFiles(fullPath)
      results = results.concat(nestedFiles)
    } else {
      const ext = path.extname(entry.name).toLowerCase()

      if (IMAGE_EXTENSIONS.includes(ext)) {
        results.push(fullPath)
      }
    }
  }

  return results
}

async function getImageDate(filePath) {
  try {
    const metadata = await exifr.parse(filePath, {
      tiff: true,
      exif: true,
      ifd0: true,
      ifd1: true,
      gps: false,
    })
    function isValidPhotoDate(date) {
      const year = date.getFullYear()

      return year >= 1900 && year <= new Date().getFullYear() + 1
    }
    const possibleDates = [
      metadata?.DateTimeOriginal,
      metadata?.CreateDate,
      metadata?.ModifyDate,
      metadata?.DateCreated,
    ]

    for (const possibleDate of possibleDates) {
      if (possibleDate instanceof Date && isValidPhotoDate(possibleDate)) {
        return possibleDate
      }
    }
  } catch (error) {
    // Ignore EXIF errors and try file system date below
  }

  try {
    const stats = await fs.stat(filePath)

    if (stats.birthtime && isValidPhotoDate(stats.birthtime)) {
      return stats.birthtime
    }

    if (stats.mtime && isValidPhotoDate(stats.mtime)) {
      return stats.mtime
    }

    return null
  } catch (error) {
    return null
  }
}

function buildFolderName(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const yyyy = String(date.getFullYear())

  const dateCode = `${mm}${dd}${yyyy}`
  const feast = getFeastForDate(date)

  if (feast) {
    return `${dateCode} - ${feast}`
  }

  return dateCode
}

async function getUniqueDestinationPath(folder, filename) {
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)

  let destination = path.join(folder, filename)
  let counter = 1

  while (await fileExists(destination)) {
    destination = path.join(folder, `${base}-${counter}${ext}`)
    counter++
  }

  return destination
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
