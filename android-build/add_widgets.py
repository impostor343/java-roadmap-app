#!/usr/bin/env python3
"""Adds the home-screen widgets and the WidgetBridge plugin to the generated Capacitor Android project.
Run from the repo root AFTER `npx cap add android` (the GitHub workflow does this). Uses only the Python standard library.
Safe to run twice. Stops with a clear message if the Android project is not what it expects."""
import json, os, re, sys

root = os.getcwd()
cfg = json.load(open('capacitor.config.json'))
PKG = cfg['appId']
app = os.path.join('android', 'app', 'src', 'main')
java_dir = os.path.join(app, 'java', *PKG.split('.'))
res = os.path.join(app, 'res')
if not os.path.isdir(java_dir):
    sys.exit('add_widgets: Android project not found at ' + java_dir)

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('wrote', path)

JAVA = {}

JAVA['MainActivity.java'] = '''package PKG;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static String pendingRoute = "";

    public static synchronized String takeRoute() {
        String r = pendingRoute;
        pendingRoute = "";
        return r;
    }

    private static synchronized void remember(Intent intent) {
        if (intent != null && intent.hasExtra("route")) {
            String r = intent.getStringExtra("route");
            pendingRoute = (r == null) ? "" : r;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
        if (savedInstanceState == null) {
            remember(getIntent());
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        remember(intent);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('cse-native-route'))", null);
        }
    }
}
'''

JAVA['WidgetBridgePlugin.java'] = '''package PKG;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    private static int intOf(PluginCall call, String key) {
        Integer v = call.getInt(key, 0);
        return v == null ? 0 : v;
    }

    private static String textOf(PluginCall call, String key) {
        String v = call.getString(key, "");
        return v == null ? "" : v;
    }

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor e = ctx.getSharedPreferences(WidgetRenderer.PREFS, Context.MODE_PRIVATE).edit();
        e.putBoolean("synced", true);
        e.putInt("total", intOf(call, "total"));
        e.putInt("done", intOf(call, "done"));
        e.putInt("skipped", intOf(call, "skipped"));
        e.putInt("nextDay", intOf(call, "nextDay"));
        e.putString("title", textOf(call, "title"));
        e.putString("module", textOf(call, "module"));
        e.putString("time", textOf(call, "time"));
        e.putString("status", textOf(call, "status"));
        e.apply();
        WidgetRenderer.updateAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void getLaunchRoute(PluginCall call) {
        JSObject r = new JSObject();
        r.put("route", MainActivity.takeRoute());
        call.resolve(r);
    }
}
'''

JAVA['WidgetRenderer.java'] = '''package PKG;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Locale;

public final class WidgetRenderer {
    static final String PREFS = "cse_widget";

    private WidgetRenderer() {
    }

    public static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] nextIds = mgr.getAppWidgetIds(new ComponentName(ctx, NextSessionWidget.class));
        for (int id : nextIds) {
            mgr.updateAppWidget(id, buildNext(ctx));
        }
        int[] progIds = mgr.getAppWidgetIds(new ComponentName(ctx, ProgressWidget.class));
        for (int id : progIds) {
            mgr.updateAppWidget(id, buildProgress(ctx));
        }
    }

    private static PendingIntent open(Context ctx, String route, int code) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("route", route);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static String n(int v) {
        return String.format(Locale.US, "%,d", v);
    }

    public static RemoteViews buildNext(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_next);
        boolean synced = sp.getBoolean("synced", false);
        int total = sp.getInt("total", 0);
        int day = sp.getInt("nextDay", 0);
        String route = "#today";
        if (!synced) {
            rv.setTextViewText(R.id.widget_label, "NEXT SESSION");
            rv.setTextViewText(R.id.widget_day, "Open the app once");
            rv.setTextViewText(R.id.widget_title, "Your next session appears here after the app has opened.");
            rv.setTextViewText(R.id.widget_meta, "");
        } else if (day <= 0) {
            rv.setTextViewText(R.id.widget_label, "NEXT SESSION");
            rv.setTextViewText(R.id.widget_day, "Nothing pending");
            rv.setTextViewText(R.id.widget_title, "Every session is completed or skipped.");
            rv.setTextViewText(R.id.widget_meta, "");
        } else {
            rv.setTextViewText(R.id.widget_label, "NEXT SESSION");
            rv.setTextViewText(R.id.widget_day, "Day " + n(day) + " / " + n(total));
            rv.setTextViewText(R.id.widget_title, sp.getString("title", ""));
            String module = sp.getString("module", "");
            String time = sp.getString("time", "");
            String meta = module;
            if (time != null && !time.isEmpty()) {
                meta = (module == null || module.isEmpty()) ? time : module + "  \\u00b7  " + time;
            }
            rv.setTextViewText(R.id.widget_meta, meta);
            route = "#today/" + day;
        }
        rv.setOnClickPendingIntent(R.id.widget_root, open(ctx, route, 1));
        return rv;
    }

    public static RemoteViews buildProgress(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_progress);
        boolean synced = sp.getBoolean("synced", false);
        int total = sp.getInt("total", 0);
        int done = sp.getInt("done", 0);
        int skipped = sp.getInt("skipped", 0);
        rv.setTextViewText(R.id.widget_label, "CURRICULUM PROGRESS");
        if (!synced || total <= 0) {
            rv.setTextViewText(R.id.widget_big, "Open the app once");
            rv.setTextViewText(R.id.widget_sub, "Progress appears here after the app has opened.");
            rv.setProgressBar(R.id.widget_bar, 100, 0, false);
        } else {
            int pct = (int) Math.floor(done * 100.0 / total);
            rv.setTextViewText(R.id.widget_big, n(done) + " / " + n(total));
            String sub = n(total - done) + " remaining  \\u00b7  " + pct + "% complete";
            if (skipped > 0) {
                sub = sub + "  \\u00b7  " + skipped + " skipped";
            }
            rv.setTextViewText(R.id.widget_sub, sub);
            rv.setProgressBar(R.id.widget_bar, 100, pct, false);
        }
        rv.setOnClickPendingIntent(R.id.widget_root, open(ctx, "#progress", 2));
        return rv;
    }
}
'''

JAVA['NextSessionWidget.java'] = '''package PKG;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

public class NextSessionWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            appWidgetManager.updateAppWidget(id, WidgetRenderer.buildNext(context));
        }
    }
}
'''

JAVA['ProgressWidget.java'] = '''package PKG;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

public class ProgressWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            appWidgetManager.updateAppWidget(id, WidgetRenderer.buildProgress(context));
        }
    }
}
'''

TV = 'android:layout_width="match_parent" android:layout_height="wrap_content"'
LAYOUT_NEXT = '''<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:orientation="vertical"
    android:padding="14dp">

    <TextView
        android:id="@+id/widget_label"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:maxLines="1"
        android:text="NEXT SESSION"
        android:textColor="@color/widget_accent"
        android:textSize="11sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_day"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="2dp"
        android:maxLines="1"
        android:textColor="@color/widget_ink"
        android:textSize="20sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:ellipsize="end"
        android:maxLines="3"
        android:textColor="@color/widget_ink"
        android:textSize="14sp" />

    <TextView
        android:id="@+id/widget_meta"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="6dp"
        android:ellipsize="end"
        android:maxLines="2"
        android:textColor="@color/widget_muted"
        android:textSize="12sp" />
</LinearLayout>
'''

LAYOUT_PROGRESS = '''<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:gravity="center_vertical"
    android:orientation="vertical"
    android:padding="14dp">

    <TextView
        android:id="@+id/widget_label"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:maxLines="1"
        android:text="CURRICULUM PROGRESS"
        android:textColor="@color/widget_accent"
        android:textSize="11sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_big"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="2dp"
        android:maxLines="1"
        android:textColor="@color/widget_ink"
        android:textSize="22sp"
        android:textStyle="bold" />

    <ProgressBar
        android:id="@+id/widget_bar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="8dp"
        android:layout_marginTop="8dp"
        android:max="100"
        android:progress="0"
        android:progressBackgroundTint="@color/widget_track"
        android:progressTint="@color/widget_accent" />

    <TextView
        android:id="@+id/widget_sub"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:ellipsize="end"
        android:maxLines="2"
        android:textColor="@color/widget_muted"
        android:textSize="12sp" />
</LinearLayout>
'''

def provider(layout, w, h):
    return '''<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/%s"
    android:minWidth="%ddp"
    android:minHeight="%ddp"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="1800000"
    android:widgetCategory="home_screen" />
''' % (layout, w, h)

BG = '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/widget_bg" />
    <corners android:radius="20dp" />
</shape>
'''

def colors(bg, ink, muted, accent, track):
    return '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="widget_bg">%s</color>
    <color name="widget_ink">%s</color>
    <color name="widget_muted">%s</color>
    <color name="widget_accent">%s</color>
    <color name="widget_track">%s</color>
</resources>
''' % (bg, ink, muted, accent, track)

RECEIVERS = '''
        <receiver android:name="PKG.NextSessionWidget" android:exported="true" android:label="CSE next session">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_next_info" />
        </receiver>
        <receiver android:name="PKG.ProgressWidget" android:exported="true" android:label="CSE progress">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_progress_info" />
        </receiver>
'''

for name, src in JAVA.items():
    write(os.path.join(java_dir, name), src.replace('PKG', PKG))
write(os.path.join(res, 'layout', 'widget_next.xml'), LAYOUT_NEXT)
write(os.path.join(res, 'layout', 'widget_progress.xml'), LAYOUT_PROGRESS)
write(os.path.join(res, 'xml', 'widget_next_info.xml'), provider('widget_next', 250, 110))
write(os.path.join(res, 'xml', 'widget_progress_info.xml'), provider('widget_progress', 250, 110))
write(os.path.join(res, 'drawable', 'widget_bg.xml'), BG)
write(os.path.join(res, 'values', 'widget_colors.xml'), colors('#FFFFFF', '#14211B', '#5B6B63', '#1F7A4D', '#D7E5DD'))
write(os.path.join(res, 'values-night', 'widget_colors.xml'), colors('#1B2420', '#EAF2EE', '#A9B9B0', '#5FC79A', '#34443C'))

manifest = os.path.join(app, 'AndroidManifest.xml')
text = open(manifest, encoding='utf-8').read()
if 'NextSessionWidget' in text:
    print('manifest already patched')
else:
    if '</application>' not in text:
        sys.exit('add_widgets: </application> not found in AndroidManifest.xml')
    text = text.replace('</application>', RECEIVERS.replace('PKG', PKG) + '    </application>', 1)
    open(manifest, 'w', encoding='utf-8', newline='\n').write(text)
    print('patched', manifest)
print('widgets added for package', PKG)
