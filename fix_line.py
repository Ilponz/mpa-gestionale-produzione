# -*- coding: utf-8 -*-
with open('build_app_js.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = """                  ${AUTH.isAdmin ? `
                    <button class="moral-delete-btn" data-delete-moral-comp-id="${comp.id}" data-delete-moral-id="${m.id}" title="Elimina pezzo (Richiede PIN Admin)">
                      [X]
                    </button>
                  ` : ''}
                </div>
                `;
              `).join('');
            })()}"""

replacement = """                  ${AUTH.isAdmin ? `
                    <button class="moral-delete-btn" data-delete-moral-comp-id="${comp.id}" data-delete-moral-id="${m.id}" title="Elimina pezzo (Richiede PIN Admin)">
                      [X]
                    </button>
                  ` : ''}
                </div>
              `).join('');
            })()}"""

assert target in text, "Target not found in build_app_js.py"
text = text.replace(target, replacement, 1)

with open('build_app_js.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed syntax in build_app_js.py")
