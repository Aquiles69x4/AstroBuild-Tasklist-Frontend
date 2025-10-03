export const playConfettiSound = () => {
  try {
    const audio = new Audio('/sounds/confetti.mp3')
    audio.volume = 0.6 // Ajusta el volumen (0.0 a 1.0)

    // Intentar reproducir el audio
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🎵 Confetti sound playing!')
        })
        .catch(error => {
          console.warn('Audio playback blocked by browser:', error)
          console.log('User interaction may be required for audio')
        })
    }
  } catch (error) {
    console.error('Error creating audio:', error)
  }
}
