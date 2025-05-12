const { ipcRenderer } = require('electron');
let currentCharacterId = null;
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
    const charactersButton = document.getElementById('characters-button');
    const newCharacterButton = document.getElementById('new-character-button');
    const backToMenuButton = document.getElementById('menu-button');
    const backToCharactersButton = document.getElementById('back-to-characters');

    if (charactersButton) {
        charactersButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-characters');
        });
    }

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-menu');
        });
    }

    if (newCharacterButton) {
        newCharacterButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-new-character'); // Вызовем функцию создания чата
        });
    }

    if (backToCharactersButton) {
        backToCharactersButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-characters'); // Возврат на предыдущую страницу
        });
    }

    const createCharacterButton = document.getElementById('create-character-button');
    if (createCharacterButton) {
        createCharacterButton.addEventListener('click', () => {
            const characterData = {
                name: document.getElementById('character-name').value.trim(),
                character_class: document.getElementById('character-class').value.trim(),
                race: document.getElementById('character-race').value.trim(),
                strength: parseInt(document.getElementById('strength').value),
                dexterity: parseInt(document.getElementById('dexterity').value),
                constitution: parseInt(document.getElementById('constitution').value),
                intelligence: parseInt(document.getElementById('intelligence').value),
                wisdom: parseInt(document.getElementById('wisdom').value),
                charisma: parseInt(document.getElementById('charisma').value),
                level: parseInt(document.getElementById('level').value),
                appearance: document.getElementById('appearance').value.trim(),
                background: document.getElementById('background').value.trim(),
            };
    
            if (!characterData.name) {
                showCustomAlert('Введите имя персонажа', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
                return;
            }
    
            // Добавь здесь проверки других обязательных полей при необходимости
    
            createNewCharacter(characterData);
        });
    }

    const generateCharacterButton = document.getElementById('generate-character-button');
    if (generateCharacterButton) {
        generateCharacterButton.addEventListener('click', () => {
            const partialData = {
                name: document.getElementById('character-name').value.trim(),
                character_class: document.getElementById('character-class').value.trim(),
                race: document.getElementById('character-race').value.trim(),
                appearance: document.getElementById('appearance').value.trim(),
                background: document.getElementById('background').value.trim(),
                strength: document.getElementById('strength').value.trim(),
                dexterity: document.getElementById('dexterity').value.trim(),
                constitution: document.getElementById('constitution').value.trim(),
                intelligence: document.getElementById('intelligence').value.trim(),
                wisdom: document.getElementById('wisdom').value.trim(),
                charisma: document.getElementById('charisma').value.trim()
            };
    
            fetch('http://localhost:5000/characters/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(partialData)
            })
            .then(response => response.json())
            .then(data => {
                const shouldUpdate = value => value === '' || value === '0' || value === '0.0';
    
                const fields = ['character-name', 'character-class', 'character-race', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'appearance', 'background'];
                fields.forEach(field => {
                    const input = document.getElementById(field);
                    if (input && shouldUpdate(input.value)) {
                        input.value = data[field];
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка при генерации персонажа:', error);
                showCustomAlert('Не удалось сгенерировать персонажа', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
            });
        });
    }
});

// Функция для загрузки списка персонажей
function loadCharacters() {
    fetch('http://localhost:5000/characters')  // Обновите URL на свой серверный путь для получения персонажей
        .then(response => response.json())
        .then(data => {
            const characterList = document.getElementById('character-list');
            characterList.innerHTML = ''; // Очистить текущий список персонажей
            data.forEach(character => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<button class="button" onclick="openCharacter(${character.id})">${character.name}</button> <button class="delete-button" onclick="deleteCharacter(${character.id})">X</button>`;
                console.log('Кнопка добавлена для персонажа:', character.id, character.name);
                characterList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке персонажей:', error);
        });
}

// Загрузить персонажей при открытии страницы
if (document.getElementById('character-list')) {
    loadCharacters();
}

// Открытие персонажа по нажатию на его кнопку
function openCharacter(characterId) {
    console.log('openCharacter вызван с characterId:', characterId);
    currentCharacterId = characterId;
    localStorage.setItem('currentCharacterId', characterId);
    ipcRenderer.send('navigate-to-character', characterId);
}

// document.addEventListener('DOMContentLoaded', () => {
//     const startChatButton = document.getElementById('chat-button');

//     if (startChatButton) {
//         startChatButton.addEventListener('click', () => {
//             ipcRenderer.send('navigate-to-chat');
//         });
//     }
// });

function createNewCharacter(characterData) {
    fetch('http://localhost:5000/characters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => {
        if (data.id) {
            showCustomAlert('Персонаж создан успешно', {
                title: 'Уведомление',
                confirmText: 'Ок'
            });
            window.location.href = 'characters.html'; // Переход к списку персонажей
        } else {
            showCustomAlert('Ошибка при создании персонажа', {
                title: 'Ошибка',
                confirmText: 'Ок'
            });
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showCustomAlert('Ошибка при создании персонажа', {
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
        });currentCharacterId
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const infoContainer = document.getElementById("character-info");
    const chooseCharacterButton = document.getElementById("choose-character");
    const cancelNewChat = document.getElementById("cancel-new-chat");   
    if (chooseCharacterButton) chooseCharacterButton.style.display = "none";
    if (cancelNewChat) cancelNewChat.style.display = "none";

    if (!infoContainer) return;

    const isGameStart = localStorage.getItem('isGameStart') === 'true';

    if (chooseCharacterButton) {
        chooseCharacterButton.style.display = isGameStart ? "block" : "none";
    }

    const characterId = localStorage.getItem('currentCharacterId');

    if (!characterId) {
        document.getElementById("character-info").textContent = "ID персонажа не указан.";
        return;
    }

    fetch(`http://localhost:5000/characters/${characterId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById("character-info").textContent = data.error;
                return;
            }

            const container = document.getElementById("character-info");
            const fieldsToDisplay = [
                { key: "name", label: "Имя" },
                { key: "character_class", label: "Класс" },
                { key: "race", label: "Раса" },
                { key: "level", label: "Уровень" },
                { key: "strength", label: "Сила" },
                { key: "dexterity", label: "Ловкость" },
                { key: "constitution", label: "Телосложение" },
                { key: "intelligence", label: "Интеллект" },
                { key: "wisdom", label: "Мудрость" },
                { key: "charisma", label: "Харизма" },
                { key: "appearance", label: "Внешность" },
                { key: "background", label: "Предыстория" },
            ];

            fieldsToDisplay.forEach(field => {
                const fieldWrapper = document.createElement("div");
                fieldWrapper.className = "character-field";

                const label = document.createElement("div");
                label.className = "character-label";
                label.textContent = field.label;

                const value = document.createElement("div");
                value.className = "character-value";
                value.textContent = data[field.key] ?? "—";

                fieldWrapper.appendChild(label);
                fieldWrapper.appendChild(value);
                container.appendChild(fieldWrapper);
            });

            if (isGameStart && chooseCharacterButton) {
                chooseCharacterButton.addEventListener("click", () => {
                    const chatTitle = localStorage.getItem('pendingChatTitle');
                    if (!chatTitle) {
                        showCustomAlert('Название чата не найдено', {
                            title: 'Ошибка',
                            confirmText: 'Ок'
                        });
                        return;
                    }
                    localStorage.setItem('selectedCharacterData', JSON.stringify(data));
                    ipcRenderer.send('navigate-to-worlds');
                });
            }
        })
        .catch(err => {
            document.getElementById("character-info").textContent = "Ошибка при загрузке данных.";
            console.error(err);
        });

     
    if (cancelNewChat) {
        cancelNewChat.style.display = isGameStart ? "block" : "none";
    }

    if (cancelNewChat) {
        cancelNewChat.addEventListener("click", () => {
            // Если мы выбирали персонажа для чата, но передумали — очищаем флаги
            if (isGameStart) {
                localStorage.removeItem('pendingChatTitle');
                localStorage.removeItem('isGameStart');
                localStorage.removeItem('selectedCharacterData');
                window.location.reload();
            }
        });
    }

    document.getElementById("back-to-characters").addEventListener("click", () => {
        ipcRenderer.send('navigate-to-characters');
    });
});

function deleteCharacter(characterId) {
    showCustomAlert('Вы уверены, что хотите удалить этого персонажа?', {
        title: 'Подтверждение удаления',
        showCancel: true,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        onConfirm: () => {
            // Действие при подтверждении удаления
            fetch(`http://localhost:5000/characters/${characterId}/delete`, {
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
                showCustomAlert('Персонаж успешно удален', {
                    title: 'Уведомление',
                    confirmText: 'Ок',
                    onConfirm: () => {
                        loadCharacters(); // Обновляем список персонажей после закрытия уведомления
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка при удалении персонажа:', error);
                showCustomAlert('Не удалось удалить персонажа. Попробуйте снова.', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
            });
        },
        onCancel: () => {
            // Действие при отмене (ничего не делаем)
            console.log('Удаление персонажа отменено');
        }
    });
}

// //кнопка выбора персонажа
// document.addEventListener('DOMContentLoaded', function() {
//     if (isGameStart) {
//         const button = document.getElementById('choose-character');
//         if (button) { 
//             button.style.display = 'block';
//         } else {
//             console.error('Кнопка с ID "choose-character" не найдена!');
//         }
//     }
// });