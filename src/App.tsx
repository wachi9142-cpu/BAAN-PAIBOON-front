import { useGame } from './game/store'
import { TitleScreen } from './ui/TitleScreen'
import { CreateCharacterScreen } from './ui/CreateCharacterScreen'
import { ChooseHouseScreen } from './ui/ChooseHouseScreen'
import { WorldScreen } from './ui/WorldScreen'

export function App() {
  const screen = useGame((s) => s.screen)
  switch (screen) {
    case 'title':
      return <TitleScreen />
    case 'create':
      return <CreateCharacterScreen />
    case 'house':
      return <ChooseHouseScreen />
    case 'world':
      return <WorldScreen />
  }
}
