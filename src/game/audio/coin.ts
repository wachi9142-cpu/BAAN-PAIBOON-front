import { audio } from './engine'

/** เสียงเงินเข้ากระเป๋า (ไฟล์ sfx-coin.mp3 ถ้ามี ไม่งั้นสังเคราะห์เสียง "กริ๊ง กริ๊ง") */
export function playCoinSound() {
  void audio.playCoin()
}
