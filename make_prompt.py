# collect_files.py
import os
import subprocess
import platform
from pathlib import Path

# Конфигурация
CONFIG = {
    'extensions': ['.vue', '.ts', '.tsx', '.js'],
    'exclude_dirs': ['node_modules', 'dist', 'build', '.git', 'coverage', '__pycache__'],
    'exclude_files': ['collect_files.py'],  # Исключить сам скрипт
    'max_size': 1024 * 1024  # 1MB
}

def get_all_files(directory, file_list=None):
    """Рекурсивно собирает все файлы с нужными расширениями"""
    if file_list is None:
        file_list = []
    
    try:
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            
            if os.path.isdir(item_path):
                if item not in CONFIG['exclude_dirs']:
                    get_all_files(item_path, file_list)
            else:
                ext = os.path.splitext(item)[1]
                if ext in CONFIG['extensions']:
                    if item not in CONFIG['exclude_files']:
                        file_list.append(item_path)
    except PermissionError:
        print(f"⚠️ Нет доступа к папке: {directory}")
    
    return file_list

def read_file_content(file_path):
    """Читает содержимое файла"""
    try:
        file_size = os.path.getsize(file_path)
        if file_size > CONFIG['max_size']:
            return f"⚠️ Файл слишком большой ({round(file_size / 1024)}KB), пропущен"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        return "⚠️ Не удалось декодировать файл (возможно, бинарный)"
    except Exception as e:
        return f"❌ Ошибка чтения: {e}"

def format_output(files):
    """Форматирует вывод всех файлов"""
    output = []
    total_files = len(files)
    total_size = 0
    
    # Заголовок
    output.append("=" * 80)
    output.append("📁 КОЛЛЕКЦИЯ ФАЙЛОВ ПРОЕКТА")
    output.append(f"📅 Дата: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append(f"📂 Текущая директория: {os.getcwd()}")
    output.append(f"📄 Найдено файлов: {total_files}")
    output.append("=" * 80)
    output.append("")
    
    # Содержимое файлов
    for file_path in files:
        content = read_file_content(file_path)
        
        if content.startswith("⚠️") or content.startswith("❌"):
            # Пропускаем проблемные файлы
            continue
        
        # Добавляем информацию о файле
        rel_path = os.path.relpath(file_path)
        file_size = os.path.getsize(file_path)
        total_size += file_size
        
        output.append(f"\n{'=' * 80}")
        output.append(f"📄 Файл: {rel_path}")
        output.append(f"📏 Размер: {file_size} байт")
        output.append(f"{'=' * 80}\n")
        output.append(content)
        output.append("")  # Пустая строка между файлами
    
    # Информация о пропущенных файлах
    skipped = total_files - len(files) + len([f for f in files if read_file_content(f).startswith(('⚠️', '❌'))])
    
    output.append("\n" + "=" * 80)
    output.append(f"✅ Обработано файлов: {len(files)}")
    output.append(f"📦 Общий размер: {total_size} байт ({round(total_size / 1024)}KB)")
    output.append("=" * 80)
    
    return "\n".join(output)


import pyperclip

            
def copy_to_clipboard(text):
    pyperclip.copy(text)
    return True

def save_to_file(text, filename='project_files.txt'):
    """Сохраняет в файл как резервную копию"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"✅ Также сохранено в файл: {filename}")
        return True
    except Exception as e:
        print(f"❌ Ошибка при сохранении: {e}")
        return False

def main():
    """Основная функция"""
    print("🔍 Сбор файлов...")
    
    # Собираем все файлы
    files = get_all_files(Path(os.getcwd(), "src"))
    files = sorted(files)  # Сортируем для удобства
    
    if not files:
        print("❌ Файлы не найдены!")
        return
    
    print(f"📄 Найдено файлов: {len(files)}")
    print("📖 Чтение файлов...")
    
    # Форматируем вывод
    output = format_output(files)
    output += f"\nВыводи только измененные участки кода, не пиши разъяснение если я тебя не просил этого сделать"

    # Копируем в буфер обмена
    print("📋 Копирование в буфер обмена...")
    if copy_to_clipboard(output):
        print(f"✅ Скопировано {len(files)} файлов")
        print(f"📊 Общий размер: {len(output)} символов")
    
    # Также сохраняем в файл как резервную копию
    # save_to_file(output)
    
    # Показываем статистику
    print(f"\n📊 Статистика:")
    print(f"   - Файлов обработано: {len(files)}")
    print(f"   - Символов: {len(output):,}")
    print(f"   - Размер: {round(len(output) / 1024)}KB")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️ Прервано пользователем")
    except Exception as e:
        print(f"❌ Ошибка: {e}")