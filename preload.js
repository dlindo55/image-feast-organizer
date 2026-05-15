const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("imageOrganizer", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),

  organizeImages: ({ inputFolder, outputFolder }) =>
    ipcRenderer.invoke("organize-images", { inputFolder, outputFolder }),
})
