const { ipcRenderer } = require('electron');
let currentChatId = null;

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
    const startChatsButton = document.getElementById('chats-button');
    const charactersButton = document.getElementById('characters-button');
    const worldsButton = document.getElementById('worlds-button');
    const newChatButton = document.getElementById('new-chat-button');
    const backToMenuButton = document.getElementById('menu-button');
    const backButton = document.getElementById('back-button');

    if (startChatsButton) {
        startChatsButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-chats');
        });
    }

    if (charactersButton) {
        charactersButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-characters');
        });
    }

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

    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-new-chat'); // Вызовем функцию создания чата
        });
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-back'); // Возврат на предыдущую страницу
        });
    }

    const createChatButton = document.getElementById('create-chat-button');
    if (createChatButton) {
        createChatButton.addEventListener('click', () => {
            const title = document.getElementById('new-chat-title').value.trim();
            if (title) {
                localStorage.setItem('isGameStart', 'true');
                // Сохраняем название чата в localStorage
                localStorage.setItem('pendingChatTitle', title);
                // Перенаправляем на выбор персонажа
                window.location.href = 'characters.html';
            } else {
                showCustomAlert('Введите название чата', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
            }
        });
    }

});

// Добавляем обработчик для кнопки "Сохранить"
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        // Сначала удаляем все существующие обработчики
        saveButton.replaceWith(saveButton.cloneNode(true));
        const freshSaveButton = document.getElementById('save-button');
        
        // Затем добавляем новый обработчик
        freshSaveButton.addEventListener('click', () => {
            const currentChatId = localStorage.getItem('currentChatId');
            if (!currentChatId) {

                  showCustomAlert('Не удалось определить текущий чат', {
                    title: 'Ошибка',
                    confirmText: 'Ок'
                });
                return;
            }
            
            // Создаем модальное окно для ввода названия
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1000';
            
            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = '#1a1a2e';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '10px';
            modalContent.style.width = '300px';
            
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.placeholder = 'Введите название копии';
            titleInput.style.width = '87%';
            titleInput.style.marginBottom = '10px';
            titleInput.style.padding = '8px';
            titleInput.style.marginLeft = '10px';
            
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Создать копию';
            confirmButton.className = 'button_small';
            confirmButton.style.marginRight = '10px';
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Отмена';
            cancelButton.className = 'button_small';
            
            confirmButton.addEventListener('click', () => {
                const newTitle = titleInput.value.trim();
                if (!newTitle) {
                    showCustomAlert('Введите название для копии чата', {
                        title: 'Ошибка',
                        confirmText: 'Ок'
                    });
                    return;
                }
                
                // Отправляем запрос на копирование чата
                fetch(`http://localhost:5000/chats/${currentChatId}/copy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: newTitle })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                    } else {
                        showCustomAlert('Чат успешно скопирован', {
                            title: 'Уведомление',
                            confirmText: 'Ок'
                        });
                        document.body.removeChild(modal);
                        // Можно автоматически перейти к новому чату
                        // openChat(data.id);
                    }
                })
                .catch(error => {
                    console.error('Error copying chat:', error);
                    showCustomAlert('Ошибка при копировании чата', {
                        title: 'Ошибка',
                        confirmText: 'Ок'
                    });
                });
            });
            
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modalContent.appendChild(titleInput);
            modalContent.appendChild(confirmButton);
            modalContent.appendChild(cancelButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Фокусируемся на поле ввода
            titleInput.focus();
        });
    }
});


// Функция для загрузки списка чатов
function loadChats() {
    fetch('http://localhost:5000/chats')  // Обновите URL на свой серверный путь для получения чатов
        .then(response => response.json())
        .then(data => {
            const chatList = document.getElementById('chat-list');
            chatList.innerHTML = ''; // Очистить текущий список чатов

            data.forEach(chat => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<button class="button" onclick="openChat(${chat.id})">${chat.title}</button> <button class="delete-button" onclick="deleteChat(${chat.id})">Х</button>`;
                console.log('Кнопка добавлена для чата:', chat.id, chat.title);
                chatList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке чатов:', error);
        });
}

// Загрузить чаты при открытии страницы
if (document.getElementById('chat-list')) {
    loadChats();
}

// Открытие чата по нажатию на его кнопку
function openChat(chatId) {
    console.log('openChat вызван с chatId:', chatId);
    currentChatId = chatId;
    localStorage.setItem('currentChatId', chatId);
    ipcRenderer.send('navigate-to-chat', chatId);
}

// document.addEventListener('DOMContentLoaded', () => {
//     const startChatButton = document.getElementById('chat-button');

//     if (startChatButton) {
//         startChatButton.addEventListener('click', () => {
//             ipcRenderer.send('navigate-to-chat');
//         });
//     }
// });

function createNewChat(title) {
    fetch('http://localhost:5000/chats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => {
        if (data.id) {
            showCustomAlert('Чат создан успешно', {
                title: 'Уведомление',
                confirmText: 'Ок'
            });
            window.location.href = 'chats.html'; // Переход к списку чатов
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
}


document.addEventListener('DOMContentLoaded', () => {
    const backToMenuButton = document.getElementById('menu-button');

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-menu');
        });
    }
});

// Функция для добавления сообщения в чат
function addMessage(sender, message, isUser) {
    const chat = document.getElementById('chat-box');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<b>${sender}:</b> ${message}`;
    messageElement.className = isUser ? 'user' : 'ai';
    chat.appendChild(messageElement);
    chat.scrollTop = chat.scrollHeight; // Прокрутка чата к последнему сообщению
}

// Отправка сообщения по нажатию на кнопку "Отправить"
document.getElementById('send-button').addEventListener('click', () => {
    sendMessage();
});

// Отправка сообщения по нажатию клавиши Enter
document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Проверка на клавишу Enter и игнорирование Shift
        event.preventDefault(); // Предотвращение вставки новой строки
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById('message-input').value;
    if (input.trim() === '') return; // Игнорировать пустые сообщения
    const chatId = localStorage.getItem('currentChatId');
    console.log('вызван с chatId:', chatId);
    // if (!currentChatId) {
    //     console.error('Chat ID не найден!');
    //     return; // Если нет chat_id, не отправляем сообщение
    // }

    addMessage('Вы', input, true); // Отображаем сообщение пользователя сразу

    // Отправка сообщения на бекенд
    fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input, chat_id: chatId })
    })
    .then(response => response.json())
    .then(data => {
        const aiResponse = data.response || "Нет ответа от ИИ.";
        addMessage('ИИ', aiResponse, false); // Отображаем ответ от ИИ
    })
    .catch(error => {
        console.error('Ошибка:', error);
        addMessage('ИИ', 'Ошибка при подключении к серверу.', false);
    });

    // Очищаем поле ввода после отправки
    document.getElementById('message-input').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const chatId = localStorage.getItem('currentChatId'); // Получаем chatId из localStorage
    if (chatId) {
        loadMessages(chatId); // Загружаем сообщения для выбранного чата
    } else {
        console.error('Chat ID не найден! Невозможно загрузить сообщения.');
    }
});

    // Функция для загрузки всех сообщений
    function loadMessages(chatId) {
        fetch(`http://localhost:5000/messages/${chatId}`)  // Добавлен chat_id в URL
            .then(response => response.json())
            .then(data => {
                const chatBox = document.getElementById('chat-box');
                chatBox.innerHTML = ''; // Очистить чат перед загрузкой
    
                // Если есть данные, отображаем сообщения
                if (data.length > 0) {
                    data.forEach(message => {
                        const isUser = message.sender === 'user';
                        addMessage(isUser ? 'Вы' : 'ИИ', message.content, isUser);
                    });
                } else {
                    chatBox.innerHTML = 'Сообщений нет.';
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке сообщений:', error);
            });
    }

    function deleteChat(chatId) {
            showCustomAlert('Вы уверены, что хотите удалить этот чат?', {
                title: 'Подтверждение удаления',
                showCancel: true,
                confirmText: 'Удалить',
                cancelText: 'Отмена',
                onConfirm: () => {
                    // Действие при подтверждении удаления
                    fetch(`http://localhost:5000/chats/${chatId}/delete`, {
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
                        showCustomAlert('Чат успешно удален', {
                            title: 'Уведомление',
                            confirmText: 'Ок',
                            onConfirm: () => {
                                loadChats(); // Обновляем список чатов после закрытия уведомления
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Ошибка при удалении чата:', error);
                        showCustomAlert('Не удалось удалить чат. Попробуйте снова.', {
                            title: 'Ошибка',
                            confirmText: 'Ок'
                        });
                    });
                },
                onCancel: () => {
                    // Действие при отмене (ничего не делаем)
                    console.log('Удаление чата отменено');
                }
            });
        }


// Загрузка сообщений при открытии чата
// document.addEventListener('DOMContentLoaded', () => {
//     loadMessages();
// });


