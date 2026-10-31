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
    private WidgetRenderer() {}

    public static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, NextSessionWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, buildNext(ctx));
        int[] progressIds = mgr.getAppWidgetIds(new ComponentName(ctx, ProgressWidget.class));
        for (int id : progressIds) mgr.updateAppWidget(id, buildProgress(ctx));
    }

    private static PendingIntent open(Context ctx, String route, int code) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("route", route);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static String n(int v) { return String.format(Locale.US, "%,d", v); }

    public static RemoteViews buildNext(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_next);
        boolean synced = sp.getBoolean("synced", false);
        int total = sp.getInt("total", 0), day = sp.getInt("nextDay", 0);
        int done = sp.getInt("done", 0);
        int pct = total > 0 ? (int)Math.floor(done * 100.0 / total) : 0;
        rv.setTextViewText(R.id.widget_brand, "Bytewise  ·  Learn • Build • Progress");
        rv.setTextViewText(R.id.widget_percent, synced ? pct + "%" : "—");
        rv.setInt(R.id.widget_ring, "setImageLevel", pct * 100);
        if (!synced) {
            rv.setTextViewText(R.id.widget_day, "Open the app once");
            rv.setTextViewText(R.id.widget_title, "Your next learning session will appear here.");
            rv.setTextViewText(R.id.widget_meta, "Live progress syncs from your app");
            day = 1;
        } else if (day <= 0) {
            rv.setTextViewText(R.id.widget_day, "Roadmap complete");
            rv.setTextViewText(R.id.widget_title, "All sessions are completed or skipped.");
            rv.setTextViewText(R.id.widget_meta, n(done) + " completed · " + pct + "% complete");
            day = total;
        } else {
            rv.setTextViewText(R.id.widget_day, "Day " + n(day) + " / " + n(total));
            rv.setTextViewText(R.id.widget_title, sp.getString("title", ""));
            String module = sp.getString("module", "");
            String time = sp.getString("time", "");
            String meta = module;
            if (time != null && !time.isEmpty()) meta = (meta == null || meta.isEmpty()) ? time : meta + "  ·  " + time;
            rv.setTextViewText(R.id.widget_meta, meta);
        }
        int prev = Math.max(1, day - 1), next = Math.min(Math.max(1, total), day + 1);
        rv.setOnClickPendingIntent(R.id.widget_root, open(ctx, "#today/" + day, 101));
        rv.setOnClickPendingIntent(R.id.widget_previous, open(ctx, "#today/" + prev, 102));
        rv.setOnClickPendingIntent(R.id.widget_done, open(ctx, "#widget-done/" + day, 103));
        rv.setOnClickPendingIntent(R.id.widget_next, open(ctx, "#today/" + next, 104));
        return rv;
    }

    public static RemoteViews buildProgress(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_progress);
        boolean synced = sp.getBoolean("synced", false);
        int total = sp.getInt("total", 0), done = sp.getInt("done", 0), skipped = sp.getInt("skipped", 0);
        rv.setTextViewText(R.id.widget_label, "BYTEWISE PROGRESS");
        if (!synced || total <= 0) {
            rv.setTextViewText(R.id.widget_big, "Open the app once");
            rv.setTextViewText(R.id.widget_sub, "Progress appears here after the app has opened.");
            rv.setProgressBar(R.id.widget_bar, 100, 0, false);
        } else {
            int pct = (int)Math.floor(done * 100.0 / total);
            rv.setTextViewText(R.id.widget_big, n(done) + " / " + n(total));
            String sub = n(total - done) + " remaining  ·  " + pct + "% complete";
            if (skipped > 0) sub += "  ·  " + skipped + " skipped";
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

    <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content"
        android:gravity="center_vertical" android:orientation="horizontal">
        <TextView android:id="@+id/widget_brand" android:layout_width="0dp"
            android:layout_height="wrap_content" android:layout_weight="1" android:maxLines="1"
            android:text="Bytewise  ·  Learn • Build • Progress" android:textColor="@color/widget_accent"
            android:textSize="12sp" android:textStyle="bold" />
        <FrameLayout android:layout_width="58dp" android:layout_height="58dp">
            <ImageView android:id="@+id/widget_ring" android:layout_width="match_parent"
                android:layout_height="match_parent" android:src="@drawable/widget_progress_ring"
                android:contentDescription="Completion progress" />
            <TextView android:id="@+id/widget_percent" android:layout_width="match_parent"
                android:layout_height="match_parent" android:gravity="center" android:text="0%"
                android:textColor="@color/widget_ink" android:textSize="17sp" android:textStyle="bold" />
        </FrameLayout>
    </LinearLayout>

    <TextView android:id="@+id/widget_day" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:layout_marginTop="8dp"
        android:text="Day 1 / 1,029" android:textColor="@color/widget_ink"
        android:textSize="18sp" android:textStyle="bold" />
    <TextView android:id="@+id/widget_title" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:layout_marginTop="3dp"
        android:ellipsize="end" android:maxLines="2" android:textColor="@color/widget_ink"
        android:textSize="15sp" android:textStyle="bold" />
    <TextView android:id="@+id/widget_meta" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:layout_marginTop="4dp"
        android:ellipsize="end" android:maxLines="1" android:textColor="@color/widget_muted"
        android:textSize="12sp" />

    <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content"
        android:layout_marginTop="12dp" android:orientation="horizontal" android:gravity="center">
        <TextView android:id="@+id/widget_previous" android:layout_width="0dp"
            android:layout_height="42dp" android:layout_weight="1"
            android:gravity="center" android:background="@drawable/widget_action_bg"
            android:paddingStart="4dp" android:paddingEnd="4dp"
            android:text="‹  Previous" android:textColor="@color/widget_ink"
            android:textSize="12sp" android:textStyle="bold" />
        <TextView android:id="@+id/widget_done" android:layout_width="0dp"
            android:layout_height="42dp" android:layout_marginStart="6dp"
            android:layout_weight="1.15" android:gravity="center"
            android:background="@drawable/widget_action_primary_bg"
            android:paddingStart="4dp" android:paddingEnd="4dp"
            android:text="✓  Done" android:textColor="#FFFFFF"
            android:textSize="12sp" android:textStyle="bold" />
        <TextView android:id="@+id/widget_next" android:layout_width="0dp"
            android:layout_height="42dp" android:layout_marginStart="6dp"
            android:layout_weight="1" android:gravity="center"
            android:background="@drawable/widget_action_bg"
            android:paddingStart="4dp" android:paddingEnd="4dp"
            android:text="Next  ›" android:textColor="@color/widget_ink"
            android:textSize="12sp" android:textStyle="bold" />
    </LinearLayout>
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
        <receiver android:name="PKG.NextSessionWidget" android:exported="true" android:label="Bytewise learning card">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_next_info" />
        </receiver>
        <receiver android:name="PKG.ProgressWidget" android:exported="true" android:label="Bytewise progress">
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
write(os.path.join(res, 'xml', 'widget_next_info.xml'), provider('widget_next', 300, 190))
write(os.path.join(res, 'xml', 'widget_progress_info.xml'), provider('widget_progress', 250, 110))
write(os.path.join(res, 'drawable', 'widget_bg.xml'), BG)
write(os.path.join(res, 'drawable', 'widget_action_bg.xml'), '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/widget_track" />
    <corners android:radius="10dp" />
</shape>''')
write(os.path.join(res, 'drawable', 'widget_action_primary_bg.xml'), '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/widget_accent" />
    <corners android:radius="10dp" />
</shape>''')
write(os.path.join(res, 'drawable', 'widget_ring.xml'), '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#EEF2FF" />
    <stroke android:width="4dp" android:color="#5A45E8" />
</shape>''')

# Determinate circular ring for the native home-screen widget (11 visual steps).
level_items = []
for step in range(11):
    lo = step * 1000
    hi = 10000 if step == 10 else (step + 1) * 1000 - 1
    level_items.append('    <item android:minLevel="%d" android:maxLevel="%d" android:drawable="@drawable/widget_ring_%d" />' % (lo, hi, step))
write(os.path.join(res, 'drawable', 'widget_progress_ring.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<level-list xmlns:android="http://schemas.android.com/apk/res/android">\n' + '\n'.join(level_items) + '\n</level-list>')
for step in range(11):
    pct = step / 10.0
    if step == 0:
        arc = ''
    elif step == 10:
        arc = 'M24,4 A20,20 0 1 1 23.99,4'
    else:
        import math
        angle = -90 + 360 * pct
        x = 24 + 20 * math.cos(math.radians(angle))
        y = 24 + 20 * math.sin(math.radians(angle))
        large = 1 if pct > 0.5 else 0
        arc = 'M24,4 A20,20 0 %d 1 %.2f,%.2f' % (large, x, y)
    vector = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="58dp" android:height="58dp" android:viewportWidth="48" android:viewportHeight="48">
    <path android:pathData="M24,4 A20,20 0 1 1 23.99,4" android:strokeColor="#DCE5FF"
        android:strokeWidth="3.5" android:fillColor="@android:color/transparent" />
    <path android:pathData="%s" android:strokeColor="#315CF5" android:strokeWidth="3.5"
        android:strokeLineCap="round" android:fillColor="@android:color/transparent" />
</vector>''' % arc
    write(os.path.join(res, 'drawable', 'widget_ring_%d.xml' % step), vector)
write(os.path.join(res, 'values', 'widget_colors.xml'), colors('#F8FAFF', '#111A35', '#58668F', '#315CF5', '#D7E2FF'))
write(os.path.join(res, 'values-night', 'widget_colors.xml'), colors('#171B2D', '#F1F3FF', '#B4BBDD', '#7A4DFF', '#343B61'))

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
