"""Mechanical extraction for W6F: move method groups out of config.service.ts without changing their bodies.
usage: python3 split-config.py <name> <startMethod> <endMethod> <GroupConstName> <file>
Moves the methods from `async <startMethod>(` through the end of `async <endMethod>(` (inclusive) into <file> as
`export const <GroupConstName> = { ... };` and spreads it into configService."""
import re,sys,os
D='src/modules/config/'
svc=open(D+'config.service.ts').read().split('\n')
def find_method(name):
    for i,l in enumerate(svc):
        if re.match(r'^  async '+re.escape(name)+r'\(',l): return i
    raise SystemExit('method not found '+name)
def method_end(i):
    # method ends at the first line == '  },' after i
    for j in range(i,len(svc)):
        if svc[j]=='  },': return j
    raise SystemExit('end not found')
name,start,end,const,fname=sys.argv[1:6]
s=find_method(start); e=method_end(find_method(end))
# include preceding comment lines attached to the first method
while s>0 and (svc[s-1].startswith('  //') or svc[s-1].startswith('  /**') or svc[s-1].startswith('   *') or svc[s-1].startswith('   */')): s-=1
body=svc[s:e+1]
text='\n'.join(body)
# pools
hdr='\n'.join(svc[:60])
schema_names=re.findall(r'^\s+([A-Za-z]+Input),?$',hdr,re.M)
shared=open(D+'config.shared.ts').read() if os.path.exists(D+'config.shared.ts') else ''
shared_names=re.findall(r'^export (?:async function|function|const|type|interface) ([A-Za-z_]+)',shared,re.M)
imports=[]
if re.search(r'\bdb\b',text): imports.append("import { db } from '../../config/database';")
if re.search(r'\bbcryptjs\b',text): imports.append("import bcryptjs from 'bcryptjs';")
if re.search(r'\bstripSecrets\b',text): imports.append("import { stripSecrets } from '../../lib/strip-secrets';")
us=[n for n in ['SAFE_USER_WITH_EMPLOYEE','SAFE_USER_WITH_RELATIONS'] if re.search(r'\b'+n+r'\b',text)]
if us: imports.append("import { "+', '.join(us)+" } from './user-select';")
sn=[n for n in schema_names if re.search(r'\b'+n+r'\b',text)]
if sn: imports.append("import {\n"+''.join('  '+n+',\n' for n in sn)+"} from './config.schema';")
rb=[n for n in ['PermissionCode','RoleCode'] if re.search(r'\b'+n+r'\b',text)]
if rb: imports.append("import { "+', '.join(rb)+" } from '../../types/rbac';")
shn=[n for n in shared_names if re.search(r'\b'+n+r'\b',text)]
if shn: imports.append("import { "+', '.join(shn)+" } from './config.shared';")
out='\n'.join(imports)+('\n\n' if imports else '')+'/** '+name+' (W6F: moved out of config.service.ts, bodies unchanged). */\nexport const '+const+' = {\n'+text+'\n};\n'
open(D+fname,'w').write(out)
del svc[s:e+1]
# spread into configService: after the opening line
k=[i for i,l in enumerate(svc) if l.startswith('export const configService = {')][0]
svc.insert(k+1,'  ...'+const+',')
# add import of the group after the last import line of the header
last=max(i for i,l in enumerate(svc[:80]) if l.startswith("} from ") or l.startswith('import '))
svc.insert(last+1,"import { "+const+" } from './"+fname[:-3]+"';")
open(D+'config.service.ts','w').write('\n'.join(svc))
print('moved',e-s+1,'lines ->',fname)
