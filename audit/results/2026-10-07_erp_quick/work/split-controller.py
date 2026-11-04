"""W6F: mechanical extraction of handler groups out of config.controller.ts (bodies unchanged).
usage: split-controller.py shared | group <name> <startHandler> <endHandler> <GroupConst> <file>"""
import re,sys,os
D='src/modules/config/'
P=D+'config.controller.ts'
svc=open(P).read().split('\n')
mode=sys.argv[1]
if mode=='shared':
    a=[i for i,l in enumerate(svc) if l.startswith('const forbiddenDepartment')][0]
    b=[i for i,l in enumerate(svc) if l.startswith('export const configController = {')][0]
    text='\n'.join(svc[a:b]).rstrip()
    text=re.sub(r'^(const |async function |function )',lambda m:'export '+m.group(1),text,flags=re.M)
    open(D+'config.controller.shared.ts','w').write("import { Request } from 'express';\nimport { accessScopeService } from '../access/access-scope.service';\n\n/*\n * Department-scope checks shared by the config controller groups (W6F: moved out of config.controller.ts, bodies unchanged).\n */\n\n"+text+"\n")
    names=re.findall(r'^export (?:async function|function|const) ([A-Za-z_]+)',text,re.M)
    new=svc[:a]+svc[b:]
    last=max(i for i,l in enumerate(new[:20]) if l.startswith('import '))
    new.insert(last+1,"import { "+', '.join(names)+" } from './config.controller.shared';")
    open(P,'w').write('\n'.join(new)); print('shared:',names); sys.exit()
name,start,end,const,fname=sys.argv[2:7]
def find(n):
    for i,l in enumerate(svc):
        if re.match(r'^  async '+re.escape(n)+r'\(',l): return i
    raise SystemExit('not found '+n)
def end_of(i):
    for j in range(i,len(svc)):
        if svc[j]=='  },': return j
s=find(start); e=end_of(find(end))
while s>0 and svc[s-1].startswith('  //'): s-=1
text='\n'.join(svc[s:e+1])
shared=open(D+'config.controller.shared.ts').read()
shn=[n for n in re.findall(r'^export (?:async function|function|const) ([A-Za-z_]+)',shared,re.M) if re.search(r'\b'+n+r'\b',text)]
imp=[]
ex=[n for n in ['Request','Response','NextFunction'] if re.search(r'\b'+n+r'\b',text)]
imp.append("import { "+', '.join(ex)+" } from 'express';")
if re.search(r'\bconfigService\b',text): imp.append("import { configService } from './config.service';")
if re.search(r'\baccessScopeService\b',text): imp.append("import { accessScopeService } from '../access/access-scope.service';")
if re.search(r'\blogger\b',text): imp.append("import logger from '../../config/logger';")
if shn: imp.append("import { "+', '.join(shn)+" } from './config.controller.shared';")
open(D+fname,'w').write('\n'.join(imp)+"\n\n/** "+name+" (W6F: moved out of config.controller.ts, bodies unchanged). */\nexport const "+const+" = {\n"+text+"\n};\n")
del svc[s:e+1]
k=[i for i,l in enumerate(svc) if l.startswith('export const configController = {')][0]
svc.insert(k+1,'  ...'+const+',')
last=max(i for i,l in enumerate(svc[:30]) if l.startswith('import '))
svc.insert(last+1,"import { "+const+" } from './"+fname[:-3]+"';")
open(P,'w').write('\n'.join(svc)); print('moved',e-s+1,'->',fname)
