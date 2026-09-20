"""Optional: pip install fonttools; python scripts/generate-outlines.py [--contact]."""
import json
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

root = Path(__file__).resolve().parents[1] / 'src/static'
font = TTFont(root / 'heading-bold.ttf')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm

class OutlinePen(BasePen):
    def __init__(self, offset):
        super().__init__(glyphs)
        self.offset = offset
        self.commands = []
    def point(self, p):
        return [round((p[0] + self.offset) / units, 6), round(p[1] / units, 6)]
    def _moveTo(self, p): self.commands.append(['moveTo', *self.point(p)])
    def _lineTo(self, p): self.commands.append(['lineTo', *self.point(p)])
    def _curveToOne(self, a, b, c): self.commands.append(['bezierCurveTo', *self.point(a), *self.point(b), *self.point(c)])
    def _qCurveToOne(self, a, b): self.commands.append(['quadraticCurveTo', *self.point(a), *self.point(b)])
    def _closePath(self): self.commands.append(['closePath'])
    def _endPath(self): pass

contact = '--contact' in sys.argv
lines = ['NAPISZ', 'DO MNIE'] if contact else ['TWORZĘ STRONY WWW', 'SKUPIONE NA WYNIKACH', 'BIZNESOWYCH']
result = []
for line in lines:
    offset = 0
    commands = []
    for char in line:
        name = cmap[ord(char)]
        pen = OutlinePen(offset)
        glyphs[name].draw(pen)
        commands.extend(pen.commands)
        offset += font['hmtx'][name][0]
    result.append({'text': line, 'commands': commands})
output = root / ('contact-outlines.js' if contact else 'title-outlines.js')
output.write_text('// Generated from heading-bold.ttf.\nexport default ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(output)
