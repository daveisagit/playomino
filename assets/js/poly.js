
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Layout {
    constructor(size, origin) {
        this.size = size;
        this.origin = origin;
    }
}

class Shape {
    constructor() {
        if (new.target === Shape) {
            throw new TypeError("Cannot construct Shape instances directly");
        }
    }
    polygon_corners(layout, h) {
        var corners = [];
        var center = this.to_pixel(layout, h);
        for (var i = 0; i < this.sides; i++) {
            var angle = 2.0 * Math.PI * (i - this.corner_offset) / this.sides;
            corners.push(new Point(center.x + layout.size.x * Math.sin(angle), center.y + layout.size.y * Math.cos(angle)));
        }
        return corners;
    }
    neighbours(p) {
        var res = [];
        for (const dv of this.directions) {
            var n = p.map(function (v, i) {
                return v + dv[i];
            });
            res.push(n);
        }
        return res;
    }
    border(ps) {
        var bs = new Set();
        for (const s of ps) {
            var p = JSON.parse(s);
            for (const n of this.neighbours(p)) {
                var b = JSON.stringify(n)
                if (!ps.has(b)) {
                    bs.add(b);
                }
            }
        }
        return bs;
    }
}


export class Hexagon extends Shape {
    constructor() {
        super();
        this.sides = 6;
        this.dimensions = 3;
        this.origin = [0, 0, 0];
        this.directions = [
            [1, 0, -1],
            [1, -1, 0],
            [0, -1, 1],
            [-1, 0, 1],
            [-1, 1, 0],
            [0, 1, -1]
        ];
        this.corner_offset = 0.0;
    }
    to_pixel(layout, h) {
        const r3 = Math.sqrt(3.0);
        var size = layout.size;
        var origin = layout.origin;
        var x = (r3 * h[0] + r3 * h[1] / 2) * size.x;
        var y = (3 * h[1] / 2) * size.y;
        return new Point(x + origin.x, y + origin.y);
    }
    manhattan(p, q) {
        return (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])) / 2;
    }
}

export class Square extends Shape {
    constructor() {
        super();
        this.sides = 4;
        this.dimensions = 2;
        this.origin = [0, 0];
        this.directions = [
            [0, 1], [-1, 0], [0, -1], [1, 0]
        ];
        this.corner_offset = 0.5;
    }
    to_pixel(layout, h) {
        const r2 = Math.sqrt(2.0);
        var size = layout.size;
        var origin = layout.origin;
        var x = r2 * h[0] * size.x;
        var y = r2 * h[1] * size.y;
        return new Point(x + origin.x, y + origin.y);
    }
    manhattan(p, q) {
        return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
    }

}
