#include <jni.h>
#include <android/log.h>
#include <oboe/Oboe.h>
#include <array>
#include <atomic>
#include <cmath>
#include <memory>
#include <mutex>
#include <algorithm>

namespace {
constexpr float kPi = 3.14159265358979323846f;
constexpr int kVoices = 16;
struct Voice {
    std::atomic<float> frequency{0.0f};
    std::atomic<float> velocity{0.0f};
    std::atomic<float> phase{0.0f};
    std::atomic<float> envelope{0.0f};
};
class StudioWaveAudio final : public oboe::AudioStreamDataCallback, public oboe::AudioStreamErrorCallback {
public:
    oboe::Result open() {
        oboe::AudioStreamBuilder builder;
        builder.setDirection(oboe::Direction::Output)
            ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
            ->setSharingMode(oboe::SharingMode::Shared)
            ->setFormat(oboe::AudioFormat::Float)
            ->setChannelCount(oboe::ChannelCount::Stereo)
            ->setDataCallback(this)
            ->setErrorCallback(this);
        auto result = builder.openStream(stream_);
        if (result != oboe::Result::OK) return result;
        stream_->setBufferSizeInFrames(std::max(stream_->getFramesPerBurst(), stream_->getBufferSizeInFrames()));
        return stream_->requestStart();
    }
    void close() {
        std::lock_guard<std::mutex> lock(streamMutex_);
        if (stream_) {
            stream_->requestStop();
            stream_->close();
            stream_.reset();
        }
    }
    void noteOn(float frequency, float velocity) {
        if (!(frequency >= 20.0f && frequency <= 20000.0f)) return;
        Voice* selected = nullptr;
        for (auto& voice : voices_) {
            if (voice.velocity.load(std::memory_order_relaxed) <= 0.0001f) { selected = &voice; break; }
        }
        if (!selected) selected = &voices_[0];
        selected->phase.store(0.0f, std::memory_order_relaxed);
        selected->envelope.store(0.0f, std::memory_order_relaxed);
        selected->frequency.store(frequency, std::memory_order_relaxed);
        selected->velocity.store(std::clamp(velocity, 0.0f, 1.0f), std::memory_order_relaxed);
    }
    void allNotesOff() {
        for (auto& voice : voices_) voice.velocity.store(0.0f, std::memory_order_relaxed);
    }
    oboe::DataCallbackResult onAudioReady(oboe::AudioStream* stream, void* audioData, int32_t frames) override {
        auto* out = static_cast<float*>(audioData);
        const float sampleRate = static_cast<float>(stream->getSampleRate());
        for (int32_t i = 0; i < frames; ++i) {
            float sample = 0.0f;
            for (auto& voice : voices_) {
                float velocity = voice.velocity.load(std::memory_order_relaxed);
                if (velocity <= 0.0001f) continue;
                float freq = voice.frequency.load(std::memory_order_relaxed);
                float phase = voice.phase.load(std::memory_order_relaxed);
                float env = voice.envelope.load(std::memory_order_relaxed);
                env = std::min(1.0f, env + 1.0f / (sampleRate * 0.008f));
                phase += (2.0f * kPi * freq) / sampleRate;
                if (phase >= 2.0f * kPi) phase -= 2.0f * kPi;
                voice.phase.store(phase, std::memory_order_relaxed);
                voice.envelope.store(env, std::memory_order_relaxed);
                sample += std::sin(phase) * velocity * env;
            }
            sample = std::clamp(sample * 0.14f, -0.9f, 0.9f);
            out[i * 2] = sample;
            out[i * 2 + 1] = sample;
        }
        return oboe::DataCallbackResult::Continue;
    }
    void onErrorAfterClose(oboe::AudioStream*, oboe::Result error) override {
        __android_log_print(ANDROID_LOG_WARN, "StudioWaveOboe", "Audio stream closed: %d", static_cast<int>(error));
    }
    void onErrorBeforeClose(oboe::AudioStream*, oboe::Result error) override {
        __android_log_print(ANDROID_LOG_WARN, "StudioWaveOboe", "Audio stream error: %d", static_cast<int>(error));
    }
private:
    oboe::ManagedStream stream_;
    std::mutex streamMutex_;
    std::array<Voice, kVoices> voices_{};
};
std::mutex gMutex;
std::unique_ptr<StudioWaveAudio> gAudio;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_novadaw_mobile_MainActivity_nativeStartAudio(JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gMutex);
    if (gAudio) return JNI_TRUE;
    auto audio = std::make_unique<StudioWaveAudio>();
    const oboe::Result result = audio->open();
    if (result != oboe::Result::OK) {
        __android_log_print(ANDROID_LOG_ERROR, "StudioWaveOboe", "Failed opening Oboe stream: %d", static_cast<int>(result));
        return JNI_FALSE;
    }
    gAudio = std::move(audio);
    return JNI_TRUE;
}
extern "C" JNIEXPORT void JNICALL
Java_com_novadaw_mobile_MainActivity_nativeStopAudio(JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gMutex);
    if (gAudio) { gAudio->allNotesOff(); gAudio->close(); gAudio.reset(); }
}
extern "C" JNIEXPORT void JNICALL
Java_com_novadaw_mobile_MainActivity_nativeNoteOn(JNIEnv*, jobject, jdouble frequency, jfloat velocity) {
    std::lock_guard<std::mutex> lock(gMutex);
    if (gAudio) gAudio->noteOn(static_cast<float>(frequency), velocity);
}
extern "C" JNIEXPORT void JNICALL
Java_com_novadaw_mobile_MainActivity_nativeAllNotesOff(JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gMutex);
    if (gAudio) gAudio->allNotesOff();
}
