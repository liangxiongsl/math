import { intersectPolygon } from 'dagre-d3-es/src/dagre-js/intersect/intersect-polygon.js';
import { intersectRect } from 'dagre-d3-es/src/dagre-js/intersect/intersect-rect.js';

/**
 * @param parent
 * @param bbox
 * @param node
 */
function question(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const s = (w + h) * 0.9;
  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 },
  ];
  const shapeSvg = insertPolygonShape(parent, s, s, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function hexagon(parent, bbox, node) {
  const f = 4;
  const h = bbox.height;
  const m = h / f;
  const w = bbox.width + 2 * m;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function rect_left_inv_arrow(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function lean_right(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function lean_left(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (2 * h) / 6, y: 0 },
    { x: w + h / 6, y: 0 },
    { x: w - (2 * h) / 6, y: -h },
    { x: -h / 6, y: -h },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function trapezoid(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w + (2 * h) / 6, y: 0 },
    { x: w - h / 6, y: -h },
    { x: h / 6, y: -h },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function inv_trapezoid(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: h / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: (-2 * h) / 6, y: -h },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function rect_right_inv_arrow(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: 0, y: 0 },
    { x: w + h / 2, y: 0 },
    { x: w, y: -h / 2 },
    { x: w + h / 2, y: -h },
    { x: 0, y: -h },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function stadium(parent, bbox, node) {
  const h = bbox.height;
  const w = bbox.width + h / 4;

  const shapeSvg = parent
    .insert('rect', ':first-child')
    .attr('rx', h / 2)
    .attr('ry', h / 2)
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h);

  node.intersect = function (point) {
    return intersectRect(node, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function subroutine(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: w + 8, y: 0 },
    { x: w + 8, y: -h },
    { x: -8, y: -h },
    { x: -8, y: 0 },
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function (point) {
    return intersectPolygon(node, points, point);
  };
  return shapeSvg;
}

/**
 * @param parent
 * @param bbox
 * @param node
 */
function cylinder(parent, bbox, node) {
  const w = bbox.width;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = bbox.height + ry;

  const shape =
    'M 0,' +
    ry +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    -w +
    ' 0 l 0,' +
    h +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 l 0,' +
    -h;

  const shapeSvg = parent
    .attr('label-offset-y', ry)
    .insert('path', ':first-child')
    .attr('d', shape)
    .attr('transform', 'translate(' + -w / 2 + ',' + -(h / 2 + ry) + ')');

  node.intersect = function (point) {
    const pos = intersectRect(node, point);
    const x = pos.x - node.x;

    if (
      rx != 0 &&
      (Math.abs(x) < node.width / 2 ||
        (Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry))
    ) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjusted value for pos.y
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) {
        y = Math.sqrt(y);
      }
      y = ry - y;
      if (point.y - node.y > 0) {
        y = -y;
      }

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
}

/** @param render */
export function addToRender(render) {
  render.shapes().question = question;
  render.shapes().hexagon = hexagon;
  render.shapes().stadium = stadium;
  render.shapes().subroutine = subroutine;
  render.shapes().cylinder = cylinder;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().rect_left_inv_arrow = rect_left_inv_arrow;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().lean_right = lean_right;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().lean_left = lean_left;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().trapezoid = trapezoid;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().inv_trapezoid = inv_trapezoid;

  // Add custom shape for box with inverted arrow on right side
  render.shapes().rect_right_inv_arrow = rect_right_inv_arrow;
}

/** @param addShape */
export function addToRenderV2(addShape) {
  addShape({ question });
  addShape({ hexagon });
  addShape({ stadium });
  addShape({ subroutine });
  addShape({ cylinder });

  // Add custom shape for box with inverted arrow on left side
  addShape({ rect_left_inv_arrow });

  // Add custom shape for box with inverted arrow on left side
  addShape({ lean_right });

  // Add custom shape for box with inverted arrow on left side
  addShape({ lean_left });

  // Add custom shape for box with inverted arrow on left side
  addShape({ trapezoid });

  // Add custom shape for box with inverted arrow on left side
  addShape({ inv_trapezoid });

  // Add custom shape for box with inverted arrow on right side
  addShape({ rect_right_inv_arrow });
}

/**
 * @param parent
 * @param w
 * @param h
 * @param points
 */
function insertPolygonShape(parent, w, h, points) {
  return parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function (d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    )
    .attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}

export default {
  addToRender,
  addToRenderV2,
};
