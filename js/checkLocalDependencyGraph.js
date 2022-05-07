import {HIGHLIGHT_AREA} from "./joint.attrsys.js";
import {chooseOneAtRandom, ERROR} from "./utils.js";


export function checkLocalDependencyGraph(graphObject, grammar, productionRuleIndex, graphErrors) {
    const productionRule = grammar.productionRules[productionRuleIndex];

    const jointPaper = graphObject.paper;
    const jointGraph = graphObject.graph;

    const allElementNodes = jointGraph.getElements();
    const allSymbolNodes = graphObject.getSymbols();
    const allAttributeNodes = allElementNodes.filter(e => e.isAttribute());

    const expectedNumberOfElements = grammar.numberOfElementsPerRule[productionRuleIndex];
    const actualNumberOfElementNodes = allSymbolNodes.length + allAttributeNodes.length;

    if (actualNumberOfElementNodes === 0) {
        graphErrors.push('The graph is empty.');
        return;
    }

    if (actualNumberOfElementNodes < 0.3 * expectedNumberOfElements) {
        ohNoes(graphErrors);
        return;
    }

    const rootNodes = graphObject.getRoots();

    if (rootNodes.length === 0) {

        graphErrors.push('There is no root in your graph. The root should have no incoming edges. Check that you have no cycles.');
        return;
    }

    if (rootNodes.length > 1) {

        graphErrors.push(`There are ${rootNodes.length} disconnected subgraphs.` +
            ' The syntax tree must be one connected component, with one root.');

        rootNodes.forEach(rootNode => {
            graphObject.highlightElement(rootNode, HIGHLIGHT_AREA.body);
        });
        return;
    }

    const rootNode = rootNodes[0]; // We have checked, that there is exactly one root node.

    const childNodesSortedByX = graphObject.getChildrenSortedByX(rootNode);

    const expectedNumberOfChildren = productionRule.rightSideLength();
    const actualNumberOfChildNodes = childNodesSortedByX.length;

    if (actualNumberOfChildNodes !== expectedNumberOfChildren) {
        graphErrors.push('The root node of the syntax tree has a wrong number of children.'
            + ` It has ${actualNumberOfChildNodes} but should have ${expectedNumberOfChildren}.`);
        const outgoingLinksFromRoot = jointGraph.getConnectedLinks(rootNode, {outbound: true});
        outgoingLinksFromRoot.forEach(link => {
            graphObject.highlightElement(link, HIGHLIGHT_AREA.default)
        });
        return;
    }

    const allSymbolNodesSortedByX = [rootNode, ...childNodesSortedByX];

    for (let i = 0; i < allSymbolNodesSortedByX.length; i++) {
        if (rootIsPositionedBelowChildren(i, rootNode, allSymbolNodesSortedByX)) {
            graphErrors.push('The root is positioned vertically below a child.');
            graphObject.highlightElement(rootNode, HIGHLIGHT_AREA.body);
            return;
        }

        if (checkSymbolNameAndOutgoingLinks(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, expectedNumberOfChildren, graphObject) === ERROR) return;

        if (checkAttributes(i, allSymbolNodesSortedByX, graphErrors,
            productionRule, jointGraph, graphObject) === ERROR) return;
    }
}


function rootIsPositionedBelowChildren(symbolIndex, rootNode, allSymbolNodesSortedByX) {
    if (symbolIndex === 0) // the root node itself
        return false;

    const rootY = rootNode.position().y;
    const childY = allSymbolNodesSortedByX[symbolIndex].position().y;

    return childY < rootY;
}


function checkSymbolNameAndOutgoingLinks(symbolIndex, allSymbolNodes, graphErrors, productionRule, expectedNumberOfChildren, graphObject) {

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

        graphObject.highlightElement(symbolNode, HIGHLIGHT_AREA.label);

        return ERROR;
    }


    // Make sure that the children have no outgoing edges. Thus, start checking from symbol 1 onwards.
    if (symbolIndex >= 1) {

        const links = graphObject.graph.getConnectedLinks(symbolNode, {outbound: true});

        if (links.length > 0) {

            graphErrors.push(`Node[${symbolIndex}] (symbol "${actualName}") should have no outgoing edges.`);

            links.forEach(link => {
                graphObject.highlightElement(link, HIGHLIGHT_AREA.default)
            });

            return ERROR;
        }
    }
}

function checkAttributes(symbolIndex, allSymbolNodes, graphErrors, productionRule, jointGraph, graphObject) {
    const symbolName = productionRule.symbols[symbolIndex].name;
    const symbolNode = allSymbolNodes[symbolIndex];
    const container = symbolNode.getContainer();

    const expectedAttributes = productionRule.symbols[symbolIndex].attributes.getMapClone();
    const actualAttributeNodes = symbolNode.getAttributeNodes();

    if (expectedAttributes.size > 0 && actualAttributeNodes.length === 0) {
        graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") is missing its attributes.`);
        graphObject.highlightElement(container, HIGHLIGHT_AREA.border);
        return;
    }

    if (symbolNode.hasDuplicateAttributes()) {
        graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") has duplicate attributes.`);
        graphObject.highlightElement(container, HIGHLIGHT_AREA.border);
        return ERROR;
    }

    for (const actualAttributeNode of actualAttributeNodes) {
        const attributeNodeName = actualAttributeNode.getName();

        if (expectedAttributes.has(attributeNodeName)) {
            checkAttributeLinks(symbolIndex, actualAttributeNode, expectedAttributes,
                graphErrors, productionRule, jointGraph, graphObject);

            expectedAttributes.delete(attributeNodeName);
        } else {
            graphErrors.push(`Node[${symbolIndex}] (symbol "${symbolName}") should not have the attribute "${attributeNodeName}".`);
            graphObject.highlightElement(actualAttributeNode, HIGHLIGHT_AREA.label);
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
        graphObject.highlightElement(container, HIGHLIGHT_AREA.border);
    }
}

function checkAttributeLinks(symbolIndex, actualAttributeNode, expectedAttributes, graphErrors,
                             productionRule, jointGraph, graphObject) {
    const symbolName = productionRule.symbols[symbolIndex].name;
    const attributeName = actualAttributeNode.getName();


    const expectedOutgoingDependencies = new Map(expectedAttributes.get(attributeName).dependencies);
    const actualOutgoingLinks = jointGraph.getConnectedLinks(actualAttributeNode, {outbound: true});

    for (const actualOutgoingLink of actualOutgoingLinks) {

        // no need to check for id existence, because links must point to a node by the graph settings
        const actualLinkTargetId = actualOutgoingLink.get('target').id;

        const actualTargetAttributeNode = jointGraph.getCell(actualLinkTargetId);
        const actualTargetAttributeName = actualTargetAttributeNode.getName();
        const actualTargetSymbolNode = actualTargetAttributeNode.getSymbolNode();
        const actualTargetSymbolName = actualTargetSymbolNode.getName();
        const actualTargetSymbolIndex = actualTargetSymbolNode.getIndex();

        const actualRelationHash = `${symbolIndex}${attributeName}${actualTargetSymbolIndex}${actualTargetAttributeName}`;

        if (expectedOutgoingDependencies.has(actualRelationHash)) {

            // A correct relation has been found, so we can delete it from the expected list.
            expectedOutgoingDependencies.delete(actualRelationHash);

        } else {

            graphErrors.push(`Attribute "${attributeName}" of node[${symbolIndex}] (symbol "${symbolName}") is wrongly linked` +
                ` to attribute "${actualTargetAttributeName}" of node[${actualTargetSymbolIndex}] (symbol "${actualTargetSymbolName}").`);
            graphObject.highlightElement(actualOutgoingLink, HIGHLIGHT_AREA.default);
        }
    }

    for (const expectedOutgoingDependency of expectedOutgoingDependencies.values()) {
        graphErrors.push(`Attribute "${attributeName}" of node[${symbolIndex}] (symbol "${symbolName}") ` +
            `is missing a dependency to attribute "${expectedOutgoingDependency.toAttributeName}".`);
        graphObject.highlightElement(actualAttributeNode, HIGHLIGHT_AREA.border);
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