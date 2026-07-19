package cn.toside.music.mobile.lyric;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** System overlay used by desktop lyrics. */
public class LyricView implements View.OnTouchListener {
  private static final long AUTO_HIDE_DELAY = 2500L;
  private static final long DOUBLE_TAP_TIMEOUT = 280L;
  private static final String[] PALETTE = {
    "#ef5350", "#42c5e8", "#35d39a", "#edc34a", "#a864db"
  };

  private LyricSwitchView textView;
  private LinearLayout rootView;
  private LinearLayout controlRow;
  private LinearLayout headerRow;
  private LinearLayout styleRow;
  private ImageButton lockButton;
  private ImageButton playPauseButton;
  private WindowManager windowManager;
  private WindowManager.LayoutParams layoutParams;
  private final ReactApplicationContext reactContext;
  private final LyricEvent lyricEvent;
  private final Handler uiHandler = new Handler(Looper.getMainLooper());
  private final Runnable hideControlsRunnable = this::hideControls;

  private float lastX;
  private float lastY;
  private float downX;
  private float downY;
  private long lastTapTime;
  private boolean moved;
  private float prevViewPercentageX;
  private float prevViewPercentageY;
  private float widthPercentage = 1f;
  private boolean isLock;
  private boolean isSingleLine;
  private boolean isShowToggleAnima;
  private boolean isPlaying;
  private boolean controlsVisible;
  private boolean styleVisible;
  private String unplayColor = "rgba(255, 255, 255, 1)";
  private String playedColor = "rgba(7, 197, 86, 1)";
  private String shadowColor = "rgba(0, 0, 0, 0.15)";
  private String textX = "LEFT";
  private String textY = "TOP";
  private float alpha = 1f;
  private float textSize = 18f;
  private int maxWidth;
  private int maxHeight;
  private int maxLineNum = 5;
  private String currentLyric = "LX Music ^-^";
  private ArrayList<String> currentExtendedLyrics = new ArrayList<>();
  private int mLastRotation;
  private OrientationEventListener orientationEventListener;
  private final Handler fixViewPositionHandler = new Handler(Looper.getMainLooper());
  private final Runnable fixViewPositionRunnable = this::updateViewPosition;

  LyricView(ReactApplicationContext reactContext, LyricEvent lyricEvent) {
    this.reactContext = reactContext;
    this.lyricEvent = lyricEvent;
  }

  private int dp(float value) {
    return Math.round(value * reactContext.getResources().getDisplayMetrics().density);
  }

  private int getSafeTop() {
    int resourceId = reactContext.getResources().getIdentifier("status_bar_height", "dimen", "android");
    int statusBarHeight = resourceId > 0
      ? reactContext.getResources().getDimensionPixelSize(resourceId)
      : dp(24);
    return statusBarHeight + dp(6);
  }

  private void listenOrientationEvent() {
    if (orientationEventListener == null) {
      orientationEventListener = new OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
        @Override
        public void onOrientationChanged(int orientation) {
          if (windowManager == null) return;
          Display display = windowManager.getDefaultDisplay();
          int rotation = display.getRotation();
          if (rotation != mLastRotation) {
            fixViewPositionHandler.removeCallbacks(fixViewPositionRunnable);
            fixViewPositionHandler.postDelayed(fixViewPositionRunnable, 300);
          }
          mLastRotation = rotation;
        }
      };
    }
    if (orientationEventListener.canDetectOrientation()) orientationEventListener.enable();
  }

  private void removeOrientationEvent() {
    if (orientationEventListener != null) orientationEventListener.disable();
  }

  private int getLayoutParamsFlags() {
    int flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
      WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
    return flags;
  }

  private boolean updateWH() {
    Display display = windowManager.getDefaultDisplay();
    Point size = new Point();
    display.getRealSize(size);
    if (maxWidth == size.x && maxHeight == size.y) return false;
    maxWidth = size.x;
    maxHeight = size.y;
    return true;
  }

  private int getVisibleLineCount() {
    if (isSingleLine) return 1;
    return Math.max(1, Math.min(maxLineNum, 1 + currentExtendedLyrics.size()));
  }

  private int getLyricHeight() {
    float lineHeight = textView == null || textView.getPaint() == null
      ? textSize * reactContext.getResources().getDisplayMetrics().scaledDensity * 1.35f
      : textView.getPaint().getFontMetricsInt(null) * 1.2f;
    return Math.max(dp(48), Math.round(lineHeight * getVisibleLineCount()) + dp(16));
  }

  private int getOverlayHeight() {
    int height = getLyricHeight();
    if (controlsVisible) height += dp(106);
    if (controlsVisible && styleVisible) height += dp(58);
    return Math.min(height, maxHeight - dp(48));
  }

  private void updateOverlayHeight() {
    if (layoutParams == null || rootView == null || textView == null) return;
    int lyricHeight = getLyricHeight();
    textView.setHeight(lyricHeight);
    LinearLayout.LayoutParams textParams = (LinearLayout.LayoutParams) textView.getLayoutParams();
    textParams.height = lyricHeight;
    textView.setLayoutParams(textParams);
    layoutParams.height = getOverlayHeight();
  }

  private void fixViewPosition() {
    if (layoutParams == null) return;
    int maxX = Math.max(0, maxWidth - layoutParams.width);
    int x = (int) (maxWidth * prevViewPercentageX);
    layoutParams.x = Math.max(0, Math.min(x, maxX));
    updateOverlayHeight();
    int maxY = Math.max(0, maxHeight - layoutParams.height);
    int y = (int) (maxHeight * prevViewPercentageY);
    layoutParams.y = Math.max(getSafeTop(), Math.min(y, maxY));
  }

  private void updateViewPosition() {
    if (windowManager == null || rootView == null || !updateWH()) return;
    layoutParams.width = (int) (maxWidth * widthPercentage);
    fixViewPosition();
    windowManager.updateViewLayout(rootView, layoutParams);
  }

  private void sendPositionEvent(float x, float y) {
    WritableMap params = Arguments.createMap();
    params.putDouble("x", x);
    params.putDouble("y", y);
    lyricEvent.sendEvent(lyricEvent.SET_VIEW_POSITION, params);
  }

  private void sendAction(String action) {
    WritableMap params = Arguments.createMap();
    params.putString("action", action);
    lyricEvent.sendEvent(lyricEvent.DESKTOP_LYRIC_ACTION, params);
  }

  private void sendAction(String action, String value) {
    WritableMap params = Arguments.createMap();
    params.putString("action", action);
    params.putString("value", value);
    lyricEvent.sendEvent(lyricEvent.DESKTOP_LYRIC_ACTION, params);
  }

  public void showLyricView(Bundle options) {
    isLock = options.getBoolean("isLock", isLock);
    isSingleLine = options.getBoolean("isSingleLine", isSingleLine);
    isShowToggleAnima = options.getBoolean("isShowToggleAnima", isShowToggleAnima);
    unplayColor = options.getString("unplayColor", unplayColor);
    playedColor = options.getString("playedColor", playedColor);
    shadowColor = options.getString("shadowColor", shadowColor);
    prevViewPercentageX = (float) options.getDouble("lyricViewX", 0f) / 100f;
    prevViewPercentageY = (float) options.getDouble("lyricViewY", 0f) / 100f;
    textX = options.getString("textX", textX);
    textY = options.getString("textY", textY);
    alpha = (float) options.getDouble("alpha", alpha);
    textSize = (float) options.getDouble("textSize", textSize);
    widthPercentage = (float) options.getDouble("width", 100) / 100f;
    maxLineNum = (int) options.getDouble("maxLineNum", maxLineNum);
    handleShowLyric();
    listenOrientationEvent();
  }

  public void showLyricView() {
    handleShowLyric();
    listenOrientationEvent();
  }

  public static int parseColor(String input) {
    if (input.startsWith("#")) return Color.parseColor(input);
    Pattern c = Pattern.compile("rgba? *\\( *(\\d+), *(\\d+), *(\\d+)(?:, *([\\d.]+))? *\\)");
    Matcher m = c.matcher(input);
    if (m.matches()) {
      int red = Integer.parseInt(m.group(1));
      int green = Integer.parseInt(m.group(2));
      int blue = Integer.parseInt(m.group(3));
      float a = m.group(4) == null ? 1 : Float.parseFloat(m.group(4));
      return Color.argb((int) (a * 255), red, green, blue);
    }
    return Color.BLACK;
  }

  private GradientDrawable panelBackground() {
    GradientDrawable drawable = new GradientDrawable();
    drawable.setColor(Color.argb(160, 52, 94, 94));
    drawable.setCornerRadius(dp(12));
    drawable.setStroke(dp(1), Color.argb(85, 108, 229, 220));
    return drawable;
  }

  private ImageButton createIconButton(int icon, String description, View.OnClickListener listener) {
    ImageButton button = new ImageButton(reactContext);
    button.setImageResource(icon);
    button.setColorFilter(Color.argb(235, 235, 248, 245));
    button.setBackgroundColor(Color.TRANSPARENT);
    button.setPadding(dp(14), dp(14), dp(14), dp(14));
    button.setContentDescription(description);
    button.setOnClickListener(v -> {
      listener.onClick(v);
      scheduleControlsHide();
    });
    button.setLayoutParams(new LinearLayout.LayoutParams(0, dp(58), 1));
    return button;
  }

  private ImageButton createHeaderButton(int icon, String description, View.OnClickListener listener) {
    ImageButton button = new ImageButton(reactContext);
    button.setImageResource(icon);
    button.setColorFilter(Color.argb(245, 239, 251, 248));
    button.setBackgroundColor(Color.TRANSPARENT);
    button.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
    button.setPadding(dp(9), dp(9), dp(9), dp(9));
    button.setContentDescription(description);
    button.setOnClickListener(v -> {
      listener.onClick(v);
      scheduleControlsHide();
    });
    button.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
    return button;
  }

  private ImageButton createAppButton() {
    ImageButton button = new ImageButton(reactContext);
    button.setImageResource(cn.toside.music.mobile.R.mipmap.ic_launcher);
    button.setBackgroundColor(Color.TRANSPARENT);
    button.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
    button.setAlpha(0.58f);
    button.setPadding(dp(10), dp(10), dp(10), dp(10));
    button.setContentDescription("LX Music");
    button.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
    return button;
  }

  private TextView createTextButton(String text, String description, View.OnClickListener listener) {
    TextView button = new TextView(reactContext);
    button.setText(text);
    button.setTextColor(Color.argb(235, 235, 248, 245));
    button.setTextSize(24);
    button.setGravity(Gravity.CENTER);
    button.setContentDescription(description);
    button.setOnClickListener(v -> {
      listener.onClick(v);
      scheduleControlsHide();
    });
    button.setLayoutParams(new LinearLayout.LayoutParams(0, dp(56), 1));
    return button;
  }

  private View createColorButton(String color) {
    View button = new View(reactContext);
    GradientDrawable background = new GradientDrawable();
    background.setShape(GradientDrawable.OVAL);
    background.setColor(parseColor(color));
    if (parseColor(color) == parseColor(playedColor)) background.setStroke(dp(3), Color.WHITE);
    button.setBackground(background);
    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(dp(34), dp(34));
    params.gravity = Gravity.CENTER;
    params.setMarginStart(dp(10));
    params.setMarginEnd(dp(10));
    button.setLayoutParams(params);
    button.setContentDescription("歌词颜色 " + color);
    button.setOnClickListener(v -> {
      setColor(unplayColor, color, shadowColor);
      sendAction("color", color);
      recreateColorButtons();
      scheduleControlsHide();
    });
    return button;
  }

  private void recreateColorButtons() {
    if (styleRow == null) return;
    styleRow.removeAllViews();
    for (String color : PALETTE) styleRow.addView(createColorButton(color));
    styleRow.addView(createTextButton("T+", "增大歌词字号", v -> changeTextSize(2f)));
    styleRow.addView(createTextButton("T−", "减小歌词字号", v -> changeTextSize(-2f)));
  }

  private void changeTextSize(float delta) {
    float size = Math.max(10f, Math.min(50f, textSize + delta));
    setTextSize(size);
    sendAction("fontSize", Integer.toString(Math.round(size * 10f)));
  }

  private void createOverlayView() {
    rootView = new LinearLayout(reactContext);
    rootView.setOrientation(LinearLayout.VERTICAL);
    rootView.setPadding(dp(8), dp(4), dp(8), dp(4));

    headerRow = new LinearLayout(reactContext);
    headerRow.setGravity(Gravity.CENTER_VERTICAL);
    headerRow.setVisibility(View.GONE);
    headerRow.addView(createAppButton());
    headerRow.addView(new View(reactContext), new LinearLayout.LayoutParams(0, dp(44), 1));
    headerRow.addView(createHeaderButton(cn.toside.music.mobile.R.drawable.desktop_lyric_close, "关闭桌面歌词", v -> sendAction("close")));
    rootView.addView(headerRow, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(44)));

    textView = new LyricSwitchView(reactContext, isSingleLine, isShowToggleAnima);
    textView.setText(currentLyric.isEmpty() ? "LX Music" : currentLyric);
    textView.setTextColor(parseColor(playedColor));
    textView.setShadowColor(parseColor(shadowColor));
    textView.setAlpha(alpha);
    textView.setTextSize(textSize);
    textView.setOnTouchListener(this);
    textView.setGravity(resolveTextGravity());
    if (!isSingleLine) textView.setMaxLines(maxLineNum);
    rootView.addView(textView, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, getLyricHeight()));

    controlRow = new LinearLayout(reactContext);
    controlRow.setGravity(Gravity.CENTER);
    controlRow.setVisibility(View.GONE);
    lockButton = createIconButton(cn.toside.music.mobile.R.drawable.desktop_lyric_lock, "锁定桌面歌词", v -> {
      setLock(!isLock);
      sendAction("lock", Boolean.toString(isLock));
    });
    controlRow.addView(lockButton);
    controlRow.addView(createIconButton(cn.toside.music.mobile.R.drawable.desktop_lyric_previous, "上一首", v -> sendAction("previous")));
    playPauseButton = createIconButton(cn.toside.music.mobile.R.drawable.desktop_lyric_play, "播放或暂停", v -> {
      isPlaying = !isPlaying;
      updatePlayPauseIcon();
      sendAction("togglePlay");
    });
    controlRow.addView(playPauseButton);
    controlRow.addView(createIconButton(cn.toside.music.mobile.R.drawable.desktop_lyric_next, "下一首", v -> sendAction("next")));
    controlRow.addView(createIconButton(cn.toside.music.mobile.R.drawable.desktop_lyric_settings, "桌面歌词样式", v -> toggleStyleRow()));
    rootView.addView(controlRow, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(58)));

    styleRow = new LinearLayout(reactContext);
    styleRow.setGravity(Gravity.CENTER);
    styleRow.setVisibility(View.GONE);
    recreateColorButtons();
    rootView.addView(styleRow, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(56)));
    rootView.setOnTouchListener(this);
    applyPanelVisibility();
  }

  private int resolveTextGravity() {
    int horizontal;
    if ("CENTER".equals(textX)) horizontal = Gravity.CENTER_HORIZONTAL;
    else if ("RIGHT".equals(textX)) horizontal = Gravity.END;
    else horizontal = Gravity.START;
    int vertical;
    if ("CENTER".equals(textY)) vertical = Gravity.CENTER_VERTICAL;
    else if ("BOTTOM".equals(textY)) vertical = Gravity.BOTTOM;
    else vertical = Gravity.TOP;
    return horizontal | vertical;
  }

  private void handleShowLyric() {
    if (windowManager == null) windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
    removeOverlayView();
    controlsVisible = false;
    styleVisible = false;
    createOverlayView();

    layoutParams = new WindowManager.LayoutParams();
    layoutParams.type = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
      ? WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
      : WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
    layoutParams.flags = getLayoutParamsFlags();
    layoutParams.gravity = Gravity.TOP | Gravity.START;
    layoutParams.format = PixelFormat.TRANSLUCENT;
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) layoutParams.alpha = isLock ? 0.88f : 1f;

    updateWH();
    layoutParams.width = (int) (maxWidth * widthPercentage);
    fixViewPosition();
    windowManager.addView(rootView, layoutParams);
    setLyric(currentLyric, currentExtendedLyrics);
    updatePlayPauseIcon();
    updateLockIcon();
  }

  private void showControls() {
    if (rootView == null) return;
    controlsVisible = true;
    headerRow.setVisibility(View.VISIBLE);
    controlRow.setVisibility(View.VISIBLE);
    applyPanelVisibility();
    updateWindowLayout();
    scheduleControlsHide();
  }

  private void hideControls() {
    if (rootView == null || !controlsVisible) return;
    controlsVisible = false;
    styleVisible = false;
    headerRow.setVisibility(View.GONE);
    controlRow.setVisibility(View.GONE);
    styleRow.setVisibility(View.GONE);
    applyPanelVisibility();
    updateWindowLayout();
  }

  private void toggleStyleRow() {
    styleVisible = !styleVisible;
    styleRow.setVisibility(styleVisible ? View.VISIBLE : View.GONE);
    updateWindowLayout();
  }

  private void applyPanelVisibility() {
    if (rootView == null) return;
    rootView.setBackground(controlsVisible ? panelBackground() : null);
  }

  private void scheduleControlsHide() {
    uiHandler.removeCallbacks(hideControlsRunnable);
    if (controlsVisible) uiHandler.postDelayed(hideControlsRunnable, AUTO_HIDE_DELAY);
  }

  private void updateWindowLayout() {
    if (windowManager == null || rootView == null || layoutParams == null) return;
    updateOverlayHeight();
    int maxY = Math.max(0, maxHeight - layoutParams.height);
    layoutParams.y = Math.max(getSafeTop(), Math.min(layoutParams.y, maxY));
    windowManager.updateViewLayout(rootView, layoutParams);
  }

  public void setLyric(String text, ArrayList<String> extendedLyrics) {
    currentLyric = text;
    currentExtendedLyrics = extendedLyrics;
    if (textView == null) return;
    if (!extendedLyrics.isEmpty() && maxLineNum > 1 && !isSingleLine) {
      int remaining = maxLineNum - 1;
      StringBuilder builder = new StringBuilder(text);
      for (String lyric : extendedLyrics) {
        builder.append("\n").append(lyric);
        if (--remaining < 1) break;
      }
      text = builder.toString();
    }
    textView.setText(text.isEmpty() ? "LX Music" : text);
    updateWindowLayout();
  }

  public void setMaxLineNum(int maxLineNum) {
    this.maxLineNum = maxLineNum;
    if (textView != null && !isSingleLine) textView.setMaxLines(maxLineNum);
    updateWindowLayout();
  }

  public void setWidth(int width) {
    widthPercentage = width / 100f;
    if (layoutParams == null) return;
    layoutParams.width = (int) (maxWidth * widthPercentage);
    updateWindowLayout();
  }

  @Override
  public boolean onTouch(View view, MotionEvent event) {
    if (layoutParams == null || rootView == null) return false;
    switch (event.getActionMasked()) {
      case MotionEvent.ACTION_DOWN:
        lastX = downX = event.getRawX();
        lastY = downY = event.getRawY();
        moved = false;
        uiHandler.removeCallbacks(hideControlsRunnable);
        return true;
      case MotionEvent.ACTION_MOVE:
        if (isLock) return true;
        float nowX = event.getRawX();
        float nowY = event.getRawY();
        if (Math.abs(nowX - downX) > ViewConfiguration.get(reactContext).getScaledTouchSlop() ||
          Math.abs(nowY - downY) > ViewConfiguration.get(reactContext).getScaledTouchSlop()) moved = true;
        int maxX = Math.max(0, maxWidth - layoutParams.width);
        int maxY = Math.max(0, maxHeight - layoutParams.height);
        layoutParams.x = Math.max(0, Math.min(layoutParams.x + Math.round(nowX - lastX), maxX));
        layoutParams.y = Math.max(getSafeTop(), Math.min(layoutParams.y + Math.round(nowY - lastY), maxY));
        windowManager.updateViewLayout(rootView, layoutParams);
        lastX = nowX;
        lastY = nowY;
        return true;
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_CANCEL:
        if (!moved && event.getActionMasked() == MotionEvent.ACTION_UP) {
          long now = System.currentTimeMillis();
          if (!isLock || now - lastTapTime <= DOUBLE_TAP_TIMEOUT) {
            showControls();
          }
          lastTapTime = now;
        }
        float percentageX = (float) layoutParams.x / (float) maxWidth * 100f;
        float percentageY = (float) layoutParams.y / (float) maxHeight * 100f;
        prevViewPercentageX = percentageX / 100f;
        prevViewPercentageY = percentageY / 100f;
        if (moved) sendPositionEvent(percentageX, percentageY);
        scheduleControlsHide();
        return true;
      default:
        return false;
    }
  }

  public void lockView() {
    setLock(true);
  }

  public void unlockView() {
    setLock(false);
  }

  private void setLock(boolean lock) {
    isLock = lock;
    if (isLock) styleVisible = false;
    if (styleRow != null) styleRow.setVisibility(View.GONE);
    updateLockIcon();
    if (windowManager == null || rootView == null) return;
    layoutParams.flags = getLayoutParamsFlags();
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) layoutParams.alpha = isLock ? 0.88f : 1f;
    windowManager.updateViewLayout(rootView, layoutParams);
  }

  public void setColor(String unplayColor, String playedColor, String shadowColor) {
    this.unplayColor = unplayColor;
    this.playedColor = playedColor;
    this.shadowColor = shadowColor;
    if (textView != null) {
      textView.setTextColor(parseColor(playedColor));
      textView.setShadowColor(parseColor(shadowColor));
    }
  }

  public void setLyricTextPosition(String textX, String textY) {
    this.textX = textX;
    this.textY = textY;
    if (textView != null) textView.setGravity(resolveTextGravity());
  }

  public void setAlpha(float alpha) {
    this.alpha = alpha;
    if (textView != null) textView.setAlpha(alpha);
  }

  public void setSingleLine(boolean singleLine) {
    isSingleLine = singleLine;
    if (rootView == null) return;
    handleShowLyric();
  }

  public void setShowToggleAnima(boolean showToggleAnima) {
    isShowToggleAnima = showToggleAnima;
    if (textView != null) textView.setShowAnima(showToggleAnima);
  }

  public void setTextSize(float size) {
    textSize = size;
    if (textView != null) textView.setTextSize(size);
    updateWindowLayout();
  }

  public void setPlaying(boolean playing) {
    isPlaying = playing;
    updatePlayPauseIcon();
  }

  private void updatePlayPauseIcon() {
    if (playPauseButton == null) return;
    playPauseButton.setImageResource(isPlaying
      ? cn.toside.music.mobile.R.drawable.desktop_lyric_pause
      : cn.toside.music.mobile.R.drawable.desktop_lyric_play);
    playPauseButton.setContentDescription(isPlaying ? "暂停" : "播放");
  }

  private void updateLockIcon() {
    if (lockButton == null) return;
    lockButton.setImageResource(isLock
      ? cn.toside.music.mobile.R.drawable.desktop_lyric_lock
      : cn.toside.music.mobile.R.drawable.desktop_lyric_unlock);
    lockButton.setContentDescription(isLock ? "桌面歌词已锁定，点击解锁" : "桌面歌词未锁定，点击锁定");
  }

  public void destroyView() {
    uiHandler.removeCallbacks(hideControlsRunnable);
    fixViewPositionHandler.removeCallbacks(fixViewPositionRunnable);
    removeOverlayView();
    rootView = null;
    textView = null;
    controlRow = null;
    headerRow = null;
    styleRow = null;
    lockButton = null;
    playPauseButton = null;
    removeOrientationEvent();
  }

  private void removeOverlayView() {
    if (rootView == null || windowManager == null) return;
    try {
      if (rootView.isAttachedToWindow()) windowManager.removeViewImmediate(rootView);
    } catch (IllegalArgumentException ignored) {
      // The system may already have detached the overlay during an app transition.
    }
  }

  public void destroy() {
    destroyView();
    windowManager = null;
    layoutParams = null;
  }
}
