import re
import os
from pathlib import Path

def extract_and_save_files(content: str, output_base_dir: str = "output_conditions"):
    """
    Извлекает блоки кода TypeScript из текста и сохраняет их в файлы.
    Путь к файлу берется из первого комментария после строки с ```typescript.
    """
    # Регулярное выражение для поиска блоков кода
    pattern = '```typescript[\n\\s]+//\\s*(.*?\\.ts)\n\n(.*?)```'

    matches = re.findall(pattern, content, re.DOTALL)
    
    if not matches:
        print("Блоки кода не найдены.")
        return
    
    # Создаем базовую директорию, если её нет
    os.makedirs(output_base_dir, exist_ok=True)
    
    for filepath, code in matches:
        # Собираем полный путь
        full_path = os.path.join(output_base_dir, filepath)
        
        # Создаем поддиректории, если их нет
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Записываем файл
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(f"{code.strip()}")
        
        print(f"Сохранен файл: {full_path}")

if __name__ == "__main__":
    # Читаем ввод из консоли или буфера обмена
    print("Вставьте текст с блоками кода (Ctrl+Z или Ctrl+D для завершения):")

    root_path = Path(__file__).parent

    with open(root_path / "write_to_file_from_md.md", 'r', encoding="utf-8") as file:
        lines = file.readlines()
	
    # lines = []
    # try:
    #     while True:
    #         line = input()
    #         lines.append(line)
    # except EOFError:
    #     pass

    content = "".join(lines)
    
    if content.strip():
        extract_and_save_files(content, str(root_path))
    else:
        print("Нет данных для обработки.")