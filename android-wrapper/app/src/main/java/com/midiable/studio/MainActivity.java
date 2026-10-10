package com.midiable.studio;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.Profile;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final String ASSET_ORIGIN = "https://appassets.androidplatform.net";
    private static final int PICK_AUDIO = 7001;
    private static final int PICK_PROJECT = 7002;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private File appFolder;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUi();
        appFolder = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
        // App-private copy remains accessible even if scoped-storage prevents public folder access.
        File internalFolder = new File(getExternalFilesDir(null), "OpenDAW");
        if (!appFolder.exists()) appFolder.mkdirs();
        if (!internalFolder.exists()) internalFolder.mkdirs();

        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", path -> {
                String cleanPath = path == null ? "" : path;
                if (cleanPath.contains("..") || cleanPath.startsWith("/")) return null;
                try {
                    InputStream stream = getAssets().open("studio/" + cleanPath);
                    return new WebResourceResponse(mimeType(cleanPath), "UTF-8", 200, "OK",
                        isolationHeaders(), stream);
                } catch (IOException error) {
                    return null;
                }
            }).build();

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF171A1D);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.addJavascriptInterface(new OpenDAWBridge(), "OpenDAWNative");
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

        if (WebViewFeature.isFeatureSupported(WebViewFeature.CROSS_ORIGIN_ISOLATED_ALLOWLIST)) {
            try {
                Profile profile = WebViewCompat.getProfile(webView);
                profile.setCrossOriginIsolatedAllowlist(Collections.singleton(ASSET_ORIGIN));
            } catch (RuntimeException error) {
                android.util.Log.e("OpenDAW", "Could not set isolation allowlist", error);
            }
        } else {
            android.util.Log.w("OpenDAW", "WebView missing cross-origin isolated allowlist feature");
        }
        webView.loadUrl(ASSET_ORIGIN + "/index.html");
    }

    private final class OpenDAWBridge {
        @JavascriptInterface public void pickAudio() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("audio/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(intent, PICK_AUDIO);
            });
        }

        @JavascriptInterface public void pickProject() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(intent, PICK_PROJECT);
            });
        }

        @JavascriptInterface public String getOpenDawFolder() {
            File folder = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
            return folder.getAbsolutePath();
        }

        @JavascriptInterface public String saveText(String name, String content) {
            if (name == null || content == null || name.contains("..") || name.contains("/") || name.contains("\\")) return "ERROR: invalid file name";
            try {
                File dir = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
                if (!dir.exists() && !dir.mkdirs()) {
                    dir = new File(getExternalFilesDir(null), "OpenDAW");
                    if (!dir.exists() && !dir.mkdirs()) return "ERROR: unable to create OpenDAW folder";
                }
                File output = new File(dir, name);
                try (FileOutputStream stream = new FileOutputStream(output)) {
                    stream.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                return "OK:" + output.getAbsolutePath();
            } catch (Exception error) {
                return "ERROR:" + error.getClass().getSimpleName() + ":" + error.getMessage();
            }
        }

        @JavascriptInterface public String listAudioFiles() {
            File dir = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
            File[] files = dir.listFiles((d, name) -> {
                String lower = name.toLowerCase(Locale.ROOT);
                return lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".flac")
                    || lower.endsWith(".ogg") || lower.endsWith(".m4a") || lower.endsWith(".aiff");
            });
            if (files == null) return "[]";
            StringBuilder json = new StringBuilder("[");
            for (File file : files) {
                if (json.length() > 1) json.append(",");
                json.append("{\"name\":\"").append(file.getName().replace("\\","\\\\").replace("\"","\\\"")).append("\"}");
            }
            return json.append("]").toString();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null || webView == null) return;
        Uri uri = data.getData();
        String name = queryName(uri);
        File internalFolder = new File(getExternalFilesDir(null), "OpenDAW");
        if (!internalFolder.exists()) internalFolder.mkdirs();
        File copied = new File(internalFolder, safeName(name));
        try (InputStream input = getContentResolver().openInputStream(uri);
             OutputStream output = new FileOutputStream(copied)) {
            if (input == null) throw new IOException("Cannot open selected file");
            byte[] buffer = new byte[65536];
            int n;
            while ((n = input.read(buffer)) >= 0) output.write(buffer, 0, n);
            String json = "{\"name\":\"" + safeName(name).replace("\"","\\\"")
                + "\",\"path\":\"" + copied.getAbsolutePath().replace("\\","\\\\") + "\"}";
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('opendaw-file-selected',{detail:" + json + "}))", null);
            Toast.makeText(this, "File tersedia di OpenDAW: " + safeName(name), Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Toast.makeText(this, "Gagal memuat file: " + error.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private String queryName(Uri uri) {
        String last = uri.getLastPathSegment();
        return last == null ? "imported-file" : last.replaceAll("^.*:", "");
    }

    private String safeName(String name) {
        return name.replaceAll("[^a-zA-Z0-9._ -]", "_").replace("..", "_");
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
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
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
        if (webView != null) { webView.loadUrl("about:blank"); webView.destroy(); }
        super.onDestroy();
    }
}
