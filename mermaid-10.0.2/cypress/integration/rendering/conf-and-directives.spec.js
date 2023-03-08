import { imgSnapshotTest } from '../../helpers/util.js';

describe('Configuration and directives - nodes should be light blue', () => {
  it('No config - use default', () => {
    imgSnapshotTest(
      `
      graph TD
          A(Default) --> B[/Another/]
          A --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
    cy.get('svg');
  });
  it('Settings from initialize - nodes should be green', () => {
    imgSnapshotTest(
      `
graph TD
          A(Forest) --> B[/Another/]
          A --> C[End]
          subgraph section
            B
            C
          end          `,
      { theme: 'forest' }
    );
    cy.get('svg');
  });
  it('Settings from initialize overriding themeVariable - nodes should be red', () => {
    imgSnapshotTest(
      `


        %%{init: { 'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'base', themeVariables: { primaryColor: '#ff0000' }, logLevel: 0 }
    );
    cy.get('svg');
  });
  it('Settings from directive - nodes should be grey', () => {
    imgSnapshotTest(
      `
        %%{init: { 'logLevel': 0, 'theme': 'neutral'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
    cy.get('svg');
  });

  it('Settings from directive overriding theme variable - nodes should be red', () => {
    imgSnapshotTest(
      `
          %%{init: {'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
    cy.get('svg');
  });
  it('Settings from initialize and directive - nodes should be grey', () => {
    imgSnapshotTest(
      `
      %%{init: { 'logLevel': 0, 'theme': 'neutral'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'forest' }
    );
    cy.get('svg');
  });
  it('Theme from initialize, directive overriding theme variable - nodes should be red', () => {
    imgSnapshotTest(
      `
      %%{init: {'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'base' }
    );
    cy.get('svg');
  });
  it('Theme variable from initialize, theme from directive - nodes should be red', () => {
    imgSnapshotTest(
      `
      %%{init: { 'logLevel': 0, 'theme': 'base'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { themeVariables: { primaryColor: '#ff0000' } }
    );
    cy.get('svg');
  });
  describe('when rendering several diagrams', () => {
    it('diagrams should not taint later diagrams', () => {
      const url = 'http://localhost:9000/theme-directives.html';
      cy.visit(url);
      cy.get('svg');
      cy.matchImageSnapshot('conf-and-directives.spec-when-rendering-several-diagrams-diagram-1');
    });
  });
});
