import json,re,glob,sys,os
sys.stdout.reconfigure(encoding='utf8')
here=os.path.dirname(__file__)
d=json.load(open(os.path.join(here,'..','rubrics_he.json'),encoding='utf8'))
T={}
for f in sorted(glob.glob(os.path.join(here,'t0*.py'))):
    ns={}; exec(open(f,encoding='utf8').read(),ns); T.update(ns['T'])
for k in (707,708): T.pop(k,None)
BOOKS={'תהילים':'Salmos','תהלים':'Salmos','שמות':'Éxodo','דברים':'Deuteronomio','במדבר':'Números','דניאל':'Daniel','מיכה':'Miqueas','בראשית':'Génesis','ויקרא':'Levítico','ישעיהו':'Isaías','ירמיהו':'Jeremías'}
def num(s):
    s=re.sub('[׳״\'"]','',s); v=0
    for c in s:
        v+= 'אבגדהוזחטיכלמנסעפצקרשת'.index(c) if False else 0
    L={'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':20,'ל':30,'מ':40,'נ':50,'ס':60,'ע':70,'פ':80,'צ':90,'ק':100,'ר':200,'ש':300,'ת':400}
    return sum(L[c] for c in s)
HN=r'[א-ת][׳״\'"]?[א-ת]?[׳״]?'
def cite(s):
    m=re.fullmatch(r'\(('+'|'.join(BOOKS)+r')\s+([א-ת׳״]+)(?:[:\s]([א-ת׳״]+)(?:-([א-ת׳״]+))?)?\)',s)
    if not m: return None
    b,c,v1,v2=m.groups(); r=f'{BOOKS[b]} {num(c)}'
    if v1: r+=f':{num(v1)}'+(f'-{num(v2)}' if v2 else '')
    return f'({r})'
out={};missing=[]
for i,x in enumerate(d):
    if i in T: out[x]=T[i]; continue
    c=cite(x)
    if c: out[x]=''; continue
    missing.append((i,x))
json.dump(out,open(os.path.join(here,'..','rubrics_es.json'),'w',encoding='utf8'),ensure_ascii=False,indent=0)
print(len(out),'translated;',len(missing),'kept Hebrew')
for i,x in missing: print(i,x)
