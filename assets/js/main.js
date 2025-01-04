import * as poly from "./poly.js";
import * as mtx from "./matrix.js";

/*
DOM elements
*/
const svgElement = document.getElementById("gridId");
const btnThemeText = document.getElementById("btnThemeText");
const header_row = document.getElementById("headerRow");
const themeButton = document.getElementById("btnTheme");
const shapeButton = document.getElementById("btnShape");
const clearButton = document.getElementById("btnClear");
const undoButton = document.getElementById("btnUndo");
const redoButton = document.getElementById("btnRedo");
const setCollinearityButton = document.getElementById("btnSetCollinearity");
const sizeElement = document.getElementById("sizeId");
const shapeText = document.getElementById("btnShapeText");
const collinearChoices = document.getElementById("collinearChoice");
const maxCollinear = document.getElementById("maxCollinear");
const collinearModal = document.getElementById("collinearModal");
const welcomeModal = document.getElementById("welcomeModal");

function set_shape() {
    if (shape == null) {
        shape = "hex";
        var s = sessionStorage.getItem("shape");
        if (s != null) shape = s;
    }
    if (shape == "squ") {
        shapeText.textContent = "square";
        shape_class = new poly.Square();
    } else {
        shapeText.textContent = "hexagon";
        shape_class = new poly.Hexagon();
    }

    collinearity = null;
    set_collinearity();

}

function set_collinearity() {
    if (collinearity == null) {
        collinearity = 3;
        var s = sessionStorage.getItem(`${shape}_collinearity`);
        if (s != null) collinearity = parseInt(s);
    }
    maxCollinear.textContent = collinearity.toString();
    document.getElementById(`co${collinearity}`).checked = true;
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
        .classed("invalid", d => {
            var cp = find_collinear(d);
            if (cp == null) {
                return false;
            }
            return true;
        })
        .classed("collinear", d => {
            if (collinear_points == null) return false;
            if (JSON.stringify(last_border_cell_selected) == JSON.stringify(d)) return true;
            return false;
        })
        .attr("points", d => {
            return shape_class.polygon_corners(layout, d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        })
        .on("click", d => {

            if (collinear_points != null && JSON.stringify(last_border_cell_selected) == JSON.stringify(d)) {
                collinear_points = null;
            } else {
                last_border_cell_selected = d;
                collinear_points = find_collinear(d);
                if (collinear_points == null) {
                    points.length = undo_index;
                    points.push(d);
                    undo_index += 1;
                    var sps = JSON.stringify(points);
                    sessionStorage.setItem(`${shape}_points`, sps);
                    sessionStorage.setItem(`${shape}_undo_index`, undo_index);
                } else {
                    set_collinear_line();
                }

            }
            refresh_ui();

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
        .classed("collinear", d => {
            if (collinear_points == null) return false;
            if (collinear_points.has(JSON.stringify(d))) {
                return true;
            }
        })
        .attr("points", d => {
            return shape_class.polygon_corners(layout, d).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")
        });
    update.exit().remove();

    update = g_cells.selectAll("circle").data(show_points);
    update.enter()
        .append("circle")
        .merge(update)
        .attr("r", cell_size / 10)
        .attr("cx", d => { return shape_class.to_pixel(layout, d).x.toFixed(0) })
        .attr("cy", d => { return shape_class.to_pixel(layout, d).y.toFixed(0) });

    update.exit().remove();

    // add the line
    if (collinear_points == null) {
        collinear_line = [];
    }
    update = g_cells.selectAll("line").data(collinear_line);
    update.enter()
        .append("line")
        .merge(update)
        .attr("x1", d => { return shape_class.to_pixel(layout, d[0]).x.toFixed(0) })
        .attr("y1", d => { return shape_class.to_pixel(layout, d[0]).y.toFixed(0) })
        .attr("x2", d => { return shape_class.to_pixel(layout, d[1]).x.toFixed(0) })
        .attr("y2", d => { return shape_class.to_pixel(layout, d[1]).y.toFixed(0) });
    update.exit().remove();


}


function set_layout() {
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

function set_header() {
    sizeElement.textContent = undo_index.toFixed(0);
    undoButton.disabled = (undo_index == 1);
    redoButton.disabled = (undo_index == points.length);
}

function refresh_ui() {
    update_grid();
    set_header();
    set_view_box();
}


function refresh_grid() {
    set_layout();
    get_points();
    backtrack();
    refresh_ui();
}

function find_collinear(np) {

    var vectors = [];
    for (var i = 0; i < undo_index; i++) {
        var p = points[i];
        const vec = p.map(function (v, j) { return v - np[j] })
        vectors.push(vec);
    }

    // build a dict of sets, each set is a set of parallel vectors
    const orthogonal = {};
    for (const v of vectors) {
        let new_value = true;
        for (const k in orthogonal) {
            var o = JSON.parse(k);
            if (mtx.are_parallel(v, o)) {
                var kv = JSON.stringify(v);
                orthogonal[k].add(kv);
                // if (at_least && orthogonal[o].size >= at_least) {
                //     return at_least + 1;
                // }                
                new_value = false;
                break;
            }
        }
        if (new_value) {
            var kv = JSON.stringify(v);
            orthogonal[JSON.stringify(v)] = new Set([kv]);
        }
    }

    for (const k in orthogonal) {
        o = orthogonal[k];
        if (o.size > collinearity - 1) {
            vectors = Array.from(o);
            var co_points = [JSON.stringify(np)];
            for (const vs of vectors) {
                var vec = JSON.parse(vs);
                var p = vec.map(function (v, j) { return v + np[j] })
                co_points.push(JSON.stringify(p));
            }
            return new Set(co_points);
        }
    }

    return null;

}

function backtrack() {
    // backtrack as needed to stay within the collinearity
    var i_limit = undo_index;
    for (var i = 1; i < i_limit; i++) {
        undo_index = i;
        var p = points[undo_index];
        var cp = find_collinear(p);
        if (cp != null) break;
        undo_index += 1;
    }
    sessionStorage.setItem(`${shape}_undo_index`, undo_index);
}

function set_collinear_line() {
    var cps = [];
    var arr = Array.from(collinear_points);
    for (const p of arr) {
        cps.push(JSON.parse(p));
    }
    var max_d = 0;
    for (var i = 0; i < cps.length; i++) {
        for (var j = i + 1; j < cps.length; j++) {
            var p = cps[i];
            var q = cps[j];
            var d = shape_class.manhattan(p, q);
            if (d > max_d) {
                collinear_line = [[p, q]];
                max_d = d;
            }
        }
    }
}


/*
=========================================================================
Button Events
=========================================================================
*/

/*
Dark Mode theme
*/
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
shapeButton.addEventListener("click", () => {
    if (shape == "squ") {
        shape = "hex";
    } else {
        shape = "squ";
    }
    sessionStorage.setItem("shape", shape);
    points = null;
    collinear_points = null;
    last_border_cell_selected = null;
    set_shape();
    refresh_grid();
});

/*
Clear
*/
clearButton.addEventListener("click", () => {
    sessionStorage.removeItem(`${shape}_points`);
    sessionStorage.removeItem(`${shape}_undo_index`);
    points = null;
    refresh_grid();
});

/*
Undo
*/
undoButton.addEventListener("click", () => {
    if (undo_index > 1) {
        undo_index -= 1;
        sessionStorage.setItem(`${shape}_undo_index`, undo_index);
        collinear_points = null;
        last_border_cell_selected = null;

    }
    refresh_grid();
});


/*
Redo
*/
redoButton.addEventListener("click", () => {
    if (undo_index < points.length) {
        last_border_cell_selected = points[undo_index]
        collinear_points = find_collinear(last_border_cell_selected);

        if (collinear_points == null) {
            undo_index += 1;
            sessionStorage.setItem(`${shape}_undo_index`, undo_index);
        }
    }
    refresh_grid();
});

/*
Collinearity
*/
setCollinearityButton.addEventListener("click", () => {
    var v = collinearChoices.querySelector("[name=collinear-options]:checked").getAttribute("value");
    var modal = bootstrap.Modal.getInstance(collinearModal)
    modal.hide();

    sessionStorage.setItem(`${shape}_collinearity`, v);
    collinearity = null;
    set_collinearity();

    collinear_points = null;
    last_border_cell_selected = null;

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
var collinearity;
var collinear_points;
var last_border_cell_selected;
var collinear_line;

theme = sessionStorage.getItem("theme", "light");
if (theme == null) {
    theme = "dark";
}
set_theme();
set_shape();
set_collinearity();

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

var seenWelcome = localStorage.getItem("seenWelcome");
if (seenWelcome == null) {
    localStorage.setItem("seenWelcome", true);
    var modal = new bootstrap.Modal(welcomeModal);
    modal.show();
}

refresh_grid();

