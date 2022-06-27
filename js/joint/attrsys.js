import {getLongestStringLengthInSet} from '../utils.js';
import {defineAttrsysLinks} from "./attrsys.Link.js";
import {defineAttrsysElements} from "./attrsys.Element.js";
import {GRAPH_TYPE} from "./drawGraph.js";

export let SYMBOL_WIDTH;
export let SYMBOL_HEIGHT;

export let ATTRIBUTE_WIDTH;
export let ATTRIBUTE_HEIGHT;

export let PAPER_MARGIN_X;
export let PAPER_MARGIN_Y;
export let SPACING_BETWEEN_CONTAINERS;
export let MAX_ALL_ATTRIBUTES_WIDTH;

export const SPACING_BETWEEN_ATTRIBUTES_X = 10;
export const SPACING_BETWEEN_ATTRIBUTES_Y = 15;
export const SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES = 15;
export const MAX_ATTRIBUTES_IN_ONE_ROW = 4;

export const ERROR_DARK_RED = '#d00';
export const ERROR_LIGHT_RED = '#fcc';
export const LIGHT_GREY = '#ccc';
export const DARK_GREY = '#333';


export const HIGHLIGHT_AREA = Object.freeze({default: 0, border: 1, label: 2, body: 3,});

export function defineJointAttrsysObjects(grammar) {
    initialiseSizeConstants(grammar);

    defineAttrsysElements(grammar);
    defineAttrsysLinks();
}

export function newAttribute(graphType, x, y, container, attributeNames, paper, graph, attributeName) {
    if (graphType === GRAPH_TYPE.localDependency) {
        return joint.shapes.attrsys.Attribute.create(x, y, container, attributeNames, paper, graph, attributeName);
    } else {
        return joint.shapes.attrsys.AcyclicityAttribute.create(x, y, container, attributeNames, paper, graph, attributeName);
    }
}

export function newSymbol(graphType, x, y, symbolNames, paper, graph, symbolIndex) {
    if (graphType === GRAPH_TYPE.localDependency) {
        return joint.shapes.attrsys.Symbol.create(graphType, x, y, symbolNames, paper, graph, symbolIndex);
    } else {
        return joint.shapes.attrsys.AcyclicitySymbol.create(graphType, x, y, symbolNames, paper, graph, symbolIndex);
    }
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

    PAPER_MARGIN_X = 1.5 * SYMBOL_WIDTH;
    PAPER_MARGIN_Y = 1.5 * SYMBOL_HEIGHT;
    SPACING_BETWEEN_CONTAINERS = 1.5 * SYMBOL_WIDTH;

    MAX_ALL_ATTRIBUTES_WIDTH =
        MAX_ATTRIBUTES_IN_ONE_ROW * ATTRIBUTE_WIDTH
        + (MAX_ATTRIBUTES_IN_ONE_ROW - 1) * SPACING_BETWEEN_ATTRIBUTES_X;
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