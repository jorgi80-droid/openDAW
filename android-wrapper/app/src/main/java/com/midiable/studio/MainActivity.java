package com.midiable.studio;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
import android.webkit.ValueCallback;
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
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final String ASSET_ORIGIN = "https://appassets.androidplatform.net";
    private static final int PICK_FILE = 7001;
    private static final int REQUEST_ALL_FILES = 7002;
    private static final int SAVE_FILE = 7003;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> pendingFileCallback;
    private String pendingSaveName;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUi();
        createOpenDawFolders();

        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", path -> {
                String cleanPath = path == null ? "" : path;
                if (cleanPath.contains("..") || cleanPath.startsWith("/")) return null;
                try (InputStream ignored = getAssets().open("studio/" + cleanPath)) {
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
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
                pendingFileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                String[] accept = params.getAcceptTypes();
                String type = "*/*";
                if (accept != null && accept.length > 0 && accept[0] != null && !accept[0].isEmpty()) {
                    type = accept[0];
                }
                intent.setType(type);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                try {
                    startActivityForResult(intent, PICK_FILE);
                    return true;
                } catch (Exception error) {
                    pendingFileCallback = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this, "File picker tidak tersedia", Toast.LENGTH_LONG).show();
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (ASSET_ORIGIN.equals(request.getUrl().getScheme() + "://" + request.getUrl().getHost())) {
                    return assetLoader.shouldInterceptRequest(request.getUrl());
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            String name = safeNameFromDisposition(contentDisposition);
            if (url != null && url.startsWith("blob:")) {
                String escapedUrl = jsQuote(url);
                String escapedName = jsQuote(name);
                webView.evaluateJavascript(
                    "(async()=>{try{const r=await fetch(" + escapedUrl + ");const b=await r.blob();" +
                    "const a=await b.arrayBuffer();const bytes=new Uint8Array(a);let s='';" +
                    "for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,Math.min(i+16384,bytes.length)));" +
                    "OpenDAWNative.saveBase64(" + escapedName + ",btoa(s));}" +
                    "catch(e){OpenDAWNative.notify('Export gagal: '+e)}})()", null);
            } else {
                Toast.makeText(this, "Unduhan eksternal dinonaktifkan pada mode offline", Toast.LENGTH_LONG).show();
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
        requestAllFilesAccessIfNeeded();
    }

    private void createOpenDawFolders() {
        File publicFolder = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
        if (!publicFolder.exists()) publicFolder.mkdirs();
        File privateFolder = new File(getExternalFilesDir(null), "OpenDAW");
        if (!privateFolder.exists()) privateFolder.mkdirs();
    }

    private void requestAllFilesAccessIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            Toast.makeText(this,
                "Agar bisa menulis ke /storage/emulated/0/OpenDAW, izinkan akses Semua file pada layar berikutnya.",
                Toast.LENGTH_LONG).show();
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, REQUEST_ALL_FILES);
            } catch (Exception error) {
                android.util.Log.w("OpenDAW", "All-files settings could not be opened", error);
            }
        }
    }

    private final class OpenDAWBridge {
        @android.webkit.JavascriptInterface public String getOpenDawFolder() {
            return new File(Environment.getExternalStorageDirectory(), "OpenDAW").getAbsolutePath();
        }

        @android.webkit.JavascriptInterface public boolean hasPublicFolderAccess() {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.R || Environment.isExternalStorageManager();
        }

        @android.webkit.JavascriptInterface public void chooseAudio() {
            runOnUiThread(() -> chooseFile("audio/*"));
        }

        @android.webkit.JavascriptInterface public void chooseProject() {
            runOnUiThread(() -> chooseFile("*/*"));
        }

        @android.webkit.JavascriptInterface public String saveText(String name, String content) {
            if (!validName(name) || content == null) return "ERROR: nama/isi file tidak valid";
            return writeBytes(name, content.getBytes(StandardCharsets.UTF_8));
        }

        @android.webkit.JavascriptInterface public String saveBase64(String name, String base64) {
            if (!validName(name) || base64 == null) return "ERROR: nama/isi file tidak valid";
            try {
                return writeBytes(name, android.util.Base64.decode(base64, android.util.Base64.DEFAULT));
            } catch (Exception error) {
                return "ERROR: data ekspor tidak valid: " + error.getMessage();
            }
        }

        @android.webkit.JavascriptInterface public String listAudioFiles() {
            File dir = preferredOpenDawFolder();
            File[] files = dir.listFiles((d, name) -> isAudio(name));
            if (files == null) return "[]";
            StringBuilder json = new StringBuilder("[");
            for (File file : files) {
                if (json.length() > 1) json.append(",");
                json.append("{\"name\":\"").append(jsonEscape(file.getName()))
                    .append("\",\"bytes\":").append(file.length()).append("}");
            }
            return json.append("]").toString();
        }

        @android.webkit.JavascriptInterface public void notify(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
        }
    }

    private void chooseFile(String type) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType(type);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(intent, PICK_FILE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_ALL_FILES) {
            Toast.makeText(this, (Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager())
                ? "Akses folder OpenDAW aktif" : "Akses publik tidak aktif; file tetap bisa disimpan di folder privat aplikasi",
                Toast.LENGTH_LONG).show();
            return;
        }
        if (requestCode != PICK_FILE) return;

        Uri uri = resultCode == RESULT_OK && data != null ? data.getData() : null;
        if (pendingFileCallback != null) {
            ValueCallback<Uri[]> callback = pendingFileCallback;
            pendingFileCallback = null;
            callback.onReceiveValue(uri == null ? null : new Uri[]{uri});
        }
        if (uri == null) return;

        String name = safeName(queryName(uri));
        File destination = new File(preferredOpenDawFolder(), name);
        try (InputStream input = getContentResolver().openInputStream(uri);
             OutputStream output = new FileOutputStream(destination)) {
            if (input == null) throw new IOException("File tidak dapat dibaca");
            byte[] buffer = new byte[65536];
            int n;
            while ((n = input.read(buffer)) != -1) output.write(buffer, 0, n);
            Toast.makeText(this, "Salinan tersimpan: " + destination.getAbsolutePath(), Toast.LENGTH_LONG).show();
        } catch (Exception error) {
            Toast.makeText(this, "File dapat dipilih, tetapi gagal disalin ke folder OpenDAW: " + error.getMessage(),
                Toast.LENGTH_LONG).show();
        }
    }

    private File preferredOpenDawFolder() {
        File publicFolder = new File(Environment.getExternalStorageDirectory(), "OpenDAW");
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || Environment.isExternalStorageManager()) {
            if (!publicFolder.exists()) publicFolder.mkdirs();
            return publicFolder;
        }
        File privateFolder = new File(getExternalFilesDir(null), "OpenDAW");
        if (!privateFolder.exists()) privateFolder.mkdirs();
        return privateFolder;
    }

    private String writeBytes(String name, byte[] bytes) {
        try {
            File dir = preferredOpenDawFolder();
            if (!dir.exists() && !dir.mkdirs()) return "ERROR: folder tidak dapat dibuat";
            File output = new File(dir, safeName(name));
            try (FileOutputStream stream = new FileOutputStream(output)) { stream.write(bytes); }
            return "OK:" + output.getAbsolutePath();
        } catch (Exception error) {
            return "ERROR:" + error.getClass().getSimpleName() + ":" + error.getMessage();
        }
    }

    private static boolean validName(String name) {
        return name != null && !name.isEmpty() && !name.contains("..") &&
            !name.contains("/") && !name.contains("\\");
    }

    private static boolean isAudio(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".flac") ||
            lower.endsWith(".ogg") || lower.endsWith(".m4a") || lower.endsWith(".aiff") || lower.endsWith(".aif");
    }

    private static String queryName(Uri uri) {
        String last = uri.getLastPathSegment();
        return last == null ? "imported-file" : last.replaceAll("^.*:", "");
    }

    private static String safeName(String name) {
        return name.replaceAll("[^a-zA-Z0-9._ -]", "_").replace("..", "_");
    }

    private static String safeNameFromDisposition(String disposition) {
        if (disposition != null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("filename=\\\"?([^\\\";]+)").matcher(disposition);
            if (m.find()) return safeName(m.group(1));
        }
        return "OpenDAW-export.bin";
    }

    private static String jsQuote(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"")
            .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }

    private static String jsonEscape(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"")
            .replace("\n", "\\n").replace("\r", "\\r");
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
        if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
        if (webView != null) { webView.loadUrl("about:blank"); webView.destroy(); }
        super.onDestroy();
    }
}
