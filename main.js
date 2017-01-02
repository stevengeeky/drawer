var camera = { x:0, y:0, scale:1, rotation:0 };
var paper = { x: -250, y:-300, width:500, height:600 };
var mouse = { x:0, y:0, isDown:false, lastDown:false, last:{ x:0, y:0 }, pressed:{ x:0, y:0, which:1 }, released:{ x:0, y:0, which:1 } };

var mc, ctx;
var keydowns = [], lastkeys = [];
var lines = [], used, ccol = "black";
var rlines = [];

var selected = [], moving = false;

window.onkeydown = function(e)
{
    if (!e.ctrlKey)
        e.preventDefault();
    if (keydowns.indexOf(e.keyCode) == -1)
        keydowns.push(e.keyCode);
}
window.onkeyup = function(e)
{
    if (keydowns.indexOf(e.keyCode) != -1)
        keydowns.splice(keydowns.indexOf(e.keyCode), 1);
}
function ismousedown(e)
{
    if (e)
        return !mouse.lastDown && mouse.isDown && mouse.pressed.which == e;
    return !mouse.lastDown && mouse.isDown;
}
function ismouseup(e)
{
    if (e)
        return mouse.lastDown && !mouse.isDown && mouse.pressed.which == e;
    return mouse.lastDown && !mouse.isDown;
}
function iskeydown(kc)
{
    return keydowns.indexOf(kc) != -1;
}
function getkeydown(kc)
{
    return keydowns.indexOf(kc) != -1 && lastkeys.indexOf(kc) == -1;
}
function getkeyup(kc)
{
    return keydowns.indexOf(kc) == -1 && lastkeys.indexOf(kc) != -1;
}

window.onmousewheel = function(e)
{
    clear();
    var delta = e.wheelDelta / 1000;
    
    if (camera.scale + delta > 0)
        camera.scale += delta;
}

window.onmousedown = function(e)
{
    mouse.isDown = true;
    mouse.pressed.x = e.pageX - mc.offsetLeft;
    mouse.pressed.y = e.pageY - mc.offsetTop;
    mouse.pressed.which = e.which;
}
window.onmousemove = function(e)
{
    mouse.last.x = mouse.x;
    mouse.last.y = mouse.y;
    
    mouse.x = e.pageX - mc.offsetLeft;
    mouse.y = e.pageY - mc.offsetTop;
}
window.onmouseup = function(e)
{
    mouse.isDown = false;
    mouse.released.x = e.pageX - mc.offsetLeft;
    mouse.released.y = e.pageY - mc.offsetTop;
    mouse.released.which = e.which;
}
window.oncontextmenu = function(e)
{
    e.preventDefault();
    return false;
}

window.ondragover = function(e)
{
    e.preventDefault();
    return false;
}

window.ondrop = function(e)
{
    e.preventDefault();
    var f = e.dataTransfer.files[0];
    var reader = new FileReader();
    reader.onload = function(){
        readScript(this.result);
    }
    reader.readAsText(f);
    
    return false;
}

window.onload = function()
{
    mc = document.createElement("canvas");
    mc.style.position = "fixed";
    mc.style.left = "0";
    mc.style.top = "0";
    mc.style.background = "#404040";
    
    mc.style["userSelect"] = "none";
    mc.style["webkitUserSelect"] = "none";
    mc.style["mozUserSelect"] = "none";
    mc.style["oUserSelect"] = "none";
    
    mc.style["webkitTouchCallout"] = "none";
    
    function resized(i){
        camera.x -= (window.innerWidth - mc.width) / 2;
        camera.y -= (window.innerHeight - mc.height) / 2;
        
        mc.width = window.innerWidth;
        mc.height = window.innerHeight;
    }
    resized(true);
    window.onresize = resized;
    
    camera.x = -mc.width / 2;
    camera.y = -mc.height / 2;
    
    document.body.appendChild(mc);
    ctx = mc.getContext("2d");
    
    _loop();
}

function _loop()
{
    requestAnimationFrame(_loop);
    if (!mc)
        return;
    
    doInput();
    drawPaper();
    draw();
    
    if (mouse.lastDown != mouse.isDown)
        mouse.lastDown = mouse.isDown;
    mouse.last.x = mouse.x;
    mouse.last.y = mouse.y;
    
    lastkeys = keydowns.slice(0);
}

function doInput()
{
    var am = .05 * camera.scale, ram = 3;
    
    if (iskeydown(keys.space))
        mc.style.cursor = "move";
    else
        mc.style.cursor = "default";
    
    if (getkeyup(keys.f))
        tofile( "drawing.txt", generateScript() );
    if (getkeyup(keys.c))
        ccol = prompt("What would you like your new line color to be?");
    if (getkeyup(keys.r) && keydowns.length == 0)
    {
        clear();
        camera.rotation = +prompt("Set the camera's rotation to a value:") || 0;
    }
    
    if (getkeyup(keys.x) && lines.length > 0)
    {
        var r = confirm("Are you sure you would like to completely clear this drawing?");
        if (r)
        {
            lines = [];
            selected = [];
            moving = false;
        }
    }
    if (getkeydown(keys.delete) || getkeydown(keys.back))
    {
        for (var i in selected)
            lines.splice(lines.indexOf(selected[i]), 1);
        selected = [];
    }
    
    if (iskeydown(keys.control))
    {
        if (getkeydown(keys.z) && lines.length > 0)
        {
            rlines.push(lines[lines.length - 1]);
            lines.splice(lines.length - 1, 1);
        }
        if (getkeydown(keys.y) && rlines.length > 0)
        {
            lines.push(rlines[rlines.length - 1]);
            rlines.splice(rlines.length - 1, 1);
        }
    }
    if (iskeydown(keys.up))
    {
        clear();
        camera.scale += am;
    }
    if (iskeydown(keys.down))
    {
        clear();
        camera.scale -= am;
    }
    if (iskeydown(keys.left))
    {
        clear();
        camera.rotation += ram;
    }
    if (iskeydown(keys.right))
    {
        clear();
        camera.rotation -= ram;
    }
    if (iskeydown(keys.w) || iskeydown(keys.a) || iskeydown(keys.s) || iskeydown(keys.d))
    {
        clear();
        var sp = 10 / camera.scale, r = (camera.rotation) * Math.PI / 180;
        var cos = Math.cos(r) * sp, sin = Math.sin(r) * sp;
        
        if (iskeydown(keys.a))
        {
            camera.x -= cos;
            camera.y += sin;
        }
        if (iskeydown(keys.d))
        {
            camera.x += cos;
            camera.y -= sin;
        }
        if (iskeydown(keys.w))
        {
            camera.y -= cos;
            camera.x -= sin;
        }
        if (iskeydown(keys.s))
        {
            camera.y += cos;
            camera.x += sin;
        }
    }
    
    if (iskeydown(keys.space) && mouse.isDown && movedMouse())
    {
        clear();
        var r = camera.rotation * Math.PI / 180;
        var dx = (mouse.x - mouse.last.x) / camera.scale;
        var dy = (mouse.y - mouse.last.y) / camera.scale;
        
        camera.x -= Math.sin(r) * dy + Math.cos(r) * dx;
        camera.y += Math.sin(r) * dx - Math.cos(r) * dy;
    }
    
    if (camera.scale < am)
        camera.scale = am;
}

function movedMouse()
{
    var tm = untransform(mouse.x, mouse.y);
    var nm = untransform(mouse.last.x, mouse.last.y);
    return tm.x != nm.x || tm.y != nm.y;
}

function clear()
{
    mc.width = mc.width;
    /*
    var bp = 2;
    ctx.clearRect(transformx(paper.x) - bp, transformy(paper.y) - bp, paper.width * camera.scale + bp * 2, paper.height * camera.scale + bp * 2);
    */
}

function draw()
{
    ctx.save();
    var rc = ismousedown(3), ru = ismouseup(3), rm = untransform(mouse.x, mouse.y);
    var didselect = false;
    
    if (ismouseup(3))
        moving = false;
    
    for (var i = lines.length - 1; i >= 0; i--)
    {
        var l = lines[i];
        if (l.boundingBox && inRect(rm, l.boundingBox))
        {
            if (rc)
            {
                didselect = true;
                if (selected.indexOf(l) == -1 && iskeydown(keys.control))
                    selected.push(l);
                if (selected.indexOf(l) != -1)
                    moving = true;
                else
                    moving = false;
            }
            else if (ru && (mouse.x == mouse.pressed.x || mouse.y == mouse.pressed.y))
            {
                didselect = true;
                if (selected.indexOf(l) != -1 && !iskeydown(keys.control))
                    selected.splice(selected.indexOf(l), 1);
                else
                    if (iskeydown(keys.control) && selected.indexOf(l) == -1)
                        selected.push(l);
                    else
                        selected = [l];
                if (selected.length > 0)
                    moving = true;
            }
        }
        l.draw();
    }
    
    if (!didselect && rc || ismousedown(1) && keydowns.length == 0)
        selected = [];
    else if (ismousedown(1) && keydowns.length > 0)
        moving = false;
    
    if (rc)
    {
    }
    else if (ismouseup(1))
    {
        if (used && used.verts.length == 0)
            lines.splice(lines.indexOf(used), 1);
        else if (used)
        {
            used.calculateBoundingBox();
        }
        used = null;
    }
    else if (ismousedown(1) && mouseInPaper() && keydowns.length == 0)
    {
        used = new Line([], ccol);
        lines.push(used);
    }
    else if (used && mouse.isDown && movedMouse() && mouseInPaper())
    {
        var ut = untransform(mouse.x, mouse.y);
        used.verts.push(ut.x, ut.y);
    }
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "lightblue";
    
    var ap = untransform(mouse.x, mouse.y);
    var bp = untransform(mouse.last.x, mouse.last.y);
    var dx = ap.x - bp.x;
    var dy = ap.y - bp.y;
    
    var bam = 1 / camera.scale;
    
    for (var i in selected)
    {
        var l = selected[i];
        var b = l.boundingBox;
        
        if (moving && mouse.isDown && movedMouse())
        {
            var tx = dx, ty = dy;
            
            if (b.x + tx <= paper.x + 1)
                tx = paper.x - b.x + bam;
            if (b.y + ty <= paper.y + 1)
                ty = paper.y - b.y + bam;
            if (b.x + b.width + tx >= paper.x + paper.width - 1)
                tx = paper.x + paper.width - bam - b.width - b.x;
            if (b.y + b.height + ty >= paper.y + paper.height - 1)
                ty = paper.y + paper.height - bam - b.height - b.y;
            
            b.x += tx;
            b.y += ty;
            
            for (var j = 0; j < l.verts.length; j++)
            {
                if (j % 2 == 0)
                    l.verts[j] += tx;
                else
                    l.verts[j] += ty;
            }
        }
        
        strokeRect( transform(b.x, b.y), transform(b.x + b.width, b.y), transform(b.x + b.width, b.y + b.height), transform(b.x, b.y + b.height) );
    }
    
    ctx.restore();
}

function drawPaper()
{
    ctx.save();
    ctx.fillStyle = "white";
    fillRect( transform(paper.x, paper.y), transform(paper.x + paper.width, paper.y), transform(paper.x + paper.width, paper.y + paper.height), transform(paper.x, paper.y + paper.height) );
    
    ctx.strokeStyle = "#e0e0ff";
    for (var y = 70 + paper.y; y < paper.y + paper.height; y += 20)
    {
        moveTo(transform(paper.x, y));
        lineTo(transform(paper.x + paper.width, y));
    }
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "#ffd0d0";
    
    var xmarg = 50;
    moveTo(transform(xmarg + paper.x, paper.y));
    lineTo(transform(xmarg + paper.x, paper.y + paper.height));
    
    moveTo(transform(paper.x + paper.width - xmarg, paper.y));
    lineTo(transform(paper.x + paper.width - xmarg, paper.y + paper.height));
    
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "darkgray";
    
    strokeRect( transform(paper.x, paper.y), transform(paper.x + paper.width, paper.y), transform(paper.x + paper.width, paper.y + paper.height), transform(paper.x, paper.y + paper.height) );
    ctx.restore();
}

function moveTo(p)
{
    ctx.moveTo(p.x, p.y);
}
function lineTo(p)
{
    ctx.lineTo(p.x, p.y);
}

function rect(a, b, c, d)
{
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.lineTo(a.x, a.y);
}
function fillRect(a, b, c, d)
{
    ctx.beginPath();
    rect(a, b, c, d);
    ctx.fill();
    ctx.beginPath();
}
function strokeRect(a, b, c, d)
{
    ctx.beginPath();
    rect(a, b, c, d);
    ctx.stroke();
    ctx.beginPath();
}

function mouseInPaper()
{
    return pointInPaper(untransform(mouse.x, mouse.y));
}

function pointInPaper(p)
{
    return inRect(p, { x:paper.x, y:paper.y, width:paper.width, height:paper.height });
}

function inRect(p, r)
{
    return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

function transform(p, b)
{
    if (typeof b != "undefined")
        p = { x:p, y:b };
    
    p.x -= camera.x + mc.width / 2;
    p.y -= camera.y + mc.height / 2;
    
    p = rotate(p, camera.rotation);
    
    p.x = p.x * camera.scale + mc.width / 2;
    p.y = p.y * camera.scale + mc.height / 2;
    
    return p;
}
function untransform(p, b)
{
    if (typeof b != "undefined")
        p = { x:p, y:b };
    p.x = (p.x - mc.width / 2) / camera.scale;
    p.y = (p.y - mc.height / 2) / camera.scale;
    
    p = rotate(p, -camera.rotation);
    
    p.x += camera.x + mc.width / 2;
    p.y += camera.y + mc.height / 2;
    
    return p;
}

function rotate(p, b, r)
{
    if (typeof r != "undefined")
        p = { x:p, y:b };
    if (typeof r == "undefined")
        r = b;
    
    r = r * Math.PI / 180;
    return { x:p.x * Math.cos(r) - p.y * Math.sin(r), y:p.x * Math.sin(r) + p.y * Math.cos(r) };
}

function transformx(p)
{
    return (p - camera.x - mc.width / 2) * camera.scale + mc.width / 2;
}
function transformy(p)
{
    return (p - camera.y - mc.height / 2) * camera.scale + mc.height / 2;
}
function untransformx(p)
{
    return (p - mc.width / 2) / camera.scale + camera.x + mc.width / 2;
}
function untransformy(p)
{
    return (p - mc.height / 2) / camera.scale + camera.y + mc.height / 2;
}

function Line(verts, color)
{
    this.verts = verts || [];
    this.color = color || "black";
    this.draw = function()
    {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        
        for (var i = 0; i < this.verts.length; i += 2)
            lineTo(transform(this.verts[i], this.verts[i + 1]));
        ctx.stroke();
    }
    this.calculateBoundingBox = function()
    {
        var xmin, xmax, ymin, ymax;
        for (var i = 0; i < this.verts.length; i++)
        {
            var p = this.verts[i];
            if (i % 2 == 0)
            {
                if (!xmin && !xmax)
                {
                    xmin = p;
                    xmax = p;
                }
                xmin = Math.min(xmin, p);
                xmax = Math.max(xmax, p);
            }
            else
            {
                if (!ymin && !ymax)
                {
                    ymin = p;
                    ymax = p;
                }
                ymin = Math.min(ymin, p);
                ymax = Math.max(ymax, p);
            }
        }
        this.boundingBox = {
            x:xmin,
            y:ymin,
            width:xmax - xmin,
            height:ymax - ymin
        }
    }
}

function readScript(s)
{
    clear();
    var f = s.substring(s.indexOf("{") + 1, s.indexOf("}"));
    var l = f.split(",");
    
    camera.x = +l[0];
    camera.y = +l[1];
    camera.scale = +l[2];
    camera.rotation = +l[3];
    s = s.substring(s.indexOf("}") + 1);
    
    while (s.indexOf("}") != -1)
    {
        var sb = s.indexOf("{");
        var eb = s.indexOf("}");
        
        var lsub = s.substring(sb + 1, eb);
        var col = lsub.substring(lsub.indexOf("(") + 1, lsub.indexOf(")"));
        var arr = lsub.substring(lsub.indexOf("[") + 1, lsub.indexOf("]")).split(",");
        for (var i in arr)
            arr[i] = +arr[i];
        
        var line = new Line(arr, col);
        line.calculateBoundingBox();
        lines.push(line);
        
        s = s.substring(eb + 1);
    }
}

function generateScript()
{
    var r = "";
    for (var i in lines)
    {
        var l = lines[i];
        r += "{" + camera.x + "," + camera.y + "," + camera.scale + "," + camera.rotation + "}{(" + l.color + ")[" + arrtostr(l.verts) + "]}";
    }
    return r;
}

function tofile(title, text)
{
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	a.setAttribute("download", title);
	a.click();
	document.body.removeChild(a);
}

function arrtostr(a)
{
    var r = "";
    for (var i in a)
        r += a[i] + ",";
    if (r != "")
        r = r.substring(0, r.length - 1);
    return r;
}