import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ringtoneBase64 } from '~/assets/tones/ringtone-base64';

export default function RingtoneAudioFallback() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:transparent;">
        <audio id="ringAudio" src="data:audio/mp3;base64,${ringtoneBase64}" autoplay loop preload="auto"></audio>
        <script>
          (function() {
            var audio = document.getElementById('ringAudio');
            if (audio) {
              audio.volume = 1.0;
              var playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(function() {
                  playOscillatorRing();
                });
              }
            } else {
              playOscillatorRing();
            }

            function playOscillatorRing() {
              try {
                var AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                var ctx = new AudioCtx();
                if (ctx.state === 'suspended') { ctx.resume(); }

                function ringCadence(start, dur) {
                  var o1 = ctx.createOscillator();
                  var o2 = ctx.createOscillator();
                  var g = ctx.createGain();
                  o1.frequency.value = 440;
                  o2.frequency.value = 480;
                  o1.connect(g);
                  o2.connect(g);
                  g.connect(ctx.destination);
                  g.gain.setValueAtTime(0, start);
                  g.gain.linearRampToValueAtTime(0.4, start + 0.05);
                  g.gain.setValueAtTime(0.4, start + dur - 0.05);
                  g.gain.linearRampToValueAtTime(0, start + dur);
                  o1.start(start);
                  o2.start(start);
                  o1.stop(start + dur);
                  o2.stop(start + dur);
                }

                var now = ctx.currentTime;
                for (var i = 0; i < 20; i++) {
                  ringCadence(now + i * 5, 2.0);
                }
              } catch (e) {}
            }
          })();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.hiddenWebView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
});
