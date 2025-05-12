from flask import Flask, request, jsonify
import requests
from db import SessionLocal, Message, Chat, Character, World
from flask_cors import CORS
import json
import re


app = Flask(__name__)
CORS(app, supports_credentials=True)


# Функция для сохранения чата
def save_chat(data):
    db = SessionLocal()
    try:
        chat = Chat(
            title=data.get("title"),
            name=data.get("name"),
            character_class=data.get("character_class"),
            race=data.get("race"),
            level=data.get("level"),
            strength=data.get("strength"),
            dexterity=data.get("dexterity"),
            constitution=data.get("constitution"),
            intelligence=data.get("intelligence"),
            wisdom=data.get("wisdom"),
            charisma=data.get("charisma"),
            appearance=data.get("appearance"),
            background=data.get("background"),
            world_name=data.get("world_name"),
            description=data.get("description")
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        print(f"Чат сохранен: {chat.title}")
        return chat
    except Exception as e:
        print(f"Ошибка сохранения чата: {e}")
        db.rollback()
        return None
    finally:
        db.close()

# Функция для сохранения сообщения
def save_message(chat_id, sender, content):
    db = SessionLocal()
    try:
        message = Message(chat_id=chat_id, sender=sender, content=content)
        db.add(message)
        db.commit()
        db.refresh(message)
        print(f"Сообщение сохранено: {sender} - {content} - {chat_id}")  # Логирование
        return message
    except Exception as e:
        print(f"Ошибка сохранения сообщения: {e}")
        db.rollback()
        return None
    finally:
        db.close()

# Функция для загрузки всех чатов
def get_all_chats():
    db = SessionLocal()
    try:
        chats = db.query(Chat).filter(Chat.deleted == False).all()  # Загружаем только не удаленные чаты
        print(f"Загружено {len(chats)} чатов")  # Логирование
        return chats
    except Exception as e:
        print(f"Ошибка загрузки чатов: {e}")
        return []
    finally:
        db.close()

# Функция для загрузки всех персонажей
def get_all_characters():
    db = SessionLocal()
    try:
        characters = db.query(Character).filter(Character.deleted == False).all()  # Загружаем только не удаленные персонажи
        print(f"Загружено {len(characters)} персонажей")  # Логирование
        return characters
    except Exception as e:
        print(f"Ошибка загрузки персонажей: {e}")
        return []
    finally:
        db.close()

# Функция для загрузки всех миров
def get_all_worlds():
    db = SessionLocal()
    try:
        worlds = db.query(World).filter(World.deleted == False).all()  # Загружаем только не удаленные миры
        print(f"Загружено {len(worlds)} миров")  # Логирование
        return worlds
    except Exception as e:
        print(f"Ошибка загрузки миров: {e}")
        return []
    finally:
        db.close()

def save_character(data):
    db = SessionLocal()
    try:
        character = Character(
            name=data.get('name', ''),
            character_class=data.get('character_class', ''),
            race=data.get('race', ''),
            strength=data.get('strength', 0),
            dexterity=data.get('dexterity', 0),
            constitution=data.get('constitution', 0),
            intelligence=data.get('intelligence', 0),
            wisdom=data.get('wisdom', 0),
            charisma=data.get('charisma', 0),
            level=data.get('level', 1),
            appearance=data.get('appearance', ''),
            background=data.get('background', '')
        )
        db.add(character)
        db.commit()
        db.refresh(character)
        print(f"Персонаж сохранен: {character.name}")
        return character
    except Exception as e:
        print(f"Ошибка сохранения персонажа: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def save_world(data):
    db = SessionLocal()
    try:
        world = World(
            name=data.get('name', ''),
            description=data.get('description', '')
        )
        db.add(world)
        db.commit()
        db.refresh(world)
        print(f"Мир сохранен: {world.name}")
        return world
    except Exception as e:
        print(f"Ошибка сохранения мира: {e}")
        db.rollback()
        return None
    finally:
        db.close()

# Функция для загрузки сообщений по чату
def get_messages_by_chat(chat_id):
    db = SessionLocal()
    try:
        messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp).all()
        print(f"Загружено {len(messages)} сообщений для чата {chat_id}")  # Логирование
        return messages
    except Exception as e:
        print(f"Ошибка загрузки сообщений: {e}")
        return []
    finally:
        db.close()

# Конфигурация для API Gigachat
GIGACHAT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
GIGACHAT_API_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
AUTH_HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'RqUID': 'b5099afa-5b67-44e6-b1b2-a82ea4fa7d00',
    'Authorization': 'Basic ODlkYTUyYzAtOGJmZC00NDAyLTlkNzYtZDYzZWY0N2ZkMTA1OjYzZmU1OTI0LWFmZGQtNDU0Ny1hNDVjLTYwZWVhMGYzN2Y0Yg=='
}

# Получение токена доступа
def get_access_token():
    payload = {'scope': 'GIGACHAT_API_PERS'}
    response = requests.post(GIGACHAT_AUTH_URL, headers=AUTH_HEADERS, data=payload, verify=False)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"Error getting access token: {response.status_code} - {response.text}")
        return None

@app.route('/chats', methods=['GET'])
def get_chats():
    chats = get_all_chats()
    return jsonify([{"id": chat.id, "title": chat.title, "created_at": chat.created_at.isoformat()} for chat in chats])

@app.route('/chats', methods=['POST'])
def create_chat():
    data = request.get_json()
    if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        # Сначала сохраняем чат
    chat = save_chat(data)
    if not chat:
            return jsonify({'error': 'Failed to create chat'}), 500

        # Формируем приветственное сообщение от ИИ
    character_info = (
            f"Имя: {chat.name}, "
            f"Класс: {chat.character_class}, "
            f"Раса: {chat.race}, "
            f"Сила: {chat.strength}, Ловкость: {chat.dexterity}, Телосложение: {chat.constitution}, "
            f"Интеллект: {chat.intelligence}, Мудрость: {chat.wisdom}, Харизма: {chat.charisma}, "
            f"Уровень: {chat.level}\n"
            f"Внешность: {chat.appearance}\n"
            f"Предыстория: {chat.background}"
        )

    world_info = (
            f"Название мира: {chat.world_name}, "
            f"Описание мира: {chat.description}"
        )

        # Промпт для приветственного сообщения
    welcome_prompt = (
            f"Представь, что ты мастер настольной ролевой игры. "
            f"Ты начинаешь новую игру с игроком. Вот информация о персонаже игрока:\n{character_info}\n"
            f"И вот информация о мире, в котором происходит действие:\n{world_info}\n\n"
            f"Напиши приветственное сообщение для игрока, которое: "
            f"1. Кратко описывает текущую ситуацию и окружение "
            f"2. Дает игроку возможность начать действовать "
            f"3. Создает атмосферу и настроение в соответствии с миром и персонажем "
            f"4. Не требует немедленного ответа, но оставляет пространство для выбора действий "
            f"Сообщение должно быть на 1-2 абзаца, живым и увлекательным."
        )

        # Получаем токен
    access_token = get_access_token()
    if not access_token:
            return jsonify({'error': 'Ошибка авторизации в GigaChat'}), 500

        # Отправляем запрос к GigaChat
    headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
    payload = {
            "model": "GigaChat",
            "messages": [{"role": "user", "content": welcome_prompt}],
            "n": 1,
            "stream": False,
            "max_tokens": 512,
            "repetition_penalty": 1,
            "update_interval": 0
        }

    try:
            response = requests.post(GIGACHAT_API_URL, headers=headers, json=payload, verify=False)
            if response.status_code == 200:
                response_data = response.json()
                ai_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', 'Добро пожаловать в игру!')
                
                # Сохраняем ответ ИИ как первое сообщение в чате
                save_message(chat_id=chat.id, sender="ai", content=ai_response)
            else:
                print(f"Ошибка при запросе к GigaChat: {response.status_code} - {response.text}")
                # Сохраняем стандартное приветственное сообщение в случае ошибки
                save_message(chat_id=chat.id, sender="ai", content="Добро пожаловать в новое приключение!")
    except Exception as e:
            print(f"Исключение при запросе к GigaChat: {str(e)}")
            save_message(chat_id=chat.id, sender="ai", content="Да начнется ваше путешествие!")

    return jsonify({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat()
        }), 201    
    
@app.route('/messages/<int:chat_id>', methods=['GET'])
def get_messages(chat_id):
    messages = get_messages_by_chat(chat_id)
    return jsonify([{
        "sender": msg.sender,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat()
    } for msg in messages])

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    chat_id = data.get('chat_id')

    # Сохранение сообщения пользователя
    save_message(chat_id=chat_id, sender="user", content=user_message)

    db = SessionLocal()
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        db.close()
        return jsonify({'response': 'Чат не найден.'}), 404

    character_info = (
        f"Имя: {chat.name}, "
        f"Класс: {chat.character_class}, "
        f"Раса: {chat.race}, "
        f"Сила: {chat.strength}, Ловкость: {chat.dexterity}, Телосложение: {chat.constitution}, "
        f"Интеллект: {chat.intelligence}, Мудрость: {chat.wisdom}, Харизма: {chat.charisma}, "
        f"Уровень: {chat.level}\n"
        f"Внешность: {chat.appearance}\n"
        f"Предыстория: {chat.background}"
    )

    world_info = (
        f"Название мира: {chat.world_name}, "
        f"Описание мира: {chat.description}"
    )

    full_prompt = (
        f"Представь, что ты мастер настольной ролевой игры. \
        Ты должен отыгрывать роль, как будто игра уже идет какое-то время. \
            Я - игрок. Ты должен описывать мне окружение, давать мне возможность решать, как действовать, придумывать квесты и случайные события. \
            Ты не должен переспрашивать у меня подробности о моем персонаже или мире, если чего-то не знаешь, то предположи наиболее вероятный вариант сам. \
            То, что сейчас прописано - вспомогательная информация. Отвечай только на то, что идет после слов 'Я пишу:' \
            Мой персонаж:\n{character_info}\n \
            Мир, в котором я нахожусь:\n{world_info}\n"
        f"Я пишу: {user_message}"
    )

    db.close()
    print("Отправляемый prompt для ИИ:\n", full_prompt)

    # Получение токена
    # access_token = get_access_token()
    if not access_token:
        return jsonify({'response': 'Ошибка авторизации.'}), 500

    # Запрос к Gigachat
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    payload = {
        "model": "GigaChat",
        "messages": [{"role": "user", "content": full_prompt}],
        "n": 1,
        "stream": False,
        "max_tokens": 512,
        "repetition_penalty": 1,
        "update_interval": 0
    }
    response = requests.post(GIGACHAT_API_URL, headers=headers, json=payload, verify=False)
    
    if response.status_code == 200:
        response_data = response.json()
        ai_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', 'Нет ответа.')
        
        # Сохранение ответа ИИ
        save_message(chat_id=chat_id, sender="ai", content=ai_response)

        return jsonify({'response': ai_response})
    else:
        return jsonify({'response': f"Ошибка: {response.status_code} - {response.text}"}), 500

@app.route('/chats/<int:chat_id>/delete', methods=['POST'])
def delete_chat(chat_id):
    db = SessionLocal()
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            chat.deleted = True
            db.commit()
            return jsonify({'message': f'Чат {chat_id} успешно удален.'}), 200
        else:
            return jsonify({'error': 'Чат не найден.'}), 404
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Ошибка удаления чата: {e}'}), 500
    finally:
        db.close()

@app.route('/characters', methods=['POST'])
def create_character():
    data = request.get_json()

    # Простая проверка на наличие обязательных полей
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    character = save_character(data)
    if character:
        return jsonify({"id": character.id, "name": character.name, "created_at": character.created_at.isoformat()}), 201
    else:
        return jsonify({'error': 'Failed to create character'}), 500

@app.route('/characters', methods=['GET'])
def get_characters():
    characters = get_all_characters()
    return jsonify([{"id": character.id, "name": character.name, "created_at": character.created_at.isoformat()} for character in characters])

def get_character_by_id(character_id):
    db = SessionLocal()
    try:
        character = db.query(Character).filter(Character.id == character_id, Character.deleted == False).first()
        return character
    except Exception as e:
        print(f"Ошибка получения персонажа: {e}")
        return None
    finally:
        db.close()

@app.route('/characters/<int:character_id>', methods=['GET'])
def get_character(character_id):
    character = get_character_by_id(character_id)
    if not character:
        return jsonify({'error': 'Персонаж не найден'}), 404  # Ошибка 404, если персонаж не найден
    
    # Если персонаж найден, возвращаем его данные
    return jsonify({
        'id': character.id,
        'name': character.name,
        'character_class': character.character_class,
        'race': character.race,
        'level': character.level,
        'strength': character.strength,
        'dexterity': character.dexterity,
        'constitution': character.constitution,
        'intelligence': character.intelligence,
        'wisdom': character.wisdom,
        'charisma': character.charisma,
        'appearance': character.appearance,
        'background': character.background
    })        

@app.route('/characters/<int:character_id>/delete', methods=['POST'])
def delete_character(character_id):
    db = SessionLocal()
    try:
        character = db.query(Character).filter(Character.id == character_id).first()
        if character:
            character.deleted = True
            db.commit()
            return jsonify({'message': f'Персонаж {character_id} успешно удален.'}), 200
        else:
            return jsonify({'error': 'Персонаж не найден.'}), 404
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Ошибка удаления персонажа: {e}'}), 500
    finally:
        db.close()

def generate_character_data(partial_data):
    # Формируем промпт
    prompt = "Представь, что ты мастер настольной ролевой игры и создаешь персонажа для игрока. Игрок дает тебе данные, от которых ты должен отталкиваться, создавая персонажа. \
        На основе указанных данных заполни недостающие поля персонажа DnD. Если на основе данных их заполнить не получается, то придумай любые данные сам. \
            Не допускай неопределенностей и уточнений, если тебе не от чего отталкиваться, то просто используй свою фантазию. Внешность и предыстория должны быть описаны словами примерно на абзац. \
            Для классов выбери один из следующих: Варвар, Бард, Жрец, Друид, Воин, Монах, Паладин, Рейнджер, Вор, Волшебник, Чародей. \
            Для персонажа первого уровня распредели числа от 8 до 15 в любом порядке между характеристиками, каждое число используй один раз.\
            Следующее предложение очень важно, следуй ему в точности! Обязательно верни результат в формате JSON со следующими ключами: " \
             "character-name, character-class, character-race, strength, dexterity, constitution, intelligence, wisdom, charisma, appearance, background.\n"
    for key, value in partial_data.items():
        if value:
            prompt += f"{key.capitalize()}: {value}\n"

    # Получение токена
    # access_token = get_access_token()
    if not access_token:
        return None, 'Ошибка авторизации.'

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    payload = {
        "model": "GigaChat",
        "messages": [{"role": "user", "content": prompt}],
        "n": 1,
        "stream": False,
        "max_tokens": 1024,
        "repetition_penalty": 1,
        "update_interval": 0
    }

    response = requests.post(GIGACHAT_API_URL, headers=headers, json=payload, verify=False)

    if response.status_code == 200:
        content = response.json().get('choices', [{}])[0].get('message', {}).get('content', '')
        print("Полный ответ модели:\n", content)

        # Попытка найти JSON-блок
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if match:
            try:
                parsed_json = json.loads(match.group(1))
                print("Извлечённый JSON:\n", parsed_json)
                return parsed_json, None
            except json.JSONDecodeError as e:
                return None, f"Ошибка декодирования JSON: {e}"
        else:
            return None, "JSON не найден в ответе модели."
    else:
        return None, f"Ошибка: {response.status_code} - {response.text}"


@app.route('/characters/generate', methods=['POST'])
def generate_character():
    data = request.get_json()

    response_text, error = generate_character_data(data)
    if error:
        return jsonify({'error': error}), 500

    try:
        generated = response_text
    except json.JSONDecodeError:
        return jsonify({'error': 'Ответ от модели не является корректным JSON.'}), 500

    return jsonify(generated), 200

@app.route('/worlds', methods=['POST'])
def create_world():
    data = request.get_json()

    # Простая проверка на наличие обязательных полей
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    world = save_world(data)
    if world:
        return jsonify({"id": world.id, "name": world.name, "created_at": world.created_at.isoformat()}), 201
    else:
        return jsonify({'error': 'Failed to create world'}), 500

@app.route('/worlds', methods=['GET'])
def get_worlds():
    worlds = get_all_worlds()
    return jsonify([{"id": world.id, "name": world.name, "created_at": world.created_at.isoformat()} for world in worlds])

def get_world_by_id(world_id):
    db = SessionLocal()
    try:
        world = db.query(World).filter(World.id == world_id, World.deleted == False).first()
        return world
    except Exception as e:
        print(f"Ошибка получения мира: {e}")
        return None
    finally:
        db.close()

@app.route('/worlds/<int:world_id>', methods=['GET'])
def get_world(world_id):
    world = get_world_by_id(world_id)
    if not world:
        return jsonify({'error': 'Мир не найден'}), 404  # Ошибка 404, если персонаж не найден
    
    # Если мир найден, возвращаем его данные
    return jsonify({
        'id': world.id,
        'name': world.name,
        'description': world.description
    })        

@app.route('/worlds/<int:world_id>/delete', methods=['POST'])
def delete_world(world_id):
    db = SessionLocal()
    try:
        world = db.query(World).filter(World.id == world_id).first()
        if world:
            world.deleted = True
            db.commit()
            return jsonify({'message': f'Мир {world_id} успешно удален.'}), 200
        else:
            return jsonify({'error': 'Мир не найден.'}), 404
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Ошибка удаления мира: {e}'}), 500
    finally:
        db.close()

def generate_world_data(partial_data):
    # Формируем промпт
    prompt = "Представь, что ты мастер настольной ролевой игры и создаешь мир для игрока. Игрок дает тебе данные, от которых ты должен отталкиваться, создавая мир. \
        На основе указанных данных заполни недостающие поля мира. Если на основе данных их заполнить не получается, то придумай любые данные сам. \
            Не допускай неопределенностей и уточнений, если тебе не от чего отталкиваться, то просто используй свою фантазию. Описание должно быть описано словами строго на один абзац. \
                            Обязательно экранируй все спецсимволы, включая переносы строк, чтобы результат можно было распарсить функцией json.loads() в Python. Обязательно верни результат в формате JSON со следующими ключами: " \
             "world-name, description.\n"
    for key, value in partial_data.items():
        if value:
            prompt += f"{key.capitalize()}: {value}\n"

    # Получение токена
    # access_token = get_access_token()
    if not access_token:
        return None, 'Ошибка авторизации.'

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    payload = {
        "model": "GigaChat",
        "messages": [{"role": "user", "content": prompt}],
        "n": 1,
        "stream": False,
        "max_tokens": 1024,
        "repetition_penalty": 1,
        "update_interval": 0
    }

    response = requests.post(GIGACHAT_API_URL, headers=headers, json=payload, verify=False)

    if response.status_code == 200:
        content = response.json().get('choices', [{}])[0].get('message', {}).get('content', '')
        print("Полный ответ модели:\n", content)

        # Попытка найти JSON-блок
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if match:
            try:
                parsed_json = json.loads(match.group(1))
                print("Извлечённый JSON:\n", parsed_json)
                return parsed_json, None
            except json.JSONDecodeError as e:
                return None, f"Ошибка декодирования JSON: {e}"
        else:
            return None, "JSON не найден в ответе модели."
    else:
        return None, f"Ошибка: {response.status_code} - {response.text}"


@app.route('/worlds/generate', methods=['POST'])
def generate_world():
    data = request.get_json()

    response_text, error = generate_world_data(data)
    if error:
        return jsonify({'error': error}), 500

    try:
        generated = response_text
    except json.JSONDecodeError:
        return jsonify({'error': 'Ответ от модели не является корректным JSON.'}), 500

    return jsonify(generated), 200

@app.route('/chats/<int:chat_id>/copy', methods=['POST'])
def copy_chat(chat_id):
    data = request.get_json()
    new_title = data.get('title')
    
    if not new_title:
        return jsonify({'error': 'Title is required'}), 400
    
    db = SessionLocal()
    try:
        # Получаем исходный чат
        original_chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not original_chat:
            return jsonify({'error': 'Chat not found'}), 404
        
        # Создаем новый чат с теми же данными, но новым названием
        new_chat = Chat(
            title=new_title,
            name=original_chat.name,
            character_class=original_chat.character_class,
            race=original_chat.race,
            level=original_chat.level,
            strength=original_chat.strength,
            dexterity=original_chat.dexterity,
            constitution=original_chat.constitution,
            intelligence=original_chat.intelligence,
            wisdom=original_chat.wisdom,
            charisma=original_chat.charisma,
            appearance=original_chat.appearance,
            background=original_chat.background,
            world_name=original_chat.world_name,
            description=original_chat.description
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        # Копируем все сообщения из исходного чата
        messages = db.query(Message).filter(Message.chat_id == chat_id).all()
        for message in messages:
            new_message = Message(
                chat_id=new_chat.id,
                sender=message.sender,
                content=message.content
            )
            db.add(new_message)
        
        db.commit()
        
        return jsonify({
            "id": new_chat.id,
            "title": new_chat.title,
            "created_at": new_chat.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.rollback()
        print(f"Error copying chat: {e}")
        return jsonify({'error': 'Failed to copy chat'}), 500
    finally:
        db.close()

if __name__ == '__main__':
    access_token = get_access_token()
    app.run(host='0.0.0.0', port=5000)
