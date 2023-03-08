# Overview for Beginners

**Explaining with a Diagram**

A picture is worth a thousand words, a good diagram is undoubtedly worth more. They make understanding easier.

## Creating and Maintaining Diagrams

Anyone who has used Visio, or (God Forbid) Excel to make a Gantt Chart, knows how hard it is to create, edit and maintain good visualizations.

Diagrams/Charts are significant but also become obsolete/inaccurate very fast. This catch-22 hobbles the productivity of teams.

# Doc Rot in Diagrams

Doc-Rot kills diagrams as quickly as it does text, but it takes hours in a desktop application to produce a diagram.

Mermaid seeks to change using markdown-inspired syntax. The process is a quicker, less complicated, and more convenient way of going from concept to visualization.

It is a relatively straightforward solution to a significant hurdle with the software teams.

# Definition of Terms/ Dictionary

**Mermaid text definitions can be saved for later reuse and editing.**

> These are the Mermaid diagram definitions inside `<div>` tags, with the `class=mermaid`.

```html
<pre class="mermaid">
    graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
</pre>
```

**render**

> This is the core function of the Mermaid API. It reads all the `Mermaid Definitions` inside `div` tags and returns an SVG file, based on the definition.

**Nodes**

> These are the boxes that contain text or otherwise discrete pieces of each diagram, separated generally by arrows, except for Gantt Charts and User Journey Diagrams. They will be referred often in the instructions. Read for Diagram Specific [Syntax](../intro/n00b-syntaxReference.md)

## Advantages of using Mermaid

- Ease to generate, modify and render diagrams when you make them.
- The number of integrations and plugins it has.
- You can add it to your or companies website.
- Diagrams can be created through comments like this in a script:

## The catch-22 of Diagrams and Charts:

**Diagramming and charting is a large waste of developer's time, but not having diagrams ruins productivity.**

Mermaid solves this by reducing the time and effort required to create diagrams and charts.

Because, the text base for the diagrams allows it to be updated easily. Also, it can be made part of production scripts (and other pieces of code). So less time is spent on documenting, as a separate task.

## Catching up with Development

Being based on markdown, Mermaid can be used, not only by accomplished front-end developers, but by most computer savvy people to render diagrams, at much faster speeds.
In fact one can pick up the syntax for it quite easily from the examples given and there are many tutorials available in the internet.

## Mermaid is for everyone.

Video [Tutorials](https://mermaid-js.github.io/mermaid/#/../config/Tutorials) are also available for the mermaid [live editor](https://mermaid.live/).

Alternatively you can use Mermaid [Plug-Ins](https://mermaid-js.github.io/mermaid/#/./integrations), with tools you already use, like Google Docs.
