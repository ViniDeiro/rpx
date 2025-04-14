# Sistema de Personagens 3D

Este diretório contém os componentes para o sistema de personagens 3D em estilo cartoon para o projeto RPX.

## Dependências

Para utilizar este sistema, você precisa adicionar as seguintes dependências ao seu projeto:

```bash
npm install --legacy-peer-deps three@0.152.2 @react-three/fiber@8.13.6 @react-three/drei@9.80.1 react-hot-toast
```

Ou adicione manualmente as dependências do arquivo `package-3d.json` ao seu `package.json`.

## Estrutura de Arquivos

- `CharacterViewer.jsx` - Componente para visualização de modelos 3D
- `CharacterCustomizer.jsx` - Interface para personalização de avatares
- `CharacterShop.jsx` - Loja para compra de skins
- `../lobby/CharacterDisplay.jsx` - Componente para exibir personagens no lobby

## Modelos 3D

Para que o sistema funcione corretamente, você precisa adicionar os modelos 3D em formato GLB à pasta `public/models/character/`.

### Estrutura de Arquivos de Modelos

```
public/
  models/
    character/
      default.glb
      ninja.glb
      soldier.glb
      explorer.glb
      cyber.glb
      neon.glb
      ... outros modelos
```

## Criação de Modelos 3D

Para criar os modelos 3D em estilo cartoon, recomendamos:

1. **Modelagem**: Usar Blender para modelagem de personagens em estilo cartoon
2. **Rigging**: Criar um esqueleto simples com bones para animações básicas
3. **Animações**: Criar animações para:
   - `idle` - Parado
   - `walk` - Caminhando
   - `run` - Correndo
   - `dance` - Dançando 
   - `wave` - Acenando

4. **Exportação**: Exportar como GLB com as seguintes configurações:
   - Incluir texturas/materiais
   - Incluir animações
   - Escala: 1 unidade = 1 metro
   - Orientação: Y-up

## Integração com o Sistema

O sistema já está integrado com:

- Página de perfil de usuário
- Sistema de lobby
- Loja de skins
- Customização de personagens

## Próximos Passos

1. Criar os modelos 3D em Blender ou contratar um artista 3D
2. Adicionar os modelos à pasta correta
3. Ajustar o tamanho e posição dos modelos conforme necessário
4. Implementar a lógica de backend para salvar as skins dos usuários
5. Expandir o sistema com mais opções de personalização (acessórios, cores, etc.)

## Exemplo de Uso

```jsx
import CharacterViewer from '@/components/3d/CharacterViewer';

export default function MyComponent() {
  return (
    <div style={{ height: 400, width: 300 }}>
      <CharacterViewer 
        skinId="default" 
        animation="idle"
        controls={true}
        autoRotate={false}
        background="transparent"
      />
    </div>
  );
}
``` 