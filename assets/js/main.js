import * as poly from "./poly.js";
// import { evaluate } from "https://cdn.jsdelivr.net/npm/mathjs@14.0.1/+esm";

function set_shape() {
    if (shape == null) {
        shape = "hex";
        var s = sessionStorage.getItem("shape");
        if (s != null) shape = s;
    }
    const btn = document.getElementById("btnShapeText");
    if (shape == "squ") {
        btn.textContent = "square";
        shape_class = new poly.Square();
    } else {
        btn.textContent = "hexagon";
        shape_class = new poly.Hexagon();
    }
}

function get_points() {
    // Get points from session storage
    if (points == null) {
        points = [shape_class.origin];
        var ps = sessionStorage.getItem(`${shape}_points`);
        if (ps != null) {
            points = JSON.parse(ps);
        }
    }

    undo_index = points.length;
    var ui = sessionStorage.getItem(`${shape}_undo_index`);
    if (ui != null) {
        undo_index = parseInt(ui);
    }

}

function update_grid() {

    var update;

    // generate the border
    border = shape_class.border(points, undo_index = undo_index);

    update = g_border.selectAll("polygon").data(border);
    update.enter()
        .append("polygon")
        .merge(update)
        .attr("points", d => {
            return shape_class.polygon_corners(layout, d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        })
        .on("click", d => {
            points.length = undo_index;
            points.push(d);
            undo_index += 1;
            var sps = JSON.stringify(points);
            sessionStorage.setItem(`${shape}_points`, sps);
            sessionStorage.setItem(`${shape}_undo_index`, undo_index);
            update_grid();
            set_view_box();
        });
    update.exit().remove();

    // Points - up to the undo index
    var show_points = [];
    for (var i = 0; i < undo_index; i++) {
        show_points.push(points[i]);
    }

    update = g_cells.selectAll("polygon").data(show_points);
    update.enter()
        .append("polygon")
        .merge(update)
        .attr("points", d => {
            return shape_class.polygon_corners(layout, d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        });
    update.exit().remove();

    update = g_cells.selectAll("circle").data(show_points);
    update.enter()
        .append("circle")
        .merge(update)
        .attr("r", cell_size / 20)
        .attr("cx", d => { return shape_class.to_pixel(layout, d).x.toFixed(0) })
        .attr("cy", d => { return shape_class.to_pixel(layout, d).y.toFixed(0) });

    update.exit().remove();

}


function set_layout() {
    const header_row = document.getElementById("headerRow");
    wdw_w = window.innerWidth;
    wdw_h = window.innerHeight - header_row.offsetHeight - 10;
    const g_origin = new poly.Point(wdw_w / 2, wdw_h / 2);
    let sz = new poly.Point(cell_size, cell_size);
    layout = new poly.Layout(sz, g_origin);
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
    const svgElement = document.getElementById("gridId");
    const btnThemeText = document.getElementById("btnThemeText");

    if (theme == "light") {
        btnThemeText.textContent = "dark_mode";
        document.documentElement.setAttribute("data-bs-theme", "light")
        svgElement.classList.remove("dark");
        sessionStorage.setItem("theme", "light");
    }
    else {
        btnThemeText.textContent = "light_mode";
        document.documentElement.setAttribute("data-bs-theme", "dark")
        svgElement.classList.add("dark");
        sessionStorage.setItem("theme", "dark");
    }
}


function refresh_grid() {
    set_layout();
    get_points();
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
const themeButton = document.getElementById("btnTheme");
themeButton.addEventListener("click", () => {
    if (theme == "light") {
        theme = "dark";
    } else {
        theme = "light";
    }
    set_theme();
});

/*
Shape mode
*/
const shapeButton = document.getElementById("btnShape");
shapeButton.addEventListener("click", () => {
    if (shape == "squ") {
        shape = "hex";
    } else {
        shape = "squ";
    }
    sessionStorage.setItem("shape", shape);
    points = null;
    set_shape();
    refresh_grid();
});

/*
Clear
*/
const clearButton = document.getElementById("btnClear");
clearButton.addEventListener("click", () => {
    sessionStorage.removeItem(`${shape}_points`);
    sessionStorage.removeItem(`${shape}_undo_index`);
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
        sessionStorage.setItem(`${shape}_undo_index`, undo_index);
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
        sessionStorage.setItem(`${shape}_undo_index`, undo_index);
    }
    refresh_grid();
});


/*
=========================================================================
MAIN Script
=========================================================================
*/
const cell_size = 20;
var points;
var border;
var theme;
var undo_index = 0;
var shape;
var layout;
var wdw_w;
var wdw_h;
var shape_class;

theme = sessionStorage.getItem("theme", "light");
if (theme == null) {
    theme = "dark";
}
set_theme();
set_shape();

/*
SVG and graphic elements
*/

d3.select("div#gridId")
    .append("svg")
    // Responsive SVG needs these 2 attributes and no width and height attr.
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 0 0")

var svg = d3.select("svg"),
    g_border = svg.append("g").classed("border", true),
    g_cells = svg.append("g").classed("cell", true);

/*
!! Go !!
*/
refresh_grid();

