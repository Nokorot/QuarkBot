#!/usr/bin/python3

import sys, os
from quicklatex import *

from PIL import Image

def adjust(image_in, image_out, border):
    image = Image.open(image_in).convert('RGBA')
    w, h = image.size
    nw = w + border
    nh = h + border
    new_image = Image.new('RGBA', (nw, nh), (0, 0, 0, 0))
    upper = (512 - image.size[1]) / 2
    new_image.paste(image, (int((nw-w)/2), int((nh-h)/2)) )
    new_image.save(image_out)

def main():
    impath = "/tmp/fb-latex-img.png"
    if len(sys.argv) > 1:
        url, w, h = qlatex_compile(sys.argv[1], size=74, color="000000")
        download_pic(url, impath)
        adjust(impath, impath, 100)
        print('\n'.join([url,str(w),str(h), impath]))
    else:
        url, w, h = qlatex_compile("e^{\pi i} = -1", size=74)
        print('\n'.join([url,str(w),str(h)]))

main()

# /latex "y = \sqrt{x^2  +1}"

'''
cd tmp

echo "\documentclass[
   11pt,
   border=1pt,
   convert
]{standalone}

\begin{document}
  $ $@ $
\end{document}" > file.tex

pdflatex file.tex
'''
