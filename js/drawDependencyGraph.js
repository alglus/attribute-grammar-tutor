import {Graph} from "./graph.js";
import {
    ATTRIBUTE_HEIGHT,
    ATTRIBUTE_WIDTH, MAX_ATTRIBUTES_IN_ONE_ROW, newAttribute, newSymbol,
    PAPER_MARGIN_X,
    PAPER_MARGIN_Y, SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES, SPACING_BETWEEN_ATTRIBUTES_X,
    SPACING_BETWEEN_CONTAINERS, SYMBOL_HEIGHT,
    SYMBOL_WIDTH
} from "./joint.attrsys.js";
import {findEmptySpotForNewAttribute} from "./joint.attrsys.Element.js";


export const GRAPH_TYPE = Object.freeze({localDependency: 0, acyclicity: 1});


export function recenterIfGraphOutOfFrame(graph) {

    const paper = graph.paper;
    const contentArea = paper.getContentArea();

    const availableWidth = paper.options.width;
    const availableHeight = paper.options.height;

    if (contentArea.width > availableWidth || contentArea.height > availableHeight) {

        recenterGraph(graph);
    }
}


export function recenterGraph(graph) {

    const paper = graph.paper;

    paper.scaleContentToFit({
        padding: SYMBOL_WIDTH,
        minxScaleX: Graph.MIN_SCALE, minScaleY: Graph.MIN_SCALE,
        maxScaleX: Graph.MAX_SCALE, maxScaleY: Graph.MAX_SCALE,
    });
}


export function drawDependencyGraph(graphObject, grammar, productionRule, graphType) {

    const symbolNodes = drawSyntaxTree(graphObject, productionRule, graphType);
    const attributeNodes = addAttributesToSyntaxTree(graphObject, grammar, productionRule, symbolNodes, graphType);

    linkAttributes(graphObject, productionRule, attributeNodes);
}


export function drawSyntaxTree(graphObject, productionRule, graphType) {

    const paper = graphObject.paper;
    const graph = graphObject.graph;

    const productionRuleSymbolNames = productionRule.symbolNames;

    const symbolNodes = [];

    for (let symbolIndex = 0; symbolIndex < productionRuleSymbolNames.length; symbolIndex++) {

        const {x, y} = defineNodePosition(symbolIndex, productionRule, paper);

        symbolNodes[symbolIndex] = newSymbol(graphType, x, y, productionRuleSymbolNames, paper, graph, symbolIndex);

        linkChildrenWithRoot(symbolIndex, symbolNodes, graph);
    }

    return symbolNodes;
}


/* Functions for drawDependencyGraph() */
function addAttributesToSyntaxTree(graphObject, grammar, productionRule, symbolNodes, graphType) {

    const attributeNodes = [];
    const paper = graphObject.paper;
    const graph = graphObject.graph;
    const allAttributeNames = grammar.allAttributeNamesArray;

    for (let i = 0; i < symbolNodes.length; i++) {

        const symbolAttributeNodes = [];
        const symbolAttributes = productionRule.symbols[i].attributes;
        const symbolNode = symbolNodes[i];
        const symbolPosition = symbolNode.position();
        const container = symbolNode.getContainer();

        for (let j = 0; j < symbolAttributes.length; j++) {

            const attributeName = symbolAttributes.getAt(j).name;
            const emptySpot = findEmptySpotForNewAttribute(symbolPosition, container, graph);

            const attributeNode = newAttribute(graphType, emptySpot.x, emptySpot.y, container, allAttributeNames, paper, graph, attributeName);

            symbolAttributeNodes.push(attributeNode);
        }

        attributeNodes.push(symbolAttributeNodes);
    }

    return attributeNodes;
}

function linkAttributes(graphObject, productionRule, attributeNodes) {

    const productionRuleSymbols = productionRule.symbols;

    for (let i = 0; i < productionRuleSymbols.length; i++) {

        const symbolAttributes = productionRuleSymbols[i].attributes;

        for (let j = 0; j < symbolAttributes.length; j++) {

            const attribute = symbolAttributes.getAt(j);

            for (let k = 0; k < attribute.dependencies.length; k++) {

                const dependency = attribute.dependencies[k];

                const link = new joint.shapes.attrsys.AttributeLink();

                link.source(attributeNodes[i][j]);
                link.target(attributeNodes[dependency.toSymbolIndex][dependency.toAttributeIndexInsideSymbol]);
                link.addTo(graphObject.graph);
            }
        }
    }
}


/* Functions for drawSyntaxGraph() */
function defineNodePosition(symbolIndex, productionRule, paper) {

    const paperWidth = paper.options.width;
    const paperHeight = paper.options.height;

    const productionRuleSymbols = productionRule.symbols;

    const centralPositionX = paperWidth / 2 - SYMBOL_WIDTH / 2

    // Root node.
    if (symbolIndex === 0) {

        return {
            x: centralPositionX,
            y: PAPER_MARGIN_Y
        };
    }


    const childrenY = paperHeight - PAPER_MARGIN_Y - getMaxContainerHeight(productionRuleSymbols);

    // Only one child.
    if (productionRuleSymbols.length === 2) {

        return {
            x: centralPositionX,
            y: childrenY
        };
    }


    // More than one child.
    const firstChildX = paperWidth / 2 - getTotalChildrenWidth(productionRuleSymbols) / 2;
    const widthOfSiblingsBefore = getWidthOfSiblingsBefore(symbolIndex, productionRuleSymbols);

    return {
        x: PAPER_MARGIN_X + firstChildX + widthOfSiblingsBefore,
        y: childrenY
    };
}

function getTotalChildrenWidth(symbols) {

    let totalChildrenWidth = 0;

    // Loop through all children in the syntax tree (leave out index=0, which is the root).
    for (let i = 1; i < symbols.length; i++) {

        totalChildrenWidth += getContainerWidth(i, symbols);
        totalChildrenWidth += SPACING_BETWEEN_CONTAINERS;
    }

    return totalChildrenWidth;
}

function getWidthOfSiblingsBefore(symbolIndex, symbols) {

    let width = 0;

    // Loop through all children before the given child (leave out index=0, which is the root).
    for (let i = 1; i < symbolIndex; i++) {

        width += getContainerWidth(i, symbols);
        width += SPACING_BETWEEN_CONTAINERS;
    }

    return width;
}

function getContainerWidth(symbolIndex, symbols) {

    const numberOfAttributes = symbols[symbolIndex].attributes.length;

    if (numberOfAttributes === 0)
        return SYMBOL_WIDTH;


    const numberOfAttributeColumns = getNumberOfAttributeColumns(numberOfAttributes);
    const attributesWidth = numberOfAttributeColumns * ATTRIBUTE_WIDTH + (numberOfAttributeColumns - 1) * SPACING_BETWEEN_ATTRIBUTES_X;

    return SYMBOL_WIDTH + SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES + attributesWidth;
}

function getNumberOfAttributeColumns(numberOfAttributes) {

    if (numberOfAttributes >= MAX_ATTRIBUTES_IN_ONE_ROW)
        return MAX_ATTRIBUTES_IN_ONE_ROW;

    return (numberOfAttributes % MAX_ATTRIBUTES_IN_ONE_ROW) + 1;
}

function getMaxContainerHeight(symbols) {

    let maxContainerHeight = 0;

    // Loop through all children in the syntax tree (leave out index=0, which is the root).
    for (let i = 1; i < symbols.length; i++) {

        const containerHeight = getContainerHeight(i, symbols);

        maxContainerHeight = Math.max(containerHeight, maxContainerHeight);
    }

    return maxContainerHeight;
}

function getContainerHeight(symbolIndex, symbols) {

    const numberOfAttributes = symbols[symbolIndex].attributes.length;
    const numberOfAttributeRows = Math.ceil(numberOfAttributes / MAX_ATTRIBUTES_IN_ONE_ROW);

    const attributeHeight = numberOfAttributeRows * ATTRIBUTE_HEIGHT;

    // The attribute height can be zero, if there are no attributes, so we need to at least count the symbol height.
    return Math.max(SYMBOL_HEIGHT, attributeHeight);
}

function linkChildrenWithRoot(i, symbolNodes, graph) {

    // Only start linking, if it is a child.
    if (i > 0) {

        const link = new joint.shapes.attrsys.SymbolLink();

        link.source(symbolNodes[0]);
        link.target(symbolNodes[i]);
        link.addTo(graph);
    }
}