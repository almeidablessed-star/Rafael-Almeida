import sys
import numpy as np
from PIL import Image
im=np.array(Image.open('letters.png').convert('L'))<128
ys,xs=np.where(im); K=3
x0,y0,x1,y1=xs.min()/K,ys.min()/K,xs.max()/K,ys.max()/K
letters=open('letters.d').read().split('\n'); spark=open('spark.d').read().split('\n'); faces=open('faces.d').read()
pad=46
vb=(x0-pad, y0-pad-40, (x1-x0)+2*pad+60, (y1-y0)+2*pad+40+30)
EXT, EXT_DARK, FACE = '#E8452B', '#A82A16', '#FFF8EE'
N, DX, DY = 26, 0.36, 0.55
T='translate(0,832) scale(0.1,-0.1)'
def mix(a,b,t):
    a=[int(a[i:i+2],16) for i in (1,3,5)]; b=[int(b[i:i+2],16) for i in (1,3,5)]
    return '#'+''.join(f'{round(a[i]+(b[i]-a[i])*t):02X}' for i in range(3))
stack=''.join(f'<use href="#ext" transform="translate({k*DX:.2f},{k*DY:.2f})" fill="{mix(EXT,EXT_DARK,k/N)}"/>' for k in range(N,0,-1))
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}" role="img" aria-label="Carula Cake">
<defs>
  <g id="ext"><g transform="{T}">{''.join(f'<path d="{p}"/>' for p in letters)}</g></g>
  <path id="face" d="{faces}" fill-rule="evenodd"/>
  <filter id="lift" x="-20%" y="-20%" width="140%" height="150%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b1"/><feOffset dx="10" dy="26" result="o1"/>
    <feFlood flood-color="#2B2420" flood-opacity=".30"/><feComposite in2="o1" operator="in" result="s1"/>
    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b2"/><feOffset dx="3" dy="7" result="o2"/>
    <feFlood flood-color="#2B2420" flood-opacity=".22"/><feComposite in2="o2" operator="in" result="s2"/>
    <feMerge><feMergeNode in="s1"/><feMergeNode in="s2"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="puff" x="-5%" y="-5%" width="110%" height="110%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="7.5" result="bump"/>
    <feDiffuseLighting in="bump" surfaceScale="9" diffuseConstant="1.04" lighting-color="#FFFFFF" result="diff"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feBlend in="SourceGraphic" in2="diffIn" mode="multiply" result="shaded"/>
    <feSpecularLighting in="bump" surfaceScale="9" specularConstant="1.5" specularExponent="34" lighting-color="#FFFFFF" result="spec"><feDistantLight azimuth="235" elevation="38"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="shaded" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit"/>
    <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="bump2"/>
    <feSpecularLighting in="bump2" surfaceScale="3" specularConstant="1.1" specularExponent="60" lighting-color="#FFFFFF" result="glint"><fePointLight x="300" y="60" z="420"/></feSpecularLighting>
    <feComposite in="glint" in2="SourceAlpha" operator="in" result="glintIn"/>
    <feComposite in="lit" in2="glintIn" operator="arithmetic" k1="0" k2="1" k3=".8" k4="0" result="lit2"/>
    <feOffset in="SourceAlpha" dx="7" dy="10" result="shift"/>
    <feComposite in="SourceAlpha" in2="shift" operator="out" result="rim"/>
    <feMorphology in="rim" operator="erode" radius="1.6" result="rimThin"/>
    <feGaussianBlur in="rimThin" stdDeviation="2.4" result="rimSoft"/>
    <feOffset in="rimSoft" dx="4" dy="6" result="rimIn"/>
    <feComposite in="rimIn" in2="SourceAlpha" operator="in" result="rimClip"/>
    <feFlood flood-color="#FFFFFF" flood-opacity=".95"/>
    <feComposite in2="rimClip" operator="in" result="shine"/>
    <feMerge><feMergeNode in="lit2"/><feMergeNode in="shine"/></feMerge>
  </filter>
  <filter id="puffExt" x="-5%" y="-5%" width="110%" height="110%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="bump"/>
    <feSpecularLighting in="bump" surfaceScale="5" specularConstant=".95" specularExponent="28" lighting-color="#FFE6DC" result="spec"><feDistantLight azimuth="235" elevation="40"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/>
  </filter>
</defs>
<g filter="url(#lift)">
  {stack}
  <use href="#ext" fill="{EXT}" filter="url(#puffExt)"/>
  <use href="#face" fill="{FACE}" filter="url(#puff)"/>
</g>
<g filter="url(#lift)"><g filter="url(#puffExt)"><g transform="{T}" fill="{EXT}">{''.join(f'<path d="{p}"/>' for p in spark)}</g></g></g>
</svg>'''
open(sys.argv[1],'w').write(svg)
mask=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}"><g transform="{T}" fill="#fff">'+''.join(f'<path d="{p}"/>' for p in letters+spark)+f'</g><path d="{faces}" fill-rule="evenodd" fill="#fff"/></svg>'
open(sys.argv[1].replace('.svg','-mascara.svg'),'w').write(mask)
print('ok', vb)
