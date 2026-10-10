"""Splits an island outline into pieces along crack lines (channels of water).
    python3 split.py in.json out.json
in: {outline: [[x,y],...], cracks: [{pts: [[x,y],...], w: width}], eps: 10, minArea: 20000}
out: {pieces: [polygon, ...]} largest first, angular (approxPolyDP)."""
import json, sys
import numpy as np, cv2

G = json.load(open(sys.argv[1]))
o = np.array(G['outline'], float)
x0, y0 = o.min(0) - 50; x1, y1 = o.max(0) + 50
W, H = int(x1 - x0), int(y1 - y0)
m = np.zeros((H, W), np.uint8)
cv2.fillPoly(m, [np.round(o - [x0, y0]).astype(np.int32)], 255)
for c in G.get('cracks', []):
    pts = np.round(np.array(c['pts'], float) - [x0, y0]).astype(np.int32)
    cv2.polylines(m, [pts], False, 0, int(c['w']), lineType=cv2.LINE_8)
for h in G.get('holes', []):
    cv2.fillPoly(m, [np.round(np.array(h, float) - [x0, y0]).astype(np.int32)], 0)
cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
pieces = []
for c in cs:
    if cv2.contourArea(c) < G.get('minArea', 20000):
        continue
    a = cv2.approxPolyDP(c, G.get('eps', 10), True).reshape(-1, 2).astype(float) + [x0, y0]
    pieces.append((cv2.contourArea(c), [[int(round(x)), int(round(y))] for x, y in a]))
pieces.sort(key=lambda p: -p[0])
json.dump({'pieces': [p for _, p in pieces]}, open(sys.argv[2], 'w'))
print('pieces', [int(a) for a, _ in pieces])
