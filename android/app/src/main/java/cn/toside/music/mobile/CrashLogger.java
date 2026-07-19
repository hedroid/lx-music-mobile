package cn.toside.music.mobile;

import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Process;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Persists Java crashes and Android's previous process-exit diagnostics. */
final class CrashLogger {
  private static final String LOG_SEPARATOR = "\n----lx log----\n";
  private static final String PREFS_NAME = "system_crash_logger";
  private static final String LAST_EXIT_TIME = "last_exit_time";
  private static boolean installed;

  private CrashLogger() {}

  static synchronized void install(Context context) {
    if (installed) return;
    installed = true;
    Context appContext = context.getApplicationContext();
    Thread.UncaughtExceptionHandler previousHandler = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
      StringWriter stack = new StringWriter();
      throwable.printStackTrace(new PrintWriter(stack));
      append(appContext, "SYSTEM CRASH\nThread: " + thread.getName() + "\n" + stack);
      if (previousHandler != null) {
        previousHandler.uncaughtException(thread, throwable);
      } else {
        Process.killProcess(Process.myPid());
        System.exit(10);
      }
    });

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      Thread collector = new Thread(() -> collectPreviousExitInfo(appContext), "lx-crash-log-collector");
      collector.setDaemon(true);
      collector.start();
    }
  }

  private static void collectPreviousExitInfo(Context context) {
    try {
      ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
      if (manager == null) return;
      SharedPreferences preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
      long lastExitTime = preferences.getLong(LAST_EXIT_TIME, 0L);
      long newestExitTime = lastExitTime;
      List<ApplicationExitInfo> exits = manager.getHistoricalProcessExitReasons(null, 0, 10);
      for (ApplicationExitInfo exit : exits) {
        newestExitTime = Math.max(newestExitTime, exit.getTimestamp());
        if (exit.getTimestamp() <= lastExitTime || !isCrash(exit.getReason())) continue;
        StringBuilder message = new StringBuilder("SYSTEM PROCESS EXIT")
          .append("\nTime: ").append(formatTime(exit.getTimestamp()))
          .append("\nReason: ").append(reasonName(exit.getReason()))
          .append("\nStatus: ").append(exit.getStatus())
          .append("\nDescription: ").append(exit.getDescription() == null ? "" : exit.getDescription())
          .append("\nPSS/RSS: ").append(exit.getPss()).append('/').append(exit.getRss()).append(" KB");
        String trace = readTrace(exit.getTraceInputStream());
        if (!trace.isEmpty()) message.append("\nTrace:\n").append(trace);
        append(context, message.toString());
      }
      if (newestExitTime > lastExitTime) preferences.edit().putLong(LAST_EXIT_TIME, newestExitTime).apply();
    } catch (Throwable ignored) {
      // Crash diagnostics must never interfere with app startup.
    }
  }

  private static boolean isCrash(int reason) {
    return reason == ApplicationExitInfo.REASON_CRASH
      || reason == ApplicationExitInfo.REASON_CRASH_NATIVE
      || reason == ApplicationExitInfo.REASON_ANR
      || reason == ApplicationExitInfo.REASON_INITIALIZATION_FAILURE;
  }

  private static String reasonName(int reason) {
    if (reason == ApplicationExitInfo.REASON_CRASH) return "JAVA_CRASH";
    if (reason == ApplicationExitInfo.REASON_CRASH_NATIVE) return "NATIVE_CRASH";
    if (reason == ApplicationExitInfo.REASON_ANR) return "ANR";
    if (reason == ApplicationExitInfo.REASON_INITIALIZATION_FAILURE) return "INITIALIZATION_FAILURE";
    return Integer.toString(reason);
  }

  private static String readTrace(InputStream stream) {
    if (stream == null) return "";
    StringBuilder result = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
      char[] buffer = new char[2048];
      int count;
      while ((count = reader.read(buffer)) > 0 && result.length() < 65536) {
        result.append(buffer, 0, Math.min(count, 65536 - result.length()));
      }
    } catch (Throwable ignored) {}
    return result.toString();
  }

  private static synchronized void append(Context context, String message) {
    File logFile = new File(context.getCacheDir(), "error.log");
    try (FileWriter writer = new FileWriter(logFile, true)) {
      writer.write(LOG_SEPARATOR);
      writer.write(formatTime(System.currentTimeMillis()));
      writer.write(" ERROR ");
      writer.write(message);
    } catch (Throwable ignored) {}
  }

  private static String formatTime(long time) {
    return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault()).format(new Date(time));
  }
}
