import {arrayHasDuplicateValues, getLongestStringLengthInSet, parameterHasBeenSpecified} from './utils.js';

export let SYMBOL_WIDTH;
export let SYMBOL_HEIGHT;

let ATTRIBUTE_WIDTH;
let ATTRIBUTE_HEIGHT;

const FONT_FAMILY = 'sometypeMono';
const FONT_SIZE = 15;

const CONTAINER_PADDING = 5;

const ERROR_DARK_RED = '#d00';
const ERROR_LIGHT_RED = '#fcc';
const LIGHT_GREY = '#ccc';
const DARK_GREY = '#333';
const SYMBOL_FILL = '#addaff';
const ATTRIBUTE_FILL = '#d0ffb4';

export const HIGHLIGHT_AREA = Object.freeze({default: 0, border: 1, label: 2, body: 3,});

export function defineJointAttrsysObjects(grammar) {
    initialiseSizeConstants(grammar);

    defineSymbolShape();
    defineAttributeShape();
    defineContainerShape();
    defineAddAttributeButton(grammar);

    defineAttributeLink();
    defineSymbolLink();
}

function initialiseSizeConstants(grammar) {
    const fontWidth = 9; // valid for 'sometypeMono' and 15pt. For any other font family / size, change this.
    const sidePadding = 3;

    // The minimal node is a square, which contains up to 2 characters.
    // In case of larger texts, the width increases until 4 characters. However, the height keeps constant.
    const nodeHeight = 2 * fontWidth + 2 * sidePadding;
    SYMBOL_HEIGHT = ATTRIBUTE_HEIGHT = nodeHeight;

    const longestSymbolLength = getLongestStringLengthInSet(grammar.allSymbolNames);
    const longestAttributeLength = getLongestStringLengthInSet(grammar.allAttributeNames);

    SYMBOL_WIDTH = setWidthBasedOnLongestName(longestSymbolLength, fontWidth, sidePadding);
    ATTRIBUTE_WIDTH = setWidthBasedOnLongestName(longestAttributeLength, fontWidth, sidePadding);

}

function setWidthBasedOnLongestName(nameLength, fontWidth, sidePadding) {
    let charactersInNode = 2;

    if (nameLength === 3) {
        charactersInNode = 3;
    } else if (nameLength >= 4) {
        charactersInNode = 4;
    }

    return charactersInNode * fontWidth + 2 * sidePadding;
}


/**
 * Symbol shape
 */
function defineSymbolShape() {
    joint.shapes.standard.Rectangle.define('attrsys.Symbol', {
        graph: '',
        container: '',
        symbolNames: [],
        currentIndex: 0,
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
        toggleName: function () {
            const symbolNames = this.prop('symbolNames');
            const currentIndex = this.prop('currentIndex');

            this.setName(symbolNames[currentIndex]);
            this.prop('attrs/label/text', symbolNames[currentIndex]);
            this.prop('currentIndex', advanceIndex(symbolNames, currentIndex));
        },
        scrollName: function (delta) {
            const symbolNames = this.prop('symbolNames');
            const currentIndex = this.prop('currentIndex');
            const newIndex = moveIndex(symbolNames, currentIndex, delta);

            this.setName(symbolNames[newIndex]);
            this.prop('attrs/label/text', symbolNames[newIndex]);
            this.prop('currentIndex', newIndex);
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
        create: function (x, y, symbolNames, paper, graph, symbolIndex) {
            let symbolText;
            if (parameterHasBeenSpecified(symbolIndex)) {
                symbolText = symbolNames[symbolIndex];
            } else {
                symbolText = symbolNames[0];
            }

            // Create a container for the symbol and all its attributes.
            const container = new joint.shapes.attrsys.Container.create(x, y);
            container.addTo(graph);

            const newSymbol = new this();
            newSymbol.prop('symbolNames', symbolNames);
            newSymbol.prop('attrs/label/text', symbolText);
            newSymbol.prop('graph', graph);
            newSymbol.prop('container', container);
            newSymbol.setName(symbolText);
            newSymbol.position(x - SYMBOL_WIDTH / 2, y - SYMBOL_HEIGHT / 2);

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
}


/**
 * Attribute shape
 */
function defineAttributeShape() {
    joint.shapes.standard.Rectangle.define('attrsys.Attribute', {
        container: '',
        attributeNames: [],
        currentIndex: 0,
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
        scrollName: function (delta) {
            const attributeNames = this.prop('attributeNames');
            const currentIndex = this.prop('currentIndex');
            const newIndex = moveIndex(attributeNames, currentIndex, delta);

            this.setName(attributeNames[newIndex]);
            this.prop('attrs/label/text', attributeNames[newIndex]);
            this.prop('currentIndex', newIndex);
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
}


/**
 * Container shape
 */
function defineContainerShape() {
    joint.dia.Element.define('attrsys.Container', {
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
    }, {
        create: function (x, y) {
            const container = new joint.shapes.attrsys.Container();

            const translateX = CONTAINER_PADDING + SYMBOL_WIDTH / 2;
            const translateY = CONTAINER_PADDING + SYMBOL_HEIGHT / 2;
            container.position(x - translateX, y - translateY);

            return container;
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
                // Transparent box around the plus-icon, so that the user can hover over to the plus-icon,
                // without leaving the symbol and thus hiding the plus-icon.
                tagName: 'rect',
                selector: 'body',
                attributes: {
                    width: backgroundWidth,
                    height: SYMBOL_HEIGHT,
                    opacity: 0,
                    stroke: '#F00',
                    strokeWidth: 1,

                    // Move the top-left corner of the background back to the right symbol corner.
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
                x: backgroundWidth / 2, // The centre of the plus-icon should be (bckgndWidth/2) to the right of the symbol.
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


/**
 * Link between attributes
 * @returns new AttributeLink object
 */
function defineAttributeLink() {
    return joint.shapes.standard.Link.define('attrsys.AttributeLink', {
        router: {name: 'manhattan'},
        connector: {name: 'rounded'},
        attrs: {
            z: 2,
            line: {
                stroke: DARK_GREY,
                strokeWidth: 2,
            }
        },

    }, {
        getTools() {
            return [
                new joint.linkTools.Vertices(),
                new joint.linkTools.Remove({distance: '50%'}),
                new joint.linkTools.TargetArrowhead(),
            ];
        },
        showErrorHighlighting(area) {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', DARK_GREY);
        },
    });
}


/**
 * Link between symbols
 * @returns new SymbolLink object
 */
function defineSymbolLink() {
    return joint.shapes.standard.Link.define('attrsys.SymbolLink', {
        router: {name: 'normal'},
        connector: {name: 'rounded'},
        attrs: {
            z: 2,
            line: {
                stroke: LIGHT_GREY,
                strokeWidth: 3,
            }
        },

    }, {
        getTools() {
            return [
                new joint.linkTools.Vertices(),
                new joint.linkTools.Remove({distance: '50%'}),
                new joint.linkTools.TargetArrowhead(),
            ];
        },
        showErrorHighlighting(area) {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', LIGHT_GREY);
        },
    });
}


function advanceIndex(array, currentIndex) {
    let nextIndex = ++currentIndex;
    if (nextIndex >= array.length) {
        nextIndex = 0;
    }
    return nextIndex;
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
    const horizontalSpacing = 10;
    const verticalSpacing = 15;

    const initialX = symbolPosition.x + SYMBOL_WIDTH + 15;

    let x = initialX;
    let y = symbolPosition.y;

    let spotsSearchedToTheRight = 0;

    while (true) {
        const nextSpot = new g.Rect(x, y, ATTRIBUTE_WIDTH, ATTRIBUTE_HEIGHT);
        const underlyingModels = graph.findModelsInArea(nextSpot);
        const underlyingAttributes = leaveOnlyAttributesInOwnContainer(underlyingModels, container);

        if (underlyingAttributes.length === 0) break;

        spotsSearchedToTheRight += 1;

        if (spotsSearchedToTheRight % 4 === 0) {
            y += ATTRIBUTE_HEIGHT + verticalSpacing;
            x = initialX;
        } else {
            x += ATTRIBUTE_WIDTH + horizontalSpacing;
        }
    }

    return {x: x, y: y}
}

function leaveOnlyAttributesInOwnContainer(modelsArray, container) {
    return modelsArray
        .filter(m => m.get('type') === 'attrsys.Attribute') // leave only attributes
        .filter(m => m.getContainer() === container)        // exclude any attributes inside other containers

}
