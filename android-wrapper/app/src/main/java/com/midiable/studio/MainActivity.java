package com.midiable.studio;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private WebView webView;
    private LocalStudioServer localServer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUi();

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF171A1D);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);

        localServer = new LocalStudioServer();
        try {
            localServer.start();
            webView.loadUrl(localServer.getBaseUrl() + "index.html");
        } catch (IOException error) {
            webView.loadDataWithBaseURL(null,
                "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
                "<body style='background:#171a1d;color:#fff;font:16px system-ui;padding:24px'>" +
                "<h2>MidiAble tidak dapat memulai server lokal</h2><pre>" +
                escapeHtml(error.toString()) + "</pre></body>",
                "text/html", "UTF-8", null);
        }
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
        }
        if (localServer != null) {
            localServer.stop();
        }
        super.onDestroy();
    }

    /**
     * A small HTTP server bound ONLY to 127.0.0.1. Unlike an intercepted WebView
     * asset response, raw loopback HTTP responses let Chromium process COOP/COEP
     * headers for crossOriginIsolated, needed by openDAW's WASM/AudioWorklet engine.
     */
    private final class LocalStudioServer {
        private ServerSocket serverSocket;
        private ExecutorService workers;
        private Thread acceptThread;
        private volatile boolean running;

        void start() throws IOException {
            serverSocket = new ServerSocket(0, 32, InetAddress.getByName("127.0.0.1"));
            serverSocket.setReuseAddress(true);
            workers = Executors.newCachedThreadPool();
            running = true;
            acceptThread = new Thread(() -> {
                while (running) {
                    try {
                        Socket client = serverSocket.accept();
                        workers.execute(() -> serve(client));
                    } catch (IOException error) {
                        if (running) android.util.Log.e("MidiAble", "Local server accept failed", error);
                    }
                }
            }, "MidiAble-HTTP-Accept");
            acceptThread.setDaemon(true);
            acceptThread.start();
        }

        String getBaseUrl() {
            return "http://127.0.0.1:" + serverSocket.getLocalPort() + "/";
        }

        void stop() {
            running = false;
            try {
                if (serverSocket != null) serverSocket.close();
            } catch (IOException ignored) {}
            if (workers != null) workers.shutdownNow();
            if (acceptThread != null) acceptThread.interrupt();
        }

        private void serve(Socket client) {
            try (Socket socket = client;
                 BufferedInputStream input = new BufferedInputStream(socket.getInputStream());
                 BufferedOutputStream output = new BufferedOutputStream(socket.getOutputStream())) {
                socket.setSoTimeout(10000);
                String requestLine = readLine(input);
                if (requestLine == null || requestLine.isEmpty()) return;
                String[] pieces = requestLine.split(" ");
                if (pieces.length < 2) {
                    sendText(output, 400, "Bad Request", "Invalid HTTP request");
                    return;
                }

                String method = pieces[0];
                if (!"GET".equals(method) && !"HEAD".equals(method)) {
                    sendText(output, 405, "Method Not Allowed", "Only GET and HEAD are supported");
                    return;
                }

                String rawPath = pieces[1].split("\\?", 2)[0];
                String path;
                try {
                    path = URLDecoder.decode(rawPath, "UTF-8");
                } catch (Exception error) {
                    sendText(output, 400, "Bad Request", "Invalid URL path");
                    return;
                }
                while (path.startsWith("/")) path = path.substring(1);
                if (path.isEmpty()) path = "index.html";
                if (path.contains("..") || path.contains("\\") || path.indexOf('\0') >= 0) {
                    sendText(output, 400, "Bad Request", "Blocked path");
                    return;
                }

                // Drain request headers before responding.
                String line;
                while ((line = readLine(input)) != null && !line.isEmpty()) {}

                String assetPath = "studio/" + path;
                try (InputStream asset = getAssets().open(assetPath)) {
                    byte[] bytes = readAll(asset);
                    sendBytes(output, 200, "OK", mimeType(path), bytes, !"HEAD".equals(method));
                } catch (IOException error) {
                    sendText(output, 404, "Not Found", "MidiAble asset not found: " + path);
                }
            } catch (IOException error) {
                android.util.Log.d("MidiAble", "HTTP request closed", error);
            }
        }

        private String readLine(InputStream input) throws IOException {
            ByteArrayOutputStream line = new ByteArrayOutputStream();
            int value;
            while ((value = input.read()) != -1) {
                if (value == '\n') break;
                if (value != '\r') line.write(value);
                if (line.size() > 16384) throw new IOException("HTTP header line too long");
            }
            if (value == -1 && line.size() == 0) return null;
            return line.toString("UTF-8");
        }

        private byte[] readAll(InputStream stream) throws IOException {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[32768];
            int count;
            while ((count = stream.read(chunk)) != -1) buffer.write(chunk, 0, count);
            return buffer.toByteArray();
        }

        private void sendText(BufferedOutputStream output, int status, String reason, String text) throws IOException {
            sendBytes(output, status, reason, "text/plain; charset=utf-8",
                text.getBytes(StandardCharsets.UTF_8), true);
        }

        private void sendBytes(BufferedOutputStream output, int status, String reason,
                               String contentType, byte[] body, boolean includeBody) throws IOException {
            String headers = "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: " + contentType + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Connection: close\r\n"
                + "Cache-Control: no-store\r\n"
                + "Cross-Origin-Opener-Policy: same-origin\r\n"
                + "Cross-Origin-Embedder-Policy: require-corp\r\n"
                + "Cross-Origin-Resource-Policy: same-origin\r\n"
                + "X-Content-Type-Options: nosniff\r\n"
                + "\r\n";
            output.write(headers.getBytes(StandardCharsets.US_ASCII));
            if (includeBody) output.write(body);
            output.flush();
        }

        private String mimeType(String path) {
            String lower = path.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".html")) return "text/html; charset=utf-8";
            if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=utf-8";
            if (lower.endsWith(".css")) return "text/css; charset=utf-8";
            if (lower.endsWith(".wasm")) return "application/wasm";
            if (lower.endsWith(".json") || lower.endsWith(".map")) return "application/json; charset=utf-8";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".webp")) return "image/webp";
            if (lower.endsWith(".woff2")) return "font/woff2";
            if (lower.endsWith(".woff")) return "font/woff";
            if (lower.endsWith(".ttf")) return "font/ttf";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".mp3")) return "audio/mpeg";
            if (lower.endsWith(".wav")) return "audio/wav";
            return "application/octet-stream";
        }
    }
}
