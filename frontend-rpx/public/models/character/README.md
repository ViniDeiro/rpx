# Modelos 3D de Personagens

Coloque neste diretório os arquivos GLB dos personagens 3D para o sistema de avatares.

## Formato Esperado

- Arquivo no formato GLB (GLTF Binary)
- Um personagem de estilo cartoon por arquivo
- Tamanho recomendado: Entre 1MB e 5MB por modelo para otimização web
- Animações embutidas no arquivo

## Modelos Necessários

- `default.glb` - Personagem padrão (obrigatório)
- `ninja.glb` - Personagem ninja
- `soldier.glb` - Personagem soldado
- `explorer.glb` - Personagem explorador
- `cyber.glb` - Personagem cibernético
- `neon.glb` - Personagem neon

## Requisitos Técnicos

- Triangulação: Maximum 10k triangles por modelo
- Textura: Texture Atlas de 1024x1024 ou 2048x2048
- Rig: Esqueleto humanóide simples
- Animações: Deve incluir no mínimo 'idle', 'walk', 'run', 'dance', 'wave'
- Escala: Personagens devem ter aproximadamente 1.7 unidades de altura
- Orientação: Y-up, face para frente (Z positivo)

## Recursos para Criar Modelos

- [Blender](https://www.blender.org/) - Software gratuito para modelagem 3D
- [Mixamo](https://www.mixamo.com/) - Animações para personagens humanóides
- [Ready Player Me](https://readyplayer.me/) - Geração de avatares 3D
- [Sketchfab](https://sketchfab.com/) - Marketplace para modelos 3D

## Formato de Nomeação

Siga o padrão de nomeação para as skins:

```
[id-da-skin].glb
```

Exemplo: `default.glb`, `ninja.glb`, etc.

## Observações

- Certifique-se de que todos os modelos têm um estilo visual consistente
- As animações devem ter nomes padronizados entre todos os modelos
- Teste a performance dos modelos em dispositivos móveis
- Considere criar variações de cores por shader em vez de texturas separadas 