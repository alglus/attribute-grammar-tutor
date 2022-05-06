import {emptyArray} from './utils.js';
import {GRAPH_TYPE} from "./drawDependencyGraph.js";
import {newSymbol, SYMBOL_HEIGHT, SYMBOL_WIDTH} from "./joint.attrsys.js";
import {hideGraphCorrectIcon, resetErrors} from './localDependencyExercise.js';


export class Graph {

    static MIN_SCALE = 0.2;
    static MAX_SCALE = 5;

    highlightedElements = [];

    constructor(graphContainer, grammar, productionIndex) {
        const namespace = joint.shapes;

        this.graph = new joint.dia.Graph({}, {cellNamespace: namespace});
        this.paper = this.#createPaper(this.graph, graphContainer, namespace);

        this.#defineOnPaperEvents(this.paper, this.graph, graphContainer, grammar, productionIndex);
    }

    /**
     * Returns all roots of the syntax tree.
     * There can be several roots, if there are several disconnected components in the graph.
     */
    getRoots() {
        // Any element without incoming links is considered a source by the function getSources().
        // In our graph, we should only search for sources within those elements,
        // which are part of the syntax tree and are of the type 'symbol'.
        return this.graph.getSources().filter(e => e.isSymbol());
    }

    /**
     * Return the children of the root, sorted by their x coordinate, from left to right.
     */
    getChildrenSortedByX(root) {

        const links = this.graph.getConnectedLinks(root, {outbound: true});

        let children = links.map(l => {
            const targetId = l.get('target').id;
            return this.graph.getCell(targetId);
        })

        return children.sort((a, b) => a.position().x - b.position().x);
    }

    /**
     * Returns all symbol nodes, i.e. the nodes of the syntax tree.
     */
    getSymbols() {
        return this.graph.getElements().filter(e => e.isSymbol());
    }


    highlightElement(element, highlightingArea) {
        element.showErrorHighlighting(highlightingArea);
        this.highlightedElements.push({element: element, highlightingArea: highlightingArea});
    }

    removeAllHighlighting() {
        this.highlightedElements.forEach(highlightedElement => {
            this.unhighlightElement(highlightedElement.element, highlightedElement.highlightingArea);
        });
        this.clearHighlightedElementsList();
    }

    unhighlightElement(element, highlightingArea) {
        element.hideErrorHighlighting(highlightingArea);
    }

    clearHighlightedElementsList() {
        emptyArray(this.highlightedElements);
    }

    resetScale() {
        this.paper.scale(1, 1);
        this.paper.translate(0, 0);
    }


    #createPaper(graph, graphContainer, namespace) {
        return new joint.dia.Paper({
            cellViewNamespace: namespace,
            el: graphContainer,
            model: graph,
            width: 400,
            height: 300,
            sorting: joint.dia.Paper.sorting.APPROX,
            linkPinning: false,
            background: {
                color: '#fdfdfd',
            },

            // Highlights a shape which is about to be connected by a link
            highlighting: {
                default: {
                    name: 'mask',
                    options: {
                        attrs: {
                            'stroke': '#ffbf00',
                            'stroke-width': 2,
                            'stroke-linecap': 'butt',
                            'stroke-linejoin': 'miter',
                        }
                    }
                }
            },

            validateConnection: function (cellViewS, magnetS, cellViewT) {
                // Prevent Link to Link connections
                if (cellViewT.model.isLink() || cellViewS.model.isLink()) return false;

                // Prevent loops in symbols - a symbol connecting to itself
                if (cellViewS.model.isSymbol() && cellViewS === cellViewT) return false;

                // Prevent symbols connecting to attributes
                if (cellViewS.model.isSymbol() && cellViewT.model.isAttribute()) return false;

                // Prevent attributes connecting to symbols
                if (cellViewS.model.isAttribute() && cellViewT.model.isSymbol()) return false;

                // Allow all other connections
                return true;
            },
        });
    }

    #defineOnPaperEvents(paper, graph, graphContainer, grammar, productionIndex) {
        paper.on({
            /* Zoom */
            'blank:mousewheel': function (event, x, y, delta) {
                zoom(event, x, y, delta, paper);
            },


            /* Panning */
            // Code for panning the graph found here:
            // https://stackoverflow.com/questions/28431384/how-to-make-a-paper-draggable#36151768
            'blank:pointerdown': function (event, x, y) {
                event.data = {};

                const scale = paper.scale();
                event.data.dragStartPosition = {x: x * scale.sx, y: y * scale.sy};
            },
            'blank:pointermove': function (event) {
                paper.translate(
                    event.offsetX - event.data.dragStartPosition.x,
                    event.offsetY - event.data.dragStartPosition.y
                );
            },
            'blank:pointerup': function (event) {
                event.data.dragStartPosition = {};
            },
        });


        // Code for zooming in and out found here:
        // https://stackoverflow.com/questions/56385868/mouse-wheel-event-has-jittery-zoom-scale-in-jointjs#69196310
        function zoom(event, x, y, delta) {
            event.preventDefault();

            const currentScale = paper.scale().sx; // we scale symmetrically, so it is enough to get the x-scale
            const newScale = currentScale + (0.2 * delta * currentScale)

            if (newScale >= Graph.MIN_SCALE && newScale <= Graph.MAX_SCALE) {
                paper.scale(newScale, newScale, 0, 0);
                paper.translate(-x * newScale + event.offsetX, -y * newScale + event.offsetY);
            }
        }
    }
}


export class DependencyGraph extends Graph {

    constructor(graphContainer, grammar, productionIndex) {
        super(graphContainer, grammar, productionIndex);

        this.#setPaperDefaultLinks();
        this.#defineOnGraphEvents(productionIndex);
        this.#defineOnPaperEvents(this.paper, this.graph, graphContainer, grammar, productionIndex);
    }

    #setPaperDefaultLinks() {
        this.paper.options.defaultLink = function (cellView) {
            if (cellView.model.isSymbol()) {
                return new joint.shapes.attrsys.SymbolLink();
            } else {
                return new joint.shapes.attrsys.AttributeLink();
            }
        };
    }

    #defineOnGraphEvents(productionIndex) {
        this.graph.on({
            'remove': function (cell) {
                resetErrors(productionIndex);
                hideGraphCorrectIcon(productionIndex);
                adjustTheContainerBorders(cell);
            },
            'add': function () {
                resetErrors(productionIndex);
                hideGraphCorrectIcon(productionIndex);
            }
        });


        function adjustTheContainerBorders(cell) {
            if (cell.isElement()) {
                const container = cell.prop('container');
                if (container) {
                    container.fitChildren();
                }
            }
        }
    }

    #defineOnPaperEvents(paper, graph, graphContainer, grammar, productionIndex) {
        paper.on({
            /* Toggle cell name */
            'cell:mousewheel': function (cellView, event, x, y, delta) {
                event.preventDefault(); // stop the page from scrolling, when over some graph node

                const model = cellView.model;

                if (model.isElement()) {

                    // The name of an element is being changed, so the previous check and warnings
                    // may no longer be valid. Therefore, we need to reset them.
                    resetErrors(productionIndex);

                    if (model.isSymbol() || model.isAttribute()) {
                        model.scrollName(delta);
                    }
                }
            },


            /* Create new element */
            'blank:pointerdblclick': function (event, x, y) {
                newSymbol(GRAPH_TYPE.localDependency, x - SYMBOL_WIDTH / 2, y - SYMBOL_HEIGHT / 2,
                    grammar.productionRules[productionIndex].symbolNames, paper, graph);
            },


            /* Add and remove link tools */
            // The link tools need to be created and removed each time, as opposed to just being shown/hidden in the elements.
            'link:mouseenter': function (linkView) {
                linkView.addTools(new joint.dia.ToolsView({tools: linkView.model.getTools()}));
            },
            'link:mouseleave': function (linkView) {
                linkView.removeTools();
            },


            /* Show and hide element tools */
            'element:mouseenter': function (elementView) {
                elementView.showTools();
            },
            'element:mouseleave': function (elementView) {
                elementView.hideTools();
            },


            /* Handle key press */
            'cell:mouseenter': function (cellView) {
                graphContainer
                    .attr('tabindex', 0)
                    .on('mouseover', function () {
                        this.focus();
                    })
                    .on('keydown', function (e) {
                        /* Delete element or link with 'del', when hovering over it */
                        if (e.which === 46) {
                            removeCell(cellView.model);
                        }
                    })
            },
            'cell:mouseleave': function (cellView) {
                graphContainer
                    .attr('tabindex', 1)
                    .off('mouseover')
                    .off('keydown');
            },


            'element:pointerdown': function (elementView, event) {
                /* Delete element with a mouse wheel click */
                // The same does not work for links, because this click creates a new vertex on links.
                if (event.which === 2) {
                    removeCell(elementView.model);
                }

                /* Move container together with symbol */
                if (elementView.model.isSymbol()) {
                    paper.setInteractivity({stopDelegation: false});
                }
            },


            /* Stop moving container together with symbol */
            'element:pointerup': function (elementView) {
                if (elementView.model.isSymbol()) {
                    paper.setInteractivity({stopDelegation: true});
                }
            },


            /* Adjust container borders */
            'element:pointermove': function (elementView) {
                const model = elementView.model;
                if (model.isAttribute()) {
                    model.adjustContainer();
                }
            },
        });


        function removeCell(model) {
            if (model.get('type') === 'attrsys.Symbol') {
                model.getContainer().remove();
            } else {
                model.remove();
            }
        }
    }
}


export class AcyclicityGraph extends Graph {

    constructor(graphContainer, grammar, productionIndex, linkTypeInputName) {
        super(graphContainer, grammar, productionIndex);

        // this.paper.setInteractivity(false);
        this.paper.options.interactive = function (cellView) {
            return cellView.model.get('type') === 'attrsys.RedecoratedLink' ||
                cellView.model.get('type') === 'attrsys.ProjectedLink';
        };
        this.#setPaperDefaultLinks(linkTypeInputName);
        this.#defineOnPaperEvents(this.paper, this.graph, graphContainer, grammar, productionIndex);
    }

    #setPaperDefaultLinks(linkTypeInputName) {
        this.paper.options.defaultLink = function (cellView) {

            const linkType = $(`input[name=${linkTypeInputName}]:checked`).val();

            if (linkType === 'redecorated') {
                return new joint.shapes.attrsys.RedecoratedLink();
            } else {
                return new joint.shapes.attrsys.ProjectedLink();
            }
        };
    }

    #defineOnPaperEvents(paper, graph, graphContainer, grammar, productionIndex) {
        paper.on({
            /* Add and remove link tools */
            // The link tools need to be created and removed each time, as opposed to just being shown/hidden in the elements.
            'link:mouseenter': function (linkView) {
                if (linkView.model.get('type') === 'attrsys.RedecoratedLink' ||
                    linkView.model.get('type') === 'attrsys.ProjectedLink') {

                    linkView.addTools(new joint.dia.ToolsView({tools: linkView.model.getTools()}));
                }
            },
            'link:mouseleave': function (linkView) {
                linkView.removeTools();
            },


            /* Show and hide element tools */
            'element:mouseenter': function (elementView) {
                if (elementView.model.isAttribute()) {
                    elementView.showTools();
                }
            },
            'element:mouseleave': function (elementView) {
                elementView.hideTools();
            },


            /* Handle key press */
            'cell:mouseenter': function (cellView) {
                if (cellView.model.get('type') === 'attrsys.RedecoratedLink' ||
                    cellView.model.get('type') === 'attrsys.ProjectedLink') {
                    graphContainer
                        .attr('tabindex', 0)
                        .on('mouseover', function () {
                            this.focus();
                        })
                        .on('keydown', function (e) {
                            /* Delete element or link with 'del', when hovering over it */
                            if (e.which === 46) {
                                removeCell(cellView.model);
                            }
                        });
                }
            },
            'cell:mouseleave': function (cellView) {
                graphContainer
                    .attr('tabindex', 1)
                    .off('mouseover')
                    .off('keydown');
            },
        });


        function removeCell(model) {
            if (model.get('type') === 'attrsys.Symbol') {
                model.getContainer().remove();
            } else {
                model.remove();
            }
        }
    }
}