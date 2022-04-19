import {DependenciesGraph, MAX_SCALE, MIN_SCALE} from './dependenciesGraph.js';
import {arrayIsEmpty, chooseOneAtRandom, emptyArray, ERROR} from './utils.js';
import {
    ATTRIBUTE_HEIGHT,
    ATTRIBUTE_WIDTH,
    defineJointAttrsysObjects,
    findEmptySpotForNewAttribute,
    HIGHLIGHT_AREA,
    MAX_ATTRIBUTES_IN_ONE_ROW, PAPER_MARGIN_X, PAPER_MARGIN_Y,
    SPACE_BETWEEN_SYMBOL_AND_ATTRIBUTES,
    SPACING_BETWEEN_ATTRIBUTES_X, SPACING_BETWEEN_CONTAINERS,
    SYMBOL_HEIGHT,
    SYMBOL_WIDTH
} from './joint.attrsys.js';


export function emptyDependenciesGraphsArray() {
    emptyArray(DependenciesGraph.allGraphs);
}

export function createDependenciesGraphs(grammar) {
    defineJointAttrsysObjects(grammar);

    createContainerForTheGraph();

    createAllGraphs(grammar);

    setFunctionForCheckAllButton(grammar);
    setFunctionForDrawAllTreesButton(grammar);
    setFunctionForShowAllSolutionsButton(grammar);
}


function createContainerForTheGraph() {
    const graphContainerHTML = $('<div class="card-body dependenciesGraph" data-index="0"></div>');
    const elementRightBeforeGraphContainer = $('.dependenciesGraphCardHeader[data-index=0]');

    graphContainerHTML.insertAfter(elementRightBeforeGraphContainer);
}

function createAllGraphs(grammar) {

    for (let i = 0; i < grammar.productionRules.length; i++) {

        createNewGraphCard(i);

        setTitleOfGraphCard(i, grammar);

        setFunctionForCheckButton(i, grammar);
        setFunctionForResetButton(i);
        setFunctionForDrawTreeButton(i, grammar);
        setFunctionForShowSolutionButton(i, grammar);
        setFunctionForRecenterButton(i);
        setFunctionForShowErrorsButton(i);

        hideToggleGraphErrorsBtn(i);
        hideGraphCorrectIcon(i);

        createNewGraph(i, grammar);
    }
}

function createNewGraphCard(i) {

    const firstDependenciesGraphCard = $('.dependenciesGraphCard[data-index=0]');

    // The first dependencies graph card (index 0) is already present in the html as a template.
    // So we need to clone it, if there are more graph cards, that need to be created.
    if (i >= 1) {

        const newDependenciesGraphCard = cloneElementAndSetNewDataIndex(firstDependenciesGraphCard, i);
        firstDependenciesGraphCard.parent().append(newDependenciesGraphCard);
    }
}

function cloneElementAndSetNewDataIndex(sourceElement, newDataIndex) {
    const newElement = sourceElement.clone();

    // Change the data-index attribute of the new element.
    newElement.attr('data-index', newDataIndex);

    // Change the data-index attribute for all children (which have it) of the new element.
    newElement.find('[data-index]').each(function () {
        $(this).attr('data-index', newDataIndex);
    });

    return newElement;
}


function setTitleOfGraphCard(i, grammar) {
    const graphCardTitle = $(`.dependenciesGraphCardTitle[data-index=${i}]`);
    const titleText = grammar.productionRules[i].toString()

    graphCardTitle.html(titleText);
}


function setFunctionForCheckButton(i, grammar) {
    const checkButton = $(`.dependenciesCheckBtn[data-index=${i}]`);
    checkButton.click(function () {
        check(i, grammar);
    });
}

function setFunctionForResetButton(i) {
    const graphResetButton = $(`.dependenciesResetBtn[data-index=${i}]`);
    graphResetButton.click(function () {
        clearGraph(i);
    });
}

function setFunctionForDrawTreeButton(i, grammar) {
    const drawTreeButton = $(`.dependenciesDrawBtn[data-index=${i}]`);
    drawTreeButton.click(function () {
        clearGraph(i);
        drawSyntaxTree(i, grammar);
        recenterIfGraphOutOfFrame(i);
    });
}

function setFunctionForShowSolutionButton(i, grammar) {
    const showSolutionButton = $(`.dependenciesSolutionBtn[data-index=${i}]`);
    showSolutionButton.click(function () {
        clearGraph(i);
        showSolution(i, grammar)
        recenterIfGraphOutOfFrame(i);
    });
}

function setFunctionForRecenterButton(i) {
    $(`.dependenciesRecenterBtn[data-index=${i}]`).click(() => recenterGraph(i));
}


function setFunctionForShowErrorsButton(i) {
    $(`.showGraphErrorsBtn[data-index=${i}]`).click(() => toggleGraphErrorsVisibility(i));
}

export function hideGraphCorrectIcon(i) {
    $(`.graphCorrectCheck[data-index=${i}]`).hide();
}

function showGraphCorrectIcon(i) {
    $(`.graphCorrectCheck[data-index=${i}]`).show();
}


function createNewGraph(i, grammar) {
    const graphContainer = $(`.dependenciesGraph[data-index=${i}]`);

    const graph = new DependenciesGraph(graphContainer, grammar, i);
    DependenciesGraph.allGraphs.push(graph);
}


function setFunctionForCheckAllButton(grammar) {
    const checkAllButton = $('#dependenciesCheckAllBtn');
    checkAllButton.click(function () {
        checkAll(grammar);
    });
}

function setFunctionForDrawAllTreesButton(grammar) {
    const drawAllTreesButton = $('#dependenciesDrawAllBtn');
    drawAllTreesButton.click(function () {
        clearAllGraphs();
        drawAllSyntaxTrees(grammar);
    });
}

function setFunctionForShowAllSolutionsButton(grammar) {
    const showAllSolutionsButton = $('#dependenciesAllSolutionsBtn');
    showAllSolutionsButton.click(function () {
        clearAllGraphs();
        showAllSolutions(grammar);
    });
}


export function removeAllGraphs() {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        removeGraph(i);
    }
    emptyArray(DependenciesGraph.allGraphs);
}

function removeGraph(graphIndex) {
    clearGraph(graphIndex);
    DependenciesGraph.allGraphs[graphIndex].paper.remove();
}


export function clearAllGraphs() {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        clearGraph(i);
    }
}

function clearGraph(graphIndex) {
    DependenciesGraph.allGraphs[graphIndex].graph.clear();
    DependenciesGraph.allGraphs[graphIndex].resetScale();
    DependenciesGraph.allGraphs[graphIndex].clearHighlightedElementsList();
}


function checkAll(grammar) {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        check(i, grammar);
    }
}

function check(graphIndex, grammar) {
    const graphErrors = [];
    resetErrors(graphIndex);
    hideGraphCorrectIcon(graphIndex);

    checkGraphCorrectness(graphIndex, grammar, graphErrors);
    addGraphErrors(graphIndex, graphErrors);
    showEitherErrorButtonOrCorrectIcon(graphIndex, graphErrors);
}

export function resetErrors(graphIndex) {
    clearErrorHighlighting(graphIndex);
    clearAndHideGraphErrorsList(graphIndex);
    hideToggleGraphErrorsBtn(graphIndex);
}

function clearErrorHighlighting(graphIndex) {
    DependenciesGraph.allGraphs[graphIndex].removeAllHighlighting();
}

export function clearAndHideGraphErrorsList(graphIndex) {
    $('.graphErrors[data-index=' + graphIndex + ']').hide();
    $('.graphErrorMessages[data-index=' + graphIndex + ']').empty();
}

function addGraphErrors(graphIndex, graphErrors) {
    const graphErrorMessagesList = $('.graphErrorMessages[data-index=' + graphIndex + ']');

    for (const error of graphErrors) {
        graphErrorMessagesList.append('<li>' + error + '</li>');
    }
}

function showEitherErrorButtonOrCorrectIcon(graphIndex, graphErrors) {
    if (arrayIsEmpty(graphErrors)) {
        showGraphCorrectIcon(graphIndex);
    } else {
        showToggleGraphErrorsBtn(graphIndex);
    }
}

function hideToggleGraphErrorsBtn(graphIndex) {
    $('.showGraphErrorsBtn[data-index=' + graphIndex + ']').hide();
}

function showToggleGraphErrorsBtn(graphIndex) {
    $('.showGraphErrorsBtn[data-index=' + graphIndex + ']').show();
}

function toggleGraphErrorsVisibility(graphIndex) {
    $('.graphErrors[data-index=' + graphIndex + ']').fadeToggle(100);
}


function checkGraphCorrectness(graphIndex, grammar, graphErrors) {
    const productionRule = grammar.productionRules[graphIndex];

    const dependencyGraph = DependenciesGraph.allGraphs[graphIndex];
    const jointPaper = dependencyGraph.paper;
    const jointGraph = dependencyGraph.graph;

    const allElementNodes = jointGraph.getElements();
    const allSymbolNodes = dependencyGraph.getSymbols();
    const allAttributeNodes = allElementNodes.filter(e => e.isAttribute());

    const expectedNumberOfElements = grammar.numberOfElementsPerRule[graphIndex];
    const actualNumberOfElementNodes = allSymbolNodes.length + allAttributeNodes.length;

    if (actualNumberOfElementNodes === 0) {
        graphErrors.push('The graph is empty.');
        return;
    }

    if (actualNumberOfElementNodes < 0.3 * expectedNumberOfElements) {
        ohNoes(graphErrors);
        return;
    }

    const rootNodes = dependencyGraph.getRoots();

    if (rootNodes.length === 0) {

        graphErrors.push('There is no root in your graph. The root should have no incoming edges. Check that you have no cycles.');
        return;
    }

    if (rootNodes.length > 1) {

        graphErrors.push(`There are ${rootNodes.length} disconnected subgraphs.` +
            ' The syntax tree must be one connected component, with one root.');

        rootNodes.forEach(rootNode => {
            dependencyGraph.highlightElement(rootNode, HIGHLIGHT_AREA.body);
        });
        return;
    }

    const rootNode = rootNodes[0]; // We have checked, that there is exactly one root node.

    const childNodesSortedByX = dependencyGraph.getChildrenSortedByX(rootNode);

    const expectedNumberOfChildren = productionRule.rightSideLength();
    const actualNumberOfChildNodes = childNodesSortedByX.length;

    if (actualNumberOfChildNodes !== expectedNumberOfChildren) {
        graphErrors.push('The root node of the syntax tree has a wrong number of children.'
            + ` It has ${actualNumberOfChildNodes} but should have ${expectedNumberOfChildren}.`);
        const outgoingLinksFromRoot = jointGraph.getConnectedLinks(rootNode, {outbound: true});
        outgoingLinksFromRoot.forEach(link => {
            dependencyGraph.highlightElement(link, HIGHLIGHT_AREA.default)
        });
        return;
    }

    const allSymbolNodesSortedByX = [rootNode, ...childNodesSortedByX];

    for (let i = 0; i < allSymbolNodesSortedByX.length; i++) {
        if (rootIsPositionedBelowChildren(i, rootNode, allSymbolNodesSortedByX)) {
            graphErrors.push('The root is positioned vertically below a child.');
            dependencyGraph.highlightElement(rootNode, HIGHLIGHT_AREA.body);
            return;
        }

        if (checkSymbolNameAndOutgoingLinks(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, expectedNumberOfChildren, dependencyGraph) === ERROR) return;

        if (checkAttributes(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, jointGraph, dependencyGraph) === ERROR) return;
    }
}


function rootIsPositionedBelowChildren(symbolIndex, rootNode, allSymbolNodesSortedByX) {
    if (symbolIndex === 0) // the root node itself
        return false;

    const rootY = rootNode.position().y;
    const childY = allSymbolNodesSortedByX[symbolIndex].position().y;

    return childY < rootY;
}


function checkSymbolNameAndOutgoingLinks(symbolIndex, allSymbolNodes, graphErrors, productionRule, expectedNumberOfChildren, dependencyGraph) {

    const expectedName = productionRule.symbolNames[symbolIndex];
    const symbolNode = allSymbolNodes[symbolIndex];
    const actualName = symbolNode.getName();

    if (actualName !== expectedName) {

        let childrenPositioningExplanation = '';

        // Add the explanation to a child node, if there are two or more children.
        if (symbolIndex > 0 && expectedNumberOfChildren > 1) {
            childrenPositioningExplanation = ' Remember, that the child nodes are indexed 1..n, from left to right.'
                + ' So their positioning along the x-axis in the graph should reflect this indexing convention.';
        }

        graphErrors.push(`Node[${symbolIndex}] in the syntax tree should be named "${expectedName}",`
            + ` whereas it is now named "${actualName}". ${childrenPositioningExplanation}`);

        dependencyGraph.highlightElement(symbolNode, HIGHLIGHT_AREA.label);

        return ERROR;
    }


    // Only check, that all children have no edges.
    if (symbolIndex > 0) {

        const links = dependencyGraph.graph.getConnectedLinks(symbolNode, {outbound: true});

        if (links.length > 0) {

            graphErrors.push(`Node[${symbolIndex}] (symbol "${actualName}") should have no outgoing edges.`);

            links.forEach(link => {
                dependencyGraph.highlightElement(link, HIGHLIGHT_AREA.default)
            });

            return ERROR;
        }
    }
}

function checkAttributes(symbolIndex, allSymbolNodes, graphErrors, productionRule, jointGraph, dependencyGraph) {
    const symbolName = productionRule.symbols[symbolIndex].name;
    const symbolNode = allSymbolNodes[symbolIndex];
    const container = symbolNode.getContainer();

    const expectedAttributes = productionRule.symbols[symbolIndex].attributes.getMapClone();
    const actualAttributeNodes = symbolNode.getAttributeNodes();

    if (expectedAttributes.size > 0 && actualAttributeNodes.length === 0) {
        graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") is missing its attributes.`);
        dependencyGraph.highlightElement(container, HIGHLIGHT_AREA.border);
        return;
    }

    if (symbolNode.hasDuplicateAttributes()) {
        graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") has duplicate attributes.`);
        dependencyGraph.highlightElement(container, HIGHLIGHT_AREA.border);
        return ERROR;
    }

    for (const actualAttributeNode of actualAttributeNodes) {
        const attributeNodeName = actualAttributeNode.getName();

        if (expectedAttributes.has(attributeNodeName)) {
            checkAttributeLinks(symbolIndex, actualAttributeNode, expectedAttributes,
                graphErrors, productionRule, jointGraph, dependencyGraph);

            expectedAttributes.delete(attributeNodeName);
        } else {
            graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") should not have the attribute "${attributeNodeName}".`);
            dependencyGraph.highlightElement(actualAttributeNode, HIGHLIGHT_AREA.label);
        }
    }

    for (const expectedAttribute of expectedAttributes.values()) {
        let indirectIdentificationExplanation = '';
        if (expectedAttribute.indirectlyIdentified) {
            indirectIdentificationExplanation = ' Please remember, that if an attribute for this exact symbol is found '
                + 'in another production rule, it must also be represented in this graph, albeit without dependencies.';
        }
        graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") is missing the attribute "${expectedAttribute.name}".` +
            indirectIdentificationExplanation);
        dependencyGraph.highlightElement(container, HIGHLIGHT_AREA.border);
    }
}

function checkAttributeLinks(symbolIndex, actualAttributeNode, expectedAttributes, graphErrors,
                             productionRule, jointGraph, dependencyGraph) {
    const symbolName = productionRule.symbols[symbolIndex].name;
    const attributeNodeName = actualAttributeNode.getName();


    const expectedOutgoingDependencies = expectedAttributes.get(attributeNodeName).getDependencyMap();
    const actualOutgoingLinks = jointGraph.getConnectedLinks(actualAttributeNode, {outbound: true});

    for (const actualOutgoingLink of actualOutgoingLinks) {
        // no need to check for id existence, because links must point to a node by the settings
        const actualLinkTargetId = actualOutgoingLink.get('target').id;

        const actualTargetAttributeNode = jointGraph.getCell(actualLinkTargetId);
        const actualTargetAttributeNodeName = actualTargetAttributeNode.getName();
        const actualTargetSymbolNodeName = actualTargetAttributeNode.getSymbolNode().getName();

        if (expectedOutgoingDependencies.has(actualTargetAttributeNodeName)) {
            const expectedOutgoingDependency = expectedOutgoingDependencies.get(actualTargetAttributeNodeName);
            const expectedTargetAttributeName = expectedOutgoingDependency.toAttributeName;
            const expectedTargetSymbolName = productionRule.symbols[expectedOutgoingDependency.toSymbolIndex].name;

            if (actualTargetSymbolNodeName === expectedTargetSymbolName) {
                expectedOutgoingDependencies.delete(actualTargetAttributeNodeName);
            } else {
                graphErrors.push(`Attribute "${attributeNodeName}" of node[${symbolIndex}] (symbol "${symbolName}") ` +
                    `is correctly linked to attribute "${expectedTargetAttributeName}". However, it is an attribute ` +
                    `of symbol "${actualTargetSymbolNodeName}", whereas it should be of symbol "${expectedTargetSymbolName}".`);
                dependencyGraph.highlightElement(actualOutgoingLink, HIGHLIGHT_AREA.default);
            }
        } else {
            graphErrors.push(`Attribute "${attributeNodeName}" of node[${symbolIndex}] (symbol "${symbolName}") ` +
                `is wrongly linked to attribute "${actualTargetAttributeNodeName}".`);
            dependencyGraph.highlightElement(actualOutgoingLink, HIGHLIGHT_AREA.default);
        }
    }
    for (const expectedOutgoingDependency of expectedOutgoingDependencies.values()) {
        graphErrors.push(`Attribute "${attributeNodeName}" of node[${symbolIndex}] (symbol "${symbolName}") ` +
            `is missing a dependency to attribute "${expectedOutgoingDependency.toAttributeName}".`);
        dependencyGraph.highlightElement(actualAttributeNode, HIGHLIGHT_AREA.border);
    }
}

function ohNoes(graphErrors) {

    const errorMessages = [
        [68, 105, 100, 32, 121, 111, 117, 32, 101, 118, 101, 110, 32, 115, 116, 97, 114, 116, 63],
        [80, 108, 101, 97, 115, 101, 44, 32, 116, 114, 121, 32, 116, 111, 32, 109, 97, 107, 101, 32, 97, 110, 32, 101, 102, 102, 111, 114, 116, 46],
        [67, 111, 109, 101, 32, 111, 110, 44, 32, 114, 101, 97, 108, 108, 121, 63, 32, 87, 104, 97, 116, 32, 105, 115, 32, 116, 104, 101, 114, 101, 32, 116, 111, 32, 99, 104, 101, 99, 107, 63],
        [73, 115, 32, 116, 104, 97, 116, 32, 116, 104, 101, 32, 98, 101, 115, 116, 32, 121, 111, 117, 32, 99, 97, 110, 32, 100, 111, 63],
        [73, 32, 104, 111, 112, 101, 32, 121, 111, 117, 32, 106, 117, 115, 116, 32, 109, 105, 115, 99, 108, 105, 99, 107, 101, 100, 32, 97, 110, 100, 32, 121, 111, 117, 39, 114, 101, 32, 110, 111, 116, 32, 97, 99, 116, 117, 97, 108, 108, 121, 32, 100, 111, 110, 101, 46],
        [73, 32, 114, 101, 102, 117, 115, 101, 32, 116, 111, 32, 99, 104, 101, 99, 107, 32, 116, 104, 105, 115, 44, 32, 97, 115, 32, 121, 111, 117, 32, 99, 108, 101, 97, 114, 108, 121, 32, 106, 117, 115, 116, 32, 103, 97, 118, 101, 32, 117, 112, 46],
    ];

    graphErrors.push(String.fromCharCode(...chooseOneAtRandom(errorMessages)));
}


function showAllSolutions(grammar) {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        showSolution(i, grammar);
        recenterIfGraphOutOfFrame(i);
    }
}

function showSolution(graphIndex, grammar) {
    const paper = DependenciesGraph.allGraphs[graphIndex].paper;
    const graph = DependenciesGraph.allGraphs[graphIndex].graph;

    const symbolNodes = drawSyntaxTree(graphIndex, grammar);
    const attributeNodes = addAttributesToSyntaxTree(graphIndex, grammar, symbolNodes, graph, paper);

    linkAttributes(graphIndex, attributeNodes, grammar, graph);
}

function drawAllSyntaxTrees(grammar) {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        drawSyntaxTree(i, grammar);
        recenterIfGraphOutOfFrame(i);
    }
}

function drawSyntaxTree(graphIndex, grammar) {

    const paper = DependenciesGraph.allGraphs[graphIndex].paper;
    const graph = DependenciesGraph.allGraphs[graphIndex].graph;

    const productionRuleSymbolNames = grammar.productionRules[graphIndex].symbolNames;

    const symbolNodes = [];

    for (let i = 0; i < productionRuleSymbolNames.length; i++) {

        const {x, y} = defineNodePosition(i, graphIndex, grammar, paper);

        symbolNodes[i] = joint.shapes.attrsys.Symbol.create(x, y, productionRuleSymbolNames, paper, graph, i);

        linkChildrenWithRoot(i, symbolNodes, graph);
    }

    return symbolNodes;
}


function defineNodePosition(symbolIndex, graphIndex, grammar, paper) {

    const paperWidth = paper.options.width;
    const paperHeight = paper.options.height;

    const productionRuleSymbols = grammar.productionRules[graphIndex].symbols;

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


function recenterIfGraphOutOfFrame(graphIndex) {

    const paper = DependenciesGraph.allGraphs[graphIndex].paper;
    const contentArea = paper.getContentArea();

    const availableWidth = paper.options.width;
    const availableHeight = paper.options.height;

    if (contentArea.width > availableWidth || contentArea.height > availableHeight) {

        recenterGraph(graphIndex);
    }
}


function recenterGraph(graphIndex) {

    const paper = DependenciesGraph.allGraphs[graphIndex].paper;

    paper.scaleContentToFit({
        padding: SYMBOL_WIDTH,
        minxScaleX: MIN_SCALE, minScaleY: MIN_SCALE,
        maxScaleX: MAX_SCALE, maxScaleY: MAX_SCALE,
    });
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


function addAttributesToSyntaxTree(graphIndex, grammar, symbolNodes, graph, paper) {

    const attributeNodes = [];

    const allAttributeNames = grammar.allAttributeNamesArray;
    const productionRule = grammar.productionRules[graphIndex];

    for (let i = 0; i < symbolNodes.length; i++) {

        const symbolAttributeNodes = [];
        const symbolAttributes = productionRule.symbols[i].attributes;
        const symbolNode = symbolNodes[i];
        const symbolPosition = symbolNode.position();
        const container = symbolNode.getContainer();

        for (let j = 0; j < symbolAttributes.length; j++) {

            const attributeName = symbolAttributes.getAt(j).name;
            const emptySpot = findEmptySpotForNewAttribute(symbolPosition, container, graph);

            const attributeNode = joint.shapes.attrsys.Attribute
                .create(emptySpot.x, emptySpot.y, container, allAttributeNames, paper, graph, attributeName);

            symbolAttributeNodes.push(attributeNode);
        }

        attributeNodes.push(symbolAttributeNodes);
    }

    return attributeNodes;
}


function linkAttributes(graphIndex, attributeNodes, grammar, graph) {

    const productionRule = grammar.productionRules[graphIndex];
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
                link.addTo(graph);
            }
        }
    }
}