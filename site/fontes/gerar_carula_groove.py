"""Gera a fonte Carula Groove a partir da Bagel Fat One (SIL Open Font License 1.1).

Uso: python3 gerar_carula_groove.py SAIDA.woff2 CINTURA ONDA PONTAS "Nome da Familia"
A deformação estreita o meio de cada letra e abre as pontas, no estilo groovy dos anos 70.
"""
import sys, math
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

SRC = '/home/user/Rafael-Almeida/CARULA SITE/site/fonts/bagel-fat-one.woff2'
out, pinch, wave, flare = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
fam = sys.argv[5] if len(sys.argv) > 5 else 'Carula Groove'
f = TTFont(SRC)
gs = f.getGlyphSet()
glyf = f['glyf']
CAP = f['OS/2'].sCapHeight
XH = f['OS/2'].sxHeight

def warp_fn(xmin, xmax, ymin, ymax, upper):
    cx = (xmin + xmax) / 2
    # zona de referência: altura da maiúscula ou da minúscula
    top = CAP if upper else XH
    ym = top / 2
    hh = top / 2
    def w(x, y):
        t = max(-1.4, min(1.4, (y - ym) / hh))
        tt_ = min(abs(t), 1.15)
        s = 1 + flare * tt_ ** 3 - pinch * (1 - min(tt_, 1) ** 2)   # cintura no meio, pontas abertas
        nx = cx + (x - cx) * s
        ny = y + wave * math.sin((x / 1000) * math.pi * 2.2)  # leve ondulação
        return (nx, ny)
    return w

new = {}
for name in f.getGlyphOrder():
    g = glyf[name]
    if g.numberOfContours == 0:
        continue
    rec = DecomposingRecordingPen(gs)
    gs[name].draw(rec)
    pts = [p for op, args in rec.value for p in args]
    if not pts:
        continue
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    upper = max(ys) > XH + 60
    w = warp_fn(min(xs), max(xs), min(ys), max(ys), upper)
    tt = TTGlyphPen(None)
    pen = Cu2QuPen(tt, 1.0, reverse_direction=False)
    for op, args in rec.value:
        args = [w(*p) for p in args]
        if op == 'moveTo': tt.moveTo(*args)
        elif op == 'lineTo': tt.lineTo(*args)
        elif op == 'qCurveTo': tt.qCurveTo(*args)
        elif op == 'curveTo': pen.curveTo(*args)
        elif op == 'closePath': tt.closePath()
        elif op == 'endPath': tt.endPath()
    new[name] = tt.glyph()
hmtx = f['hmtx']
for name, g in new.items():
    old = glyf[name]
    old.recalcBounds(glyf)
    g.recalcBounds(glyf)
    adv, lsb = hmtx[name]
    ow = old.xMax - old.xMin; nw = g.xMax - g.xMin
    dx = lsb - g.xMin
    g.coordinates.translate((dx, 0))
    g.recalcBounds(glyf)
    glyf[name] = g
    hmtx[name] = (int(round(adv + (nw - ow))), int(g.xMin))
for name in f.getGlyphOrder():
    glyf[name].recalcBounds(glyf) if hasattr(glyf[name], 'recalcBounds') else None
for t in ('fpgm', 'prep', 'cvt ', 'gasp'):
    if t in f: del f[t]
for name in f.getGlyphOrder():
    g = glyf[name]
    if hasattr(g, 'program'):
        from fontTools.ttLib.tables import ttProgram
        g.program = ttProgram.Program(); g.program.fromBytecode(b'')
for n in f['name'].names:
    if n.nameID in (1, 16): n.string = fam
    elif n.nameID == 4: n.string = fam + ' Regular'
    elif n.nameID == 6: n.string = 'CarulaGroove-Regular'
    elif n.nameID == 3: n.string = 'CarulaGroove-Regular-1.0'
f['name'].setName('This Font Software is licensed under the SIL Open Font License, Version 1.1. Modified from Bagel Fat One for Carula Cake.', 13, 3, 1, 0x409)
f['name'].setName('https://openfontlicense.org', 14, 3, 1, 0x409)
f.flavor = 'woff2'
f.save(out)
print('saved', out, len(new))
