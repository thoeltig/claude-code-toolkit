import os
import re
import glob
import json
import argparse
from pathlib import Path

def extract_frontmatter(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if not match:
            return None, None

        frontmatter = match.group(1)
        name_match = re.search(r'^name:\s*(.+)$', frontmatter, re.MULTILINE)
        desc_match = re.search(r'^description:\s*(.+?)(?=\n\w+:|$)', frontmatter, re.MULTILINE | re.DOTALL)

        name = name_match.group(1).strip() if name_match else None
        desc = desc_match.group(1).strip() if desc_match else None

        if desc:
            desc = ' '.join(desc.split())

        return name, desc
    except Exception:
        return None, None

def find_skills(base_path, scope, plugin_name=None):
    pattern = os.path.join(base_path, '**', 'SKILL.md')
    skills = []
    for skill_file in glob.glob(pattern, recursive=True):
        name, desc = extract_frontmatter(skill_file)
        if name and desc:
            skills.append({
                'name': name,
                'path': skill_file,
                'description': desc,
                'scope': scope,
                'plugin_name': plugin_name
            })
    return sorted(skills, key=lambda x: x['name'])

# Parse arguments
parser = argparse.ArgumentParser(description='List available Claude Code skills')
parser.add_argument('--format', choices=['names', 'paths', 'list', 'table', 'json'],
                    default='names', help='Output format')
args = parser.parse_args()

# Find project skills
project_path = os.path.join('.claude', 'skills')
project_skills = find_skills(project_path, 'project') if os.path.exists(project_path) else []

# Find personal skills
home = Path.home()
personal_path = os.path.join(home, '.claude', 'skills')
personal_skills = find_skills(personal_path, 'personal') if os.path.exists(personal_path) else []

# Find installed plugin skills
plugin_skills = []
installed_plugins_file = os.path.join(home, '.claude', 'plugins', 'installed_plugins.json')
if os.path.exists(installed_plugins_file):
    try:
        with open(installed_plugins_file, 'r', encoding='utf-8') as f:
            installed_data = json.load(f)
            if 'plugins' in installed_data:
                for plugin_id, plugin_info in installed_data['plugins'].items():
                    if 'installPath' in plugin_info:
                        install_path = plugin_info['installPath']
                        if os.path.exists(install_path):
                            # Extract plugin name without marketplace (e.g., "changelog" from "changelog@claude-code-toolkit")
                            plugin_name = plugin_id.split('@')[0] if '@' in plugin_id else plugin_id
                            plugin_skills.extend(find_skills(install_path, 'plugin', plugin_name))
    except Exception:
        pass

all_skills = project_skills + personal_skills + plugin_skills

# Output based on format
if args.format == 'names':
    for skill in all_skills:
        if skill['plugin_name']:
            print(f"{skill['plugin_name']}:{skill['name']}")
        else:
            print(skill['name'])

elif args.format == 'paths':
    for skill in all_skills:
        print(skill['path'])

elif args.format == 'list':
    if project_skills:
        print('PROJECT SKILLS')
        for skill in project_skills:
            print(f"{skill['name']}: {skill['description']}")
        print()

    if personal_skills:
        print('PERSONAL SKILLS')
        for skill in personal_skills:
            print(f"{skill['name']}: {skill['description']}")
        print()

    if plugin_skills:
        print('PLUGIN SKILLS')
        for skill in plugin_skills:
            skill_name = f"{skill['plugin_name']}:{skill['name']}" if skill['plugin_name'] else skill['name']
            print(f"{skill_name}: {skill['description']}")

elif args.format == 'table':
    print('name\tpath\tdescription\tscope')
    for skill in all_skills:
        print(f"{skill['name']}\t{skill['path']}\t{skill['description']}\t{skill['scope']}")

elif args.format == 'json':
    print(json.dumps(all_skills, indent=2))
