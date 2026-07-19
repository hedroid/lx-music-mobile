package cn.toside.music.mobile;

import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import cn.toside.music.mobile.lyric.LyricModule;

public class MainActivity extends NavigationActivity {
  @Override
  protected void onStart() {
    super.onStart();
    LyricModule.setAppInForeground(true);
  }

  @Override
  protected void onStop() {
    LyricModule.setAppInForeground(false);
    super.onStop();
  }
}
