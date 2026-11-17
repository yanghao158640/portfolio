"""Render the site's social cover from its real project images (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parents[1]
font = Path('C:/Windows/Fonts/msyh.ttc')
bold = Path('C:/Windows/Fonts/msyhbd.ttc')
canvas = Image.new('RGB', (1200, 630), '#f3f2eb')
draw = ImageDraw.Draw(canvas)
def label(x, y, text, size, color='#20231e', heavy=False):
    draw.text((x,y), text, font=ImageFont.truetype(str(bold if heavy else font), size), fill=color)

draw.rectangle((725, 0, 1200, 630), fill='#171c18')
draw.ellipse((970,-100,1300,230), outline='#4d5e3d', width=1)
draw.ellipse((930,-140,1340,270), outline='#38482d', width=1)
draw.line((48,93,677,93), fill='#cbd1bf', width=1)
draw.ellipse((48,48,61,61), fill='#6b8341')
label(76,36,'杨豫豪 / YANG YUHAO',25,heavy=True)
label(48,129,'让想象',64,heavy=True)
label(48,215,'不止于想象。',64,heavy=True)
label(50,330,'AI 影像 × 创意工具 × 环境工程',27)
label(50,385,'从一段故事，到一个能解决问题的工具。',23,'#566049')
draw.rectangle((48,478,674,539), fill='#d5ff62')
label(66,492,'五集独立短剧  /  交互作品  /  创作过程',23)
label(48,573,'yanghao158640.github.io',19,'#566049')
label(1050,26,'WORK / 2026',14,'#d5ff62')

def photo(name, rect):
    x,y,w,h=rect
    img = ImageOps.fit(Image.open(root/'public'/name).convert('RGB'),(w,h),method=Image.Resampling.LANCZOS)
    draw.rectangle((x-4,y-4,x+w+4,y+h+4),fill='#f3f2eb')
    canvas.paste(img,(x,y))
photo('films/poster-01.jpg',(765,70,185,329))
photo('films/poster-03.jpg',(975,115,175,311))
photo('works/shots/wwtp-simulator.png',(765,452,385,135))
label(769,407,'海妖囚岛 / AI SHORT FILM',16,'#d5ff62')
canvas.save(root/'public/og-portfolio-202611.png',optimize=True)
print('Created 1200 x 630 share cover.')
