"""Build a one-page PDF from the website's public content; no browser automation."""
import json, os, sys
from xml.sax.saxutils import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from pypdf import PdfReader
d=json.load(open(sys.argv[1],encoding='utf-8'));out=sys.argv[2]
font=os.environ.get('PORTFOLIO_CJK_FONT',r'C:\Windows\Fonts\msyh.ttc')
if os.path.exists(font):pdfmetrics.registerFont(TTFont('Resume',font,subfontIndex=0));face='Resume'
else:pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'));face='STSong-Light'
accent=colors.HexColor('#146454');styles={}
for name,size,leading,color in [('name',23,30,'#18252b'),('role',11,16,'#146454'),('body',9.1,14,'#18252b'),('small',8,12,'#5b6870'),('heading',11.4,17,'#146454'),('item',9.7,14,'#18252b')]:
 styles[name]=ParagraphStyle(name,fontName=face,fontSize=size,leading=leading,textColor=colors.HexColor(color),spaceAfter=5,spaceBefore=8 if name=='heading' else 0,wordWrap='CJK')
def p(text,kind='body'):return Paragraph(escape(str(text)),styles[kind])
def link(label,url):return '<link href="'+escape(url,{'"':'&quot;'})+'" color="#146454">'+escape(label)+'</link>'
pr=d['profile'];head=Table([[[p(pr['name'],'name'),p(pr['role'],'role')],[p(pr['phone']+' | '+pr['email'],'small'),p(pr['location'],'small'),Paragraph(link('yanghao158640.github.io','https://yanghao158640.github.io/'),styles['small'])]]],colWidths=[290,225])
head.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),12),('LINEBELOW',(0,0),(-1,-1),1.2,accent)]))
story=[head,Spacer(1,10),p(pr['school']+pr['major']+'专业本科在读，借助 AI 工具将学习和产品想法做成可体验的作品。代表项目覆盖污水处理教学模拟、学习规划工具与机器学习课程汇报；持续根据使用反馈改进功能。')]
main=[p('代表作品 | 专业实践与 AI 应用','heading')]
for x in d['projects']:
 if x['id'] in [4,5,3]:
  main.extend([p(x['title'],'item'),p(x['des']),Paragraph(link(x['linkLabel'],x['link'])+' | '+link('项目源码',x['repo']),styles['small']),p(' / '.join(x['tags']),'small')])
main.append(Paragraph('其他作品：'+' / '.join(link(x['title'],x['link']) for x in d['projects'] if x['category']=='互动游戏'),styles['small']))
main.append(p('实践经历','heading'))
for x in d['experiences']:
 if x['id'] in [1,2,3,4]:main.extend([p(x['title']+' | '+x['period'],'item'),p(x['desc'])])
side=[p('教育背景','heading'),p(pr['school'],'item'),p(pr['major']+' | 2026级本科在读'),p('方向：环境工程知识的可视化表达与 AI 工具应用。','small'),p('AI 领域认证 | '+str(len(d['certifications']))+'项','heading')]
for x in d['certifications']:side.extend([p(x['title'],'item'),p(x['issuer']+' | '+x['date'],'small')])
table=Table([[main,side]],colWidths=[331,184]);table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(0,0),0),('RIGHTPADDING',(0,0),(0,0),16),('LEFTPADDING',(1,0),(1,0),14),('RIGHTPADDING',(1,0),(1,0),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),('LINEBEFORE',(1,0),(1,0),.5,colors.HexColor('#d8e0dd'))]))
story.extend([table,Spacer(1,10),p('技能与工具','heading'),p('技能：'+' / '.join(x['name'] for x in sorted(d['skills'],key=lambda x:-x['level'])),'small'),p('常用工具：'+' / '.join(d['toolStack']['left']+d['toolStack']['right']),'small')])
doc=SimpleDocTemplate(out,pagesize=A4,leftMargin=40,rightMargin=40,topMargin=30,bottomMargin=30,title=pr['name']+' - 环境工程与AI应用简历',author=pr['name']);doc.build(story)
r=PdfReader(out)
if len(r.pages)!=1:raise RuntimeError('Resume must fit one page; got '+str(len(r.pages)))
urls=[a.get_object().get('/A',{}).get('/URI') for page in r.pages for a in page.get('/Annots',[])]
for url in ['https://hsbx9017-dot.github.io/wwtp-simulator/','https://hsbx9017-dot.github.io/xianxue-yidian/']:
 if url not in urls:raise RuntimeError('Missing project link in PDF')
print('One-page PDF created; both project hyperlinks verified.')
