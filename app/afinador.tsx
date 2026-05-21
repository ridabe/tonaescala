import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { Mic, MicOff, RotateCcw } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';

// ─── Gauge geometry ──────────────────────────────────────────────────────────
const GW = 280;
const GH = 158;
const CX = GW / 2;
const CY = GH + 8; // pivot sits just below the visible area
const R_OUT = 128;
const R_IN = 110;
const NEEDLE_LEN = 118;

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(rO: number, rI: number, a1: number, a2: number) {
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const o1 = polar(rO, a1), o2 = polar(rO, a2);
  const i1 = polar(rI, a2), i2 = polar(rI, a1);
  return [
    `M ${o1.x.toFixed(1)} ${o1.y.toFixed(1)}`,
    `A ${rO} ${rO} 0 ${large} 1 ${o2.x.toFixed(1)} ${o2.y.toFixed(1)}`,
    `L ${i1.x.toFixed(1)} ${i1.y.toFixed(1)}`,
    `A ${rI} ${rI} 0 ${large} 0 ${i2.x.toFixed(1)} ${i2.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

// cents → SVG angle: 0 cents = -90° (pointing up), ±50 cents = ±80°
function centsToAngle(cents: number) {
  return -90 + (Math.max(-50, Math.min(50, cents)) / 50) * 80;
}

function needleTip(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + NEEDLE_LEN * Math.cos(rad), y: CY + NEEDLE_LEN * Math.sin(rad) };
}

const ARC_START = centsToAngle(-50); // -170°
const ARC_END   = centsToAngle(50);  //  -10°
const ARC_WARN  = centsToAngle(-25);
const ARC_TUNE  = centsToAngle(0);   //  -90°
const ARC_WARN2 = centsToAngle(25);

const TICK_ANGLES = [-80, -55, -30, 0, 30, 55, 80].map((c) => ({
  angle: -90 + (c / 50) * 80,
  major: c === 0,
}));

// ─── Instrument data ─────────────────────────────────────────────────────────
type Mode = 'Cromático' | 'Violão' | 'Guitarra' | 'Baixo';

const STRING_DATA: Record<Exclude<Mode, 'Cromático'>, { note: string; octave: number; label: string; hz: number }[]> = {
  Violão: [
    { note: 'E', octave: 2, label: '6ª', hz: 82.4 },
    { note: 'A', octave: 2, label: '5ª', hz: 110 },
    { note: 'D', octave: 3, label: '4ª', hz: 146.8 },
    { note: 'G', octave: 3, label: '3ª', hz: 196 },
    { note: 'B', octave: 3, label: '2ª', hz: 246.9 },
    { note: 'E', octave: 4, label: '1ª', hz: 329.6 },
  ],
  Guitarra: [
    { note: 'E', octave: 2, label: '6ª', hz: 82.4 },
    { note: 'A', octave: 2, label: '5ª', hz: 110 },
    { note: 'D', octave: 3, label: '4ª', hz: 146.8 },
    { note: 'G', octave: 3, label: '3ª', hz: 196 },
    { note: 'B', octave: 3, label: '2ª', hz: 246.9 },
    { note: 'E', octave: 4, label: '1ª', hz: 329.6 },
  ],
  Baixo: [
    { note: 'E', octave: 1, label: '4ª', hz: 41.2 },
    { note: 'A', octave: 1, label: '3ª', hz: 55 },
    { note: 'D', octave: 2, label: '2ª', hz: 73.4 },
    { note: 'G', octave: 2, label: '1ª', hz: 98 },
  ],
};

function closestString(hz: number, mode: Exclude<Mode, 'Cromático'>) {
  const strings = STRING_DATA[mode];
  let best = 0;
  let bestDist = Infinity;
  strings.forEach((s, i) => {
    const d = Math.abs(s.hz - hz);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

// ─── WebView HTML (pitch detection via Web Audio API) ─────────────────────────
const TUNER_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:transparent}</style>
</head><body><script>
function detectPitch(buf,sr){
  var N=buf.length,half=Math.floor(N/2),best=-1,bestC=0,found=false,last=1,rms=0,i,j,c,cs=[];
  for(i=0;i<N;i++)rms+=buf[i]*buf[i];
  rms=Math.sqrt(rms/N);
  if(rms<0.008)return{f:-1,vol:rms};
  for(var off=1;off<half;off++){
    c=0;for(j=0;j<half;j++)c+=Math.abs(buf[j]-buf[j+off]);
    c=1-c/half;cs[off]=c;
    if(c>0.9&&c>last){found=true;if(c>bestC){bestC=c;best=off;}}
    else if(found){var sh=0;if(best>1&&best<half-1)sh=(cs[best+1]-cs[best-1])/(2*cs[best]);return{f:sr/(best+8*sh),vol:rms};}
    last=c;
  }
  return{f:bestC>0.01?sr/best:-1,vol:rms};
}
function freqToNote(f){
  if(f<=0)return null;
  var A4=440,C0=A4*Math.pow(2,-4.75),names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var h=Math.round(12*Math.log2(f/C0)),n=((h%12)+12)%12;
  var exact=C0*Math.pow(2,h/12),cents=Math.round(1200*Math.log2(f/exact));
  return{note:names[n],octave:Math.floor(h/12),cents:Math.max(-50,Math.min(50,cents)),hz:Math.round(f*10)/10};
}
var ctx,analyser,fbuf,stream,running=false,smooth=0;
function start(){
  navigator.mediaDevices.getUserMedia({audio:{noiseSuppression:false,autoGainControl:false,echoCancellation:false},video:false})
  .then(function(s){
    stream=s;
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    analyser=ctx.createAnalyser();analyser.fftSize=2048;
    ctx.createMediaStreamSource(s).connect(analyser);
    fbuf=new Float32Array(analyser.fftSize);
    running=true;
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'started'}));
    tick();
  }).catch(function(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',msg:e.message}));});
}
function stop(){
  running=false;smooth=0;
  if(stream)stream.getTracks().forEach(function(t){t.stop();});
  if(ctx)ctx.close();
  stream=null;ctx=null;analyser=null;
}
var frameCount=0;
function tick(){
  if(!running||!analyser)return;
  requestAnimationFrame(tick);
  frameCount++;
  if(frameCount%2!==0)return; // throttle to ~30fps
  analyser.getFloatTimeDomainData(fbuf);
  var r=detectPitch(fbuf,ctx.sampleRate);
  var vol=Math.min(1,r.vol*12);
  if(r.f>60&&r.f<1500){
    smooth=smooth?smooth*0.65+r.f*0.35:r.f;
    var info=freqToNote(smooth);
    if(info)window.ReactNativeWebView.postMessage(JSON.stringify({type:'pitch',note:info.note,octave:info.octave,cents:info.cents,hz:info.hz,vol:vol}));
  } else {
    smooth=0;
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'silence',vol:vol}));
  }
}
function onMsg(raw){try{var m=JSON.parse(raw);if(m.cmd==='start')start();else if(m.cmd==='stop')stop();}catch(e){}}
document.addEventListener('message',function(e){onMsg(e.data);});
window.addEventListener('message',function(e){onMsg(e.data);});
<\/script></body></html>`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PitchData {
  note: string;
  octave: number;
  cents: number;
  hz: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AfinadorScreen() {
  const { colors } = useColorScheme();

  const [mode, setMode] = useState<Mode>('Violão');
  const [listening, setListening] = useState(false);
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [volume, setVolume] = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);

  const webviewRef = useRef<WebView>(null);
  const needleAnim = useRef(new Animated.Value(-90)).current;
  const [needlePos, setNeedlePos] = useState(needleTip(-90));
  const volBars = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0.15)),
  ).current;

  // ─── Needle animation ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = needleAnim.addListener(({ value }) => {
      setNeedlePos(needleTip(value));
    });
    return () => needleAnim.removeListener(id);
  }, [needleAnim]);

  const animateNeedle = useCallback(
    (cents: number) => {
      Animated.spring(needleAnim, {
        toValue: centsToAngle(cents),
        useNativeDriver: false,
        tension: 50,
        friction: 9,
      }).start();
    },
    [needleAnim],
  );

  // ─── Volume bars animation ────────────────────────────────────────────────
  useEffect(() => {
    volBars.forEach((bar, i) => {
      const target = listening ? Math.max(0.15, volume * (0.4 + Math.random() * 0.6)) : 0.1;
      Animated.timing(bar, {
        toValue: target,
        duration: 120 + i * 18,
        useNativeDriver: false,
      }).start();
    });
  }, [volume, listening, volBars]);

  // ─── WebView messages ─────────────────────────────────────────────────────
  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.type === 'started') {
          setListening(true);
        } else if (msg.type === 'pitch') {
          const data: PitchData = { note: msg.note, octave: msg.octave, cents: msg.cents, hz: msg.hz };
          setPitch(data);
          setVolume(msg.vol ?? 0);
          animateNeedle(msg.cents);
          if (mode !== 'Cromático') {
            setActiveString(closestString(msg.hz, mode as Exclude<Mode, 'Cromático'>));
          }
        } else if (msg.type === 'silence') {
          setVolume(msg.vol ?? 0);
        } else if (msg.type === 'error') {
          setListening(false);
        }
      } catch {
        // ignore parse errors
      }
    },
    [animateNeedle, mode],
  );

  // ─── Controls ─────────────────────────────────────────────────────────────
  function toggleListening() {
    if (listening) {
      webviewRef.current?.injectJavaScript(`onMsg('{"cmd":"stop"}')`);
      setListening(false);
      setPitch(null);
      setActiveString(null);
      animateNeedle(0);
    } else {
      webviewRef.current?.injectJavaScript(`onMsg('{"cmd":"start"}')`);
    }
  }

  function reset() {
    setPitch(null);
    setActiveString(null);
    animateNeedle(0);
  }

  // ─── Derived display values ───────────────────────────────────────────────
  const inTune = pitch !== null && Math.abs(pitch.cents) <= 8;
  const slightlyOff = pitch !== null && Math.abs(pitch.cents) > 8 && Math.abs(pitch.cents) <= 25;

  const tuneColor = pitch === null
    ? colors.textSoft
    : inTune
      ? Colors.status.success
      : slightlyOff
        ? Colors.status.warning
        : Colors.status.danger;

  const tuneBg = pitch === null
    ? colors.surfaceAlt
    : inTune
      ? Colors.status.successSoft
      : slightlyOff
        ? Colors.status.warningSoft
        : Colors.status.dangerSoft;

  const tuneLabel = pitch === null
    ? '–'
    : inTune
      ? 'Afinado'
      : (pitch.cents < 0 ? `${pitch.cents} cents (grave)` : `+${pitch.cents} cents (agudo)`);

  const needleColor = pitch === null ? colors.textSoft : tuneColor;

  const modes: Mode[] = ['Cromático', 'Violão', 'Guitarra', 'Baixo'];
  const strings = mode !== 'Cromático' ? STRING_DATA[mode as Exclude<Mode, 'Cromático'>] : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Afinador"
        fallbackHref="/(tabs)/perfil"
        right={
          <View style={[styles.statusDot, { backgroundColor: listening ? Colors.status.success : colors.border }]} />
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Mode tabs */}
        <View style={[styles.modeTabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          {modes.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeTab,
                mode === m && { backgroundColor: colors.surface },
              ]}
              onPress={() => { setMode(m); reset(); }}
              accessibilityRole="button"
              accessibilityLabel={`Modo ${m}`}
            >
              <Text
                style={[
                  Typography.micro,
                  { color: mode === m ? Colors.brand.primary : colors.textMuted, fontWeight: '800' },
                ]}
              >
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main tuner card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* Note display */}
          <View style={styles.noteRow}>
            <Text style={[styles.noteMain, { color: pitch ? tuneColor : colors.textSoft }]}>
              {pitch?.note ?? '–'}
            </Text>
            {pitch && (
              <Text style={[styles.noteOctave, { color: colors.textMuted }]}>
                {pitch.octave}
              </Text>
            )}
          </View>
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: -4, marginBottom: 8 }]}>
            {pitch ? `${pitch.hz} Hz` : listening ? 'Aguardando som...' : 'Toque Iniciar'}
          </Text>

          {/* SVG gauge */}
          <View style={styles.gaugeWrap}>
            <Svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH + 10}`}>
              {/* Background arc */}
              <Path d={arcPath(R_OUT, R_IN, ARC_START, ARC_END)} fill={colors.border} />
              {/* Warning zones */}
              <Path d={arcPath(R_OUT, R_IN, ARC_START, ARC_WARN)} fill={Colors.status.dangerSoft} opacity={0.7} />
              <Path d={arcPath(R_OUT, R_IN, ARC_WARN2, ARC_END)} fill={Colors.status.dangerSoft} opacity={0.7} />
              {/* In-tune zone */}
              <Path d={arcPath(R_OUT, R_IN, ARC_WARN, ARC_WARN2)} fill={Colors.status.successSoft} opacity={0.8} />
              {/* Sweet spot */}
              <Path
                d={arcPath(R_OUT + 1, R_IN - 1, centsToAngle(-8), centsToAngle(8))}
                fill={Colors.status.success}
                opacity={0.55}
              />

              {/* Tick marks */}
              {TICK_ANGLES.map(({ angle, major }, idx) => {
                const outer = polar(R_OUT + 6, angle);
                const inner = polar(R_OUT - (major ? 18 : 10), angle);
                return (
                  <Line
                    key={idx}
                    x1={outer.x}
                    y1={outer.y}
                    x2={inner.x}
                    y2={inner.y}
                    stroke={major ? colors.textMuted : colors.border}
                    strokeWidth={major ? 2.5 : 1.5}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Needle */}
              <G>
                <Line
                  x1={CX}
                  y1={CY}
                  x2={needlePos.x}
                  y2={needlePos.y}
                  stroke={needleColor}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
                {/* Pivot circle */}
                <Circle cx={CX} cy={CY} r={13} fill={needleColor} opacity={0.15} />
                <Circle cx={CX} cy={CY} r={7} fill={needleColor} />
                <Circle cx={CX} cy={CY} r={3} fill={colors.surface} />
              </G>
            </Svg>
          </View>

          {/* Cents labels */}
          <View style={styles.centLabels}>
            <Text style={[Typography.micro, { color: colors.textSoft }]}>-50</Text>
            <Text style={[Typography.micro, { color: colors.textSoft }]}>0 cents</Text>
            <Text style={[Typography.micro, { color: colors.textSoft }]}>+50</Text>
          </View>

          {/* Cents pill */}
          <View style={[styles.centsPill, { backgroundColor: tuneBg }]}>
            <Text style={[Typography.bodyStrong, { color: tuneColor, fontWeight: '800' }]}>
              {tuneLabel}
            </Text>
          </View>
        </View>

        {/* Volume meter */}
        <View style={[styles.card, styles.cardRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View>
            <Text style={[Typography.micro, { color: colors.textMuted, letterSpacing: 0.5 }]}>ENTRADA</Text>
            <Text style={[Typography.caption, { color: colors.text, fontWeight: '700', marginTop: 2 }]}>
              {listening ? 'Microfone ativo' : 'Microfone pausado'}
            </Text>
          </View>
          <View style={styles.volBars}>
            {volBars.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.volBar,
                  {
                    backgroundColor: Colors.brand.primary,
                    height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 40] }),
                    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* String grid (instrument modes only) */}
        {strings && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[Typography.micro, { color: colors.textMuted, letterSpacing: 0.5, marginBottom: Spacing.sm }]}>
              CORDAS — {mode.toUpperCase()} PADRÃO
            </Text>
            <View style={styles.stringGrid}>
              {strings.map((s, i) => {
                const isActive = activeString === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.stringCell,
                      {
                        borderColor: isActive ? Colors.brand.primary : colors.border,
                        backgroundColor: isActive ? Colors.brand.primarySoft : colors.surfaceAlt,
                      },
                    ]}
                    onPress={() => setActiveString(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Corda ${s.label} - ${s.note}${s.octave}`}
                  >
                    <Text
                      style={[
                        styles.stringNote,
                        { color: isActive ? Colors.brand.primaryPressed : colors.text },
                      ]}
                    >
                      {s.note}
                    </Text>
                    <Text style={[Typography.micro, { color: isActive ? Colors.brand.primary : colors.textMuted }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.btnReset, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={reset}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar leitura"
          >
            <RotateCcw size={18} color={colors.textMuted} strokeWidth={2} />
            <Text style={[Typography.bodyStrong, { color: colors.textMuted }]}>Reiniciar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnMain,
              { backgroundColor: listening ? Colors.status.dangerSoft : Colors.brand.primary },
            ]}
            onPress={toggleListening}
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Pausar afinador' : 'Iniciar afinador'}
          >
            {listening
              ? <MicOff size={20} color={Colors.status.danger} strokeWidth={2.3} />
              : <Mic size={20} color="#FFFFFF" strokeWidth={2.3} />}
            <Text
              style={[
                Typography.bodyStrong,
                { color: listening ? Colors.status.danger : '#FFFFFF', fontWeight: '800' },
              ]}
            >
              {listening ? 'Pausar' : 'Iniciar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[Typography.micro, styles.footer, { color: colors.textSoft }]}>
          O microfone é usado apenas localmente para detectar a nota. Nenhum áudio é gravado ou enviado.
        </Text>
      </ScrollView>

      {/* Hidden WebView — audio processing engine */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <WebView
        ref={webviewRef}
        style={styles.hidden}
        source={{ html: TUNER_HTML }}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        originWhitelist={['*']}
        onMessage={handleMessage}
        {...(Platform.OS === 'android'
          ? {
              // Android: auto-grant microphone access inside WebView
              onPermissionRequest: (e: any) => {
                e.nativeEvent.request.grant(e.nativeEvent.request.resources);
              },
            }
          : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  hidden: { width: 1, height: 1, position: 'absolute', opacity: 0 },

  modeTabs: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: Spacing.sm,
  },
  noteMain: {
    fontSize: 80,
    lineHeight: 88,
    fontWeight: '800',
    letterSpacing: -2,
  },
  noteOctave: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 10,
  },

  gaugeWrap: {
    marginVertical: Spacing.xs,
    overflow: 'hidden',
    height: GH,
    width: GW,
  },

  centLabels: {
    width: GW - 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  centsPill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minWidth: 140,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  volBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 44,
  },
  volBar: {
    width: 6,
    borderRadius: 3,
  },

  stringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  stringCell: {
    width: '30%',
    minHeight: 62,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.sm,
  },
  stringNote: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },

  controlRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btnReset: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btnMain: {
    flex: 2,
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  footer: {
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.xl,
  },
});
