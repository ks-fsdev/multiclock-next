// Audio elements are created on first use: `new Audio()` doesn't exist during server rendering.

let checkpoint: HTMLAudioElement | null = null;
let final: HTMLAudioElement | null = null;

function sounds() {
  if (!checkpoint) {
    checkpoint = new Audio("/checkpoint.wav");
    checkpoint.loop = true;
  }
  if (!final) {
    final = new Audio("/timer.wav");
    final.loop = true;
  }
  return { checkpoint, final };
}

export function stopAlarms() {
  if (!checkpoint && !final) return;
  for (const a of Object.values(sounds())) {
    a.pause();
    a.currentTime = 0;
  }
}

export function playAlarm(kind: "checkpoint" | "final") {
  stopAlarms();
  sounds()
    [kind].play()
    .catch((err) => console.error("Playback blocked:", err));
}
