import os

pages_dir = '../hr-frontend/src/pages'
for file in os.listdir(pages_dir):
    if file.endswith('.jsx') and file != 'Login.jsx':
        filepath = os.path.join(pages_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'fetch(' in content and 'apiFetch(' not in content:
            content = content.replace('fetch(', 'apiFetch(')
            content = "import { apiFetch } from '../utils/api';\n" + content
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {file}')
