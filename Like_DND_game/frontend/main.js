// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: false,
            nodeIntegration: true,
        }
    });
    loadPage('menu.html'); // Загрузка меню при запуске приложения
}

function loadPage(page) {
    win.loadFile(path.join(__dirname, 'pages', page));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Обработка сообщения от рендерера для переключения страниц
ipcMain.on('navigate-to-chats', () => {
    loadPage('chats.html');
});

ipcMain.on('navigate-to-menu', () => {
    loadPage('menu.html');
});

ipcMain.on('navigate-to-chat', () => {
    loadPage('chat_app.html');
});

ipcMain.on('navigate-to-character', () => {
    loadPage('character_details.html');
});

ipcMain.on('navigate-to-new-chat', () => {
    loadPage('new_chat.html'); // Переход на страницу нового чата
});

ipcMain.on('navigate-to-new-character', () => {
    loadPage('new_character.html'); // Переход на страницу нового чата
});

ipcMain.on('navigate-back', () => {
    loadPage('chats.html'); // Переход на главную страницу
});

ipcMain.on('navigate-to-characters', () => {
    loadPage('characters.html'); // Переход на страницу персонажей
});

ipcMain.on('navigate-to-world', () => {
    loadPage('world_details.html');
});

ipcMain.on('navigate-to-new-world', () => {
    loadPage('new_world.html'); // Переход на страницу нового чата
});

ipcMain.on('navigate-to-worlds', () => {
    loadPage('worlds.html'); // Переход на страницу персонажей
});