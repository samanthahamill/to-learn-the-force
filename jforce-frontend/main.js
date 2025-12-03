/**
 * This is utilized for electron-builder to create an executable app. Once the backend
 * is implemented, we should remove this
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, "dist/jforce/index.html"));
}

app.whenReady().then(createWindow);
