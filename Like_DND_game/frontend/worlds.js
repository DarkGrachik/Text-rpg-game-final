const { ipcRenderer } = require('electron');
let currentWorldId = null;
let isGameStart = false;

function showCustomAlert(message, options = {}) {
    // Параметры по умолчанию
    const {
        title = 'Уведомление',
        confirmText = 'OK',
        showCancel = false,
        cancelText = 'Отмена',
        onConfirm = () => {},
        onCancel = () => {}
    } = options;

    // Создаем элементы модального окна
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'custom-modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'custom-modal-content';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'custom-modal-title';
    modalTitle.textContent = title;
    
    const modalMessage = document.createElement('p');
    modalMessage.className = 'custom-modal-message';
    modalMessage.textContent = message;
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'custom-modal-buttons';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'button_small custom-modal-confirm';
    confirmBtn.textContent = confirmText;
    
    // Функция закрытия модального окна
    const closeModal = () => {
        document.body.removeChild(modalOverlay);
    };
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });
    
    buttonsContainer.appendChild(confirmBtn);
    
    // Добавляем кнопку отмены если нужно
    if (showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'button_small custom-modal-cancel';
        cancelBtn.textContent = cancelText;
        
        cancelBtn.addEventListener('click', () => {
            onCancel();
            closeModal();
        });
        
        buttonsContainer.appendChild(cancelBtn);
    }
    
    // Собираем модальное окно
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(buttonsContainer);
    modalOverlay.appendChild(modalContent);
    
    // Закрытие при клике вне окна
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Добавляем в DOM
    document.body.appendChild(modalOverlay);
    
    // Фокус на кнопке подтверждения
    confirmBtn.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const worldsButton = document.getElementById('worlds-button');
    const newWorldButton = document.getElementById('new-world-button');
    const backToMenuButton = document.getElementById('menu-button');
    const backToWorldsButton = document.getElementById('back-to-worlds');

    if (worldsButton) {
        worldsButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-worlds');
        });
    }

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-menu');
        });
    }

    if (newWorldButton) {
        newWorldButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-new-world'); // Вызовем функцию создания чата
        });
    }

    if (backToWorldsButton) {
        backToWorldsButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-worlds'); // Возврат на предыдущую страницу
        });
    }

    const createWorldButton = document.getElementById('create-world-button');
    if (createWorldButton) {
        createWorldButton.addEventListener('click', () => {
            const worldData = {
                name: document.getElementById('world-name').value.trim(),
                description: document.getElementById('description').value.trim(),
            };
    
            if (!worldData.name) {
                showCustomAlert('Введите название мира', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
                return;
            }
    
            // Добавь здесь проверки других обязательных полей при необходимости
    
            createNewWorld(worldData);
        });
    }

    const generateWorldButton = document.getElementById('generate-world-button');
    if (generateWorldButton) {
        generateWorldButton.addEventListener('click', () => {
            const partialData = {
                name: document.getElementById('world-name').value.trim(),
                description: document.getElementById('description').value.trim()
            };
    
            fetch('http://localhost:5000/worlds/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(partialData)
            })
            .then(response => response.json())
            .then(data => {
                const shouldUpdate = value => value === '' || value === '0' || value === '0.0';
    
                const fields = ['world-name', 'description'];
                fields.forEach(field => {
                    const input = document.getElementById(field);
                    if (input && shouldUpdate(input.value)) {
                        input.value = data[field];
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка при генерации мира:', error);
                showCustomAlert('Не удалось сгенерировать мир', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
            });
        });
    }
});

// Функция для загрузки списка миров
function loadWorlds() {
    fetch('http://localhost:5000/worlds')  // Обновите URL на свой серверный путь для получения миров
        .then(response => response.json())
        .then(data => {
            const worldList = document.getElementById('world-list');
            worldList.innerHTML = ''; // Очистить текущий список миров

            data.forEach(world => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<button class="button" onclick="openWorld(${world.id})">${world.name}</button> <button class="delete-button" onclick="deleteWorld(${world.id})">X</button>`;
                console.log('Кнопка добавлена для мира:', world.id, world.name);
                worldList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке миров:', error);
        });
}

// Загрузить миры при открытии страницы
if (document.getElementById('world-list')) {
    loadWorlds();
}

// Открытие мира по нажатию на его кнопку
function openWorld(worldId) {
    console.log('openWorld вызван с worldId:', worldId);
    currentWorldId = worldId;
    localStorage.setItem('currentWorldId', worldId);
    ipcRenderer.send('navigate-to-world', worldId);
}

// document.addEventListener('DOMContentLoaded', () => {
//     const startChatButton = document.getElementById('chat-button');

//     if (startChatButton) {
//         startChatButton.addEventListener('click', () => {
//             ipcRenderer.send('navigate-to-chat');
//         });
//     }
// });

function createNewWorld(worldData) {
    fetch('http://localhost:5000/worlds', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(worldData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => {
        if (data.id) {
            showCustomAlert('Мир создан успешно', {
                title: 'Уведомление',
                confirmText: 'Ок'
            });
            window.location.href = 'worlds.html'; // Переход к списку миров
        } else {
            showCustomAlert('Ошибка при создании мира', {
                title: 'Ошибка',
                confirmText: 'Ок'
            });
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showCustomAlert('Ошибка при создании мира', {
            title: 'Ошибка',
            confirmText: 'Ок'
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const backToMenuButton = document.getElementById('menu-button');

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-menu');
        });currentWorldId
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const infoContainer = document.getElementById("world-info");
    const chooseWorldButton = document.getElementById("choose-world");
    const cancelNewChat = document.getElementById("cancel-new-chat");   
    if (chooseWorldButton) chooseWorldButton.style.display = "none";
    if (cancelNewChat) cancelNewChat.style.display = "none";

    if (!infoContainer) return;

    const isGameStart = localStorage.getItem('isGameStart') === 'true';

    if (chooseWorldButton) {
        chooseWorldButton.style.display = isGameStart ? "block" : "none";
    }

    const worldId = localStorage.getItem('currentWorldId');

    if (!worldId) {
        document.getElementById("world-info").textContent = "ID мира не указан.";
        return;
    }

    fetch(`http://localhost:5000/worlds/${worldId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById("world-info").textContent = data.error;
                return;
            }

            const container = document.getElementById("world-info");
            const fieldsToDisplay = [
                { key: "name", label: "Имя" },
                { key: "description", label: "Описание" },
            ];

            fieldsToDisplay.forEach(field => {
                const fieldWrapper = document.createElement("div");
                fieldWrapper.className = "world-field";

                const label = document.createElement("div");
                label.className = "world-label";
                label.textContent = field.label;

                const value = document.createElement("div");
                value.className = "world-value";
                value.textContent = data[field.key] ?? "—";

                fieldWrapper.appendChild(label);
                fieldWrapper.appendChild(value);
                container.appendChild(fieldWrapper);
            });

            if (isGameStart && chooseWorldButton) {
                chooseWorldButton.addEventListener("click", () => {
                    const chatTitle = localStorage.getItem('pendingChatTitle');
                    const characterDataRaw = localStorage.getItem('selectedCharacterData');
                    if (!chatTitle || !characterDataRaw) {
                        showCustomAlert('Недостаточно данных для создания чата. Сначала выберите персонажа.', {
                            title: 'Ошибка',
                            confirmText: 'Ок'
                        });
                        return;
                    }

                    const characterData = JSON.parse(characterDataRaw);

                    const chatData = {
                        title: chatTitle,
                        ...characterData, // данные персонажа
                        world_name: data.name,
                        description: data.description, // или 'world_id': worldId, если нужно
                    };

                    fetch('http://localhost:5000/chats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(chatData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.id) {
                            showCustomAlert('Чат создан успешно', {
                                title: 'Уведомление',
                                confirmText: 'Ок'
                            });
                            // Очищаем временные данные
                            localStorage.removeItem('pendingChatTitle');
                            localStorage.removeItem('isGameStart');
                            localStorage.removeItem('selectedCharacterData');
                            // Перенаправляем в чат
                            ipcRenderer.send('navigate-to-chats');;
                        } else {
                            showCustomAlert('Ошибка при создании чата', {
                                title: 'Ошибка',
                                confirmText: 'Ок'
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        showCustomAlert('Ошибка при создании чата', {
                            title: 'Ошибка',
                            confirmText: 'Ок'
                        });
                    });
                });
            }
        })
        .catch(err => {
            document.getElementById("world-info").textContent = "Ошибка при загрузке данных.";
            console.error(err);
        });

     
    if (cancelNewChat) {
        cancelNewChat.style.display = isGameStart ? "block" : "none";
    }

    if (cancelNewChat) {
        cancelNewChat.addEventListener("click", () => {
            // Если мы выбирали мир для чата, но передумали — очищаем флаги
            if (isGameStart) {
                localStorage.removeItem('pendingChatTitle');
                localStorage.removeItem('isGameStart');
                localStorage.removeItem('selectedCharacterData');
                window.location.reload();
            }
        });
    }

    document.getElementById("back-to-worlds").addEventListener("click", () => {
        ipcRenderer.send('navigate-to-worlds');
    });
});

function deleteWorld(worldId) {
    showCustomAlert('Вы уверены, что хотите удалить этот мир?', {
        title: 'Подтверждение удаления',
        showCancel: true,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        onConfirm: () => {
            // Действие при подтверждении удаления
            fetch(`http://localhost:5000/worlds/${worldId}/delete`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(() => {
                // Показываем уведомление об успешном удалении
                showCustomAlert('Мир успешно удален', {
                    title: 'Уведомление',
                    confirmText: 'Ок',
                    onConfirm: () => {
                        loadWorlds(); // Обновляем список миров после закрытия уведомления
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка при удалении мира:', error);
                showCustomAlert('Не удалось удалить мир. Попробуйте снова', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
            });
        },
        onCancel: () => {
            // Действие при отмене (ничего не делаем)
            console.log('Удаление мира отменено');
        }
    });
}

// //кнопка выбора персонажа
// document.addEventListener('DOMContentLoaded', function() {
//     if (isGameStart) {
//         const button = document.getElementById('choose-world');
//         if (button) { 
//             button.style.display = 'block';
//         } else {
//             console.error('Кнопка с ID "choose-world" не найдена!');
//         }
//     }
// });