from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
# The actual U+27C1 character uses three nested outlined triangles in this font.
# Original single-glyph artwork; no system font is needed on mobile.
def contour(pen,points):
    pen.moveTo(points[0])
    for p in points[1:]:pen.lineTo(p)
    pen.closePath()
pen=TTGlyphPen(None)
center=(500,420)
for radius in (420,250,95):
    import math
    outer=[(round(center[0]+radius*math.cos(a)),round(center[1]+radius*math.sin(a))) for a in (math.pi/2,math.pi/2+2*math.pi/3,math.pi/2+4*math.pi/3)]
    inner=[(round(center[0]+(radius-34)*math.cos(a)),round(center[1]+(radius-34)*math.sin(a))) for a in (math.pi/2,math.pi/2+2*math.pi/3,math.pi/2+4*math.pi/3)]
    contour(pen,outer);contour(pen,list(reversed(inner)))
empty=TTGlyphPen(None).glyph();glyph=pen.glyph()
font=FontBuilder(1000,isTTF=True);font.setupGlyphOrder(['.notdef','space','nestedTriangle']);font.setupCharacterMap({32:'space',0x27C1:'nestedTriangle'});font.setupGlyf({'.notdef':empty,'space':empty,'nestedTriangle':glyph});font.setupHorizontalMetrics({'.notdef':(1000,0),'space':(500,0),'nestedTriangle':(1000,136)});font.setupHorizontalHeader(ascent=950,descent=-50);font.setupNameTable({'familyName':'UNBRIK Symbol','styleName':'Regular','uniqueFontIdentifier':'UNBRIKSymbol-1','fullName':'UNBRIK Symbol','psName':'UNBRIKSymbol'});font.setupOS2(sTypoAscender=950,sTypoDescender=-50,usWinAscent=950,usWinDescent=50);font.setupPost();font.setupMaxp();font.font.flavor='woff';font.save(Path(__file__).resolve().parents[1]/'dist/unbrik-symbol.woff')
