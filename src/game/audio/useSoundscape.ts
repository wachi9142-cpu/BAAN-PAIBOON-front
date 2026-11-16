import { useEffect } from 'react'
import { SOUND_PERIODS, periodAt } from '../content/soundscape'
import { useSettings } from '../settings'
import { useGame } from '../store'
import { audio } from './engine'

/** ส่งค่าระดับเสียงจากการตั้งค่าเข้าระบบเสียง (ใช้ครั้งเดียวที่ App) */
export function useAudioSettings() {
  const musicOn = useSettings((s) => s.musicOn)
  const music = useSettings((s) => s.musicVolume)
  const ambience = useSettings((s) => s.ambienceVolume)
  const sfx = useSettings((s) => s.sfxVolume)
  useEffect(() => {
    audio.setVolumes({ musicOn, music, ambience, sfx })
  }, [musicOn, music, ambience, sfx])
}

/** เสียงในหมู่บ้านตามช่วงเวลาในเกม */
export function useVillageSoundscape() {
  const minute = useGame((s) => s.save?.minuteOfDay ?? 6 * 60)
  const preview = useSettings((s) => s.soundPreview)
  const period = preview === 'auto' ? periodAt(minute) : SOUND_PERIODS.find((p) => p.id === preview)!
  useEffect(() => {
    audio.setScene(period.loops, period.oneShots)
  }, [period])
  useEffect(() => () => audio.stopAll(), [])
  return period
}

/** หน้าแรก: เสียงนกยามเช้าเบา ๆ (ไม่มีไก่ขัน) */
export function useTitleSoundscape() {
  useEffect(() => {
    const morning = SOUND_PERIODS.find((p) => p.id === 'morning')!
    audio.setScene(morning.loops, [])
    return () => audio.stopAll()
  }, [])
}
