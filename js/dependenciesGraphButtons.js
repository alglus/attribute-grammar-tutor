import {DependenciesGraph, MAX_SCALE, MIN_SCALE} from './dependenciesGraph.js';
import {arrayIsEmpty, chooseOneAtRandom, emptyArray, ERROR} from './utils.js';
import {
    defineJointAttrsysObjects,
    findEmptySpotForNewAttribute,
    HIGHLIGHT_AREA,
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
    });
}

function setFunctionForShowSolutionButton(i, grammar) {
    const showSolutionButton = $(`.dependenciesSolutionBtn[data-index=${i}]`);
    showSolutionButton.click(function () {
        clearGraph(i);
        showSolution(i, grammar)
    });
}

function setFunctionForRecenterButton(i) {

    const recenterButton = $(`.dependenciesRecenterBtn[data-index=${i}]`);

    recenterButton.click(function () {

        const paper = DependenciesGraph.allGraphs[i].paper;

        paper.scaleContentToFit({
            padding: 20,
            minxScaleX: MIN_SCALE, minScaleY: MIN_SCALE,
            maxScaleX: MAX_SCALE, maxScaleY: MAX_SCALE,
        });
    });
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
    DependenciesGraph.allGraphs[graphIndex].clearHighlightedElementsList();
    DependenciesGraph.allGraphs[graphIndex].graph.clear();
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

        if (checkSymbolName(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, expectedNumberOfChildren, dependencyGraph) === ERROR) return;

        if (checkAttributes(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, jointGraph, dependencyGraph) === ERROR) return;
    }
}


function rootIsPositionedBelowChildren(symbolIndex, rootNode, allSymbolNodesInCorrectOrder) {
    if (symbolIndex === 0) // the root node itself
        return false;

    const rootY = rootNode.position().y;
    const childY = allSymbolNodesInCorrectOrder[symbolIndex].position().y;

    return childY < rootY;
}


function checkSymbolName(symbolIndex, allSymbolNodes, graphErrors, productionRule, expectedNumberOfChildren, dependencyGraph) {
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
        // const actualTargetAttributeSymbolNode = actualTargetAttributeNode.getSymbolNode();
        const actualTargetSymbolNodeName = actualTargetAttributeNode.getSymbolNode().getName();

        if (expectedOutgoingDependencies.has(actualTargetAttributeNodeName)) {
            const expectedOutgoingDependency = expectedOutgoingDependencies.get(actualTargetAttributeNodeName);
            const expectedTargetAttributeName = expectedOutgoingDependency.toAttributeName;
            // const expectedTargetAttributeSymbol = productionRule.symbols[expectedOutgoingDependency.toSymbolIndex];
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
        'Wait, what?...',
        'Did you even start?',
        'Please, try to make an effort.',
        'Come on, really?',
        'Is that the best you can do?',
        // '73;32;104;111;112;101;32;121;111;117;32;106;117;115;116;32;109;105;115;99;108;105;99;107;101;100;32;97;110;100;32;121;111;117;39;114;101;32;110;111;116;32;97;99;116;117;97;108;108;121;32;100;111;110;101;46',
    ];
    // graphErrors.push(String.fromCharCode(...chooseOneAtRandom(errorMessages).split(';')));
    graphErrors.push(chooseOneAtRandom(errorMessages));
}


function showAllSolutions(grammar) {
    for (let i = 0; i < DependenciesGraph.allGraphs.length; i++) {
        showSolution(i, grammar);
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
    }
}

function drawSyntaxTree(graphIndex, grammar) {
    const paper = DependenciesGraph.allGraphs[graphIndex].paper;
    const graph = DependenciesGraph.allGraphs[graphIndex].graph;

    const productionRuleSymbolNames = grammar.productionRules[graphIndex].symbolNames;

    const symbolNodes = [];

    for (let i = 0; i < productionRuleSymbolNames.length; i++) {
        const {x, y} = defineNodePosition(i, productionRuleSymbolNames, paper);

        symbolNodes[i] = joint.shapes.attrsys.Symbol.create(x, y, productionRuleSymbolNames, paper, graph, i);

        linkChildrenWithRoot(i, symbolNodes, graph);
    }

    return symbolNodes;
}

function defineNodePosition(i, productionRuleSymbolNames, paper) {
    const paperWidth = paper.options.width;
    const paperHeight = paper.options.height;

    const centralPositionX = paperWidth / 2 - SYMBOL_WIDTH / 2

    // Root node.
    if (i === 0) {
        return {x: centralPositionX, y: 50};
    }

    // Only one child.
    if (productionRuleSymbolNames.length === 2) {
        return {x: centralPositionX, y: 250}; // TODO: calculate y
    }

    // More than one child.
    return {x: 30 + (i - 1) * 200, y: 250}; // TODO: calculate x and y
}


function linkChildrenWithRoot(i, symbolNodes, graph) {
    if (i > 0) { // Only start linking, if it is a child.
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

            const attributeNode = joint.shapes.attrsys.Attribute.create(
                emptySpot.x, emptySpot.y, container, allAttributeNames, paper, graph, attributeName);

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