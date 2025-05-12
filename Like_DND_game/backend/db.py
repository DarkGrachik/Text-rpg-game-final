from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
# import os

# if os.path.exists("chat.db"):
#     os.remove("chat.db")

# Настройка подключения к базе данных
DATABASE_URL = "sqlite:///chat.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# персонаж
class Character(Base):
    __tablename__ = "characters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)                  # Имя персонажа
    character_class = Column(String, nullable=False)       # Класс персонажа
    race = Column(String, nullable=False)                  # Раса

    strength = Column(Integer, default=0)                  # Сила
    dexterity = Column(Integer, default=0)                 # Ловкость
    constitution = Column(Integer, default=0)              # Телосложение
    intelligence = Column(Integer, default=0)              # Интеллект
    wisdom = Column(Integer, default=0)                    # Мудрость
    charisma = Column(Integer, default=0)                  # Харизма

    level = Column(Integer, default=1)                     # Уровень
    appearance = Column(Text, default="")                  # Внешность
    background = Column(Text, default="")                  # Предыстория

    created_at = Column(DateTime, default=datetime.utcnow) # Дата создания
    deleted_at = Column(DateTime, nullable=True)           # Дата удаления (если удалён)
    deleted = Column(Boolean, default=False)               # Логическое удаление

# мир
class World(Base):
    __tablename__ = "worlds"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)                  # Название мира
    description = Column(Text, default="")                  # Описание

    created_at = Column(DateTime, default=datetime.utcnow) # Дата создания
    deleted_at = Column(DateTime, nullable=True)           # Дата удаления (если удалён)
    deleted = Column(Boolean, default=False)               # Логическое удаление

# Модель чата
class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # Название чата
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted = Column(Boolean, default=False)  # Флаг для логического удаления чата

    name = Column(String, default="")                  # Имя персонажа
    character_class = Column(String, default="")       # Класс персонажа
    race = Column(String, default="")                  # Раса

    strength = Column(Integer, default=0)                  # Сила
    dexterity = Column(Integer, default=0)                 # Ловкость
    constitution = Column(Integer, default=0)              # Телосложение
    intelligence = Column(Integer, default=0)              # Интеллект
    wisdom = Column(Integer, default=0)                    # Мудрость
    charisma = Column(Integer, default=0)                  # Харизма

    level = Column(Integer, default=1)                     # Уровень
    appearance = Column(Text, default="")                  # Внешность
    background = Column(Text, default="")                  # Предыстория

    world_name = Column(String, default="")                  # Название мира
    description = Column(Text, default="")    
    
    # Связь с сообщениями
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

# Модель сообщения
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, nullable=False)  # 'user' или 'ai'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    chat_id = Column(Integer, ForeignKey('chats.id'))

    # Связь с чатом
    chat = relationship("Chat", back_populates="messages")

# Создание таблиц
Base.metadata.create_all(bind=engine)

