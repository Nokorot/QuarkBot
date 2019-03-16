#!/usr/bin/python3

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
import sys, os
import json

A = "abs,acos:arccos,asin:arcsin,atan:arctan,atan2:arctan2".split(',')
B = "ceil,cos,cosh,degrees,e,exp,fabs,floor,fmod,frexp,hypot".split(',')
C = "ldexp,log,log10,modf,pi,radians,sin,sinh,sqrt,tan,tanh".split(',')
maths_expr = A+B+C

class ArgumentExeption(Exception):
    pass
def assertArgLength(args, length, message=None):
    if len(args) < length:
        raise ArgumentExeption("\set <property>");

def safe_eval(expr, locals=[]):
    def pair(k):
        if ':' in k:
            [key, value] = k.split(':')
        else:
            [key, value] = [k,k]
        return (key, np.__dict__[value]);
    safe_locals = dict([pair(k) for k in maths_expr]);

    for k in locals:
        safe_locals[k] = locals[k];

    return eval(expr, {"__builtins__":None}, safe_locals)
    # TODO: timeout

title = None;
line_style = [];
ranges = {};

def set(args):
    def setTitle(args):
        global title
        title = ' '.join(args[0])
    def setLineStyle(args):
        ls = json.loads(args[0])
        lw = ls.get('linewidth', []);
        lc = ls.get('linecolor', []);
        dt = ls.get('dashtype', []);

        global line_style;
        line_style = []
        for i in range(max(len(lw), len(lc), len(dt))):
            ls = {}
            if i < len(lc): ls['color']     = lc[i].replace('\'', '');
            if i < len(lw): ls['linewidth'] = int(lw[i]);
            else: ls['linewidth'] = 2;
            if i < len(dt): ls['linestyle'] = dt[i];
            line_style.append(ls);
    def setRanges(args):
        global ranges;
        ranges = json.loads(args[0]);

    cmd = {
        'output':       None,
        'title':        setTitle,
        'linestyle':    setLineStyle,
        'ranges':       setRanges
    }.get(args[0], None);
    if cmd != None: cmd(args[1:]);

import time
def plot(args):
    exprs = ' '.join(args).split(',');

    dpi = 70;

    plt.figure(figsize=(400/dpi, 300/dpi), dpi=dpi)
    plt.title(title, fontname='Helvetica')

    xr = ranges.get('xrange', '[-1:1]')[1:-1].split(':')
    x = np.linspace(float(safe_eval(xr[0])),float(safe_eval(xr[1])),101);
    for (i, exp) in enumerate(exprs):
        ls = line_style[i] if i < len(line_style) else {};
        plt.plot(x, safe_eval(exp, {'x': x}), **ls);

    plt.savefig('tmp/plot.png');

def splot(args):
    exprs = ' '.join(args).split(',');

    dpi = 70;
    plt.figure(figsize=(400/dpi, 300/dpi), dpi=dpi)
    ax = plt.axes(projection='3d')

    plt.title(title, fontname='Helvetica')

    xr = ranges.get('xrange', '[-1:1]')[1:-1].split(':')
    yr = ranges.get('yrange', '[-1:1]')[1:-1].split(':')
    x = np.linspace(float(safe_eval(xr[0])),float(safe_eval(xr[1])),101);
    y = np.linspace(float(safe_eval(yr[0])),float(safe_eval(yr[1])),101);
    x, y = np.meshgrid(x,y)

    for (i, exp) in enumerate(exprs):
        ls = line_style[i] if i < len(line_style) else {};
        ax.plot_surface(x, y, safe_eval(exp, {'x': x, 'y':y}), cmap='viridis');

    plt.savefig('tmp/splot.png');

def implot(args):
    exprs = ' '.join(args).split(',');

    dpi = 70;
    plt.figure(figsize=(400/dpi, 300/dpi), dpi=dpi)

    plt.title(title, fontname='Helvetica')

    xr = ranges.get('xrange', '[-1:1]')[1:-1].split(':')
    yr = ranges.get('yrange', '[-1:1]')[1:-1].split(':')
    x = np.linspace(float(safe_eval(xr[0])),float(safe_eval(xr[1])),101);
    y = np.linspace(float(safe_eval(yr[0])),float(safe_eval(yr[1])),101);
    x, y = np.meshgrid(x,y)

    plt.axis('equal')

    for (i, exp) in enumerate(exprs):
        ls = line_style[i] if i < len(line_style) else {};
        ls = dict([(k+'s',v) for (k,v) in ls.items()]);
        log(ls)
        plt.contour(x,y, safe_eval(exp.replace('=','-',1), {'x': x, 'y':y}), [0], **ls);

    plt.savefig('tmp/implot.png');

if os.path.isfile('output'):
    os.remove('output');
def log(*data):
    with open('output', 'a') as f:
        f.write('\n'.join(map(str,data)) + '\n');

def main():
    while True:
        inp = input().split(' ');
        if len(inp) == 0:
            continue;

        log(inp);
        cmd = {
            'set':      set,
            'plot':     plot,
            'splot':    splot,
            'implot':   implot,
            'exit':     lambda args: sys.exit()
        }.get(inp[0], None);
        if cmd != None: cmd(inp[1:]);

import resource
def memory_limit(limit=83886080):
    soft, hard = resource.getrlimit(resource.RLIMIT_AS)
    resource.setrlimit(resource.RLIMIT_AS, (83886080, hard))

if __name__ == '__main__':
    # memory_limit() # Limitates maximun memory usage to half
    try:
        main()
    except MemoryError:
        sys.stderr.write('\n\nERROR: Memory Exception\n')
        sys.exit(0)
