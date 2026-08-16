# -*- coding: utf-8 -*-
"""يركّب مؤثرات صوتية مزامنة لأحداث الموشن ثم يدمجها مع الفيديو.

التوقيتات مأخوذة حرفياً من ثوابت story/motion.py:
  نزول الكتب 1.05 + i*0.021 (٢٧ كتاباً) · موجة الاستعراض 2.30 + k*0.30 (٦ مرّات)
  طيران الكتاب المميّز 5.45 · صفحتا التنضيد 6.55 · البطاقة الختامية 7.75
"""
import os, wave, subprocess
import numpy as np
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, DUR = 44100, 10.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
buf = np.zeros(N + SR)               # هامش للذيل

def put(sig, t, gain=1.0, pan=0.0):
    """يضع مقطعاً عند لحظةٍ ما (pan: -1 يسار .. +1 يمين)."""
    i = int(t * SR)
    n = len(sig)
    if i + n > len(buf):
        sig, n = sig[:len(buf) - i], len(buf) - i
    buf[i:i + n] += sig * gain
    return pan

def env(n, atk, dec, power=2.0):
    a = int(atk * SR); d = max(1, n - a)
    e = np.concatenate([np.linspace(0, 1, a) ** 1.5 if a else np.array([]),
                        np.linspace(1, 0, d) ** power])
    return e[:n]

def noise(n):
    return rng.standard_normal(n)

def biquad_bp(x, f0, q, sr=SR):
    """مرشّح تمرير نطاقي بسيط (Direct Form I)."""
    w0 = 2 * np.pi * f0 / sr
    alpha = np.sin(w0) / (2 * q)
    b0, b1, b2 = alpha, 0.0, -alpha
    a0, a1, a2 = 1 + alpha, -2 * np.cos(w0), 1 - alpha
    b = np.array([b0, b1, b2]) / a0
    a = np.array([a1, a2]) / a0
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2
        x2, x1 = x1, x[i]; y2, y1 = y1, v
        y[i] = v
    return y

def lp1(x, fc, sr=SR):
    """مرشّح تمرير منخفض من الدرجة الأولى (متجّه)."""
    a = np.exp(-2 * np.pi * fc / sr)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y

# ---------- مولّدات المؤثرات ----------
def thud(f0=140, dur=.16, bright=.5):
    """ارتطام كتابٍ بالخشب: نغمة منخفضة سريعة الخفوت + طقّة ورق."""
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f0 * t * np.exp(-t * 2.2)) * env(n, .002, dur, 3.0)
    click = lp1(noise(n), 2600) * env(n, .0007, .03, 4.0) * bright
    return (body * .8 + click * .5)

def whoosh(dur=.42, f_a=380, f_b=2200, q=1.1):
    """هسهسة مرور: ضجيج عبر مرشّحٍ متحرّك."""
    n = int(dur * SR)
    x = noise(n)
    y = biquad_bp(x, f_a, q) * .6 + biquad_bp(x, f_b, q) * .4
    sweep = np.linspace(0, 1, n)
    y = y * (1 - sweep) + np.roll(y, 400) * sweep
    return y * env(n, dur * .35, dur, 2.4) * .55

def paper(dur=.5, grain=26):
    """حفيف ورق: دفعات ضجيج قصيرة متتابعة."""
    n = int(dur * SR)
    y = np.zeros(n)
    for _ in range(grain):
        s = rng.integers(0, n - 900)
        ln = int(rng.integers(300, 900))
        y[s:s + ln] += noise(ln) * env(ln, .002, ln / SR, 2.0) * rng.uniform(.3, 1.0)
    y = y - lp1(y, 700)                      # تمرير عالٍ ليبقى الحفيف رقيقاً
    return y * env(n, .06, dur, 1.6) * .5

def chime(f=784.0, dur=1.8, parts=(1.0, 1.5, 2.0, 3.0), amps=(1, .5, .3, .12)):
    """رنّة دافئة هادئة."""
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * p * t + rng.uniform(0, 6.28))
            * np.exp(-t * (1.6 + p * .55)) for p, a in zip(parts, amps))
    return y * env(n, .012, dur, 1.0) * .32

def swell(dur=1.1):
    """تصاعدٌ قبل الانتقال."""
    n = int(dur * SR)
    y = biquad_bp(noise(n), 1400, .8)
    return y * (np.linspace(0, 1, n) ** 2.6) * .5

def drone(dur=DUR):
    """طنينٌ خافت يربط المشهد."""
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 55 * t) * .55 + np.sin(2 * np.pi * 82.5 * t) * .3
         + np.sin(2 * np.pi * 110 * t) * .15)
    trem = 1 + .12 * np.sin(2 * np.pi * .21 * t)
    fade = np.clip(np.minimum(t / 1.1, (dur - t) / .8), 0, 1)
    return y * trem * fade * .05

# ---------- الجدول الزمني ----------
put(drone(), 0.0, 1.0)
put(swell(.9) * .5, 0.05)                                  # ظهور الشعار
put(chime(660, 2.2), 0.34, .55)                            # رنّة العنوان

for i in range(2):                                         # وصول الرفّين
    put(thud(96, .30, .35), 1.05 + i * .14, .5)

for i in range(27):                                        # نزول الكتب
    t = 1.05 + i * .021 + .42
    put(thud(rng.uniform(120, 205), rng.uniform(.10, .17), rng.uniform(.35, .8)),
        t, rng.uniform(.12, .26))

for k in range(6):                                         # موجة الاستعراض
    t0 = 2.30 + k * .30
    put(whoosh(.34, 420, 1900), t0, .46)
    put(paper(.24, 14), t0 + .06, .30)
    if k < 5:
        put(whoosh(.30, 900, 380), t0 + .60, .27)          # عودة الكتاب
        put(thud(150, .12, .4), t0 + .90, .17)

put(whoosh(.75, 300, 2600, .9), 5.42, .55)                 # تقدّم الكتاب المميّز
put(thud(78, .45, .25), 6.42, .40)                         # استقراره
put(chime(523.25, 2.0), 6.46, .28)

put(paper(.62, 34), 6.55, .55)                             # فتح الصفحتين
put(paper(.40, 18), 7.02, .30)

put(swell(1.0), 7.55, .55)                                 # الانتقال للبطاقة
put(thud(70, .5, .2), 8.20, .35)
put(chime(880, 2.6, (1, 1.5, 2, 2.66), (1, .45, .28, .12)), 8.26, .55)
put(chime(587.33, 2.2), 8.62, .28)

# ---------- صدىً خفيف ثم التصدير ----------
ir_n = int(.45 * SR)
ir = noise(ir_n) * np.exp(-np.arange(ir_n) / (SR * .13))
ir[:int(.02 * SR)] = 0
wet = np.convolve(buf, ir / np.abs(ir).sum(), mode='full')[:len(buf)]
mix = buf + wet * 1.6

mix = mix[:N]
mix = np.tanh(mix * 1.05)                                   # حدٌّ ليّن للقمم
mix /= max(1e-9, np.abs(mix).max()) / 0.89
fade = int(.12 * SR)
mix[:fade] *= np.linspace(0, 1, fade)
mix[-fade:] *= np.linspace(1, 0, fade)

right = np.concatenate([np.zeros(int(.0009 * SR)), mix])[:N] * .97   # اتّساعٌ طفيف
stereo = np.stack([mix, right], axis=1)
pcm = (np.clip(stereo, -1, 1) * 32767).astype('<i2')

wav = os.path.join(ROOT, 'story', 'sfx.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())

rms = float(np.sqrt((mix ** 2).mean()))
print(f'wav ok | peak {np.abs(mix).max():.2f} | rms {rms:.4f} ({20*np.log10(rms):.1f} dBFS)')

ff = imageio_ffmpeg.get_ffmpeg_exe()
out = os.path.join(ROOT, 'story', 'story-motion-sfx.mp4')
# تسوية الجهارة إلى ‎-15 LUFS مع ذروةٍ حقيقية ‎-1.5 dBTP (آمنة لضغط AAC ولمنصّات التواصل)
subprocess.run([ff, '-y', '-i', os.path.join(ROOT, 'story', 'story-motion.mp4'), '-i', wav,
                '-c:v', 'copy', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2',
                '-shortest', '-movflags', '+faststart', out],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(out, os.path.getsize(out))
