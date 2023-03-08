// @ts-nocheck TODO: fix file
import { select, selectAll } from 'd3';
import svgDraw, { drawText, fixLifeLineHeights } from './svgDraw';
import { log } from '../../logger';
import common from '../common/common';
import * as configApi from '../../config';
import assignWithDepth from '../../assignWithDepth';
import utils from '../../utils';
import { configureSvgSize } from '../../setupGraphViewbox';
import { Diagram } from '../../Diagram';

let conf = {};

export const bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined,
  },
  verticalPos: 0,
  sequenceItems: [],
  activations: [],
  models: {
    getHeight: function () {
      return (
        Math.max.apply(
          null,
          this.actors.length === 0 ? [0] : this.actors.map((actor) => actor.height || 0)
        ) +
        (this.loops.length === 0
          ? 0
          : this.loops.map((it) => it.height || 0).reduce((acc, h) => acc + h)) +
        (this.messages.length === 0
          ? 0
          : this.messages.map((it) => it.height || 0).reduce((acc, h) => acc + h)) +
        (this.notes.length === 0
          ? 0
          : this.notes.map((it) => it.height || 0).reduce((acc, h) => acc + h))
      );
    },
    clear: function () {
      this.actors = [];
      this.boxes = [];
      this.loops = [];
      this.messages = [];
      this.notes = [];
    },
    addBox: function (boxModel) {
      this.boxes.push(boxModel);
    },
    addActor: function (actorModel) {
      this.actors.push(actorModel);
    },
    addLoop: function (loopModel) {
      this.loops.push(loopModel);
    },
    addMessage: function (msgModel) {
      this.messages.push(msgModel);
    },
    addNote: function (noteModel) {
      this.notes.push(noteModel);
    },
    lastActor: function () {
      return this.actors[this.actors.length - 1];
    },
    lastLoop: function () {
      return this.loops[this.loops.length - 1];
    },
    lastMessage: function () {
      return this.messages[this.messages.length - 1];
    },
    lastNote: function () {
      return this.notes[this.notes.length - 1];
    },
    actors: [],
    boxes: [],
    loops: [],
    messages: [],
    notes: [],
  },
  init: function () {
    this.sequenceItems = [];
    this.activations = [];
    this.models.clear();
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined,
    };
    this.verticalPos = 0;
    setConf(configApi.getConfig());
  },
  updateVal: function (obj, key, val, fun) {
    if (obj[key] === undefined) {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function (startx, starty, stopx, stopy) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _self = this;
    let cnt = 0;
    /** @param type - Either `activation` or `undefined` */
    function updateFn(type?: 'activation') {
      return function updateItemBounds(item) {
        cnt++;
        // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems
        const n = _self.sequenceItems.length - cnt + 1;

        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min);
        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max);

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);
        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min);
          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max);

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);
          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
        }
      };
    }

    this.sequenceItems.forEach(updateFn());
    this.activations.forEach(updateFn('activation'));
  },
  insert: function (startx, starty, stopx, stopy) {
    const _startx = Math.min(startx, stopx);
    const _stopx = Math.max(startx, stopx);
    const _starty = Math.min(starty, stopy);
    const _stopy = Math.max(starty, stopy);

    this.updateVal(bounds.data, 'startx', _startx, Math.min);
    this.updateVal(bounds.data, 'starty', _starty, Math.min);
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max);
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max);

    this.updateBounds(_startx, _starty, _stopx, _stopy);
  },
  newActivation: function (message, diagram, actors) {
    const actorRect = actors[message.from.actor];
    const stackedSize = actorActivations(message.from.actor).length || 0;
    const x = actorRect.x + actorRect.width / 2 + ((stackedSize - 1) * conf.activationWidth) / 2;
    this.activations.push({
      startx: x,
      starty: this.verticalPos + 2,
      stopx: x + conf.activationWidth,
      stopy: undefined,
      actor: message.from.actor,
      anchored: svgDraw.anchorElement(diagram),
    });
  },
  endActivation: function (message) {
    // find most recent activation for given actor
    const lastActorActivationIdx = this.activations
      .map(function (activation) {
        return activation.actor;
      })
      .lastIndexOf(message.from.actor);
    return this.activations.splice(lastActorActivationIdx, 1)[0];
  },
  createLoop: function (title = { message: undefined, wrap: false, width: undefined }, fill) {
    return {
      startx: undefined,
      starty: this.verticalPos,
      stopx: undefined,
      stopy: undefined,
      title: title.message,
      wrap: title.wrap,
      width: title.width,
      height: 0,
      fill: fill,
    };
  },
  newLoop: function (title = { message: undefined, wrap: false, width: undefined }, fill) {
    this.sequenceItems.push(this.createLoop(title, fill));
  },
  endLoop: function () {
    return this.sequenceItems.pop();
  },
  addSectionToLoop: function (message) {
    const loop = this.sequenceItems.pop();
    loop.sections = loop.sections || [];
    loop.sectionTitles = loop.sectionTitles || [];
    loop.sections.push({ y: bounds.getVerticalPos(), height: 0 });
    loop.sectionTitles.push(message);
    this.sequenceItems.push(loop);
  },
  bumpVerticalPos: function (bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function () {
    return this.verticalPos;
  },
  getBounds: function () {
    return { bounds: this.data, models: this.models };
  },
};

/** Options for drawing a note in {@link drawNote} */
interface NoteModel {
  /** x axis start position */
  startx: number;
  /** y axis position */
  starty: number;
  /** the message to be shown */
  message: string;
  /** Set this with a custom width to override the default configured width. */
  width: number;
}

/**
 * Draws an note in the diagram with the attached line
 *
 * @param elem - The diagram to draw to.
 * @param noteModel - Note model options.
 */
const drawNote = function (elem: any, noteModel: NoteModel) {
  bounds.bumpVerticalPos(conf.boxMargin);
  noteModel.height = conf.boxMargin;
  noteModel.starty = bounds.getVerticalPos();
  const rect = svgDraw.getNoteRect();
  rect.x = noteModel.startx;
  rect.y = noteModel.starty;
  rect.width = noteModel.width || conf.width;
  rect.class = 'note';

  const g = elem.append('g');
  const rectElem = svgDraw.drawRect(g, rect);
  const textObj = svgDraw.getTextObj();
  textObj.x = noteModel.startx;
  textObj.y = noteModel.starty;
  textObj.width = rect.width;
  textObj.dy = '1em';
  textObj.text = noteModel.message;
  textObj.class = 'noteText';
  textObj.fontFamily = conf.noteFontFamily;
  textObj.fontSize = conf.noteFontSize;
  textObj.fontWeight = conf.noteFontWeight;
  textObj.anchor = conf.noteAlign;
  textObj.textMargin = conf.noteMargin;
  textObj.valign = 'center';

  const textElem = drawText(g, textObj);

  const textHeight = Math.round(
    textElem
      .map((te) => (te._groups || te)[0][0].getBBox().height)
      .reduce((acc, curr) => acc + curr)
  );

  rectElem.attr('height', textHeight + 2 * conf.noteMargin);
  noteModel.height += textHeight + 2 * conf.noteMargin;
  bounds.bumpVerticalPos(textHeight + 2 * conf.noteMargin);
  noteModel.stopy = noteModel.starty + textHeight + 2 * conf.noteMargin;
  noteModel.stopx = noteModel.startx + rect.width;
  bounds.insert(noteModel.startx, noteModel.starty, noteModel.stopx, noteModel.stopy);
  bounds.models.addNote(noteModel);
};

const messageFont = (cnf) => {
  return {
    fontFamily: cnf.messageFontFamily,
    fontSize: cnf.messageFontSize,
    fontWeight: cnf.messageFontWeight,
  };
};
const noteFont = (cnf) => {
  return {
    fontFamily: cnf.noteFontFamily,
    fontSize: cnf.noteFontSize,
    fontWeight: cnf.noteFontWeight,
  };
};
const actorFont = (cnf) => {
  return {
    fontFamily: cnf.actorFontFamily,
    fontSize: cnf.actorFontSize,
    fontWeight: cnf.actorFontWeight,
  };
};

/**
 * Process a message by adding its dimensions to the bound. It returns the Y coordinate of the
 * message so it can be drawn later. We do not draw the message at this point so the arrowhead can
 * be on top of the activation box.
 *
 * @param _diagram - The parent of the message element.
 * @param msgModel - The model containing fields describing a message
 * @returns `lineStartY` - The Y coordinate at which the message line starts
 */
function boundMessage(_diagram, msgModel): number {
  bounds.bumpVerticalPos(10);
  const { startx, stopx, message } = msgModel;
  const lines = common.splitBreaks(message).length;
  const textDims = utils.calculateTextDimensions(message, messageFont(conf));
  const lineHeight = textDims.height / lines;
  msgModel.height += lineHeight;

  bounds.bumpVerticalPos(lineHeight);

  let lineStartY;
  let totalOffset = textDims.height - 10;
  const textWidth = textDims.width;

  if (startx === stopx) {
    lineStartY = bounds.getVerticalPos() + totalOffset;
    if (!conf.rightAngles) {
      totalOffset += conf.boxMargin;
      lineStartY = bounds.getVerticalPos() + totalOffset;
    }
    totalOffset += 30;
    const dx = Math.max(textWidth / 2, conf.width / 2);
    bounds.insert(
      startx - dx,
      bounds.getVerticalPos() - 10 + totalOffset,
      stopx + dx,
      bounds.getVerticalPos() + 30 + totalOffset
    );
  } else {
    totalOffset += conf.boxMargin;
    lineStartY = bounds.getVerticalPos() + totalOffset;
    bounds.insert(startx, lineStartY - 10, stopx, lineStartY);
  }
  bounds.bumpVerticalPos(totalOffset);
  msgModel.height += totalOffset;
  msgModel.stopy = msgModel.starty + msgModel.height;
  bounds.insert(msgModel.fromBounds, msgModel.starty, msgModel.toBounds, msgModel.stopy);

  return lineStartY;
}

/**
 * Draws a message. Note that the bounds have previously been updated by boundMessage.
 *
 * @param diagram - The parent of the message element
 * @param msgModel - The model containing fields describing a message
 * @param lineStartY - The Y coordinate at which the message line starts
 * @param diagObj - The diagram object.
 */
const drawMessage = function (diagram, msgModel, lineStartY: number, diagObj: Diagram) {
  const { startx, stopx, starty, message, type, sequenceIndex, sequenceVisible } = msgModel;
  const textDims = utils.calculateTextDimensions(message, messageFont(conf));
  const textObj = svgDraw.getTextObj();
  textObj.x = startx;
  textObj.y = starty + 10;
  textObj.width = stopx - startx;
  textObj.class = 'messageText';
  textObj.dy = '1em';
  textObj.text = message;
  textObj.fontFamily = conf.messageFontFamily;
  textObj.fontSize = conf.messageFontSize;
  textObj.fontWeight = conf.messageFontWeight;
  textObj.anchor = conf.messageAlign;
  textObj.valign = 'center';
  textObj.textMargin = conf.wrapPadding;
  textObj.tspan = false;

  drawText(diagram, textObj);

  const textWidth = textDims.width;

  let line;
  if (startx === stopx) {
    if (conf.rightAngles) {
      line = diagram
        .append('path')
        .attr(
          'd',
          `M  ${startx},${lineStartY} H ${startx + Math.max(conf.width / 2, textWidth / 2)} V ${
            lineStartY + 25
          } H ${startx}`
        );
    } else {
      line = diagram
        .append('path')
        .attr(
          'd',
          'M ' +
            startx +
            ',' +
            lineStartY +
            ' C ' +
            (startx + 60) +
            ',' +
            (lineStartY - 10) +
            ' ' +
            (startx + 60) +
            ',' +
            (lineStartY + 30) +
            ' ' +
            startx +
            ',' +
            (lineStartY + 20)
        );
    }
  } else {
    line = diagram.append('line');
    line.attr('x1', startx);
    line.attr('y1', lineStartY);
    line.attr('x2', stopx);
    line.attr('y2', lineStartY);
  }
  // Make an SVG Container
  // Draw the line
  if (
    type === diagObj.db.LINETYPE.DOTTED ||
    type === diagObj.db.LINETYPE.DOTTED_CROSS ||
    type === diagObj.db.LINETYPE.DOTTED_POINT ||
    type === diagObj.db.LINETYPE.DOTTED_OPEN
  ) {
    line.style('stroke-dasharray', '3, 3');
    line.attr('class', 'messageLine1');
  } else {
    line.attr('class', 'messageLine0');
  }

  let url = '';
  if (conf.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  line.attr('stroke-width', 2);
  line.attr('stroke', 'none'); // handled by theme/css anyway
  line.style('fill', 'none'); // remove any fill colour
  if (type === diagObj.db.LINETYPE.SOLID || type === diagObj.db.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)');
  }
  if (type === diagObj.db.LINETYPE.SOLID_POINT || type === diagObj.db.LINETYPE.DOTTED_POINT) {
    line.attr('marker-end', 'url(' + url + '#filled-head)');
  }

  if (type === diagObj.db.LINETYPE.SOLID_CROSS || type === diagObj.db.LINETYPE.DOTTED_CROSS) {
    line.attr('marker-end', 'url(' + url + '#crosshead)');
  }

  // add node number
  if (sequenceVisible || conf.showSequenceNumbers) {
    line.attr('marker-start', 'url(' + url + '#sequencenumber)');
    diagram
      .append('text')
      .attr('x', startx)
      .attr('y', lineStartY + 4)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('class', 'sequenceNumber')
      .text(sequenceIndex);
  }
};

export const drawActors = function (
  diagram,
  actors,
  actorKeys,
  verticalPos,
  configuration,
  messages,
  isFooter
) {
  if (configuration.hideUnusedParticipants === true) {
    const newActors = new Set();
    messages.forEach((message) => {
      newActors.add(message.from);
      newActors.add(message.to);
    });
    actorKeys = actorKeys.filter((actorKey) => newActors.has(actorKey));
  }

  // Draw the actors
  let prevWidth = 0;
  let prevMargin = 0;
  let maxHeight = 0;
  let prevBox = undefined;

  for (const actorKey of actorKeys) {
    const actor = actors[actorKey];
    const box = actor.box;

    // end of box
    if (prevBox && prevBox != box) {
      if (!isFooter) {
        bounds.models.addBox(prevBox);
      }
      prevMargin += conf.boxMargin + prevBox.margin;
    }

    // new box
    if (box && box != prevBox) {
      if (!isFooter) {
        box.x = prevWidth + prevMargin;
        box.y = verticalPos;
      }
      prevMargin += box.margin;
    }

    // Add some rendering data to the object
    actor.width = actor.width || conf.width;
    actor.height = Math.max(actor.height || conf.height, conf.height);
    actor.margin = actor.margin || conf.actorMargin;

    actor.x = prevWidth + prevMargin;
    actor.y = bounds.getVerticalPos();

    // Draw the box with the attached line
    const height = svgDraw.drawActor(diagram, actor, conf, isFooter);
    maxHeight = Math.max(maxHeight, height);
    bounds.insert(actor.x, verticalPos, actor.x + actor.width, actor.height);

    prevWidth += actor.width + prevMargin;
    if (actor.box) {
      actor.box.width = prevWidth + box.margin - actor.box.x;
    }
    prevMargin = actor.margin;
    prevBox = actor.box;
    bounds.models.addActor(actor);
  }

  // end of box
  if (prevBox && !isFooter) {
    bounds.models.addBox(prevBox);
  }

  // Add a margin between the actor boxes and the first arrow
  bounds.bumpVerticalPos(maxHeight);
};

export const drawActorsPopup = function (diagram, actors, actorKeys, doc) {
  let maxHeight = 0;
  let maxWidth = 0;
  for (const actorKey of actorKeys) {
    const actor = actors[actorKey];
    const minMenuWidth = getRequiredPopupWidth(actor);
    const menuDimensions = svgDraw.drawPopup(
      diagram,
      actor,
      minMenuWidth,
      conf,
      conf.forceMenus,
      doc
    );
    if (menuDimensions.height > maxHeight) {
      maxHeight = menuDimensions.height;
    }
    if (menuDimensions.width + actor.x > maxWidth) {
      maxWidth = menuDimensions.width + actor.x;
    }
  }

  return { maxHeight: maxHeight, maxWidth: maxWidth };
};

export const setConf = function (cnf) {
  assignWithDepth(conf, cnf);

  if (cnf.fontFamily) {
    conf.actorFontFamily = conf.noteFontFamily = conf.messageFontFamily = cnf.fontFamily;
  }
  if (cnf.fontSize) {
    conf.actorFontSize = conf.noteFontSize = conf.messageFontSize = cnf.fontSize;
  }
  if (cnf.fontWeight) {
    conf.actorFontWeight = conf.noteFontWeight = conf.messageFontWeight = cnf.fontWeight;
  }
};

const actorActivations = function (actor) {
  return bounds.activations.filter(function (activation) {
    return activation.actor === actor;
  });
};

const activationBounds = function (actor, actors) {
  // handle multiple stacked activations for same actor
  const actorObj = actors[actor];
  const activations = actorActivations(actor);

  const left = activations.reduce(function (acc, activation) {
    return Math.min(acc, activation.startx);
  }, actorObj.x + actorObj.width / 2);
  const right = activations.reduce(function (acc, activation) {
    return Math.max(acc, activation.stopx);
  }, actorObj.x + actorObj.width / 2);
  return [left, right];
};

function adjustLoopHeightForWrap(loopWidths, msg, preMargin, postMargin, addLoopFn) {
  bounds.bumpVerticalPos(preMargin);
  let heightAdjust = postMargin;
  if (msg.id && msg.message && loopWidths[msg.id]) {
    const loopWidth = loopWidths[msg.id].width;
    const textConf = messageFont(conf);
    msg.message = utils.wrapLabel(`[${msg.message}]`, loopWidth - 2 * conf.wrapPadding, textConf);
    msg.width = loopWidth;
    msg.wrap = true;

    // const lines = common.splitBreaks(msg.message).length;
    const textDims = utils.calculateTextDimensions(msg.message, textConf);
    const totalOffset = Math.max(textDims.height, conf.labelBoxHeight);
    heightAdjust = postMargin + totalOffset;
    log.debug(`${totalOffset} - ${msg.message}`);
  }
  addLoopFn(msg);
  bounds.bumpVerticalPos(heightAdjust);
}

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 *
 * @param _text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = function (_text: string, id: string, _version: string, diagObj: Diagram) {
  const { securityLevel, sequence } = configApi.getConfig();
  conf = sequence;
  diagObj.db.clear();
  // Parse the graph definition
  diagObj.parser.parse(_text);
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }

  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
  bounds.init();
  log.debug(diagObj.db);

  const diagram =
    securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : select(`[id="${id}"]`);

  // Fetch data from the parsing
  const actors = diagObj.db.getActors();
  const boxes = diagObj.db.getBoxes();
  const actorKeys = diagObj.db.getActorKeys();
  const messages = diagObj.db.getMessages();
  const title = diagObj.db.getDiagramTitle();
  const hasBoxes = diagObj.db.hasAtLeastOneBox();
  const hasBoxTitles = diagObj.db.hasAtLeastOneBoxWithTitle();
  const maxMessageWidthPerActor = getMaxMessageWidthPerActor(actors, messages, diagObj);
  conf.height = calculateActorMargins(actors, maxMessageWidthPerActor, boxes);

  svgDraw.insertComputerIcon(diagram);
  svgDraw.insertDatabaseIcon(diagram);
  svgDraw.insertClockIcon(diagram);

  if (hasBoxes) {
    bounds.bumpVerticalPos(conf.boxMargin);
    if (hasBoxTitles) {
      bounds.bumpVerticalPos(boxes[0].textMaxHeight);
    }
  }

  drawActors(diagram, actors, actorKeys, 0, conf, messages, false);
  const loopWidths = calculateLoopBounds(messages, actors, maxMessageWidthPerActor, diagObj);

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram);
  svgDraw.insertArrowCrossHead(diagram);
  svgDraw.insertArrowFilledHead(diagram);
  svgDraw.insertSequenceNumber(diagram);

  /**
   * @param msg - The message to draw.
   * @param verticalPos - The vertical position of the message.
   */
  function activeEnd(msg: any, verticalPos: number) {
    const activationData = bounds.endActivation(msg);
    if (activationData.starty + 18 > verticalPos) {
      activationData.starty = verticalPos - 6;
      verticalPos += 12;
    }
    svgDraw.drawActivation(
      diagram,
      activationData,
      verticalPos,
      conf,
      actorActivations(msg.from.actor).length
    );

    bounds.insert(activationData.startx, verticalPos - 10, activationData.stopx, verticalPos);
  }

  // Draw the messages/signals
  let sequenceIndex = 1;
  let sequenceIndexStep = 1;
  const messagesToDraw = [];
  messages.forEach(function (msg) {
    let loopModel, noteModel, msgModel;

    switch (msg.type) {
      case diagObj.db.LINETYPE.NOTE:
        noteModel = msg.noteModel;
        drawNote(diagram, noteModel);
        break;
      case diagObj.db.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram, actors);
        break;
      case diagObj.db.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos());
        break;
      case diagObj.db.LINETYPE.LOOP_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.LOOP_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'loop', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      case diagObj.db.LINETYPE.RECT_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin, (message) =>
          bounds.newLoop(undefined, message.message)
        );
        break;
      case diagObj.db.LINETYPE.RECT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawBackgroundRect(diagram, loopModel);
        bounds.models.addLoop(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      case diagObj.db.LINETYPE.OPT_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.OPT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'opt', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      case diagObj.db.LINETYPE.ALT_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.ALT_ELSE:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin + conf.boxTextMargin,
          conf.boxMargin,
          (message) => bounds.addSectionToLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.ALT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'alt', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      case diagObj.db.LINETYPE.PAR_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.PAR_AND:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin + conf.boxTextMargin,
          conf.boxMargin,
          (message) => bounds.addSectionToLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.PAR_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'par', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      case diagObj.db.LINETYPE.AUTONUMBER:
        sequenceIndex = msg.message.start || sequenceIndex;
        sequenceIndexStep = msg.message.step || sequenceIndexStep;
        if (msg.message.visible) {
          diagObj.db.enableSequenceNumbers();
        } else {
          diagObj.db.disableSequenceNumbers();
        }
        break;
      case diagObj.db.LINETYPE.CRITICAL_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.CRITICAL_OPTION:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin + conf.boxTextMargin,
          conf.boxMargin,
          (message) => bounds.addSectionToLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.CRITICAL_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'critical', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      case diagObj.db.LINETYPE.BREAK_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          (message) => bounds.newLoop(message)
        );
        break;
      case diagObj.db.LINETYPE.BREAK_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'break', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;
      default:
        try {
          // lastMsg = msg
          msgModel = msg.msgModel;
          msgModel.starty = bounds.getVerticalPos();
          msgModel.sequenceIndex = sequenceIndex;
          msgModel.sequenceVisible = diagObj.db.showSequenceNumbers();
          const lineStartY = boundMessage(diagram, msgModel);
          messagesToDraw.push({ messageModel: msgModel, lineStartY: lineStartY });
          bounds.models.addMessage(msgModel);
        } catch (e) {
          log.error('error while drawing message', e);
        }
    }

    // Increment sequence counter if msg.type is a line (and not another event like activation or note, etc)
    if (
      [
        diagObj.db.LINETYPE.SOLID_OPEN,
        diagObj.db.LINETYPE.DOTTED_OPEN,
        diagObj.db.LINETYPE.SOLID,
        diagObj.db.LINETYPE.DOTTED,
        diagObj.db.LINETYPE.SOLID_CROSS,
        diagObj.db.LINETYPE.DOTTED_CROSS,
        diagObj.db.LINETYPE.SOLID_POINT,
        diagObj.db.LINETYPE.DOTTED_POINT,
      ].includes(msg.type)
    ) {
      sequenceIndex = sequenceIndex + sequenceIndexStep;
    }
  });

  messagesToDraw.forEach((e) => drawMessage(diagram, e.messageModel, e.lineStartY, diagObj));

  if (conf.mirrorActors) {
    // Draw actors below diagram
    bounds.bumpVerticalPos(conf.boxMargin * 2);
    drawActors(diagram, actors, actorKeys, bounds.getVerticalPos(), conf, messages, true);
    bounds.bumpVerticalPos(conf.boxMargin);
    fixLifeLineHeights(diagram, bounds.getVerticalPos());
  }

  bounds.models.boxes.forEach(function (box) {
    box.height = bounds.getVerticalPos() - box.y;
    bounds.insert(box.x, box.y, box.x + box.width, box.height);
    box.startx = box.x;
    box.starty = box.y;
    box.stopx = box.startx + box.width;
    box.stopy = box.starty + box.height;
    box.stroke = 'rgb(0,0,0, 0.5)';
    svgDraw.drawBox(diagram, box, conf);
  });

  if (hasBoxes) {
    bounds.bumpVerticalPos(conf.boxMargin);
  }

  // only draw popups for the top row of actors.
  const requiredBoxSize = drawActorsPopup(diagram, actors, actorKeys, doc);

  const { bounds: box } = bounds.getBounds();

  // Adjust line height of actor lines now that the height of the diagram is known
  log.debug('For line height fix Querying: #' + id + ' .actor-line');
  const actorLines = selectAll('#' + id + ' .actor-line');
  actorLines.attr('y2', box.stopy);

  // Make sure the height of the diagram supports long menus.
  let boxHeight = box.stopy - box.starty;
  if (boxHeight < requiredBoxSize.maxHeight) {
    boxHeight = requiredBoxSize.maxHeight;
  }

  let height = boxHeight + 2 * conf.diagramMarginY;
  if (conf.mirrorActors) {
    height = height - conf.boxMargin + conf.bottomMarginAdj;
  }

  // Make sure the width of the diagram supports wide menus.
  let boxWidth = box.stopx - box.startx;
  if (boxWidth < requiredBoxSize.maxWidth) {
    boxWidth = requiredBoxSize.maxWidth;
  }
  const width = boxWidth + 2 * conf.diagramMarginX;

  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', (box.stopx - box.startx) / 2 - 2 * conf.diagramMarginX)
      .attr('y', -25);
  }

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  const extraVertForTitle = title ? 40 : 0;
  diagram.attr(
    'viewBox',
    box.startx -
      conf.diagramMarginX +
      ' -' +
      (conf.diagramMarginY + extraVertForTitle) +
      ' ' +
      width +
      ' ' +
      (height + extraVertForTitle)
  );

  log.debug(`models:`, bounds.models);
};

/**
 * Retrieves the max message width of each actor, supports signals (messages, loops) and notes.
 *
 * It will enumerate each given message, and will determine its text width, in relation to the actor
 * it originates from, and destined to.
 *
 * @param actors - The actors map
 * @param messages - A list of message objects to iterate
 * @param diagObj - The diagram object.
 * @returns The max message width of each actor.
 */
function getMaxMessageWidthPerActor(
  actors: { [id: string]: any },
  messages: any[],
  diagObj: Diagram
): { [id: string]: number } {
  const maxMessageWidthPerActor = {};

  messages.forEach(function (msg) {
    if (actors[msg.to] && actors[msg.from]) {
      const actor = actors[msg.to];

      // If this is the first actor, and the message is left of it, no need to calculate the margin
      if (msg.placement === diagObj.db.PLACEMENT.LEFTOF && !actor.prevActor) {
        return;
      }

      // If this is the last actor, and the message is right of it, no need to calculate the margin
      if (msg.placement === diagObj.db.PLACEMENT.RIGHTOF && !actor.nextActor) {
        return;
      }

      const isNote = msg.placement !== undefined;
      const isMessage = !isNote;

      const textFont = isNote ? noteFont(conf) : messageFont(conf);
      const wrappedMessage = msg.wrap
        ? utils.wrapLabel(msg.message, conf.width - 2 * conf.wrapPadding, textFont)
        : msg.message;
      const messageDimensions = utils.calculateTextDimensions(wrappedMessage, textFont);
      const messageWidth = messageDimensions.width + 2 * conf.wrapPadding;

      /*
       * The following scenarios should be supported:
       *
       * - There's a message (non-note) between fromActor and toActor
       *   - If fromActor is on the right and toActor is on the left, we should
       *     define the toActor's margin
       *   - If fromActor is on the left and toActor is on the right, we should
       *     define the fromActor's margin
       * - There's a note, in which case fromActor == toActor
       *   - If the note is to the left of the actor, we should define the previous actor
       *     margin
       *   - If the note is on the actor, we should define both the previous and next actor
       *     margins, each being the half of the note size
       *   - If the note is on the right of the actor, we should define the current actor
       *     margin
       */
      if (isMessage && msg.from === actor.nextActor) {
        maxMessageWidthPerActor[msg.to] = Math.max(
          maxMessageWidthPerActor[msg.to] || 0,
          messageWidth
        );
      } else if (isMessage && msg.from === actor.prevActor) {
        maxMessageWidthPerActor[msg.from] = Math.max(
          maxMessageWidthPerActor[msg.from] || 0,
          messageWidth
        );
      } else if (isMessage && msg.from === msg.to) {
        maxMessageWidthPerActor[msg.from] = Math.max(
          maxMessageWidthPerActor[msg.from] || 0,
          messageWidth / 2
        );

        maxMessageWidthPerActor[msg.to] = Math.max(
          maxMessageWidthPerActor[msg.to] || 0,
          messageWidth / 2
        );
      } else if (msg.placement === diagObj.db.PLACEMENT.RIGHTOF) {
        maxMessageWidthPerActor[msg.from] = Math.max(
          maxMessageWidthPerActor[msg.from] || 0,
          messageWidth
        );
      } else if (msg.placement === diagObj.db.PLACEMENT.LEFTOF) {
        maxMessageWidthPerActor[actor.prevActor] = Math.max(
          maxMessageWidthPerActor[actor.prevActor] || 0,
          messageWidth
        );
      } else if (msg.placement === diagObj.db.PLACEMENT.OVER) {
        if (actor.prevActor) {
          maxMessageWidthPerActor[actor.prevActor] = Math.max(
            maxMessageWidthPerActor[actor.prevActor] || 0,
            messageWidth / 2
          );
        }

        if (actor.nextActor) {
          maxMessageWidthPerActor[msg.from] = Math.max(
            maxMessageWidthPerActor[msg.from] || 0,
            messageWidth / 2
          );
        }
      }
    }
  });

  log.debug('maxMessageWidthPerActor:', maxMessageWidthPerActor);
  return maxMessageWidthPerActor;
}

const getRequiredPopupWidth = function (actor) {
  let requiredPopupWidth = 0;
  const textFont = actorFont(conf);
  for (const key in actor.links) {
    const labelDimensions = utils.calculateTextDimensions(key, textFont);
    const labelWidth = labelDimensions.width + 2 * conf.wrapPadding + 2 * conf.boxMargin;
    if (requiredPopupWidth < labelWidth) {
      requiredPopupWidth = labelWidth;
    }
  }

  return requiredPopupWidth;
};

/**
 * This will calculate the optimal margin for each given actor,
 * for a given actor → messageWidth map.
 *
 * An actor's margin is determined by the width of the actor, the width of the largest message that
 * originates from it, and the configured conf.actorMargin.
 *
 * @param actors - The actors map to calculate margins for
 * @param actorToMessageWidth - A map of actor key → max message width it holds
 * @param boxes - The boxes around the actors if any
 */
function calculateActorMargins(
  actors: { [id: string]: any },
  actorToMessageWidth: ReturnType<typeof getMaxMessageWidthPerActor>,
  boxes
) {
  let maxHeight = 0;
  Object.keys(actors).forEach((prop) => {
    const actor = actors[prop];
    if (actor.wrap) {
      actor.description = utils.wrapLabel(
        actor.description,
        conf.width - 2 * conf.wrapPadding,
        actorFont(conf)
      );
    }
    const actDims = utils.calculateTextDimensions(actor.description, actorFont(conf));
    actor.width = actor.wrap
      ? conf.width
      : Math.max(conf.width, actDims.width + 2 * conf.wrapPadding);

    actor.height = actor.wrap ? Math.max(actDims.height, conf.height) : conf.height;
    maxHeight = Math.max(maxHeight, actor.height);
  });

  for (const actorKey in actorToMessageWidth) {
    const actor = actors[actorKey];

    if (!actor) {
      continue;
    }

    const nextActor = actors[actor.nextActor];

    // No need to space out an actor that doesn't have a next link
    if (!nextActor) {
      const messageWidth = actorToMessageWidth[actorKey];
      const actorWidth = messageWidth + conf.actorMargin - actor.width / 2;
      actor.margin = Math.max(actorWidth, conf.actorMargin);
      continue;
    }

    const messageWidth = actorToMessageWidth[actorKey];
    const actorWidth = messageWidth + conf.actorMargin - actor.width / 2 - nextActor.width / 2;

    actor.margin = Math.max(actorWidth, conf.actorMargin);
  }

  let maxBoxHeight = 0;
  boxes.forEach((box) => {
    const textFont = messageFont(conf);
    let totalWidth = box.actorKeys.reduce((total, aKey) => {
      return (total += actors[aKey].width + (actors[aKey].margin || 0));
    }, 0);

    totalWidth -= 2 * conf.boxTextMargin;
    if (box.wrap) {
      box.name = utils.wrapLabel(box.name, totalWidth - 2 * conf.wrapPadding, textFont);
    }

    const boxMsgDimensions = utils.calculateTextDimensions(box.name, textFont);
    maxBoxHeight = Math.max(boxMsgDimensions.height, maxBoxHeight);
    const minWidth = Math.max(totalWidth, boxMsgDimensions.width + 2 * conf.wrapPadding);
    box.margin = conf.boxTextMargin;
    if (totalWidth < minWidth) {
      const missing = (minWidth - totalWidth) / 2;
      box.margin += missing;
    }
  });
  boxes.forEach((box) => (box.textMaxHeight = maxBoxHeight));

  return Math.max(maxHeight, conf.height);
}

const buildNoteModel = function (msg, actors, diagObj) {
  const startx = actors[msg.from].x;
  const stopx = actors[msg.to].x;
  const shouldWrap = msg.wrap && msg.message;

  let textDimensions = utils.calculateTextDimensions(
    shouldWrap ? utils.wrapLabel(msg.message, conf.width, noteFont(conf)) : msg.message,
    noteFont(conf)
  );
  const noteModel = {
    width: shouldWrap
      ? conf.width
      : Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin),
    height: 0,
    startx: actors[msg.from].x,
    stopx: 0,
    starty: 0,
    stopy: 0,
    message: msg.message,
  };
  if (msg.placement === diagObj.db.PLACEMENT.RIGHTOF) {
    noteModel.width = shouldWrap
      ? Math.max(conf.width, textDimensions.width)
      : Math.max(
          actors[msg.from].width / 2 + actors[msg.to].width / 2,
          textDimensions.width + 2 * conf.noteMargin
        );
    noteModel.startx = startx + (actors[msg.from].width + conf.actorMargin) / 2;
  } else if (msg.placement === diagObj.db.PLACEMENT.LEFTOF) {
    noteModel.width = shouldWrap
      ? Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin)
      : Math.max(
          actors[msg.from].width / 2 + actors[msg.to].width / 2,
          textDimensions.width + 2 * conf.noteMargin
        );
    noteModel.startx = startx - noteModel.width + (actors[msg.from].width - conf.actorMargin) / 2;
  } else if (msg.to === msg.from) {
    textDimensions = utils.calculateTextDimensions(
      shouldWrap
        ? utils.wrapLabel(msg.message, Math.max(conf.width, actors[msg.from].width), noteFont(conf))
        : msg.message,
      noteFont(conf)
    );
    noteModel.width = shouldWrap
      ? Math.max(conf.width, actors[msg.from].width)
      : Math.max(actors[msg.from].width, conf.width, textDimensions.width + 2 * conf.noteMargin);
    noteModel.startx = startx + (actors[msg.from].width - noteModel.width) / 2;
  } else {
    noteModel.width =
      Math.abs(startx + actors[msg.from].width / 2 - (stopx + actors[msg.to].width / 2)) +
      conf.actorMargin;
    noteModel.startx =
      startx < stopx
        ? startx + actors[msg.from].width / 2 - conf.actorMargin / 2
        : stopx + actors[msg.to].width / 2 - conf.actorMargin / 2;
  }
  if (shouldWrap) {
    noteModel.message = utils.wrapLabel(
      msg.message,
      noteModel.width - 2 * conf.wrapPadding,
      noteFont(conf)
    );
  }
  log.debug(
    `NM:[${noteModel.startx},${noteModel.stopx},${noteModel.starty},${noteModel.stopy}:${noteModel.width},${noteModel.height}=${msg.message}]`
  );
  return noteModel;
};

const buildMessageModel = function (msg, actors, diagObj) {
  let process = false;
  if (
    [
      diagObj.db.LINETYPE.SOLID_OPEN,
      diagObj.db.LINETYPE.DOTTED_OPEN,
      diagObj.db.LINETYPE.SOLID,
      diagObj.db.LINETYPE.DOTTED,
      diagObj.db.LINETYPE.SOLID_CROSS,
      diagObj.db.LINETYPE.DOTTED_CROSS,
      diagObj.db.LINETYPE.SOLID_POINT,
      diagObj.db.LINETYPE.DOTTED_POINT,
    ].includes(msg.type)
  ) {
    process = true;
  }
  if (!process) {
    return {};
  }
  const fromBounds = activationBounds(msg.from, actors);
  const toBounds = activationBounds(msg.to, actors);
  const fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0;
  const toIdx = fromBounds[0] < toBounds[0] ? 0 : 1;
  const allBounds = [...fromBounds, ...toBounds];
  const boundedWidth = Math.abs(toBounds[toIdx] - fromBounds[fromIdx]);
  if (msg.wrap && msg.message) {
    msg.message = utils.wrapLabel(
      msg.message,
      Math.max(boundedWidth + 2 * conf.wrapPadding, conf.width),
      messageFont(conf)
    );
  }
  const msgDims = utils.calculateTextDimensions(msg.message, messageFont(conf));

  return {
    width: Math.max(
      msg.wrap ? 0 : msgDims.width + 2 * conf.wrapPadding,
      boundedWidth + 2 * conf.wrapPadding,
      conf.width
    ),
    height: 0,
    startx: fromBounds[fromIdx],
    stopx: toBounds[toIdx],
    starty: 0,
    stopy: 0,
    message: msg.message,
    type: msg.type,
    wrap: msg.wrap,
    fromBounds: Math.min.apply(null, allBounds),
    toBounds: Math.max.apply(null, allBounds),
  };
};

const calculateLoopBounds = function (messages, actors, _maxWidthPerActor, diagObj) {
  const loops = {};
  const stack = [];
  let current, noteModel, msgModel;

  messages.forEach(function (msg) {
    msg.id = utils.random({ length: 10 });
    switch (msg.type) {
      case diagObj.db.LINETYPE.LOOP_START:
      case diagObj.db.LINETYPE.ALT_START:
      case diagObj.db.LINETYPE.OPT_START:
      case diagObj.db.LINETYPE.PAR_START:
      case diagObj.db.LINETYPE.CRITICAL_START:
      case diagObj.db.LINETYPE.BREAK_START:
        stack.push({
          id: msg.id,
          msg: msg.message,
          from: Number.MAX_SAFE_INTEGER,
          to: Number.MIN_SAFE_INTEGER,
          width: 0,
        });
        break;
      case diagObj.db.LINETYPE.ALT_ELSE:
      case diagObj.db.LINETYPE.PAR_AND:
      case diagObj.db.LINETYPE.CRITICAL_OPTION:
        if (msg.message) {
          current = stack.pop();
          loops[current.id] = current;
          loops[msg.id] = current;
          stack.push(current);
        }
        break;
      case diagObj.db.LINETYPE.LOOP_END:
      case diagObj.db.LINETYPE.ALT_END:
      case diagObj.db.LINETYPE.OPT_END:
      case diagObj.db.LINETYPE.PAR_END:
      case diagObj.db.LINETYPE.CRITICAL_END:
      case diagObj.db.LINETYPE.BREAK_END:
        current = stack.pop();
        loops[current.id] = current;
        break;
      case diagObj.db.LINETYPE.ACTIVE_START:
        {
          const actorRect = actors[msg.from ? msg.from.actor : msg.to.actor];
          const stackedSize = actorActivations(msg.from ? msg.from.actor : msg.to.actor).length;
          const x =
            actorRect.x + actorRect.width / 2 + ((stackedSize - 1) * conf.activationWidth) / 2;
          const toAdd = {
            startx: x,
            stopx: x + conf.activationWidth,
            actor: msg.from.actor,
            enabled: true,
          };
          bounds.activations.push(toAdd);
        }
        break;
      case diagObj.db.LINETYPE.ACTIVE_END:
        {
          const lastActorActivationIdx = bounds.activations
            .map((a) => a.actor)
            .lastIndexOf(msg.from.actor);
          delete bounds.activations.splice(lastActorActivationIdx, 1)[0];
        }
        break;
    }
    const isNote = msg.placement !== undefined;
    if (isNote) {
      noteModel = buildNoteModel(msg, actors, diagObj);
      msg.noteModel = noteModel;
      stack.forEach((stk) => {
        current = stk;
        current.from = Math.min(current.from, noteModel.startx);
        current.to = Math.max(current.to, noteModel.startx + noteModel.width);
        current.width =
          Math.max(current.width, Math.abs(current.from - current.to)) - conf.labelBoxWidth;
      });
    } else {
      msgModel = buildMessageModel(msg, actors, diagObj);
      msg.msgModel = msgModel;
      if (msgModel.startx && msgModel.stopx && stack.length > 0) {
        stack.forEach((stk) => {
          current = stk;
          if (msgModel.startx === msgModel.stopx) {
            const from = actors[msg.from];
            const to = actors[msg.to];
            current.from = Math.min(
              from.x - msgModel.width / 2,
              from.x - from.width / 2,
              current.from
            );
            current.to = Math.max(to.x + msgModel.width / 2, to.x + from.width / 2, current.to);
            current.width =
              Math.max(current.width, Math.abs(current.to - current.from)) - conf.labelBoxWidth;
          } else {
            current.from = Math.min(msgModel.startx, current.from);
            current.to = Math.max(msgModel.stopx, current.to);
            current.width = Math.max(current.width, msgModel.width) - conf.labelBoxWidth;
          }
        });
      }
    }
  });
  bounds.activations = [];
  log.debug('Loop type widths:', loops);
  return loops;
};

export default {
  bounds,
  drawActors,
  drawActorsPopup,
  setConf,
  draw,
};
