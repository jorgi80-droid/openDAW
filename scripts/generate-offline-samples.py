#!/usr/bin/env python3
"""Generate small, original synthetic sample assets for the offline OpenDAW Android build."""
import json
import math
import os
import random
import struct
import sys
import uuid
import wave

SAMPLE_RATE = 44100
SEED = 80224026
NAMESPACE = uuid.UUID("d0d0f4b2-9f35-4c0a-98c8-6e18d79c3e21")


def write_wav(path, samples, sample_rate=SAMPLE_RATE):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        peak = max((abs(value) for value in samples), default=1.0)
        scale = 0.88 / max(peak, 1.0)
        output.writeframes(b"".join(
            struct.pack("<h", max(-32768, min(32767, int(value * scale * 32767))))
            for value in samples
        ))


def kick(seconds=0.52):
    count = int(SAMPLE_RATE * seconds)
    result = []
    phase = 0.0
    for i in range(count):
        t = i / SAMPLE_RATE
        freq = 42.0 + 100.0 * math.exp(-t * 18.0)
        phase += 2.0 * math.pi * freq / SAMPLE_RATE
        env = math.exp(-t * 8.2)
        result.append(math.sin(phase) * env)
    return result


def noise_hit(seconds, brightness, decay, seed):
    rng = random.Random(seed)
    count = int(SAMPLE_RATE * seconds)
    result = []
    previous = 0.0
    for i in range(count):
        t = i / SAMPLE_RATE
        raw = rng.uniform(-1.0, 1.0)
        high = raw - previous * (1.0 - brightness)
        previous = raw
        result.append(high * math.exp(-t * decay))
    return result


def snare():
    noise = noise_hit(0.29, 0.72, 17.0, SEED + 2)
    for i in range(len(noise)):
        t = i / SAMPLE_RATE
        noise[i] += 0.24 * math.sin(2.0 * math.pi * (185.0 - 45.0 * t) * t) * math.exp(-t * 23.0)
    return noise


def bass_loop():
    bpm = 120
    seconds = 8.0 * 60.0 / bpm
    count = int(SAMPLE_RATE * seconds)
    notes = [55.0, 55.0, 73.416, 82.407, 55.0, 55.0, 65.406, 73.416]
    beat = 60.0 / bpm
    result = []
    for i in range(count):
        t = i / SAMPLE_RATE
        step = min(int(t / beat), len(notes) - 1)
        local = (t - step * beat) / beat
        freq = notes[step]
        env = min(1.0, local * 25.0) * math.exp(-local * 1.8)
        value = (math.sin(2 * math.pi * freq * t)
                 + 0.25 * math.sin(2 * math.pi * freq * 2.0 * t)
                 + 0.08 * math.sin(2 * math.pi * freq * 3.0 * t))
        result.append(value * env)
    return result


def pad_chord():
    seconds = 4.0
    count = int(SAMPLE_RATE * seconds)
    frequencies = [130.813, 164.814, 196.0, 261.626]  # C major chord
    result = []
    for i in range(count):
        t = i / SAMPLE_RATE
        attack = min(1.0, t / 0.65)
        release = min(1.0, (seconds - t) / 0.6)
        env = max(0.0, min(attack, release))
        value = sum(math.sin(2.0 * math.pi * f * t + j * 0.11) for j, f in enumerate(frequencies))
        value += 0.22 * sum(math.sin(2.0 * math.pi * (f * 2.0) * t) for f in frequencies)
        result.append(value * env)
    return result


def metadata(file_name, display_name, bpm, audio):
    duration = len(audio) / SAMPLE_RATE
    return {
        "uuid": str(uuid.uuid5(NAMESPACE, file_name)),
        "name": display_name,
        "bpm": bpm,
        "duration": round(duration, 6),
        "sample_rate": SAMPLE_RATE,
        "origin": "openDAW",
        "file": file_name,
    }


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "packages/app/studio/public/offline-samples"
    os.makedirs(out_dir, exist_ok=True)
    definitions = [
        ("kick.wav", "Offline Kick", 120, kick()),
        ("snare.wav", "Offline Snare", 120, snare()),
        ("hihat.wav", "Offline Hi-Hat", 120, noise_hit(0.16, 0.92, 32.0, SEED + 3)),
        ("bass-loop.wav", "Offline Bass Loop", 120, bass_loop()),
        ("pad-chord.wav", "Offline Pad Chord", 120, pad_chord()),
    ]
    entries = []
    for file_name, display_name, bpm, audio in definitions:
        write_wav(os.path.join(out_dir, file_name), audio)
        entries.append(metadata(file_name, display_name, bpm, audio))
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as catalog:
        json.dump({"version": 1, "samples": entries}, catalog, ensure_ascii=False, indent=2)
        catalog.write("\n")
    print(f"Generated {len(entries)} offline samples in {out_dir}")


if __name__ == "__main__":
    main()
