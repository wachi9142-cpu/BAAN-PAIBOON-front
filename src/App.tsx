import { useGame } from './game/store'
import { useAudioSettings } from './game/audio/useSoundscape'
import { TitleScreen } from './ui/TitleScreen'
import { CreateCharacterScreen } from './ui/CreateCharacterScreen'
import { ChooseHouseScreen } from './ui/ChooseHouseScreen'
import { ChoosePetScreen } from './ui/ChoosePetScreen'
import { WorldScreen } from './ui/WorldScreen'

const SCREENS = {
  title: TitleScreen,
  create: CreateCharacterScreen,
  pet: ChoosePetScreen,
  house: ChooseHouseScreen,
  world: WorldScreen,
}

export function App() {
  const screen = useGame((s) => s.screen)
  useAudioSettings()
  const Screen = SCREENS[screen]
  // ห่อแต่ละหน้าด้วย div ที่มี key เพื่อให้ Canvas เก่าถูกถอดออกทั้งก้อนอย่างสะอาด
  return (
    <div key={screen} className="screen">
      <Screen />
    </div>
  )
}
