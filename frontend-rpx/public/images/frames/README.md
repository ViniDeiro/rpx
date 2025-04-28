# Molduras de Perfil

Esta pasta contém molduras que podem ser aplicadas em torno das fotos de perfil dos usuários.

## Formato

As molduras devem ser imagens PNG com transparência e preferencialmente em formato quadrado (recomendado 512x512 pixels).

## Convenção de Nomenclatura

As molduras devem seguir o seguinte padrão de nomenclatura:

- `basic_frame.png` - Moldura básica disponível para todos os usuários
- `premium_frame.png` - Moldura para usuários premium
- `event_[nome-evento].png` - Moldura para eventos específicos
- `achievement_[nome-conquista].png` - Moldura para conquistas específicas
- `seasonal_[estação].png` - Moldura para temporadas específicas

## Como Usar

Para usar uma moldura, importe o componente ProfileAvatar e forneça a URL da moldura:

```jsx
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export default function UserProfile() {
  return (
    <div>
      <ProfileAvatar 
        size="md" 
        frameUrl="/images/frames/premium_frame.png" 
      />
      <h2>Nome do Usuário</h2>
    </div>
  );
}
```

## Tamanhos Disponíveis

O componente ProfileAvatar suporta três tamanhos:

- `sm`: Pequeno (64x64px)
- `md`: Médio (96x96px) - Padrão
- `lg`: Grande (128x128px)

## Notas de Design

- As molduras devem ter uma área transparente no centro para a foto do perfil
- A área útil da moldura deve estar entre 110% e 125% do tamanho da foto de perfil
- Use cores e efeitos que se destaquem mas não dificultem a visualização da foto 