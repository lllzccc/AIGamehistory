"""Extract public WeChat articles; blocked pages remain research leads, never evidence."""
import argparse, datetime, hashlib, html, json, pathlib, re, urllib.parse, urllib.request
from html.parser import HTMLParser
class Article(HTMLParser):
    def __init__(self):
        super().__init__(); self.depth=0; self.inside=None; self.parts=[]; self.meta={}; self.hidden=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='meta': self.meta[a.get('property',a.get('name',''))]=a.get('content','')
        if self.inside is None and a.get('id')=='js_content': self.inside=self.depth
        if tag in ('script','style'): self.hidden+=1
        if self.inside is not None and tag in ('p','br','div'): self.parts.append('\n')
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.depth+=1
    def handle_endtag(self,tag):
        self.depth=max(0,self.depth-1)
        if tag in ('script','style'): self.hidden=max(0,self.hidden-1)
        if self.inside is not None and self.depth<=self.inside: self.inside=None
    def handle_data(self,data):
        if self.inside is not None and not self.hidden: self.parts.append(data)
def extract(raw):
    parser=Article();parser.feed(raw)
    text=re.sub(r'\n\s*\n+','\n\n',''.join(parser.parts)).strip()
    def variable(name):
        match=re.search(r'\b'+re.escape(name)+r'\s*=\s*[\"\x27](.*?)[\"\x27]',raw,re.S)
        return html.unescape(match.group(1)) if match else None
    return {'title':parser.meta.get('og:title') or variable('msg_title'),'accountName':variable('nickname'),'accountIdentityVerified':False,'publishedAt':variable('publish_time') or variable('create_time'),'text':text,'readStatus':'readable' if len(text)>80 else 'blocked-or-unavailable','factVerification':'pending'}
def main():
    p=argparse.ArgumentParser();p.add_argument('url');p.add_argument('--html',type=pathlib.Path);p.add_argument('--out',type=pathlib.Path,default=pathlib.Path('.local-checks/wechat'));args=p.parse_args()
    u=urllib.parse.urlsplit(args.url)
    if u.scheme!='https' or u.hostname!='mp.weixin.qq.com' or not(u.path=='/s' or u.path.startswith('/s/')): p.error('Only HTTPS mp.weixin.qq.com article URLs are accepted')
    error=None
    try:
        if args.html: raw=args.html.read_text(encoding='utf-8')
        else:
            request=urllib.request.Request(args.url,headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(request,timeout=25) as response:
                if urllib.parse.urlsplit(response.url).hostname!='mp.weixin.qq.com': raise ValueError('Unexpected redirect')
                raw=response.read(4_000_001)
                if len(raw)>4_000_000: raise ValueError('Response exceeds limit')
                raw=raw.decode('utf-8',errors='replace')
        result=extract(raw)
    except Exception as e: result={'readStatus':'fetch-failed','factVerification':'pending'};error=str(e)
    result.update(url=args.url,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),error=error)
    args.out.mkdir(parents=True,exist_ok=True);path=args.out/(hashlib.sha256(args.url.encode()).hexdigest()[:16]+'.json');path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'file':str(path),'readStatus':result['readStatus'],'title':result.get('title')},ensure_ascii=False))
if __name__=='__main__': main()
