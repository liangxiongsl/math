import * as configApi from './config';
import { log } from './logger';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI';
import { detectType, getDiagramLoader } from './diagram-api/detectType';
import { extractFrontMatter } from './diagram-api/frontmatter';
import { UnknownDiagramError } from './errors';
import { DetailedError } from './utils';

export type ParseErrorFunction = (err: string | DetailedError | unknown, hash?: any) => void;
export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  private detectError?: UnknownDiagramError;
  constructor(public text: string) {
    this.text += '\n';
    const cnf = configApi.getConfig();
    try {
      this.type = detectType(text, cnf);
    } catch (e) {
      this.type = 'error';
      this.detectError = e as UnknownDiagramError;
    }
    const diagram = getDiagram(this.type);
    log.debug('Type ' + this.type);
    // Setup diagram
    this.db = diagram.db;
    this.db.clear?.();
    this.renderer = diagram.renderer;
    this.parser = diagram.parser;
    const originalParse = this.parser.parse.bind(this.parser);
    // Wrap the jison parse() method to handle extracting frontmatter.
    //
    // This can't be done in this.parse() because some code
    // directly calls diagram.parser.parse(), bypassing this.parse().
    //
    // Similarly, we can't do this in getDiagramFromText() because some code
    // calls diagram.db.clear(), which would reset anything set by
    // extractFrontMatter().
    this.parser.parse = (text: string) => originalParse(extractFrontMatter(text, this.db));
    this.parser.parser.yy = this.db;
    if (diagram.init) {
      diagram.init(cnf);
      log.info('Initialized diagram ' + this.type, cnf);
    }
    this.parse();
  }

  parse() {
    if (this.detectError) {
      throw this.detectError;
    }
    this.db.clear?.();
    this.parser.parse(this.text);
  }

  async render(id: string, version: string) {
    await this.renderer.draw(this.text, id, version, this);
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

export const getDiagramFromText = async (text: string): Promise<Diagram> => {
  const type = detectType(text, configApi.getConfig());
  try {
    // Trying to find the diagram
    getDiagram(type);
  } catch (error) {
    const loader = getDiagramLoader(type);
    if (!loader) {
      throw new UnknownDiagramError(`Diagram ${type} not found.`);
    }
    // Diagram not available, loading it.
    // new diagram will try getDiagram again and if fails then it is a valid throw
    const { id, diagram } = await loader();
    registerDiagram(id, diagram);
  }
  return new Diagram(text);
};
