import numpy as np, wave, sys
SR=44100
def env(n,a,r):
    e=np.ones(n); na=int(a*SR); nr=int(r*SR)
    e[:na]=np.linspace(0,1,na); e[-nr:]=np.linspace(1,0,nr); return e
def pitido(dur=2.4):
    t=np.arange(int(dur*SR))/SR
    s=0.55*np.sin(2*np.pi*6000*t)+0.25*np.sin(2*np.pi*6010*t)+0.12*np.sin(2*np.pi*3000*t)
    s*= (1+0.04*np.sin(2*np.pi*5*t)); return s*env(len(t),0.25,0.9)*0.35
def latido(dur=4.5,bpm=64):
    out=np.zeros(int(dur*SR)); per=60/bpm; k=0
    while k*per<dur-0.4:
        for off,amp in ((0,1.0),(0.28,0.65)):
            i=int((k*per+off)*SR); n=int(0.16*SR); t=np.arange(n)/SR
            b=np.sin(2*np.pi*(52-60*t)*t)*np.exp(-t*22)*amp
            out[i:i+n]+=b[:len(out)-i]
        k+=1
    return out*0.8
def pasos(dur=2.1,cad=0.5):
    out=np.zeros(int(dur*SR)); rng=np.random.default_rng(3); k=0
    while k*cad<dur-0.2:
        i=int(k*cad*SR); n=int(0.12*SR); t=np.arange(n)/SR
        b=(np.sin(2*np.pi*(95-120*t)*t)+0.25*rng.standard_normal(n)*np.exp(-t*60))*np.exp(-t*30)
        out[i:i+n]+=b[:len(out)-i]*(0.9 if k%2 else 1.0); k+=1
    return out*0.55
def puerta(dur=1.4):
    out=np.zeros(int(dur*SR)); rng=np.random.default_rng(5)
    n=int(0.05*SR); t=np.arange(n)/SR; c=(rng.standard_normal(n)*np.exp(-t*160)); out[:n]+=c*0.3   # picaporte
    n=int(0.5*SR); t=np.arange(n)/SR; r=np.sin(2*np.pi*(140+30*np.sin(8*t))*t)*0.12*(1-t/0.5)       # chirrido de bisagra
    i=int(0.12*SR); out[i:i+n]+=r[:len(out)-i]
    return out
EF={'pitido':pitido,'latido':latido,'pasos':pasos,'puerta':puerta}
def guardar(x,f):
    x=np.clip(x,-1,1); w=wave.open(f,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype('<i2').tobytes()); w.close()
if __name__=='__main__':
    if sys.argv[1]=='prueba':
        guardar(np.concatenate([pitido(2.4),np.zeros(SR//2),latido(3.0),np.zeros(SR//2),pasos(2.0),np.zeros(SR//2),puerta(1.4)]),sys.argv[2])
