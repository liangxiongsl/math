import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'state';

const detector: DiagramDetector = (txt, config) => {
  // If we have confirmed to only use new state diagrams this function should always return false
  // as in not signalling true for a legacy state diagram
  if (config?.state?.defaultRenderer === 'dagre-wrapper') {
    return false;
  }
  return txt.match(/^\s*stateDiagram/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./stateDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
