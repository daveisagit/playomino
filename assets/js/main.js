import * as rb from "./hex.js";
import { evaluate } from "https://cdn.jsdelivr.net/npm/mathjs@14.0.1/+esm";

function get_points() {
    // Get points from session storage
    if (points == null) {
        const default_points = [new rb.Hex(0, 0, 0)];
        var ps = sessionStorage.getItem("points");
        if (ps == null) {
            points = default_points;
        } else {
            points = [];
            ps = JSON.parse(ps);
            for (const h of ps) {
                points.push(new rb.Hex(h.q, h.r, h.s));
            }
        }
    }

    undo_index = points.length;
    var ui = sessionStorage.getItem("undo_index");
    if (ui != null) {
        undo_index = parseInt(ui);
    }

}

function set_border() {
    var point_set = new Set();
    for (var i = 0; i < undo_index; i++) {
        var p = point_set[p];
        point_set.add(JSON.stringify(p));
    }
    var border_set = new Set();
    for (var i = 0; i < undo_index; i++) {
        var h = points[i];
        for (const d of rb.Hex.directions) {
            var b = h.add(d);
            b = JSON.stringify(b)
            if (!point_set.has(b)) {
                border_set.add(b);
            }
        }
    }
    border = [];
    for (const b of border_set) {
        var h = JSON.parse(b);
        border.push(new rb.Hex(h.q, h.r, h.s));
    }

}

function update_grid() {

    var update;

    // Border
    update = g_border.selectAll("polygon").data(border);
    update.enter()
        .append("polygon")
        .merge(update)
        .attr("points", d => {
            return layout.polygonCorners(d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        })
        .on("click", d => {
            points.length = undo_index;
            points.push(d);
            undo_index += 1;
            var sps = JSON.stringify(points);
            sessionStorage.setItem("points", sps);
            sessionStorage.setItem("undo_index", undo_index);
            set_border();
            update_grid();
            set_view_box();
        });
    update.exit().remove();

    // Points
    var show_points = [];
    for (var i = 0; i < undo_index; i++) {
        show_points.push(points[i]);
    }
    update = g_cells.selectAll("polygon").data(show_points);
    update.enter()
        .append("polygon")
        .merge(update)
        .attr("points", d => {
            return layout.polygonCorners(d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        });
    update.exit().remove();

}


function set_view_box() {
    /*
    Keep the <g> border element central and of optimal size to fill the space
    */
    let box = g_border.node().getBBox();
    let wdw_r = wdw_h / wdw_w;
    let box_wdw_ratio = box.width / wdw_w;
    let req_h = box.height / box_wdw_ratio;
    let wdw_clip = req_h - wdw_h;
    let extra_width = 0;
    let svg_margin = 1;
    if (wdw_clip > 0) {
        wdw_clip = wdw_clip / wdw_r;
        extra_width = (wdw_clip / 2) * box_wdw_ratio;
        extra_width = extra_width.toFixed(0);
    }

    var
        vb_x = box.x - svg_margin - extra_width,
        vb_y = box.y - svg_margin,
        vb_w = box.width + svg_margin * 2 + extra_width * 2,
        vb_h = box.height + svg_margin * 2;

    svg.transition().attr("viewBox", `${vb_x} ${vb_y} ${vb_w} ${vb_h}`)
}


function set_theme() {
    if (theme == "light") {
        themeButton.classList.add("bx-moon");
        themeButton.classList.remove("bx-sun");
        document.documentElement.setAttribute("data-bs-theme", "light")
        svgElement.classList.remove("dark");
        sessionStorage.setItem("theme", "light");
    }
    else {
        themeButton.classList.add("bx-sun");
        themeButton.classList.remove("bx-moon");
        document.documentElement.setAttribute("data-bs-theme", "dark")
        svgElement.classList.add("dark");
        sessionStorage.setItem("theme", "dark");
    }
}


function refresh_grid() {
    get_points();
    set_border();
    update_grid();
    set_view_box();
}



/*
=========================================================================
Button Events
=========================================================================
*/

/*
Dark Mode theme
*/
const themeButton = document.getElementById("theme-button");
const svgElement = document.getElementById("gridId");
themeButton.addEventListener("click", () => {
    if (theme == "light") {
        theme = "dark";
    } else {
        theme = "light";
    }
    set_theme();
});

/*
Clear
*/
const clearButton = document.getElementById("btnClear");
clearButton.addEventListener("click", () => {
    sessionStorage.clear("points");
    points = null;
    refresh_grid();
});

/*
Undo
*/
const undoButton = document.getElementById("btnUndo");
undoButton.addEventListener("click", () => {
    if (undo_index > 1) {
        undo_index -= 1;
        sessionStorage.setItem("undo_index", undo_index);
    }
    refresh_grid();
});


/*
Redo
*/
const redoButton = document.getElementById("btnRedo");
redoButton.addEventListener("click", () => {
    if (undo_index < points.length) {
        undo_index += 1;
        sessionStorage.setItem("undo_index", undo_index);
    }
    refresh_grid();
});


window.addEventListener('resize', function (event) {
    refresh_grid();
});

window.addEventListener('orientationchange', function (event) {
    refresh_grid();
});


/*
=========================================================================
MAIN Script
=========================================================================
*/
var wdw_w = window.innerWidth;
var wdw_h = window.innerHeight - 100;

var points;
var border;
var theme;
var undo_index = 0;

/*
Sizing and global objects
*/

const
    cell_size = 20,
    g_origin = new rb.Point(wdw_w / 2, wdw_h / 2);

let
    sz = new rb.Point(cell_size, cell_size),
    layout = new rb.Layout(rb.Layout.pointy, sz, g_origin);

// console.log("result:", evaluate("sqrt(-4)").toString())

d3.select("div#gridId")
    .append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${wdw_w} ${wdw_h}`)

var svg = d3.select("svg"),
    g_border = svg.append("g").classed("border", true),
    g_cells = svg.append("g").classed("cell", true);


theme = sessionStorage.getItem("theme", "light");
if (theme == null) {
    theme = "light";
}
set_theme();

/*
!! Go !!
*/
refresh_grid();

