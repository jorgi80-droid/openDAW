package com.midiable.studio;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import androidx.webkit.Profile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final String ASSET_ORIGIN = "https://appassets.androidplatform.net";
    private WebView webView;
    private WebViewAssetLoader assetLoader;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUi();

        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", path -> {
                String cleanPath = path == null ? "" : path;
                if (cleanPath.contains("..") || cleanPath.startsWith("/")) return null;
                try {
                    InputStream stream = getAssets().open("studio/" + cleanPath);
                    Map<String, String> headers = isolationHeaders();
                    return new WebResourceResponse(
                        mimeType(cleanPath), "UTF-8", 200, "OK", headers, stream);
                } catch (IOException error) {
                    return null;
                }
            })
            .build();

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF171A1D);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (ASSET_ORIGIN.equals(request.getUrl().getScheme() + "://" + request.getUrl().getHost())) {
                    return assetLoader.shouldInterceptRequest(request.getUrl());
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
        setContentView(webView);

        // Android WebView does not enable SharedArrayBuffer merely from COOP/COEP.
        // Newer WebView providers support a narrowly-scoped allowlist for this app's trusted local origin.
        boolean isolationAllowed = false;
        String featureState;
        if (WebViewFeature.isFeatureSupported(WebViewFeature.CROSS_ORIGIN_ISOLATED_ALLOWLIST)) {
            try {
                Profile profile = WebViewCompat.getProfile(webView);
                profile.setCrossOriginIsolatedAllowlist(
                    Collections.singleton(ASSET_ORIGIN));
                isolationAllowed = true;
                featureState = "Cross-origin isolation allowlist enabled";
            } catch (RuntimeException error) {
                featureState = "Allowlist API failed: " + error.getClass().getSimpleName()
                    + ": " + String.valueOf(error.getMessage());
            }
        } else {
            featureState = "This Android System WebView version does not support "
                + "CROSS_ORIGIN_ISOLATED_ALLOWLIST. Update Android System WebView/Chrome and retry.";
        }

        android.util.Log.i("MidiAble", featureState);
        webView.loadUrl(ASSET_ORIGIN + "/index.html");
    }

    private static Map<String, String> isolationHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Document-Isolation-Policy", "isolate-and-require-corp");
        headers.put("Cross-Origin-Opener-Policy", "same-origin");
        headers.put("Cross-Origin-Embedder-Policy", "require-corp");
        headers.put("Cross-Origin-Resource-Policy", "same-origin");
        headers.put("Cache-Control", "no-store");
        return headers;
    }

    private static String mimeType(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
        }
        super.onDestroy();
    }
}
