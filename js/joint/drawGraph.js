import {Graph} from "./graph.js";
import {
    ATTRIBUTE_HEIGHT,
    ATTRIBUTE_WIDTH, MAX_ALL_ATTRIBUTES_WIDTH, MAX_ATTRIBUTES_IN_ONE_ROW, newAttribute, newSymbol,
    PAPER_MARGIN_X,
    PAPER_MARGIN_Y, SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES, SPACING_BETWEEN_ATTRIBUTES_X,
    SPACING_BETWEEN_CONTAINERS, SYMBOL_HEIGHT,
    SYMBOL_WIDTH
} from "./attrsys.js";
import {findEmptySpotForNewAttribute} from "./attrsys.Element.js";
import {getLastArrayIndex} from "../utils.js";


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


export function drawDependencyGraph(graphObject, grammar, productionRule, graphType,
                                    nonterminalIndex, productionRuleIndex, iterationIndex) {

    const symbolNodes = drawSyntaxTree(graphObject, productionRule, graphType, false);
    const attributeNodes = addAttributesToSyntaxTree(graphObject, grammar, productionRule, symbolNodes, graphType);

    linkAttributes(graphObject, grammar, productionRule, attributeNodes, graphType, nonterminalIndex, productionRuleIndex, iterationIndex);
}


export function drawSyntaxTree(graphObject, productionRule, graphType, onlySyntaxTree) {

    const paper = graphObject.paper;
    const graph = graphObject.graph;

    const productionRuleSymbolNames = productionRule.symbolNames;

    const symbolNodes = [];

    for (let symbolIndex = 0; symbolIndex < productionRuleSymbolNames.length; symbolIndex++) {

        const {x, y} = defineNodePosition(symbolIndex, productionRule, paper, onlySyntaxTree);

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


function linkAttributes(graphObject, grammar, productionRule, attributeNodes, graphType,
                        nonterminalIndex, productionRuleIndex, iterationIndex) {

    addRegularAttributeLinks(graphObject, productionRule, attributeNodes);

    if (graphType === GRAPH_TYPE.acyclicity && iterationIndex > 0) {

        const previousIterationIndex = iterationIndex - 1;

        addRedecoratedRelations(graphObject, grammar, attributeNodes, nonterminalIndex, productionRuleIndex, previousIterationIndex);
        addRootProjections(graphObject, grammar, attributeNodes, nonterminalIndex, productionRuleIndex, previousIterationIndex);
    }
}

function addRegularAttributeLinks(graphObject, productionRule, attributeNodes) {

    const productionRuleSymbols = productionRule.symbols;

    for (let i = 0; i < productionRuleSymbols.length; i++) {

        const symbolAttributes = productionRuleSymbols[i].attributes;

        for (let j = 0; j < symbolAttributes.length; j++) {

            const attribute = symbolAttributes.getAt(j);

            for (const dependency of attribute.dependencies.values()) {

                const link = joint.shapes.attrsys.RegularAttributeLink.createWithRandomPadding();

                link.source(attributeNodes[i][j]);
                link.target(attributeNodes[dependency.toSymbolIndex][dependency.toAttributeIndexInsideSymbol]);
                link.addTo(graphObject.graph);
            }
        }
    }
}

function addRedecoratedRelations(graphObject, grammar, attributeNodes, nonterminalIndex, productionRuleIndex, iterationIndex) {

    const redecoratedRelations = grammar.strongAcyclicity.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].redecoratedRelations;

    for (const redecoratedRelation of redecoratedRelations.values()) {

        const newRedecoratedLink = joint.shapes.attrsys.RedecoratedLink.createWithRandomPadding();

        newRedecoratedLink.source(attributeNodes[redecoratedRelation.fromSymbolIndex][redecoratedRelation.fromAttributeIndexInsideSymbol]);
        newRedecoratedLink.target(attributeNodes[redecoratedRelation.toSymbolIndex][redecoratedRelation.toAttributeIndexInsideSymbol]);
        newRedecoratedLink.addTo(graphObject.graph);
    }
}

function addRootProjections(graphObject, grammar, attributeNodes, nonterminalIndex, productionRuleIndex, iterationIndex) {

    const rootProjections = grammar.strongAcyclicity.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].rootProjections;

    for (const rootProjection of rootProjections.values()) {

        const newRootProjectedLink = joint.shapes.attrsys.ProjectedLink.createWithRandomPadding();

        newRootProjectedLink.source(attributeNodes[rootProjection.fromSymbolIndex][rootProjection.fromAttributeIndexInsideSymbol]);
        newRootProjectedLink.target(attributeNodes[rootProjection.toSymbolIndex][rootProjection.toAttributeIndexInsideSymbol]);
        newRootProjectedLink.addTo(graphObject.graph);
    }
}


/* Functions for drawSyntaxGraph() */
function defineNodePosition(symbolIndex, productionRule, paper, onlySyntaxTree) {

    const paperWidth = paper.options.width;
    const paperHeight = paper.options.height;

    const productionRuleSymbols = productionRule.symbols;


    // Root node.
    if (symbolIndex === 0) {

        return {
            x: placeInTheCentreX(0, productionRuleSymbols, paper, onlySyntaxTree),
            y: PAPER_MARGIN_Y
        };
    }

    const childrenY = paperHeight - PAPER_MARGIN_Y - getMaxContainerHeight(productionRuleSymbols);


    // Only one child.
    if (productionRuleSymbols.length === 2) {

        return {
            x: placeInTheCentreX(symbolIndex, productionRuleSymbols, paper, onlySyntaxTree),
            y: childrenY
        };
    }


    // More than one child.
    const firstChildX = paperWidth / 2 - getTotalChildrenWidth(productionRuleSymbols, onlySyntaxTree) / 2;
    const widthOfSiblingsBefore = getWidthOfSiblingsBefore(symbolIndex, productionRuleSymbols, onlySyntaxTree);

    return {
        x: firstChildX + widthOfSiblingsBefore,
        y: childrenY
    };
}

function placeInTheCentreX(symbolIndex, symbols, paper, onlySyntaxTree) {

    const paperWidth = paper.options.width;
    let centralPositionX = paperWidth / 2 - SYMBOL_WIDTH / 2;

    // If we are not just drawing the syntax tree and there are 4 attribute nodes, it can happen,
    // that they go out of frame, if the (non-)terminal node is positioned centrally.
    if (!onlySyntaxTree) {

        const containerWidth = getContainerWidth(symbolIndex, symbols, onlySyntaxTree);

        // If the container width is larger than half of the width of the paper, then we need to move
        // the (non-)terminal to the left, so that all attributes fit into the view.
        if (containerWidth >= paperWidth / 2) {
            centralPositionX = paperWidth - containerWidth - PAPER_MARGIN_X;
        }
    }

    return centralPositionX;
}

function getTotalChildrenWidth(symbols, onlySyntaxTree) {

    let totalChildrenWidth = 0;

    // Loop through all children in the syntax tree (leave out index=0, which is the root).
    for (let i = 1; i < symbols.length; i++) {

        totalChildrenWidth += getContainerWidth(i, symbols, onlySyntaxTree);

        if (i < getLastArrayIndex(symbols)) {
            totalChildrenWidth += SPACING_BETWEEN_CONTAINERS;
        }
    }

    return totalChildrenWidth;
}

function getWidthOfSiblingsBefore(symbolIndex, symbols, onlySyntaxTree) {

    let width = 0;

    // Loop through all children before the given child (leave out index=0, which is the root).
    for (let i = 1; i < symbolIndex; i++) {

        width += getContainerWidth(i, symbols, onlySyntaxTree);
        width += SPACING_BETWEEN_CONTAINERS;
    }

    return width;
}

function getContainerWidth(symbolIndex, symbols, onlySyntaxTree) {

    if (onlySyntaxTree) {
        let containerWidth = SYMBOL_WIDTH;

        if (symbolIndex < getLastArrayIndex(symbols)) {
            containerWidth += SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES + MAX_ALL_ATTRIBUTES_WIDTH;
        }

        return containerWidth;

    } else {
        const numberOfAttributes = symbols[symbolIndex].attributes.length;

        if (numberOfAttributes === 0)
            return SYMBOL_WIDTH;


        const numberOfAttributeColumns = getNumberOfAttributeColumns(numberOfAttributes);
        const attributesWidth = numberOfAttributeColumns * ATTRIBUTE_WIDTH + (numberOfAttributeColumns - 1) * SPACING_BETWEEN_ATTRIBUTES_X;

        return SYMBOL_WIDTH + SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES + attributesWidth;
    }
}

function getNumberOfAttributeColumns(numberOfAttributes) {

    if (numberOfAttributes >= MAX_ATTRIBUTES_IN_ONE_ROW)
        return MAX_ATTRIBUTES_IN_ONE_ROW;

    return numberOfAttributes % MAX_ATTRIBUTES_IN_ONE_ROW;
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