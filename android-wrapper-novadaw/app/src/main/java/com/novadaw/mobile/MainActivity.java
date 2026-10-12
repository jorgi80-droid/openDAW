package com.novadaw.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.content.pm.ActivityInfo;
import android.media.AudioManager;

public final class MainActivity extends Activity {
    static { System.loadLibrary("studiowave_audio"); }
    private WebView webView;
    private final NativeAudioBridge audioBridge = new NativeAudioBridge();

    private final class NativeAudioBridge {
        @JavascriptInterface public boolean start() { return nativeStartAudio(); }
        @JavascriptInterface public void stop() { nativeStopAudio(); }
        @JavascriptInterface public void noteOn(double frequency, float velocity) {
            if (frequency >= 20.0 && frequency <= 20000.0) nativeNoteOn(frequency, Math.max(0f, Math.min(1f, velocity)));
        }
        @JavascriptInterface public void allNotesOff() { nativeAllNotesOff(); }
        @JavascriptInterface public String engine() { return "Android Oboe 1.11 / low-latency callback"; }
    }

    private native boolean nativeStartAudio();
    private native void nativeStopAudio();
    private native void nativeNoteOn(double frequency, float velocity);
    private native void nativeAllNotesOff();

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        getWindow().setStatusBarColor(Color.rgb(9, 13, 18));
        getWindow().setNavigationBarColor(Color.rgb(9, 13, 18));
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS,
                WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        applyImmersiveMode();
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(9, 13, 18));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(audioBridge, "StudioWaveAudio");
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);
        webView.loadUrl("file:///android_asset/novadaw/index.html");
    }

    private void applyImmersiveMode() {
        final View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveMode();
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onPause() {
        if (webView != null) webView.evaluateJavascript("window.StudioWaveAudioBridge&&window.StudioWaveAudioBridge.stop()", null);
        nativeStopAudio();
        super.onPause();
    }
    @Override protected void onDestroy() {
        nativeStopAudio();
        if (webView != null) { webView.loadUrl("about:blank"); webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
