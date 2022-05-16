import {
    arrayHasDuplicateValues,
    parameterHasBeenSpecified
} from "./utils.js";
import {
    ATTRIBUTE_HEIGHT,
    ATTRIBUTE_WIDTH, DARK_GREY, ERROR_DARK_RED, ERROR_LIGHT_RED,
    HIGHLIGHT_AREA, LIGHT_GREY,
    MAX_ATTRIBUTES_IN_ONE_ROW,
    SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES,
    SPACING_BETWEEN_ATTRIBUTES_X,
    SPACING_BETWEEN_ATTRIBUTES_Y,
    SYMBOL_HEIGHT,
    SYMBOL_WIDTH
} from "./joint.attrsys.js";
import {GRAPH_TYPE} from "./drawDependencyGraph.js";

const FONT_FAMILY = 'sometypeMono';
const FONT_SIZE = 15;

const CONTAINER_PADDING = 5;

const SYMBOL_FILL = '#addaff';
const ATTRIBUTE_FILL = '#d0ffb4';


export function defineAttrsysElements(grammar) {
    defineSymbolShape();
    defineAttributeShape();
    defineContainerShape();
    defineAddAttributeButton(grammar);
}

/**
 * Symbol shape
 */
function defineSymbolShape() {
    const Symbol = joint.shapes.standard.Rectangle.define('attrsys.Symbol', {
        graph: '',
        container: '',
        symbolIndex: 0,
        symbolNames: [],
        currentNameIndex: 0,
        size: {width: SYMBOL_WIDTH, height: SYMBOL_HEIGHT},
        attrs: {
            // z: 4,
            root: {
                // Defines around which part to highlight, when a link is hovering over it.
                highlighterSelector: 'body',
                title: '',
            },
            body: {
                rx: 1,
                ry: 1,
                strokeWidth: 1,
                stroke: DARK_GREY,
                fill: SYMBOL_FILL,
            },
            label: {
                textAnchor: 'middle', // Horizontal position
                textVerticalAnchor: 'middle',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE,
                fill: DARK_GREY,
                textWrap: {
                    width: -6, // Maximum width of the text, before wrapping: shapeWidth + width
                    maxLineCount: 1,
                    ellipsis: '…', // Character to replace the trimmed characters with.
                },
            }
        }
    }, {
        /* Object functions */
        scrollName: function (delta) {
            const symbolNames = this.prop('symbolNames');
            const currentNameIndex = this.prop('currentNameIndex');
            const newNameIndex = moveIndex(symbolNames, currentNameIndex, delta);

            this.setName(symbolNames[newNameIndex]);
            this.prop('attrs/label/text', symbolNames[newNameIndex]);
            this.prop('currentNameIndex', newNameIndex);
        },
        getTools() {
            // The last tool in the array will be the one on top in the graph.
            return [
                getNewConnectTool(this),
                this.getNewAttributeButtonTool(),
                this.getNewRemoveTool(),
            ]
        },
        getNewAttributeButtonTool() {
            return new joint.elementTools.AddAttributeButton();
        },
        getNewRemoveTool() {
            const container = this.getContainer();
            return new joint.elementTools.Remove({
                action: function () {
                    container.remove();
                }
            });
        },
        getAttributeNodes() {
            return this.getContainer().getEmbeddedCells().filter(c => c.isAttribute());
        },
        hasDuplicateAttributes() {
            const attributeNodeNames = this.getAttributeNodes().map(a => a.getName());
            return arrayHasDuplicateValues(attributeNodeNames);
        },
        getName() {
            return this.prop('attrs/root/title');
        },
        setName(name) {
            this.prop('attrs/root/title', name);
        },
        setIndex(index) {
           this.prop('symbolIndex', index);
        },
        getIndex() {
            return this.prop('symbolIndex');
        },
        getContainer() {
            return this.prop('container');
        },
        isSymbol() {
            return true;
        },
        isAttribute() {
            return false;
        },
        isContainer() {
            return false;
        },
        showErrorHighlighting(area) {
            switch (area) {
                case HIGHLIGHT_AREA.border:
                    this.prop('attrs/body/stroke', ERROR_DARK_RED);
                    this.prop('attrs/body/strokeWidth', 2);
                    break;
                case HIGHLIGHT_AREA.body:
                    this.prop('attrs/body/fill', ERROR_LIGHT_RED);
                    break;
                case HIGHLIGHT_AREA.label:
                    this.prop('attrs/label/fill', ERROR_DARK_RED);
                    break;
                case HIGHLIGHT_AREA.default:
                default:
            }
        },
        hideErrorHighlighting(area) {
            switch (area) {
                case HIGHLIGHT_AREA.border:
                    this.prop('attrs/body/stroke', DARK_GREY);
                    this.prop('attrs/body/strokeWidth', 1);
                    break;
                case HIGHLIGHT_AREA.body:
                    this.prop('attrs/body/fill', SYMBOL_FILL);
                    break;
                case HIGHLIGHT_AREA.label:
                    this.prop('attrs/label/fill', DARK_GREY);
                    break;
                case HIGHLIGHT_AREA.default:
                default:
            }
        },
    }, {
        /* Static function */
        create: function (graphType, x, y, symbolNames, paper, graph, symbolIndex) {
            let symbolText;
            if (parameterHasBeenSpecified(symbolIndex)) {
                symbolText = symbolNames[symbolIndex];
            } else {
                symbolText = symbolNames[0];
            }

            // Create a container for the symbol and all its attributes.
            let container;
            if (graphType === GRAPH_TYPE.localDependency) {
                container = new joint.shapes.attrsys.Container();
            } else {
                container = new joint.shapes.attrsys.AcyclicityContainer();
            }
            container.position(x - CONTAINER_PADDING, y - CONTAINER_PADDING);
            container.addTo(graph);

            const newSymbol = new this();
            newSymbol.prop('symbolNames', symbolNames);
            newSymbol.prop('attrs/label/text', symbolText);
            newSymbol.prop('graph', graph);
            newSymbol.prop('container', container);
            newSymbol.setName(symbolText);
            newSymbol.position(x, y);

            newSymbol.addTo(graph);
            container.embed(newSymbol);

            const newSymbolToolsView = new joint.dia.ToolsView({
                tools: newSymbol.getTools(),
            });
            const newSymbolElementView = newSymbol.findView(paper);
            newSymbolElementView.addTools(newSymbolToolsView);
            newSymbolElementView.hideTools();

            return newSymbol;
        },
    });

    /**
     * Acyclicity Symbol
     */
    Symbol.define('attrsys.AcyclicitySymbol', {
        attrs: {
            root: {cursor: 'default',},
            body: {cursor: 'default',},
            label: {cursor: 'default',}
        }
    });

}


/**
 * Attribute shape
 */
function defineAttributeShape() {
    const Attribute = joint.shapes.standard.Rectangle.define('attrsys.Attribute', {
        container: '',
        attributeNames: [],
        currentNameIndex: 0,
        size: {width: ATTRIBUTE_WIDTH, height: ATTRIBUTE_HEIGHT},
        attrs: {
            root: {
                highlighterSelector: 'body',
                title: '',
            },
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                rx: 5,
                ry: 5,
                strokeWidth: 1,
                stroke: DARK_GREY,
                fill: ATTRIBUTE_FILL,
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE,
                fill: DARK_GREY,
                textWrap: {
                    width: -6, // Maximum width of the text, before wrapping = shapeWidth + width
                    maxLineCount: 1,
                    ellipsis: '…', // Character to replace the trimmed characters with.
                },
            }
        }
    }, {
        /* Object functions */
        scrollName: function (delta) {
            const attributeNames = this.prop('attributeNames');
            const currentNameIndex = this.prop('currentNameIndex');
            const newNameIndex = moveIndex(attributeNames, currentNameIndex, delta);

            this.setName(attributeNames[newNameIndex]);
            this.prop('attrs/label/text', attributeNames[newNameIndex]);
            this.prop('currentNameIndex', newNameIndex);
        },
        adjustContainer: function () {
            this.getContainer().fitChildren();
        },
        getTools() {
            return [
                getNewConnectTool(this),
                new joint.elementTools.Remove(),
            ]
        },
        getSymbolNode() {
            // There can't possibly be more than 1 symbol in a container, so it is safe to use: [0].
            return this.getContainer().getEmbeddedCells().filter(c => c.isSymbol())[0];
        },
        getName() {
            return this.prop('attrs/root/title');
        },
        setName(name) {
            this.prop('attrs/root/title', name);
        },
        getContainer() {
            return this.prop('container');
        },
        isSymbol() {
            return false;
        },
        isAttribute() {
            return true;
        },
        isContainer() {
            return false;
        },
        showErrorHighlighting(area) {
            switch (area) {
                case HIGHLIGHT_AREA.border:
                    this.prop('attrs/body/stroke', ERROR_DARK_RED);
                    this.prop('attrs/body/strokeWidth', 2);
                    break;
                case HIGHLIGHT_AREA.label:
                default:
                    this.prop('attrs/label/fill', ERROR_DARK_RED);
            }
        },
        hideErrorHighlighting(area) {
            switch (area) {
                case HIGHLIGHT_AREA.border:
                    this.prop('attrs/body/stroke', DARK_GREY);
                    this.prop('attrs/body/strokeWidth', 1);
                    break;
                case HIGHLIGHT_AREA.label:
                default:
                    this.prop('attrs/label/fill', DARK_GREY);
            }
        },
    }, {
        /* Static function */
        create: function (x, y, container, attributeNames, paper, graph, attributeName) {
            let attributeText;
            if (parameterHasBeenSpecified(attributeName)) {
                attributeText = attributeName;
            } else {
                attributeText = attributeNames[0];
            }

            const newAttribute = new this();
            newAttribute.prop('attributeNames', attributeNames);
            newAttribute.prop('attrs/label/text', attributeText);
            newAttribute.prop('container', container);
            newAttribute.setName(attributeText);
            newAttribute.position(x, y);

            newAttribute.addTo(graph);
            container.embed(newAttribute);

            const newAttributeToolsView = new joint.dia.ToolsView({
                tools: newAttribute.getTools(),
            });
            const newAttributeElementView = newAttribute.findView(paper);
            newAttributeElementView.addTools(newAttributeToolsView);
            newAttributeElementView.hideTools();

            container.fitChildren();

            return newAttribute;
        }
    });


    /**
     * Acyclicity graph attribute
     */
    Attribute.define('attrsys.AcyclicityAttribute', {
        /* Options */
        attrs: {
            root: {cursor: 'default',},
            body: {cursor: 'default',},
            label: {cursor: 'default',}
        }
    }, {
        /* Object functions */
        getTools() {
            return [getNewConnectTool(this)]
        }
    });
}


/**
 * Container shape
 */
function defineContainerShape() {
    const Container = joint.dia.Element.define('attrsys.Container', {
        size: {
            width: SYMBOL_WIDTH + CONTAINER_PADDING * 2,
            height: SYMBOL_HEIGHT + CONTAINER_PADDING * 2,
        },
        attrs: {
            z: 1,
            '.': {magnet: false}, // prevents any link to attach to this shape
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                rx: 5,
                ry: 5,
                strokeWidth: 1,
                stroke: LIGHT_GREY,
                strokeDasharray: '4 4',
                fillOpacity: 0, // If the fill was 'none', then one would not be able to move the container.
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }],

        /* Object functions */
        fitChildren: function () {
            this.fitEmbeds({
                padding: CONTAINER_PADDING,
            });
        },
        isSymbol() {
            return false;
        },
        isAttribute() {
            return false;
        },
        isContainer() {
            return true;
        },
        showErrorHighlighting(area) {
            this.prop('attrs/body/stroke', ERROR_DARK_RED);
            this.prop('attrs/body/strokeWidth', 2);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/body/stroke', LIGHT_GREY);
            this.prop('attrs/body/strokeWidth', 1);
        },
    });


    /**
     * Acyclicity Container
     */
    Container.define('attrsys.AcyclicityContainer', {
        attrs: {
            body: {cursor: 'default'}
        }
    });
}


/**
 * Add-new-attribute button
 * @param grammar
 */
function defineAddAttributeButton(grammar) {

    const backgroundWidth = 20;

    joint.elementTools.AddAttributeButton = joint.elementTools.Button.extend({
        name: 'add-attribute-button',
        options: {
            markup: [{
                // Transparent box around the plus-icon, so that there is a larger area for the mouse to hover over,
                // so the user can move the mouse over to the plus-icon more easily.
                tagName: 'rect',
                selector: 'body',
                attributes: {
                    width: backgroundWidth,
                    height: SYMBOL_HEIGHT,
                    opacity: 0,
                    stroke: '#F00',
                    strokeWidth: 1,

                    // Move the top-left corner of the background back to the symbol right corner.
                    x: -backgroundWidth / 2,
                    y: -SYMBOL_HEIGHT / 2,
                }
            }, {
                tagName: 'circle',
                selector: 'button',
                attributes: {
                    'r': 8,
                    'fill': '#ffbf00',
                    'cursor': 'pointer',
                }
            }, {
                tagName: 'path',
                selector: 'icon',
                attributes: {
                    'd': 'M -5 0 5 0 M 0 -5 0 5',
                    'fill': 'none',
                    'stroke': '#FFFFFF',
                    'stroke-width': 2,
                    'pointer-events': 'none',
                }
            }],
            // The original (x,y) is the top-left corner of the symbol.
            x: '100%', // Moves the x a whole width (100%) to the right. So it becomes the right-top corner.
            y: '50%',  // Moves the y halfway (50%) down. So it becomes the middle point of the right border of the symbol.
            offset: {
                // Offset in relation to the (x,y) defined above.
                x: backgroundWidth / 2, // The centre of the plus-icon should be (backgroundWidth/2) to the right of the symbol.
                y: 0                    // The y should stay in the middle of the symbol, as defined above.
            },
            rotate: true,
            action: function (event, view) {
                const symbol = view.model;
                const symbolPosition = symbol.position();

                const container = symbol.getContainer();

                const attributeNamesArray = grammar.allAttributeNamesArray;
                const paper = view.paper;
                const graph = symbol.prop('graph');

                const emptySpot = findEmptySpotForNewAttribute(symbolPosition, container, graph);

                joint.shapes.attrsys.Attribute.create(emptySpot.x, emptySpot.y, container, attributeNamesArray, paper, graph);
            }
        }
    });
}


function moveIndex(array, currentIndex, delta) {

    let newIndex = currentIndex + delta;

    if (newIndex >= array.length) {
        newIndex = newIndex - array.length;

    } else if (newIndex < 0) {
        newIndex = array.length + newIndex;
    }

    return newIndex;
}


function getNewConnectTool(cell) {

    return new joint.linkTools.Connect({
        markup: [{
            tagName: 'rect',
            attributes: {
                'width': cell.size().width,
                'height': cell.size().height,
                // 'z': 5,
                'fill': 'none',
                'stroke-width': 5,
                'rx': cell.prop('attrs/body/rx'),
                'ry': cell.prop('attrs/body/ry'),
                'stroke-opacity': 0.4,
                'stroke': DARK_GREY,
                'cursor': 'cell',
            }
        }]
    });
}


export function findEmptySpotForNewAttribute(symbolPosition, container, graph) {

    const initialX = symbolPosition.x + SYMBOL_WIDTH + SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES;

    let x = initialX;
    let y = symbolPosition.y;

    let spotsSearchedToTheRight = 0;

    while (true) {

        const nextSpot = new g.Rect(x, y, ATTRIBUTE_WIDTH, ATTRIBUTE_HEIGHT);

        // Find out, whether there are any sibling attributes already at (x,y).
        const underlyingModels = graph.findModelsInArea(nextSpot);
        const underlyingAttributes = leaveOnlyAttributesInOwnContainer(underlyingModels, container);

        // The spot is empty.
        if (underlyingAttributes.length === 0) break;


        spotsSearchedToTheRight += 1;

        if (spotsSearchedToTheRight % MAX_ATTRIBUTES_IN_ONE_ROW === 0) {

            // Advance to the next row of attributes.
            y += ATTRIBUTE_HEIGHT + SPACING_BETWEEN_ATTRIBUTES_Y;
            x = initialX;

        } else {

            // Move one attribute to the right.
            x += ATTRIBUTE_WIDTH + SPACING_BETWEEN_ATTRIBUTES_X;
        }
    }

    return {x: x, y: y}
}

function leaveOnlyAttributesInOwnContainer(modelsArray, container) {

    return modelsArray
        .filter(
            m => m.get('type') === 'attrsys.Attribute' ||
                m.get('type') === 'attrsys.AcyclicityAttribute') // leave only attributes
        .filter(m => m.getContainer() === container)        // exclude any attributes inside other containers

}