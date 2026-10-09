"""Raster geometry for island 1 v3: unions, offsets and clipping done on a
1-unit grid with OpenCV, then traced back to angular polygons."""
import json, math, random, sys, os
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, 'island1.json')))
SEA = json.load(open(os.path.join(HERE, 'sea_v1.json')))
OX, OY, W, H = 300, 400, 3800, 3100


def mask(polys):
    m = np.zeros((H, W), np.uint8)
    arr = [np.round(np.array(p, float) + [OX, OY]).astype(np.int32) for p in polys if len(p) >= 3]
    if arr:
        cv2.fillPoly(m, arr, 255)
    return m


_k = {}
def octk(r):
    if r not in _k:
        k = np.zeros((2 * r + 1, 2 * r + 1), np.uint8)
        pts = [[r + r * math.cos(i / 8 * 2 * math.pi + math.pi / 8) / math.cos(math.pi / 8) * .999,
                r + r * math.sin(i / 8 * 2 * math.pi + math.pi / 8) / math.cos(math.pi / 8) * .999] for i in range(8)]
        cv2.fillPoly(k, [np.round(np.array(pts)).astype(np.int32)], 1)
        _k[r] = k
    return _k[r]


def dil(m, r): return cv2.dilate(m, octk(r)) if r > 0 else m
def ero(m, r): return cv2.erode(m, octk(r)) if r > 0 else m


def trace(m, eps=1.3, min_area=150):
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c in cs:
        if cv2.contourArea(c) < min_area:
            continue
        a = cv2.approxPolyDP(c, eps, True).reshape(-1, 2).astype(float) - [OX, OY]
        out.append([[round(x, 1), round(y, 1)] for x, y in a])
    return out


def inside(x, y, poly):
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def seg_angle_near(x, y, poly):
    best, ang = 1e9, 0
    for i in range(len(poly)):
        a, b = poly[i], poly[(i + 1) % len(poly)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)))
        d = math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)
        if d < best:
            best, ang = d, math.degrees(math.atan2(dy, dx))
    return ang, best


def rect(cx, cy, w, h, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return [[round(cx + c * x - s * y, 1), round(cy + s * x + c * y, 1)] for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]


coast, small = G['coast'], G['small']
reef_pts = [p for r in SEA['reefs'] for part in r['parts'] for p in part]


def reef_clear(poly, clear=34):
    # every reef vertex stays `clear` units away from the block
    c = np.array(poly, np.float32).reshape(-1, 1, 2)
    return all(cv2.pointPolygonTest(c, (float(x), float(y)), True) < -clear for x, y in reef_pts)


# ---- beaches (outward widening along the south shores) ----
def beach(poly, slices, ymin):
    base = mask([poly]); out = np.zeros_like(base)
    for x0, x1, w in slices:
        box = mask([[[x0, ymin], [x1, ymin], [x1, 2600], [x0, 2600]]])
        out |= dil(base, w) & box
    return out


coastM, smallM = mask([coast]), mask([small])
beachM = beach(coast, G['beach'], 1700) | beach(small, G['smallBeach'], 1780)

# ---- rocks ----
rng = random.Random(11)
rocks = []
for z in G['rockZones']:
    area = z['area']
    xs = [p[0] for p in area]; ys = [p[1] for p in area]
    items = [dict(pts=rect(*c), core=True) for c in z['core']]
    tries = 0
    while len([i for i in items if not i['core']]) < z['count'] and tries < 4000:
        tries += 1
        cx, cy = rng.uniform(min(xs), max(xs)), rng.uniform(min(ys), max(ys))
        if not inside(cx, cy, area):
            continue
        w = rng.uniform(*z['size']); h = w * rng.uniform(.45, .95)
        ang, dist = seg_angle_near(cx, cy, coast)
        deg = ang + rng.gauss(0, 16) if rng.random() < .7 else rng.uniform(0, 90)
        pts = rect(cx, cy, w, h, deg)
        if not all(inside(px, py, area) for px, py in pts):
            continue
        items.append(dict(pts=pts, core=False))
    items = [i for i in items if reef_clear(i['pts'])]
    for i in items:
        i['zone'] = z['name']
        i['area'] = abs(cv2.contourArea(np.array(i['pts'], np.float32)))
    rocks += items
rocks.sort(key=lambda i: -i['area'])
for k, i in enumerate(rocks):
    # bigger blocks sit lower (darker); small ones stack on top (lighter)
    rank = k / max(1, len(rocks) - 1)
    i['tone'] = min(4, max(0, int(rank * 4.2 + rng.uniform(-.6, .6))))
    if i['area'] > 26000 and rng.random() < .75:
        cx = sum(p[0] for p in i['pts']) / 4; cy = sum(p[1] for p in i['pts']) / 4
        e0, e1 = i['pts'][0], i['pts'][1]
        deg = math.degrees(math.atan2(e1[1] - e0[1], e1[0] - e0[0])) + rng.uniform(-9, 9)
        w = math.dist(e0, e1); h = math.dist(i['pts'][1], i['pts'][2])
        f = rng.uniform(.42, .62)
        i['cap'] = rect(cx + rng.uniform(-.12, .12) * w, cy + rng.uniform(-.12, .12) * h, w * f, h * f, deg)
rockM = mask([i['pts'] for i in rocks])
landM = coastM | smallM | beachM | rockM
# fill gaps between blocks so a rock zone reads as one mass
rockBaseM = ero(dil(rockM, 34), 34) & (landM | rockM)
landM |= rockBaseM

# ---- sand ----
# beaches follow the shore: octagons swept along stretches of coast with a depth that
# changes vertex to vertex, wobbled a little, then traced back to an angular inland edge
def coast_band(poly, chain, seed):
    r = random.Random(seed); ph = [r.uniform(0, 6.28) for _ in range(3)]
    m = np.zeros((H, W), np.uint8); s_acc = 0
    for (i0, d0), (i1, d1) in zip(chain, chain[1:]):
        a, b = poly[i0 % len(poly)], poly[i1 % len(poly)]; L = math.dist(a, b); n = max(1, int(L / 12))
        for k in range(n + 1):
            t = k / n; x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t; s = s_acc + L * t
            wob = 1 + .16 * math.sin(s / 140 + ph[0]) + .1 * math.sin(s / 61 + ph[1]) + .06 * math.sin(s / 29 + ph[2])
            d = (d0 + (d1 - d0) * t) * wob
            if d < 4:
                continue
            o = [[x + d * math.cos(j / 8 * 6.2832 + .3927) / .9239, y + d * math.sin(j / 8 * 6.2832 + .3927) / .9239] for j in range(8)]
            cv2.fillPoly(m, [np.round(np.array(o) + [OX, OY]).astype(np.int32)], 255)
        s_acc += L
    return mask(trace(m, eps=9, min_area=400))


bandM = np.zeros((H, W), np.uint8)
for poly_key, chain, seed in G['sandBands']:
    bandM |= coast_band(coast if poly_key == 'coast' else small, chain, seed)
sandM = (coastM | smallM | beachM) & bandM
sandM &= ~rockBaseM
wetM = sandM & ~ero(landM, 26)
srng = random.Random(5)
inner = ero(sandM, 70)
dunes = []
for _ in range(400):
    if len(dunes) >= 7:
        break
    x, y = srng.uniform(450, 2950), srng.uniform(300, 2200)
    xi, yi = int(x + OX), int(y + OY)
    if not inner[yi, xi]:
        continue
    k = srng.randint(5, 7); R = srng.uniform(60, 120); a0 = srng.uniform(0, 6.28)
    pts = [[x + math.cos(a0 + t / k * 6.283 + srng.uniform(-.3, .3)) * R * srng.uniform(.65, 1.15) * 1.5,
            y + math.sin(a0 + t / k * 6.283 + srng.uniform(-.3, .3)) * R * srng.uniform(.65, 1.15) * .8] for t in range(k)]
    dm = mask([pts]) & ero(sandM, 34)
    if any(math.hypot(x - d['c'][0], y - d['c'][1]) < 220 for d in dunes):
        continue
    polys = trace(dm)
    if not polys:
        continue
    top = trace(mask([[[x + (p[0] - x) * .5 + 10, y + (p[1] - y) * .5 - 4] for p in pts]]) & dm)
    dunes.append(dict(c=[x, y], polys=polys, top=top))

# ---- grass layers (clipped to the land, away from the shore) ----
grassClip = ero(coastM | smallM, 24)
layers = []
for t in G['terrain']:
    p = trace(mask([t['pts']]) & grassClip)
    if p:
        layers.append(dict(c=t['c'], polys=p))

# ---- coast: surf lines and shallows follow the final outline ----
smoothM = ero(dil(landM, 22), 22)
surf = {d: trace(dil(smoothM, d), eps=2.2) for d in (16, 38)}
near = trace(dil(landM, 46), eps=1.6)
waves = {d: trace(dil(smoothM, d), eps=2.2) for d in (64, 92, 120)}
# rolling waves only where the shore is sand: keep runs of each offset line that face a beach
waveRuns = []
for i, d in enumerate((120, 92, 64)):
    near_sand = dil(sandM, d + 34)
    for poly in waves[d]:
        ok = [bool(near_sand[int(y + OY), int(x + OX)]) for x, y in poly]
        if all(ok):
            waveRuns.append(dict(i=i, pts=poly + [poly[0]])); continue
        if not any(ok):
            continue
        start = ok.index(False); run = []
        for k in range(1, len(poly) + 1):
            j = (start + k) % len(poly)
            if ok[j]:
                run.append(poly[j])
            else:
                if len(run) > 1:
                    waveRuns.append(dict(i=i, pts=run))
                run = []
        if len(run) > 1:
            waveRuns.append(dict(i=i, pts=run))

# ---- zones of nodes ----
def zone_at(x, y):
    xi, yi = int(x + OX), int(y + OY)
    if rockBaseM[yi, xi] or rockM[yi, xi]:
        return 'rock'
    if sandM[yi, xi]:
        return 'sand'
    return 'grass'


zones = {n[0]: zone_at(n[1], n[2]) for n in G['nodes']}
# land test for the layout check: card corners vs the final land
_lm = ero(landM, 36)
def land_margin(x, y, w, h):
    m = _lm
    for fx in (-1, -.5, 0, .5, 1):
        for fy in (-1, -.5, 0, .5, 1):
            xi, yi = int(x + fx * w / 2 + OX), int(y + fy * h / 2 + OY)
            if not m[yi, xi]:
                return False
    return True


bad = [n[0] for n in G['nodes'] if not land_margin(n[1], n[2], 146, 118)]
out = dict(
    land=trace(landM, eps=1.4), rockBase=trace(rockBaseM, eps=1.4),
    rocks=[dict(pts=i['pts'], tone=i['tone'], cap=i.get('cap'), zone=i['zone']) for i in rocks],
    sand=trace(sandM, eps=1.4), wet=trace(wetM, eps=1.4), beach=trace(beachM & ~coastM & ~smallM, eps=1.4), dunes=dunes,
    layers=layers, surf=surf, near=near, waves=waves, waveRuns=waveRuns, zones=zones, offLand=bad)
json.dump(out, open(os.path.join(HERE, 'geom.json'), 'w'))
print('rocks', len(rocks), 'dunes', len(dunes), 'layers', len(layers), 'zones', zones, 'cards too close to water', bad)
