"""Browser QA using installed Chrome and Python's standard library; no dependencies."""
from pathlib import Path
import argparse, base64, hashlib, http.client, json, os, socket, struct, subprocess, tempfile, time, urllib.request

class Browser:
    def __init__(self):
        self.profile = tempfile.TemporaryDirectory(prefix='zak-browser-')
        chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        self.proc = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-port=0', '--remote-allow-origins=http://localhost', '--user-data-dir='+self.profile.name, 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        portfile=Path(self.profile.name)/'DevToolsActivePort'
        for _ in range(100):
            if portfile.exists(): break
            time.sleep(.1)
        self.port=int(portfile.read_text().splitlines()[0])
        targets=json.load(urllib.request.urlopen(f'http://localhost:{self.port}/json'))
        page=next(t for t in targets if t['type']=='page')
        self.sock=socket.create_connection(('localhost',self.port),10)
        path=page['webSocketDebuggerUrl'].split(str(self.port),1)[1]
        key=base64.b64encode(os.urandom(16)).decode()
        request=f'GET {path} HTTP/1.1\r\nHost: localhost:{self.port}\r\nOrigin: http://localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
        self.sock.sendall(request.encode()); response=b''
        while b'\r\n\r\n' not in response: response+=self.sock.recv(1)
        if b' 101 ' not in response: raise RuntimeError(response.decode())
        self.seq=0; self.errors=[]
        self.command('Page.enable'); self.command('Runtime.enable')
    def receive(self,n):
        result=b''
        while len(result)<n:
            chunk=self.sock.recv(n-len(result))
            if not chunk: raise RuntimeError('Browser connection closed')
            result+=chunk
        return result
    def message(self):
        a,b=self.receive(2);length=b&127
        if length==126:length=struct.unpack('!H',self.receive(2))[0]
        elif length==127:length=struct.unpack('!Q',self.receive(8))[0]
        mask=self.receive(4) if b&128 else None
        payload=self.receive(length)
        if mask:payload=bytes(v^mask[i%4] for i,v in enumerate(payload))
        if a&15==8:raise RuntimeError('Browser closed socket')
        return json.loads(payload)
    def command(self,method,params=None):
        self.seq+=1; data=json.dumps({'id':self.seq,'method':method,'params':params or {}}).encode(); key=os.urandom(4)
        length=len(data); header=bytes([0x81,0x80|length]) if length<126 else bytes([0x81,0x80|126])+struct.pack('!H',length) if length<65536 else bytes([0x81,0x80|127])+struct.pack('!Q',length)
        self.sock.sendall(header+key+bytes(v^key[i%4] for i,v in enumerate(data)))
        while True:
            msg=self.message()
            if msg.get('method')=='Runtime.exceptionThrown':self.errors.append(msg['params']['exceptionDetails'])
            if msg.get('id')==self.seq:
                if 'error' in msg:raise RuntimeError(msg['error'])
                return msg.get('result',{})
    def evaluate(self,expression):
        result=self.command('Runtime.evaluate',{'expression':expression,'returnByValue':True,'awaitPromise':True})
        if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'])
        return result.get('result',{}).get('value')
    def navigate(self,path,width=1440,height=900):
        self.command('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':False})
        self.command('Page.navigate',{'url':Path(path).resolve().as_uri()})
        for _ in range(100):
            try:
                if self.evaluate("document.readyState === 'complete'"):break
            except RuntimeError:pass
            time.sleep(.05)
        time.sleep(.5)
    def screenshot(self,path):
        data=self.command('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
        Path(path).parent.mkdir(parents=True,exist_ok=True);Path(path).write_bytes(base64.b64decode(data))
    def close(self):
        try:self.command('Browser.close')
        except Exception:pass
        self.sock.close()
        try:self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:self.proc.terminate()
        try:self.profile.cleanup()
        except PermissionError:pass

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('page',nargs='?',default='index.html');parser.add_argument('--script');parser.add_argument('--screenshot');parser.add_argument('--width',type=int,default=1440);parser.add_argument('--height',type=int,default=900);parser.add_argument('--touch',action='store_true');args=parser.parse_args()
    browser=Browser()
    try:
        browser.navigate(args.page,args.width,args.height)
        if args.touch:browser.command('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':1})
        if args.script:print(json.dumps(browser.evaluate(Path(args.script).read_text(encoding='utf-8-sig')),ensure_ascii=False))
        else:print(json.dumps(browser.evaluate("({title:document.title,state:window.zakGame?.state,canvas:!!document.querySelector('canvas')})"),ensure_ascii=False))
        if args.screenshot:browser.screenshot(args.screenshot)
        print('BROWSER_ERRORS:',json.dumps(browser.errors,ensure_ascii=False))
        if browser.errors:raise SystemExit(1)
    finally:browser.close()
